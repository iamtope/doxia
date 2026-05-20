import asyncio
import base64
import io
import json
import logging
import mimetypes
import spacy
import redis.asyncio as redis
import os
from contextlib import asynccontextmanager
import uuid
from pathlib import Path
from typing import Any
from pypdf import PdfReader
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from aio_pika import connect, Message, IncomingMessage
from config import settings
from openai import OpenAI

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI
client = OpenAI(api_key=settings.openai_api_key)

# Load Spacy NLP model
try:
    nlp = spacy.load("en_core_web_sm")
    logger.info(" [NLP] Spacy model loaded successfully.")
except Exception as e:
    logger.error(f" [NLP] Failed to load Spacy model: {e}")
    nlp = None

# --- Templates Configuration ---
TEMPLATES = {
    "SOAP": {"sections": ["SUBJECTIVE", "OBJECTIVE", "ASSESSMENT", "PLAN"]},
    "DAP": {"sections": ["DATA", "ASSESSMENT", "PLAN"]},
    "BIRP": {"sections": ["BEHAVIOR", "INTERVENTION", "RESPONSE", "PLAN"]},
}

# --- Redis Client ---
redis_client: redis.Redis = None

# --- Pydantic Models ---
class TranscriptRequest(BaseModel):
    session_id: str
    raw_text: str

class ScrubbedTranscriptResponse(BaseModel):
    session_id: str
    scrubbed_text: str
    pii_found: bool

# Prompts for Whisper fallback only (gpt-4o-transcribe-diarize does not accept prompts).
PRODUCT_WHISPER_PROMPTS: dict[str, str] = {
    "scribe": (
        "This is a clinical encounter. Ignore background noise, coughing, and non-speech sounds."
    ),
    "behavioral_interviewer": (
        "This is a behavioral job interview: an interviewer and a candidate. "
        "Transcribe all speech clearly."
    ),
    "generic": "Transcribe the full conversation, including every speaker.",
}

ALLOWED_PRODUCTS = frozenset(PRODUCT_WHISPER_PROMPTS.keys())


class ConversationUtterance(BaseModel):
    """One time-bounded line of speech; speaker is set when diarization is used."""

    speaker: str | None = None
    start: float
    end: float
    text: str
    segment_id: str | None = None


class TranscribeConversationResponse(BaseModel):
    """Shared contract for scribe, behavioral interviewer, and other products."""

    session_id: str
    product: str
    full_text: str
    utterances: list[ConversationUtterance]
    language: str | None = None
    duration_seconds: float | None = None
    diarization_enabled: bool
    model_used: str


def _seg_prop(seg: Any, name: str, default: Any = None) -> Any:
    if isinstance(seg, dict):
        return seg.get(name, default)
    return getattr(seg, name, default)


def _utterances_from_diarized_segments(segments: list[Any]) -> list[ConversationUtterance]:
    out: list[ConversationUtterance] = []
    for seg in segments:
        text = (_seg_prop(seg, "text") or "").strip()
        if not text:
            continue
        sid = _seg_prop(seg, "id")
        out.append(
            ConversationUtterance(
                speaker=_seg_prop(seg, "speaker"),
                start=float(_seg_prop(seg, "start", 0.0)),
                end=float(_seg_prop(seg, "end", 0.0)),
                text=text,
                segment_id=str(sid) if sid is not None else None,
            )
        )
    return out


def _parse_transcription_object(resp: Any) -> tuple[str, list[Any], float | None, str | None]:
    if hasattr(resp, "model_dump"):
        data = resp.model_dump()
    elif isinstance(resp, dict):
        data = resp
    else:
        data = {
            "text": getattr(resp, "text", None),
            "segments": getattr(resp, "segments", None),
            "duration": getattr(resp, "duration", None),
            "language": getattr(resp, "language", None),
        }
    full_text = (data.get("text") or "").strip()
    segments = data.get("segments") or []
    duration = data.get("duration")
    language = data.get("language")
    return full_text, segments, duration, language


