"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MicrophoneIcon, 
  StopIcon, 
  ArrowPathIcon, 
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

export default function LiveScribe() {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedNote, setGeneratedNote] = useState<null | {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  }>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setGeneratedNote(null);
    setTranscript("");
    setSessionTime(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Simulate AI Processing
    setTimeout(() => {
      setIsProcessing(false);
      setGeneratedNote({
        subjective: "Patient reports chronic lower back pain for 2 weeks. Pain is sharp and radiates to the left thigh. Aggravated by prolonged sitting.",
        objective: "Tenderness noted at L4-L5 levels. Decreased range of motion in spinal flexion. Muscle strength 5/5 bilaterally. Reflexes intact.",
        assessment: "Mechanical low back pain with possible early radiculopathy. No emergent neurological deficits noted.",
        plan: "Physical therapy referral. Prescribed Naproxen 500mg BID. Follow up in 3 weeks. Return if weakness or numbness develops.",
      });
    }, 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Live Scribe</h1>
          <p className="text-slate-500 dark:text-slate-400">Capture patient encounters ambiently.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="pill bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-bold uppercase tracking-tighter">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-2" />
            Secure Connection
          </div>
        </div>
      </div>

      {/* Recording Control Card */}
      <div className="card p-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-trust-blue/5 to-indigo-500/5 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center gap-6">
          <div className="space-y-2">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Session</div>
            <div className={`text-6xl font-mono font-bold tracking-tighter ${isRecording ? "text-rose-500" : "text-slate-300 dark:text-slate-700"}`}>
              {formatTime(sessionTime)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="h-20 w-20 rounded-full bg-trust-blue text-white flex items-center justify-center shadow-[0_20px_50px_-15px_rgba(0,82,204,0.5)] hover:scale-105 transition-all"
              >
                <MicrophoneIcon className="w-10 h-10" />
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="h-20 w-20 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-[0_20px_50px_-15px_rgba(244,63,94,0.5)] hover:scale-105 transition-all animate-pulse"
              >
                <StopIcon className="w-10 h-10" />
              </button>
            )}
          </div>

          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {isRecording ? "Doxia is listening ambiently..." : "Click the microphone to start capturing."}
          </p>

          {isRecording && (
            <div className="h-12 flex items-center gap-1.5">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [4, 16, 8, 32, 12][i % 5] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.03 }}
                  className="w-1 bg-trust-blue rounded-full opacity-40"
                />
              ))}
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Generating Report</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Our medical AI is structuring your encounter into a clinical report...</p>
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
                  <button className="pill text-xs font-bold py-1.5">Edit Note</button>
                  <button className="bg-trust-blue text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-trust-blue/20">Finalize</button>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { id: "SUBJECTIVE", content: generatedNote.subjective },
                  { id: "OBJECTIVE", content: generatedNote.objective },
                  { id: "ASSESSMENT", content: generatedNote.assessment },
                  { id: "PLAN", content: generatedNote.plan },
                ].map((section) => (
                  <div key={section.id} className="card p-6 space-y-3 hover:border-trust-blue/30 transition-colors">
                    <div className="text-[10px] font-black tracking-widest text-trust-blue uppercase">{section.id}</div>
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Side Actions Area */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Workflow Actions</h3>
              
              <div className="card p-6 space-y-6">
                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-trust-blue/5 hover:border-trust-blue/20 border border-transparent transition-all group">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Copy to Clipboard</span>
                    <ArrowPathIcon className="w-5 h-5 text-slate-400 group-hover:text-trust-blue" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-500/5 hover:border-emerald-500/20 border border-transparent transition-all group">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Sync to Epic EHR</span>
                    <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                  </button>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Generate Extra</p>
                  <button className="w-full text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Referral Letter</p>
                    <p className="text-xs text-slate-500">Based on this plan</p>
                  </button>
                  <button className="w-full text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Patient Summary</p>
                    <p className="text-xs text-slate-500">Layman terms version</p>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

