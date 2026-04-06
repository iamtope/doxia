"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DocumentTextIcon,
  CalendarIcon,
  TagIcon,
  ChevronRightIcon,
  SparklesIcon,
  CheckCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

interface Note {
  id: number;
  rawTranscript: string;
  structuredNote: any;
  template: string;
  billingCodes: any[];
  patientSummary: string;
  createdAt: string;
  userId: number;
}

export default function PatientNotes() {
  const { user, token } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && token) {
      fetchNotes();
    }
  }, [user, token]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const GATEWAY_BASE = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3003";
      const response = await fetch(`${GATEWAY_BASE}/auth/notes/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch notes");
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load patient history.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Patient Notes
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          History of all ambiently captured encounters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Notes List */}
        <div className="lg:col-span-1 space-y-4 h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-8 h-8 border-4 border-trust-blue border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Loading history...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="card p-12 text-center space-y-4 opacity-60">
              <DocumentTextIcon className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                No encounters saved yet.
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`w-full text-left card p-5 transition-all group ${
                  selectedNote?.id === note.id
                    ? "border-trust-blue bg-trust-blue/5 shadow-md"
                    : "hover:border-trust-blue/30"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="pill bg-trust-blue/10 text-trust-blue py-0.5 px-2 text-[10px] font-bold uppercase tracking-widest">
                    {note.template}
                  </div>
                  <ChevronRightIcon className={`w-4 h-4 transition-transform ${
                    selectedNote?.id === note.id ? "translate-x-1 text-trust-blue" : "text-slate-300 group-hover:text-slate-400"
                  }`} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">
                  Encounter on {new Date(note.createdAt).toLocaleDateString()}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {formatDate(note.createdAt)}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Note Detail */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedNote ? (
              <motion.div
                key={selectedNote.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="card p-8 space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Clinical Report Detail
                      </h2>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <CalendarIcon className="w-4 h-4" />
                          {formatDate(selectedNote.createdAt)}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <TagIcon className="w-4 h-4" />
                          Template: {selectedNote.template}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Structured Sections */}
                    <div className="space-y-4">
                      {selectedNote.structuredNote && 
                        Object.keys(selectedNote.structuredNote).map((section) => (
                        <div key={section} className="space-y-2">
                          <div className="text-[10px] font-black tracking-widest text-trust-blue uppercase">
                            {section}
                          </div>
                          <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                            {selectedNote.structuredNote[section]}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Admin Package */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-trust-blue">
                          <SparklesIcon className="w-5 h-5" />
                          <span className="text-xs font-black uppercase tracking-widest">
                            ICD-10 Billing Codes
                          </span>
                        </div>
                        <div className="space-y-2">
                          {selectedNote.billingCodes && selectedNote.billingCodes.length > 0 ? (
                            selectedNote.billingCodes.map((bc, i) => (
                              <div key={i} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-trust-blue/5">
                                <span className="font-mono font-bold text-trust-blue text-sm">{bc.code}</span>
                                <span className="text-xs text-slate-600 dark:text-slate-400">{bc.description}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">No codes recorded.</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCircleIcon className="w-5 h-5" />
                          <span className="text-xs font-black uppercase tracking-widest">
                            Patient Summary
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {selectedNote.patientSummary || "No summary recorded."}
                        </p>
                      </div>
                    </div>

                    {/* Raw Transcript Reveal */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <details className="group">
                        <summary className="flex items-center justify-between cursor-pointer list-none">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-open:text-trust-blue transition-colors">
                            Show Original Scrubbed Transcript
                          </span>
                          <ChevronRightIcon className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                        </summary>
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 leading-relaxed max-h-48 overflow-y-auto">
                          {selectedNote.rawTranscript}
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-30 py-20">
                <DocumentTextIcon className="w-24 h-24 text-slate-300" />
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Select an Encounter
                  </h3>
                  <p className="text-sm text-slate-500">
                    Choose a note from the left to view full details.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