async def transcribe_conversation_audio(
    temp_path: str,
    session_id: str,
    *,
    diarize: bool,
    product: str,
    known_speaker_names: list[str] | None = None,
) -> TranscribeConversationResponse:
    """
    diarize=True: gpt-4o-transcribe-diarize + diarized_json (speakers A, B, … or known names).
    diarize=False: whisper-1 + verbose_json segments (timestamps only, speaker=null).
    Optional known_speaker_names (e.g. interviewer/candidate) — requires reference clips per OpenAI docs for stable labels.
    """

    def _diarized() -> Any:
        with open(temp_path, "rb") as audio_file:
            kwargs: dict[str, Any] = {
                "model": settings.transcription_diarize_model,
                "file": audio_file,
                "response_format": "diarized_json",
                "chunking_strategy": "auto",
            }
            if known_speaker_names:
                kwargs["known_speaker_names"] = known_speaker_names
            try:
                return client.audio.transcriptions.create(**kwargs)
            except TypeError:
                kwargs.pop("known_speaker_names", None)
                extra: dict[str, Any] = {
                    "response_format": "diarized_json",
                    "chunking_strategy": "auto",
                }
                if known_speaker_names:
                    extra["known_speaker_names"] = known_speaker_names
                with open(temp_path, "rb") as af2:
                    return client.audio.transcriptions.create(
                        model=settings.transcription_diarize_model,
                        file=af2,
                        extra_body=extra,
                    )

    def _whisper_verbose(prompt: str) -> Any:
        with open(temp_path, "rb") as audio_file:
            return client.audio.transcriptions.create(
                model=settings.transcription_segment_model,
                file=audio_file,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
                prompt=prompt,
            )

    prompt = PRODUCT_WHISPER_PROMPTS.get(product, PRODUCT_WHISPER_PROMPTS["generic"])

    if diarize:
        try:
            raw = await asyncio.to_thread(_diarized)
        except Exception as e:
            logger.warning(
                f" [Transcribe] Diarization model failed ({e}); falling back to Whisper segments."
            )
            raw = await asyncio.to_thread(_whisper_verbose, prompt)
            full_text, segments, duration, language = _parse_transcription_object(raw)
            utterances = _utterances_from_diarized_segments(segments)
            for u in utterances:
                u.speaker = None
            if not utterances and full_text:
                utterances = [
                    ConversationUtterance(
                        speaker=None,
                        start=0.0,
                        end=float(duration or 0.0),
                        text=full_text,
                    )
                ]
            return TranscribeConversationResponse(
                session_id=session_id,
                product=product,
                full_text=full_text,
                utterances=utterances,
                language=language,
                duration_seconds=float(duration) if duration is not None else None,
                diarization_enabled=False,
                model_used=f"{settings.transcription_segment_model} (fallback)",
            )

        full_text, segments, duration, language = _parse_transcription_object(raw)
        utterances = _utterances_from_diarized_segments(segments)
        if not utterances and full_text:
            utterances = [
                ConversationUtterance(
                    speaker=None,
                    start=0.0,
                    end=float(duration or 0.0),
                    text=full_text,
                )
            ]
        return TranscribeConversationResponse(
            session_id=session_id,
            product=product,
            full_text=full_text or " ".join(u.text for u in utterances),
            utterances=utterances,
            language=language,
            duration_seconds=float(duration) if duration is not None else None,
            diarization_enabled=True,
            model_used=settings.transcription_diarize_model,
        )

    # diarize=False: Whisper verbose_json only (no speaker labels)
    raw = await asyncio.to_thread(_whisper_verbose, prompt)
    full_text, segments, duration, language = _parse_transcription_object(raw)
    utterances = _utterances_from_diarized_segments(segments)
    for u in utterances:
        u.speaker = None
    if not utterances and full_text:
        utterances = [
            ConversationUtterance(
                speaker=None,
                start=0.0,
                end=float(duration or 0.0),
                text=full_text,
            )
        ]
    return TranscribeConversationResponse(
        session_id=session_id,
        product=product,
        full_text=full_text,
        utterances=utterances,
        language=language,
        duration_seconds=float(duration) if duration is not None else None,
        diarization_enabled=False,
        model_used=settings.transcription_segment_model,
    )


