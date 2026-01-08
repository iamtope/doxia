"use client";

import { motion } from "framer-motion";
import { 
  MicrophoneIcon, 
  DocumentTextIcon, 
  Squares2X2Icon, 
  Cog6ToothIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon
} from "@heroicons/react/24/outline";

export default function DashboardPreview() {
  return (
    <div className="relative w-full max-w-5xl mx-auto px-4 py-12">
      {/* Background Glows */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-trust-blue/10 blur-[120px] rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-indigo-500/10 blur-[120px] rounded-full" />

      {/* Main Container - Mock Browser/App Frame */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative glass rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white/40 dark:border-slate-800/60 flex h-[600px]"
      >
        {/* Sidebar */}
        <div className="w-64 border-r border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/50 p-6 hidden md:flex flex-col gap-8">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-lg bg-trust-blue flex items-center justify-center">
              <span className="text-white font-bold text-lg italic">d</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">doxia</span>
          </div>

          <nav className="space-y-1">
            {[
              { icon: Squares2X2Icon, label: "Dashboard", active: false },
              { icon: MicrophoneIcon, label: "Live Scribe", active: true },
              { icon: DocumentTextIcon, label: "Patient Notes", active: false },
              { icon: UsersIcon, label: "Team Collaboration", active: false },
              { icon: ArrowPathIcon, label: "EHR Sync", active: false },
              { icon: Cog6ToothIcon, label: "Settings", active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  item.active 
                    ? "bg-white dark:bg-slate-800 text-trust-blue shadow-sm border border-slate-200/50 dark:border-slate-700/50" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/30"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>
            ))}
          </nav>

          <div className="mt-auto p-4 rounded-2xl bg-trust-blue/5 border border-trust-blue/10">
            <p className="text-[10px] uppercase tracking-wider font-bold text-trust-blue mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">HIPAA & GDPR Protected</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white/30 dark:bg-slate-900/30">
          {/* Header */}
          <header className="h-16 border-b border-slate-200/40 dark:border-slate-800/40 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Patient: John Doe</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">DOB: 05/12/1984</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="pill text-xs font-bold py-1.5 h-auto">Save Draft</button>
              <button className="px-4 py-1.5 rounded-full bg-trust-blue text-white text-xs font-bold shadow-lg shadow-trust-blue/20">Finalize Note</button>
            </div>
          </header>

          {/* Scribe Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Recording Bar */}
            <div className="card p-6 flex items-center gap-6">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-20" />
                <MicrophoneIcon className="w-6 h-6 text-rose-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Listening ambiently...</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">Accents: Local</span>
                    <span className="text-xs font-mono text-slate-400">08:42</span>
                  </div>
                </div>
                <div className="h-8 flex items-center gap-1">
                  {[...Array(32)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 12, 6, 20, 8][i % 5] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.05 }}
                      className="w-1 bg-trust-blue rounded-full opacity-60"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Generated Note Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="w-4 h-4" /> Clinical Report
                  </h3>
                  <div className="pill px-2 py-0.5 text-[10px] bg-trust-blue/5 text-trust-blue border-trust-blue/10">
                    Template: SOAP
                  </div>
                </div>
                <div className="space-y-6">
                  <section>
                    <p className="text-xs font-bold text-trust-blue mb-1">SUBJECTIVE</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Patient reports lower back pain (7/10) for 3 days following heavy lifting. Describes it as a "sharp, stabbing" sensation radiating to the left hip. No numbness or tingling.
                    </p>
                  </section>
                  <section>
                    <p className="text-xs font-bold text-trust-blue mb-1">OBJECTIVE</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Lumbosacral tenderness present at L4-L5. Range of motion limited in flexion (30°). Straight leg raise negative bilaterally. Strength 5/5 in lower extremities.
                    </p>
                  </section>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <ArrowPathIcon className="w-4 h-4" /> EHR Direct Sync
                </h3>
                <div className="card p-4 border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">CONNECTED TO EPIC EHR</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="h-2 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="h-2 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  </div>
                </div>
                <div className="pill w-full justify-center bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-bold">Push to AthenaHealth</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Badges similar to reference image */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute -right-8 top-1/4 space-y-4 hidden lg:block"
      >
        {[
          { text: "Fast AI Processing", color: "bg-emerald-500" },
          { text: "Simple EHR Sync", color: "bg-trust-blue" },
          { text: "Secure Data Layer", color: "bg-indigo-500" },
        ].map((badge, i) => (
          <div key={i} className="glass py-3 px-6 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/60">
            <CheckCircleIcon className={`w-6 h-6 text-white p-1 rounded-full ${badge.color}`} />
            <span className="font-bold text-slate-800 dark:text-slate-100">{badge.text}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

