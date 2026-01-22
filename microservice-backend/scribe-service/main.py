import asyncio
import json
import logging
import spacy
import redis.asyncio as redis
import os
from contextlib import asynccontextmanager
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

# --- RabbitMQ Consumer Logic ---
async def process_user_created(message: IncomingMessage):
    """
    Handles 'user_created' events from the Auth Service (NestJS).
    """
    async with message.process():
        try:
            body = json.loads(message.body.decode())
            logger.info(f" [RMQ] Received user_created: {body}")
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Endpoints ---

@app.get("/")
async def health_check():
    return {"status": "healthy", "service": "scribe-service"}

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

@app.post("/process-audio")
@app.post("/scribe/process-audio")
async def process_audio(
    audio: UploadFile = File(...),
    session_id: str = Form(...),
    template: str = Form("SOAP")
):
    """
    1. Transcribes raw audio with Whisper.
    2. Scrubs PII with Spacy.
    3. Summarizes into a medical note with GPT-4o.
    """
    logger.info(f" [API] Processing audio for session: {session_id} using {template} template")
    
    # Save temporary file
    temp_filename = f"temp_{session_id}.webm"
    with open(temp_filename, "wb") as buffer:
        buffer.write(await audio.read())

    try:
        # 1. Transcribe with Whisper
        # We use an initial_prompt to help Whisper ignore noise and focus on medical context
        medical_prompt = "This is a clinical encounter. Ignore background noise, coughing, and non-speech sounds."
        with open(temp_filename, "rb") as audio_file:
            transcript_response = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file,
                prompt=medical_prompt
            )
        raw_text = transcript_response.text
        logger.info(f" [Whisper] Transcription complete for {session_id}")

        # 2. Scrub PII
        # ... scrub logic ...
        scrub_request = TranscriptRequest(session_id=session_id, raw_text=raw_text)
        scrub_result = await scrub_pii(scrub_request)
        scrubbed_text = scrub_result["scrubbed_text"]

        # 3. Generate Clinical Note & Admin Package with GPT-4o
        sections_list = ", ".join(TEMPLATES.get(template, TEMPLATES["SOAP"])["sections"])
        
        system_prompt = f"""
        You are an expert medical scribe. Convert the following transcript into:
        1. A structured clinical note using the {template} format. 
           REQUIRED KEYS for the structured_note object: {sections_list}
        2. A list of relevant ICD-10 Billing Codes.
        3. A patient-friendly summary in layman's terms.

        CRITICAL: The transcript may contain background noise, coughing, or nonsensical words transcribed by the AI. 
        Filter these out. Focus ONLY on the medical content and clinical dialogue. 
        Ensure medical accuracy and professional terminology for the note.
        """
        
        user_prompt = f"""
        Transcript:
        {scrubbed_text}

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
        
        return {
            "session_id": session_id,
            "raw_transcript": scrubbed_text,
            "structured_note": ai_response.get("structured_note"),
            "billing_codes": ai_response.get("billing_codes"),
            "patient_summary": ai_response.get("patient_summary")
        }

    except Exception as e:
        logger.error(f" [API] Error processing audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup
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
            logger.info(f" [WS] Received raw data: {data}")
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