def _transcript_text_for_clinical_pipeline(conv: TranscribeConversationResponse) -> str:
    """Plain text for PII scrub + GPT; includes speaker labels when present."""
    if not conv.utterances:
        return conv.full_text
    if any(u.speaker for u in conv.utterances):
        return "\n".join(
            f"{u.speaker}: {u.text}" if u.speaker else u.text for u in conv.utterances
        )
    return conv.full_text


# --- RabbitMQ Consumer Logic ---
async def process_user_created(message: IncomingMessage):
    """
    Handles 'user_created' events from the Auth Service (NestJS).
    """
    async with message.process():
        try:
            body = json.loads(message.body.decode())
            logger.info(f" [RMQ] Received user_created event for userId={body.get('userId')}")
            # Placeholder for future logic: Initialize user settings or workspace
        except Exception as e:
            logger.error(f" [RMQ] Error processing message: {e}")

async def start_rabbitmq_consumer():
    """
    Connects to RabbitMQ and starts consuming from the auth_queue.
    Includes a retry loop for when services are starting up.
    """
    retries = 5
    while retries > 0:
        try:
            connection = await connect(settings.rabbitmq_url)
            channel = await connection.channel()
            
            # We listen on 'auth_queue' which is where NestJS emits events
            queue = await channel.declare_queue("auth_queue", durable=False)
            
            logger.info(" [RMQ] Connected to RabbitMQ. Waiting for messages...")
            await queue.consume(process_user_created)
            
            # Keep the connection alive in the background
            return connection
        except Exception as e:
            retries -= 1
            logger.warning(f" [RMQ] Connection failed. Retrying in 5s... ({retries} retries left)")
            await asyncio.sleep(5)
    
    logger.error(" [RMQ] Could not connect to RabbitMQ after multiple attempts.")
    return None

# --- FastAPI Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    # Startup: Initialize Redis
    try:
        redis_client = redis.from_url(settings.redis_url, decode_responses=True)
        await redis_client.ping()
        logger.info(f" [Redis] Connected to Redis at {settings.redis_url}")
    except Exception as e:
        logger.error(f" [Redis] Failed to connect to Redis: {e}")

    # Startup: Start RabbitMQ consumer
    rmq_conn = await start_rabbitmq_consumer()
    yield
    # Shutdown: Close connections
    if rmq_conn:
        await rmq_conn.close()
        logger.info(" [RMQ] Connection closed.")
    if redis_client:
        await redis_client.close()
        logger.info(" [Redis] Connection closed.")

