"use client";

import { useState, useEffect, useRef } from "react";
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
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

const TEMPLATES = {
  SOAP: {
    name: "SOAP",
    description: "Subjective, Objective, Assessment, Plan",
    sections: ["SUBJECTIVE", "OBJECTIVE", "ASSESSMENT", "PLAN"],
  },
  DAP: {
    name: "DAP",
    description: "Data, Assessment, Plan",
    sections: ["DATA", "ASSESSMENT", "PLAN"],
  },
  BIRP: {
    name: "BIRP",
    description: "Behavior, Intervention, Response, Plan",
    sections: ["BEHAVIOR", "INTERVENTION", "RESPONSE", "PLAN"],
  },
};

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
  const [activeTemplate, setActiveTemplate] =
    useState<keyof typeof TEMPLATES>("SOAP");

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
      recognitionRef.current.interimResults = true; // Changed to true for better responsiveness
      recognitionRef.current.lang = "en-US";

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
      formData.append("template", activeTemplate);

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

      // Initialize editNote with correct keys for the current template
      const initialEditNote: Record<string, string> = {};
      TEMPLATES[activeTemplate].sections.forEach((sectionId) => {
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
        TEMPLATES[activeTemplate].sections.forEach((sectionId) => {
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
            template: activeTemplate,
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Live Scribe
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Capture patient encounters ambiently.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Microphone Selector */}
          <div className="relative group">
            <select
              disabled={isRecording}
              value={selectedMicrophone}
              onChange={(e) => setSelectedMicrophone(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2 pr-10 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-trust-blue/20 outline-none transition-all disabled:opacity-50 cursor-pointer"
            >
              {audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div
            className={`pill ${
              isRecording
                ? isPaused
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            } text-xs font-bold uppercase tracking-tighter`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isRecording
                  ? isPaused
                    ? "bg-amber-500"
                    : "bg-rose-500 animate-pulse"
                  : "bg-emerald-500"
              } mr-2`}
            />
            {isRecording
              ? isPaused
                ? "Recording Paused"
                : "Streaming Audio"
              : "Secure Connection"}
          </div>
        </div>
      </div>

      {/* Template Selection Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl w-fit">
        {(Object.keys(TEMPLATES) as Array<keyof typeof TEMPLATES>).map(
          (key) => (
            <button
              key={key}
              onClick={() => setActiveTemplate(key)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTemplate === key
                  ? "bg-white dark:bg-slate-800 text-trust-blue shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {TEMPLATES[key].name}
            </button>
          )
        )}
      </div>

      {/* Recording Control Card */}
      <div className="card p-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-trust-blue/5 to-indigo-500/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center gap-6">
          <div className="space-y-2">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Active Session
            </div>
            <div
              className={`text-6xl font-mono font-bold tracking-tighter ${
                isRecording
                  ? "text-rose-500"
                  : "text-slate-300 dark:text-slate-700"
              }`}
            >
              {formatTime(sessionTime)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={getRemainingUsage() <= 0}
                className={`h-20 w-20 rounded-full text-white flex items-center justify-center transition-all ${
                  getRemainingUsage() <= 0
                    ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                    : "bg-trust-blue shadow-[0_20px_50px_-15px_rgba(0,82,204,0.5)] hover:scale-105"
                }`}
              >
                <MicrophoneIcon className="w-10 h-10" />
              </button>
            ) : (
              <div className="flex items-center gap-8">
                <button
                  onClick={handleDiscardActiveSession}
                  className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-all group"
                  title="Discard Recording"
                >
                  <TrashIcon className="w-7 h-7 group-hover:scale-110 transition-transform" />
                </button>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePauseResume}
                    className={`h-16 w-16 rounded-full ${
                      isPaused ? "bg-emerald-500" : "bg-amber-500"
                    } text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all`}
                  >
                    {isPaused ? (
                      <PlayIcon className="w-8 h-8" />
                    ) : (
                      <PauseIcon className="w-8 h-8" />
                    )}
                  </button>
                  <button
                    onClick={handleStopRecording}
                    className="h-20 w-20 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-[0_20px_50px_-15px_rgba(244,63,94,0.5)] hover:scale-105 transition-all animate-pulse"
                  >
                    <StopIcon className="w-10 h-10" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {isRecording
              ? "Doxia is listening ambiently..."
              : getRemainingUsage() <= 0
                ? "Usage limit reached. Contact support for more time."
                : "Click the microphone to start capturing."}
          </p>

          {/* Session & Usage Limits */}
          <div className="w-full max-w-sm space-y-2">
            {isRecording && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Session</span>
                  <span>{formatTime(sessionTime)} / {formatTime(SESSION_CAP_SECONDS)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      sessionTime / SESSION_CAP_SECONDS > 0.9
                        ? "bg-rose-500"
                        : sessionTime / SESSION_CAP_SECONDS > 0.75
                          ? "bg-amber-500"
                          : "bg-trust-blue"
                    }`}
                    style={{ width: `${Math.min(100, (sessionTime / SESSION_CAP_SECONDS) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Total Usage</span>
                <span>{formatUsageTime(getTotalUsage() + (isRecording ? sessionTime : 0))} / {formatUsageTime(TOTAL_USAGE_CAP_SECONDS)}</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (getTotalUsage() + (isRecording ? sessionTime : 0)) / TOTAL_USAGE_CAP_SECONDS > 0.9
                      ? "bg-rose-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, ((getTotalUsage() + (isRecording ? sessionTime : 0)) / TOTAL_USAGE_CAP_SECONDS) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {isRecording && (
            <div className="h-12 flex items-center gap-1.5 mb-4">
              {audioLevels.map((level, i) => (
                <motion.div
                  key={i}
                  animate={{ height: Math.max(4, level * 40) }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-1.5 bg-trust-blue rounded-full opacity-60"
                />
              ))}
            </div>
          )}

          {isRecording && (
            <div className="w-full max-w-lg bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 text-left border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-black tracking-widest text-trust-blue uppercase mb-2">
                Live Preview (Scrubbed)
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                {transcriptChunks.length === 0 && !interimTranscript && (
                  <p className="text-slate-400 italic text-sm">
                    Waiting for speech...
                  </p>
                )}
                {transcriptChunks.map((chunk, i) => (
                  <p
                    key={i}
                    className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium"
                  >
                    {chunk}
                  </p>
                ))}
                {interimTranscript && (
                  <p className="text-sm text-slate-400 leading-relaxed font-medium italic">
                    {interimTranscript}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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
                {TEMPLATES[activeTemplate].sections.map((sectionId) => {
                  const sectionKey = sectionId.toLowerCase();
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
                      const sections = TEMPLATES[activeTemplate].sections;
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
