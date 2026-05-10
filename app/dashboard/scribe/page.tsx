"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MicrophoneIcon,
  StopIcon,
  PauseIcon,
  PlayIcon,
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  TrashIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  RectangleStackIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import {
  getTemplateById,
  listTemplatesForScribe,
  type TemplateDef,
  BUILTIN_TEMPLATES,
} from "../../lib/clinical-templates";
import { getTrialDaysRemaining, SCRIBE_LANGUAGES } from "../../lib/scribe-session";

const SESSION_CAP_SECONDS = 30 * 60; // 30 minutes
const TOTAL_USAGE_CAP_SECONDS = 2 * 60 * 60; // 2 hours
const USAGE_STORAGE_KEY = "doxia_total_usage_seconds";

function getTotalUsage(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(USAGE_STORAGE_KEY) || "0", 10);
}

function addUsage(seconds: number) {
  const current = getTotalUsage();
  localStorage.setItem(USAGE_STORAGE_KEY, String(current + seconds));
}

function getRemainingUsage(): number {
  return Math.max(0, TOTAL_USAGE_CAP_SECONDS - getTotalUsage());
}

function formatUsageTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function LiveScribe() {
  const { user, token } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [transcriptChunks, setTranscriptChunks] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const [selectedTemplateId, setSelectedTemplateId] = useState("builtin-soap");
  const activeDef = useMemo<TemplateDef>(
    () =>
      getTemplateById(selectedTemplateId) ?? BUILTIN_TEMPLATES[0],
    [selectedTemplateId],
  );

  const [sessionTitle, setSessionTitle] = useState("Add patient details");
  const [speechLang, setSpeechLang] = useState("en-US");
  const [scribbleTab, setScribbleTab] = useState<"context" | "notes">("notes");
  const [encounterContext, setEncounterContext] = useState("");
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [trialDaysLeft] = useState(() => getTrialDaysRemaining());
  const [nowLabel, setNowLabel] = useState("");
  const templateMenuRef = useRef<HTMLDivElement | null>(null);

  const templatePickerOptions = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    const all = listTemplatesForScribe();
    if (!q) return all;
    return all.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    );
  }, [templateSearch]);

  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("");

  const [generatedNote, setGeneratedNote] = useState<Record<
    string,
    any
  > | null>(null);
  const [billingCodes, setBillingCodes] = useState<any[]>([]);
  const [patientSummary, setPatientSummary] = useState<string>("");
  const [rawTranscript, setRawTranscript] = useState<string>("");
  const [speakerUtterances, setSpeakerUtterances] = useState<
    {
      speaker: string | null;
      text: string;
      start: number;
      end: number;
      segment_id?: string | null;
    }[]
  >([]);
  const [diarizationEnabled, setDiarizationEnabled] = useState(false);
  const [editNote, setEditNote] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null); // For Browser Speech Recognition
  const sessionIdRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(
    new Array(20).fill(0)
  );
  const [interimTranscript, setInterimTranscript] = useState("");

  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter((device) => device.kind === "audioinput");
      setAudioDevices(mics);
      if (mics.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(mics[0].deviceId);
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
    }
  };

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date());
    setNowLabel(fmt());
    const id = setInterval(() => setNowLabel(fmt()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!templateMenuRef.current?.contains(e.target as Node)) {
        setTemplateMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    getDevices();

    navigator.mediaDevices.addEventListener("devicechange", getDevices);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", getDevices);
      if (timerRef.current) clearInterval(timerRef.current);
      if (socketRef.current) socketRef.current.close();
      if (recognitionRef.current) recognitionRef.current.stop();
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setSessionTime((prev) => {
          const next = prev + 1;
          if (next >= SESSION_CAP_SECONDS) {
            toast.error(
              "Session limit reached (30 min). Stopping and generating your report."
            );
            setTimeout(() => handleStopRecording(), 0);
          }
          const remaining = getRemainingUsage();
          if (remaining <= 0) {
            toast.error(
              "You have reached your 2-hour total usage limit for this beta period."
            );
            setTimeout(() => handleStopRecording(), 0);
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  useEffect(() => {
    if (isRecording && selectedMicrophone) {
      // Hot-swap visualizer if mic changes during recording
      const swapMic = async () => {
        if (animationFrameRef.current)
          cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) await audioContextRef.current.close();

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: selectedMicrophone } },
          });
          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(stream);
          const analyzer = audioContext.createAnalyser();
          analyzer.fftSize = 64;
          source.connect(analyzer);

          audioContextRef.current = audioContext;
          analyzerRef.current = analyzer;

          const updateLevels = () => {
            const dataArray = new Uint8Array(analyzer.frequencyBinCount);
            analyzer.getByteFrequencyData(dataArray);
            const normalized = Array.from(dataArray.slice(0, 20)).map(
              (v) => v / 255
            );
            setAudioLevels(normalized);
            animationFrameRef.current = requestAnimationFrame(updateLevels);
          };
          updateLevels();
        } catch (err) {
          console.error("Mic swap error:", err);
        }
      };
      swapMic();
    }
  }, [selectedMicrophone]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartRecording = async () => {
    const remaining = getRemainingUsage();
    if (remaining <= 0) {
      toast.error(
        "You have reached your 2-hour total usage limit for this beta period. Contact support if you need more time."
      );
      return;
    }
    if (remaining < 60) {
      toast(
        `Less than 1 minute of usage remaining (${formatUsageTime(remaining)} left).`,
        { icon: "⚠️" }
      );
    }

    const sessionId = `session-${Date.now()}`;
    setCurrentSessionId(sessionId);
    sessionIdRef.current = sessionId;

    // 0. Initialize Audio Visualizer
    try {
      const constraints = {
        audio: selectedMicrophone
          ? { deviceId: { exact: selectedMicrophone } }
          : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 64;
      source.connect(analyzer);

      audioContextRef.current = audioContext;
      analyzerRef.current = analyzer;

      // After permission is granted, labels become available. Refresh the list.
      getDevices();

      const updateLevels = () => {
        const dataArray = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(dataArray);

        // Normalize and pick 20 bars
        const normalized = Array.from(dataArray.slice(0, 20)).map(
          (v) => v / 255
        );
        setAudioLevels(normalized);
        animationFrameRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();

      // --- NEW: Initialize MediaRecorder for high-fidelity audio capture ---
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
    } catch (err) {
      console.error("Visualizer Error:", err);
    }

    // 1. Initialize WebSocket
    try {
      const WS_BASE =
        process.env.NEXT_PUBLIC_SCRIBE_WS_URL || "ws://127.0.0.1:8001";
      socketRef.current = new WebSocket(`${WS_BASE}/ws/scribe/${sessionId}`);

      socketRef.current.onopen = () => {
        console.log("WS Connected");
        toast.success("Recording started...");
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.scrubbed_text) {
          setTranscriptChunks((prev) => [...prev, data.scrubbed_text]);
        }
      };

      socketRef.current.onerror = () => {
        console.error("WebSocket connection error");
        toast.error(
          "Could not connect to the transcription service. Please try again or contact support."
        );
        cleanupLiveRecording();
      };
    } catch (err) {
      toast.error("Could not connect to the transcription service. Please try again.");
      return;
    }

    // 2. Initialize Browser Speech Recognition (ASR)
    // This acts as our "Streaming ASR" from the diagram for now
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = speechLang;

      recognitionRef.current.onstart = () => {
        console.log("Speech recognition service has started");
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          toast.error("Microphone permission denied.");
        }
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        let interim = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        setInterimTranscript(interim);

        if (
          finalTranscript &&
          socketRef.current?.readyState === WebSocket.OPEN
        ) {
          console.log("Sending final chunk to backend:", finalTranscript);
          socketRef.current.send(JSON.stringify({ text: finalTranscript }));
          setInterimTranscript(""); // Clear interim when finalized
        }
      };

      recognitionRef.current.start();
    } else {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    setIsRecording(true);
    setIsPaused(false);
    setGeneratedNote(null);
    setSpeakerUtterances([]);
    setDiarizationEnabled(false);
    setTranscriptChunks([]);
    setSessionTime(0);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      // Resume
      recognitionRef.current?.start();
      mediaRecorderRef.current?.resume();
      setIsPaused(false);
      toast.success("Recording resumed");
    } else {
      // Pause
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.pause();
      setIsPaused(true);
      toast.success("Recording paused");
    }
  };

  /** Stops mic, speech recognition, and WebSocket without calling the backend. */
  const cleanupLiveRecording = () => {
    setIsRecording(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    setAudioLevels(new Array(20).fill(0));
    setInterimTranscript("");
  };

  const handleStopRecording = async () => {
    addUsage(sessionTime);
    cleanupLiveRecording();

    setIsProcessing(true);

    // Wait a tiny bit for the ondataavailable to finish
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      if (!sessionIdRef.current) {
        throw new Error("No active session found");
      }

      // 1. Create FormData with the audio blob
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("session_id", sessionIdRef.current);
      const templateSlug = activeDef.name.replace(/\s+/g, "_").slice(0, 64);
      formData.append("template", templateSlug);
      formData.append("sections_json", JSON.stringify(activeDef.sections));
      if (activeDef.instructions?.trim()) {
        formData.append("ai_style", activeDef.instructions.trim());
      }
      if (encounterContext.trim()) {
        formData.append("clinical_context", encounterContext.trim());
      }

      // 2. Diarized transcription + clinical note (same response shape as before)
      const API_BASE =
        process.env.NEXT_PUBLIC_SCRIBE_SERVICE_URL || "http://127.0.0.1:8001";
      const response = await fetch(`${API_BASE}/scribe/complete-session`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody?.detail) detail = String(errBody.detail);
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }

      const data = await response.json();

      // 3. Update the UI with the real GPT-4o output
      const structured = data.structured_note || {};
      setGeneratedNote(structured);

      const initialEditNote: Record<string, string> = {};
      activeDef.sections.forEach((sectionId) => {
        initialEditNote[sectionId] =
          structured[sectionId] ||
          structured[sectionId.toLowerCase()] ||
          structured[
            sectionId.charAt(0).toUpperCase() + sectionId.slice(1).toLowerCase()
          ] ||
          "";
      });
      setEditNote(initialEditNote);

      setBillingCodes(data.billing_codes || []);
      setPatientSummary(data.patient_summary || "");
      setRawTranscript(data.raw_transcript || "");
      setSpeakerUtterances(Array.isArray(data.utterances) ? data.utterances : []);
      setDiarizationEnabled(Boolean(data.diarization_enabled));

      toast.success("Professional clinical report generated!");
    } catch (err) {
      console.error("Error generating report:", err);
      const raw =
        err instanceof Error ? err.message : "Unknown error";
      const isNetwork =
        /fetch|Failed to fetch|NetworkError|ECONNREFUSED|Load failed/i.test(raw);
      const userMsg = isNetwork
        ? "Could not reach the transcription service. Please check your connection and try again."
        : "Failed to generate report. Please try again or contact support.";
      toast.error(userMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      // Save changes
      setGeneratedNote(editNote);
      toast.success("Note updated locally");
    } else {
      // Entering edit mode: Sync editNote with generatedNote using case-insensitive keys
      // to ensure textareas are populated even if AI used different casing
      if (generatedNote) {
        const syncedNote: Record<string, string> = {};
        activeDef.sections.forEach((sectionId) => {
          syncedNote[sectionId] =
            generatedNote[sectionId] ||
            generatedNote[sectionId.toLowerCase()] ||
            generatedNote[
              sectionId.charAt(0).toUpperCase() +
                sectionId.slice(1).toLowerCase()
            ] ||
            "";
        });
        setEditNote(syncedNote);
      }
    }
    setIsEditing(!isEditing);
  };

  const handleFinalize = async () => {
    if (!user || !generatedNote) return;

    setIsSaving(true);
    try {
      const GATEWAY_BASE =
        process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3003";
      const response = await fetch(`${GATEWAY_BASE}/auth/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          note: {
            rawTranscript: rawTranscript,
            structuredNote: generatedNote,
            template: `${activeDef.name} (${activeDef.id})`,
            billingCodes: billingCodes,
            patientSummary: patientSummary,
            speakerUtterances:
              speakerUtterances.length > 0 ? speakerUtterances : undefined,
            diarizationEnabled,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to save note");

      toast.success("Note finalized and saved to patient history!");
      // Optionally redirect or clear
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save note to history.");
    } finally {
      setIsSaving(false);
    }
  };

  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [discardAction, setDiscardAction] = useState<() => void>(() => {});

  const handleDiscard = () => {
    setDiscardAction(() => () => {
      setGeneratedNote(null);
      setBillingCodes([]);
      setPatientSummary("");
      setRawTranscript("");
      setSpeakerUtterances([]);
      setDiarizationEnabled(false);
      setTranscriptChunks([]);
      setSessionTime(0);
      setCurrentSessionId(null);
      setIsDiscardModalOpen(false);
      toast.success("Session discarded");
    });
    setIsDiscardModalOpen(true);
  };

  const handleDiscardActiveSession = () => {
    setDiscardAction(() => () => {
      addUsage(sessionTime);
      setIsRecording(false);
      setIsPaused(false);

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if (socketRef.current) {
        socketRef.current.close();
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();

      setAudioLevels(new Array(20).fill(0));
      setInterimTranscript("");
      setSessionTime(0);
      setTranscriptChunks([]);
      setCurrentSessionId(null);
      sessionIdRef.current = null;
      setIsDiscardModalOpen(false);
      toast.success("Recording discarded");
    });
    setIsDiscardModalOpen(true);
  };

  const handleNewSession = () => {
    if (isRecording) {
      toast.error("Stop or discard the recording first.");
      return;
    }
    setGeneratedNote(null);
    setBillingCodes([]);
    setPatientSummary("");
    setRawTranscript("");
    setSpeakerUtterances([]);
    setDiarizationEnabled(false);
    setTranscriptChunks([]);
    setSessionTime(0);
    setCurrentSessionId(null);
    setSessionTitle("Add patient details");
    setEncounterContext("");
    toast.success("New session");
  };

  const sourceLabel = (s: TemplateDef["source"]) =>
    s === "builtin" ? "Standard" : s === "community" ? "Community" : "Yours";

  const transcriptionQuotaSecondsLeft = Math.max(
    0,
    getRemainingUsage() - (isRecording ? sessionTime : 0),
  );

  return (
    <div className="max-w-5xl mx-auto pb-24 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:justify-between">
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-3">
          <input
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="Session title"
            className="flex-1 min-w-[200px] text-2xl md:text-3xl font-serif font-semibold bg-transparent border-b border-slate-200/80 dark:border-slate-700 focus:border-trust-blue focus:outline-none text-slate-900 dark:text-white py-1"
          />
          <button
            type="button"
            disabled={isRecording || isProcessing}
            onClick={handleNewSession}
            title="Clear draft session"
            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
          >
            <TrashIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="relative group">
            <select
              disabled={isRecording}
              value={selectedMicrophone}
              onChange={(e) => setSelectedMicrophone(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 pr-9 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-trust-blue/15 outline-none max-w-[200px]"
            >
              {audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Mic ${device.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button
            type="button"
            onClick={handleNewSession}
            disabled={isRecording}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 disabled:opacity-40"
          >
            Create
          </button>
          <div className="flex rounded-xl overflow-hidden shadow-lg shadow-emerald-500/15">
            {!isRecording ? (
              <button
                type="button"
                onClick={handleStartRecording}
                disabled={getRemainingUsage() <= 0 || isProcessing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold disabled:opacity-40"
              >
                <MicrophoneIcon className="w-5 h-5" />
                Transcribe
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopRecording}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold disabled:opacity-50"
              >
                <StopIcon className="w-5 h-5" />
                Finish &amp; generate
              </button>
            )}
            <button
              type="button"
              disabled={!isRecording || isProcessing}
              onClick={handlePauseResume}
              className="px-3 bg-emerald-600/90 hover:bg-emerald-700 text-white border-l border-emerald-400/40 disabled:opacity-30"
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? (
                <PlayIcon className="w-5 h-5" />
              ) : (
                <PauseIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:gap-5 text-sm text-slate-600 dark:text-slate-400">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5">
          <CalendarDaysIcon className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-slate-800 dark:text-slate-100">
            {nowLabel || "…"}
          </span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5">
          <GlobeAltIcon className="w-4 h-4 text-slate-500" />
          <select
            value={speechLang}
            onChange={(e) => setSpeechLang(e.target.value)}
            disabled={isRecording}
            className="bg-transparent font-medium text-slate-800 dark:text-slate-100 text-sm outline-none cursor-pointer disabled:opacity-50"
          >
            {SCRIBE_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </span>
        <span
          className="inline-flex items-center gap-2 rounded-full border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/40 px-3 py-1.5 text-violet-800 dark:text-violet-200 font-semibold text-xs"
          title="Beta clinician trial allowance"
        >
          {trialDaysLeft} days left · trial
        </span>
        <span
          className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 dark:border-teal-900 bg-teal-50/90 dark:bg-teal-950/40 px-3 py-1.5 text-teal-900 dark:text-teal-100 text-xs font-semibold"
          title="Total ambient transcription time remaining this beta period"
        >
          <span className="text-teal-700/80 dark:text-teal-300/90 font-medium">
            Recording allowance
          </span>
          <span className="font-mono tabular-nums font-bold">
            {formatUsageTime(transcriptionQuotaSecondsLeft)} left
          </span>
        </span>
        <span className="inline-flex items-center gap-3 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-1.5">
          <ClockIcon className="w-4 h-4 text-slate-500 shrink-0" />
          <span
            className={`font-mono font-bold tracking-tight ${
              isRecording ? "text-rose-500" : "text-slate-500"
            }`}
          >
            {formatTime(sessionTime)}
          </span>
          <div className="flex items-center gap-0.5 h-8">
            {([0.2, 0.45, 0.65, 0.85, 1] as const).map((m, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isRecording && !isPaused
                    ? audioLevels[i * 4] !== undefined &&
                      audioLevels[i * 4] > m * 0.35
                      ? "bg-emerald-500 h-5"
                      : "bg-slate-200 dark:bg-slate-600 h-2"
                    : "bg-slate-200 dark:bg-slate-600 h-2"
                }`}
              />
            ))}
          </div>
        </span>
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {(["context", "notes"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setScribbleTab(tab)}
            className={`px-5 py-3 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors ${
              scribbleTab === tab
                ? "border-trust-blue text-trust-blue"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {scribbleTab === "context" && (
        <div className="card p-6 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Extra context sent to AI with this encounter
          </p>
          <textarea
            value={encounterContext}
            onChange={(e) => setEncounterContext(e.target.value)}
            rows={10}
            disabled={isRecording}
            placeholder="Paste prior visit summary, meds, goals, interpreter needs, billing context…"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-trust-blue/20 outline-none resize-y disabled:opacity-60"
          />
        </div>
      )}

      {scribbleTab === "notes" && (
        <div className="card overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-trust-blue/25 to-transparent" />
          <div className="p-5 md:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:justify-between">
              <div className="relative" ref={templateMenuRef}>
                <button
                  type="button"
                  disabled={isRecording || isProcessing}
                  onClick={() => setTemplateMenuOpen((o) => !o)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#fcf9f9] dark:bg-slate-800/50 text-sm font-semibold text-slate-900 dark:text-white hover:border-trust-blue/30 transition-colors disabled:opacity-40"
                >
                  <RectangleStackIcon className="w-5 h-5 text-slate-500" />
                  Select a template
                  <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                </button>
                <span className="ml-3 text-sm font-medium text-slate-500">
                  Active:{" "}
                  <span className="text-trust-blue font-semibold">
                    {activeDef.name}
                  </span>
                </span>

                <AnimatePresence>
                  {templateMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute left-0 top-full mt-2 z-50 w-[min(100vw-2rem,28rem)] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                        <input
                          autoFocus
                          value={templateSearch}
                          onChange={(e) => setTemplateSearch(e.target.value)}
                          placeholder="Search templates…"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-trust-blue/15"
                        />
                      </div>
                      <div className="max-h-72 overflow-y-auto p-2">
                        {templatePickerOptions.length === 0 && (
                          <p className="text-sm text-slate-500 px-3 py-6 text-center">
                            No matches. Try Library or create your own —{" "}
                            <Link
                              href="/dashboard/templates"
                              className="text-trust-blue font-semibold"
                              onClick={() => setTemplateMenuOpen(false)}
                            >
                              Manage templates
                            </Link>
                          </p>
                        )}
                        {templatePickerOptions.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setSelectedTemplateId(t.id);
                              setTemplateMenuOpen(false);
                              toast.success(`Template: ${t.name}`);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl hover:bg-[#fcf9f9] dark:hover:bg-slate-800/80 transition-colors ${
                              selectedTemplateId === t.id
                                ? "bg-trust-blue/5 ring-1 ring-trust-blue/20"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {t.name}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">
                                {sourceLabel(t.source)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {t.description}
                            </p>
                          </button>
                        ))}
                      </div>
                      <Link
                        href="/dashboard/templates"
                        className="block text-center py-3 text-sm font-semibold text-trust-blue bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800"
                        onClick={() => setTemplateMenuOpen(false)}
                      >
                        Manage in Library →
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {!isRecording && (
                <p className="text-xs text-slate-500 max-w-md">
                  {activeDef.description}.{" "}
                  <button
                    type="button"
                    onClick={() => setScribbleTab("context")}
                    className="text-trust-blue font-semibold underline-offset-2 hover:underline"
                  >
                    Add context
                  </button>{" "}
                  anytime before generating.
                </p>
              )}
            </div>

            {!generatedNote && !isProcessing && (
              <div className="min-h-[220px] flex flex-col items-center justify-center text-center px-6 py-14 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4">
                  <SparklesIcon className="w-7 h-7 text-trust-blue/70" />
                </div>
                <p className="text-lg font-serif font-medium text-slate-800 dark:text-slate-100">
                  Ready when you are.
                </p>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                  Transcribe to capture dialogue, then we structure it into{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {activeDef.name}
                  </span>
                  .
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      disabled={getRemainingUsage() <= 0}
                      className="px-6 py-3 rounded-xl bg-trust-blue text-white font-bold text-sm shadow-lg shadow-trust-blue/20 hover:brightness-105 disabled:opacity-40"
                    >
                      Start recording
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleDiscardActiveSession}
                        className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-200"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm"
                      >
                        Finish &amp; generate
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {isRecording && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div
                    className={`pill ${
                      isPaused
                        ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isPaused ? "bg-amber-500" : "bg-rose-500 animate-pulse"
                      }`}
                    />
                    {isPaused ? "Paused" : "Recording"}
                  </div>
                  <button
                    type="button"
                    onClick={handleDiscardActiveSession}
                    className="text-sm font-semibold text-rose-500 hover:underline"
                  >
                    Discard recording
                  </button>
                </div>
                <div className="h-14 flex items-end justify-center gap-1.5 py-2">
                  {audioLevels.map((level, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: Math.max(6, level * 48) }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                      className="w-1.5 bg-gradient-to-t from-trust-blue to-indigo-400 rounded-full opacity-80"
                    />
                  ))}
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 p-5 text-left max-h-40 overflow-y-auto">
                  <p className="text-[10px] font-black tracking-widest text-trust-blue uppercase mb-2">
                    Live preview
                  </p>
                  {transcriptChunks.length === 0 && !interimTranscript && (
                    <p className="text-sm text-slate-400 italic">
                      Waiting for speech…
                    </p>
                  )}
                  {transcriptChunks.map((chunk, i) => (
                    <p
                      key={i}
                      className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                    >
                      {chunk}
                    </p>
                  ))}
                  {interimTranscript && (
                    <p className="text-sm text-slate-400 italic">
                      {interimTranscript}
                    </p>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-500">
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider">
                      Session cap
                    </span>
                    <div className="h-1.5 mt-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-trust-blue rounded-full"
                        style={{
                          width: `${Math.min(100, (sessionTime / SESSION_CAP_SECONDS) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>{formatTime(sessionTime)}</span>
                      <span>{formatTime(SESSION_CAP_SECONDS)}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase tracking-wider">
                      Total beta usage
                    </span>
                    <div className="h-1.5 mt-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            ((getTotalUsage() + sessionTime) /
                              TOTAL_USAGE_CAP_SECONDS) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>
                        {formatUsageTime(getTotalUsage() + sessionTime)}
                      </span>
                      <span>{formatUsageTime(TOTAL_USAGE_CAP_SECONDS)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-center text-[11px] text-slate-400 max-w-2xl mx-auto leading-relaxed">
        Review AI output before it is relied on clinically. PHI is streamed for
        transcription and structured summarization according to our beta terms.
      </p>

      <AnimatePresence mode="wait">
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card p-12 text-center flex flex-col items-center gap-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-trust-blue/10 flex items-center justify-center">
              <SparklesIcon className="w-8 h-8 text-trust-blue animate-spin-slow" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Generating Report
              </h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                Our medical AI is structuring your encounter into a clinical
                report...
              </p>
            </div>
            <div className="w-64 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-full h-full bg-trust-blue"
              />
            </div>
          </motion.div>
        )}

        {generatedNote && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Main Note Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ClipboardDocumentCheckIcon className="w-6 h-6 text-trust-blue" />
                  Structured Clinical Report
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDiscard}
                    className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition-all"
                    title="Discard Session"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={toggleEdit}
                    className={`pill text-xs font-bold py-1.5 ${
                      isEditing ? "bg-emerald-500 text-white" : ""
                    }`}
                  >
                    {isEditing ? "Save Note" : "Edit Note"}
                  </button>
                  <button
                    onClick={handleFinalize}
                    disabled={isSaving}
                    className="bg-trust-blue text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-trust-blue/20 disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Finalize & Save"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {activeDef.sections.map((sectionId) => {
                  return (
                    <div
                      key={sectionId}
                      className="card p-6 space-y-3 hover:border-trust-blue/30 transition-colors"
                    >
                      <div className="text-[10px] font-black tracking-widest text-trust-blue uppercase">
                        {sectionId}
                      </div>
                      {isEditing ? (
                        <textarea
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-trust-blue/20 outline-none transition-all"
                          rows={3}
                          value={editNote[sectionId] || ""}
                          onChange={(e) =>
                            setEditNote({
                              ...editNote,
                              [sectionId]: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                          {generatedNote?.[sectionId] ||
                            generatedNote?.[sectionId.toLowerCase()] ||
                            generatedNote?.[
                              sectionId.charAt(0).toUpperCase() +
                                sectionId.slice(1).toLowerCase()
                            ] ||
                            `${sectionId} content missing.`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {speakerUtterances.length > 0 && (
                <div className="card p-6 space-y-4 border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MicrophoneIcon className="w-4 h-4 text-indigo-500" />
                      <span className="text-[10px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                        Full Encounter Conversation
                      </span>
                    </div>
                    {diarizationEnabled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Speakers identified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                        Timestamps only
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {speakerUtterances.map((u, i) => {
                      const hasSpeaker =
                        u.speaker != null && u.speaker !== "";
                      const mins = Math.floor(u.start / 60);
                      const secs = Math.floor(u.start % 60);
                      const ts = `${mins}:${secs
                        .toString()
                        .padStart(2, "0")}`;
                      return (
                        <div
                          key={i}
                          className="flex gap-3 items-start group"
                        >
                          <span className="text-[10px] font-mono text-slate-400 pt-1 w-10 shrink-0 text-right">
                            {ts}
                          </span>
                          <div
                            className={`flex-1 rounded-xl px-4 py-2.5 ${
                              hasSpeaker
                                ? i % 2 === 0
                                  ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                                  : "bg-trust-blue/5 dark:bg-trust-blue/10 border border-trust-blue/10"
                                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                            }`}
                          >
                            {hasSpeaker && (
                              <span className="text-[10px] font-black tracking-widest uppercase text-trust-blue block mb-1">
                                {u.speaker}
                              </span>
                            )}
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              {u.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Admin Package: Billing Codes & Patient Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="card p-6 space-y-4 border-trust-blue/10 bg-trust-blue/5">
                  <div className="flex items-center gap-2 text-trust-blue">
                    <SparklesIcon className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">
                      ICD-10 Billing Codes
                    </span>
                  </div>
                  <div className="space-y-2">
                    {billingCodes.length > 0 ? (
                      billingCodes.map((bc, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-trust-blue/10"
                        >
                          <span className="font-mono font-bold text-trust-blue text-sm">
                            {bc.code}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            {bc.description}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No codes generated.
                      </p>
                    )}
                  </div>
                </div>

                <div className="card p-6 space-y-4 border-emerald-500/10 bg-emerald-500/5">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">
                      Patient-Friendly Summary
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {patientSummary ||
                      "Generate a summary by stopping the recording."}
                  </p>
                </div>
              </div>
            </div>

            {/* Side Actions Area */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Workflow Actions
              </h3>

              <div className="card p-6 space-y-6">
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      if (!generatedNote) return;
                      const sections = activeDef.sections;
                      const text = sections
                        .map((s) => `${s.toUpperCase()}\n${generatedNote[s] || generatedNote[s.toLowerCase()] || generatedNote[s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()] || ""}`)
                        .join("\n\n");
                      navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard!"));
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-trust-blue/5 hover:border-trust-blue/20 border border-transparent transition-all group"
                  >
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      Copy to Clipboard
                    </span>
                    <ClipboardIcon className="w-5 h-5 text-slate-400 group-hover:text-trust-blue" />
                  </button>
                  <div className="relative w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-transparent opacity-60 cursor-not-allowed">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      Sync to Epic EHR
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-tighter bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md text-slate-500 dark:text-slate-400">
                      Soon
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                    Generate Extra
                  </p>
                  <div className="relative w-full text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        Referral Letter
                      </p>
                      <span className="text-[8px] font-black uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-400">
                        Soon
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Based on this plan</p>
                  </div>
                  <div className="relative w-full text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        Patient Summary
                      </p>
                      <span className="text-[8px] font-black uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-400">
                        Soon
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Layman terms version
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional Confirmation Modal */}
      <AnimatePresence>
        {isDiscardModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDiscardModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-2">
                  <TrashIcon className="w-8 h-8 text-rose-500" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Discard this session?
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    This action cannot be undone. All recorded audio and
                    generated content for this encounter will be permanently
                    deleted.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full pt-4">
                  <button
                    onClick={() => setIsDiscardModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={discardAction}
                    className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all"
                  >
                    Discard Session
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