app = FastAPI(
    title="Doxia Scribe Service",
    description="FastAPI service for PII scrubbing and AI processing",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
_allowed_origins = [
    o.strip()
    for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Endpoints ---

@app.get("/")
async def health_check():
    return {"status": "healthy", "service": "scribe-service"}


NOTE_IMPORT_MAX_BYTES = 10 * 1024 * 1024
_NOTE_IMAGE_MIMES = frozenset(
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
    }
)


def _guess_note_mime(filename: str, content_type: str | None) -> str:
    if content_type and content_type != "application/octet-stream":
        return content_type.split(";")[0].strip().lower()
    guessed, _ = mimetypes.guess_type(filename or "")
    return (guessed or "application/octet-stream").lower()


def _extract_plain_text(data: bytes) -> str:
    return data.decode("utf-8", errors="replace")


def _extract_pdf_text(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    parts: list[str] = []
    for page in reader.pages:
        text = (page.extract_text() or "").strip()
        if text:
            parts.append(text)
    return "\n\n".join(parts)


async def _extract_image_text(data: bytes, mime: str) -> str:
    b64 = base64.standard_b64encode(data).decode("ascii")
    data_url = f"data:{mime};base64,{b64}"
    completion = client.chat.completions.create(
        model=settings.ai_model_version,
        messages=[
            {
                "role": "system",
                "content": (
                    "Extract all visible text from this clinical or medical note image. "
                    "Preserve headings, line breaks, and section labels as they appear. "
                    "Return plain text only with no commentary."
                ),
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract the full note text from this image.",
                    },
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            },
        ],
    )
    return (completion.choices[0].message.content or "").strip()


@app.post("/scribe/extract-note-text")
async def extract_note_text(file: UploadFile = File(...)):
    """
    Extract plain text from an uploaded note (.txt, .pdf, or image) for template import.
    """
    data = await file.read()
    if len(data) > NOTE_IMPORT_MAX_BYTES:
        raise HTTPException(status_code=413, detail="File is too large (max 10 MB).")

    filename = file.filename or "upload"
    mime = _guess_note_mime(filename, file.content_type)
    lower = filename.lower()

    try:
        if mime == "text/plain" or lower.endswith(".txt"):
            text = _extract_plain_text(data)
        elif mime == "application/pdf" or lower.endswith(".pdf"):
            text = _extract_pdf_text(data)
            if len(text.strip()) < 40:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "Could not read enough text from this PDF. "
                        "Try a text-based PDF or upload a photo of the note."
                    ),
                )
        elif mime in _NOTE_IMAGE_MIMES or lower.endswith(
            (".jpg", ".jpeg", ".png", ".webp", ".gif")
        ):
            image_mime = mime if mime in _NOTE_IMAGE_MIMES else "image/jpeg"
            text = await _extract_image_text(data, image_mime)
        else:
            raise HTTPException(
                status_code=415,
                detail="Unsupported file type. Use .txt, .pdf, or an image (JPEG, PNG, WebP, GIF).",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f" [API] extract-note-text failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract text from file")

    text = (text or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="No text could be extracted from this file.")

    return {"text": text}


@app.post("/scrub", response_model=ScrubbedTranscriptResponse)
async def scrub_pii(request: TranscriptRequest):
    """
    Phase 1 MVP: Real PII scrubbing using Spacy.
    Identifies Persons, Organizations, and Locations and redacts them.
    """
    if not nlp:
        raise HTTPException(status_code=500, detail="NLP model not loaded")

    logger.info(f" [API] Scrubbing request for session: {request.session_id}")
    
    doc = nlp(request.raw_text)
    scrubbed_text = request.raw_text
    pii_found = False

    # Entities to redact: PERSON (People), ORG (Companies), GPE (Locations)
    to_redact = ["PERSON", "ORG", "GPE", "DATE"]
    
    # We iterate backwards through entities to maintain correct string offsets
    for ent in reversed(doc.ents):
        if ent.label_ in to_redact:
            pii_found = True
            redaction_label = f"[{ent.label_}]"
            scrubbed_text = scrubbed_text[:ent.start_char] + redaction_label + scrubbed_text[ent.end_char:]
    
    return {
        "session_id": request.session_id,
        "scrubbed_text": scrubbed_text,
        "pii_found": pii_found
    }

@app.post("/append")
async def append_transcript(request: TranscriptRequest):
    """
    Scrubs PII and appends the result to a Redis-based memory buffer.
    Data automatically expires after 30 minutes (stateless privacy).
    """
    if not redis_client:
        raise HTTPException(status_code=500, detail="Redis not connected")
    
    # 1. Scrub the text
    scrub_result = await scrub_pii(request)
    scrubbed_text = scrub_result["scrubbed_text"]
    
    # 2. Append to Redis list
    key = f"transcript:{request.session_id}"
    await redis_client.rpush(key, scrubbed_text)
    
    # 3. Set/Update TTL (30 minutes)
    await redis_client.expire(key, 1800)
    
    return {"status": "appended", "session_id": request.session_id}

@app.get("/transcript/{session_id}")
async def get_full_transcript(session_id: str):
    """
    Retrieves the full scrubbed transcript from Redis for the given session.
    """
    if not redis_client:
        raise HTTPException(status_code=500, detail="Redis not connected")
    
    key = f"transcript:{session_id}"
    chunks = await redis_client.lrange(key, 0, -1)
    
    if not chunks:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    full_text = " ".join(chunks)
    return {"session_id": session_id, "full_transcript": full_text}


@app.post("/transcribe/conversation", response_model=TranscribeConversationResponse)
@app.post("/scribe/transcribe/conversation", response_model=TranscribeConversationResponse)
async def transcribe_conversation(
    audio: UploadFile = File(...),
    session_id: str = Form(...),
    product: str = Form("generic"),
    diarize: bool = Form(True),
    known_speaker_names: str | None = Form(None),
):
    """
    Product-agnostic transcription for multi-use (clinical scribe, behavioral interviewer, etc.).
    Returns time-aligned utterances; with diarize=true, speakers are labeled (A/B/… via OpenAI diarize model).
    """
    if product not in ALLOWED_PRODUCTS:
        raise HTTPException(
            status_code=400,
            detail=f"product must be one of: {sorted(ALLOWED_PRODUCTS)}",
        )
    names: list[str] | None = None
    if known_speaker_names:
        names = [n.strip() for n in known_speaker_names.split(",") if n.strip()]

    suffix = Path(audio.filename or "audio").suffix or ".webm"
    temp_filename = f"temp_conv_{session_id}_{uuid.uuid4().hex}{suffix}"

    try:
        with open(temp_filename, "wb") as buffer:
            buffer.write(await audio.read())
        return await transcribe_conversation_audio(
            temp_filename,
            session_id,
            diarize=diarize,
            product=product,
            known_speaker_names=names,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f" [API] transcribe/conversation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)


@app.post("/process-audio")
@app.post("/scribe/process-audio")
def resolve_template_sections(template: str, sections_json: str | None) -> list[str]:
    """Prefer JSON list from client for custom/community templates; else built-in lookup."""
    if sections_json:
        try:
            data = json.loads(sections_json)
            if isinstance(data, list):
                cleaned = [
                    str(s).strip()
                    for s in data
                    if str(s).strip()
                ]
                if cleaned:
                    return cleaned
        except json.JSONDecodeError:
            logger.warning(" [API] Invalid sections_json; falling back to built-in template")
    cfg = TEMPLATES.get(template, TEMPLATES["SOAP"])
    return list(cfg["sections"])


@app.post("/scribe/complete-session")
async def process_audio(
    audio: UploadFile = File(...),
    session_id: str = Form(...),
    template: str = Form("SOAP"),
    sections_json: str | None = Form(None),
    ai_style: str | None = Form(None),
    clinical_context: str | None = Form(None),
):
    """
    1. Transcribes audio with speaker diarization (gpt-4o-transcribe-diarize) when available, else Whisper.
    2. Scrubs PII with Spacy.
    3. Summarizes into a medical note with GPT-4o.
    """
    logger.info(
        f" [API] Processing audio for session: {session_id} using template key={template!r} "
        f"custom_sections={bool(sections_json)} extra_style={bool(ai_style)}"
    )

    suffix = Path(audio.filename or "recording").suffix or ".webm"
    temp_filename = f"temp_proc_{session_id}_{uuid.uuid4().hex}{suffix}"
    with open(temp_filename, "wb") as buffer:
        buffer.write(await audio.read())

    try:
        # 1. Transcribe with diarization (same pipeline as /transcribe/conversation, product=scribe)
        conv = await transcribe_conversation_audio(
            temp_filename,
            session_id,
            diarize=True,
            product="scribe",
            known_speaker_names=None,
        )
        raw_text = _transcript_text_for_clinical_pipeline(conv)
        logger.info(
            f" [Transcribe] session={session_id} diarization={conv.diarization_enabled} model={conv.model_used}"
        )

        scrub_request = TranscriptRequest(session_id=session_id, raw_text=raw_text)
        scrub_result = await scrub_pii(scrub_request)
        scrubbed_text = scrub_result["scrubbed_text"]

        sections = resolve_template_sections(template, sections_json)
        sections_list = ", ".join(sections)

        style_block = ""
        if ai_style and str(ai_style).strip():
            style_block = f"\nAdditional style / structure guidance from the template author:\n{str(ai_style).strip()}\n"

        system_prompt = f"""
        You are an expert medical scribe. Convert the following transcript into:
        1. A structured note using template "{template}".
           REQUIRED JSON keys for structured_note (use these keys exactly, uppercase with underscores): {sections_list}
        2. A list of relevant ICD-10 Billing Codes where clinically appropriate (empty list if none).
        3. A patient-friendly summary in layman's terms.

        The transcript may include speaker labels (e.g. A, B, or named roles). Use them to separate who said what clinically when helpful.
        CRITICAL: The transcript may contain background noise, coughing, or nonsensical words transcribed by the AI.
        Filter these out. Focus ONLY on clinically relevant dialogue and content unless the template is explicitly non-clinical meeting minutes.
        {style_block}
        """
        
        cc = (clinical_context or "").strip()
        context_block = (
            f"\nClinician-supplied encounter context (not part of transcript):\n{cc}\n"
            if cc
            else ""
        )

        user_prompt = f"""
        Transcript:
        {scrubbed_text}
        {context_block}

        Return the result as a JSON object with the following structure:
        {{
            "structured_note": {{ (use keys exactly as specified above) }},
            "billing_codes": [{{ "code": "...", "description": "..." }}],
            "patient_summary": "..."
        }}
        """
        
        completion = client.chat.completions.create(
            model=settings.ai_model_version,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        ai_response = json.loads(completion.choices[0].message.content)

        utterances_out = [u.model_dump() for u in conv.utterances]

        return {
            "session_id": session_id,
            "raw_transcript": scrubbed_text,
            "structured_note": ai_response.get("structured_note"),
            "billing_codes": ai_response.get("billing_codes"),
            "patient_summary": ai_response.get("patient_summary"),
            "utterances": utterances_out,
            "diarization_enabled": conv.diarization_enabled,
            "transcription_model": conv.model_used,
        }

    except Exception as e:
        logger.error(f" [API] Error processing audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

# --- WebSocket for Real-time Streaming ---

@app.websocket("/ws/scribe/{session_id}")
async def scribe_websocket(websocket: WebSocket, session_id: str):
    """
    Real-time WebSocket endpoint for receiving transcript chunks.
    """
    await websocket.accept()
    logger.info(f" [WS] Session connected: {session_id}")
    
    key = f"transcript:{session_id}"
    
    try:
        while True:
            # Receive data from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            raw_text = message.get("text", "")
            if not raw_text:
                continue
                
            # 1. Scrub PII
            # We call the same logic as the /scrub endpoint
            scrubbed_text = raw_text
            if nlp:
                doc = nlp(raw_text)
                to_redact = ["PERSON", "ORG", "GPE", "DATE"]
                for ent in reversed(doc.ents):
                    if ent.label_ in to_redact:
                        scrubbed_text = scrubbed_text[:ent.start_char] + f"[{ent.label_}]" + scrubbed_text[ent.end_char:]
            
            # 2. Append to Redis
            if redis_client:
                await redis_client.rpush(key, scrubbed_text)
                await redis_client.expire(key, 1800)
            
            # 3. Echo back the scrubbed version (for real-time UI feedback)
            await websocket.send_json({
                "status": "processed",
                "scrubbed_text": scrubbed_text
            })
            
    except WebSocketDisconnect:
        logger.info(f" [WS] Session disconnected: {session_id}")
    except Exception as e:
        logger.error(f" [WS] Error in session {session_id}: {e}")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
