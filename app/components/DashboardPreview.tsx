import {
  MicrophoneIcon,
  DocumentTextIcon,
  ClipboardIcon,
  QueueListIcon,
  UsersIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

/** Static product frame — no motion, glass, or floating badges */
export default function DashboardPreview() {
  return (
    <div className="border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex h-[480px]">
        <aside className="hidden sm:flex w-52 flex-col border-r border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950 p-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 bg-[#0052CC] flex items-center justify-center text-white text-sm font-bold">
              d
            </div>
            <span className="font-semibold text-sm">doxia</span>
          </div>
          <nav className="space-y-0.5 text-sm">
            {[
              { icon: MicrophoneIcon, label: "Live Scribe", active: true },
              { icon: DocumentTextIcon, label: "Patient Notes" },
              { icon: QueueListIcon, label: "Templates" },
              { icon: UsersIcon, label: "Team Sync", soon: true },
              { icon: ArrowPathIcon, label: "EHR Integrations" },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between gap-2 px-2 py-1.5 ${
                  item.active
                    ? "bg-white dark:bg-slate-900 border-l-2 border-[#0052CC] text-[#0052CC]"
                    : "text-slate-500"
                }`}
              >
                <span className="flex items-center gap-2">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </span>
                {item.soon && (
                  <span className="text-[9px] uppercase text-slate-400">Soon</span>
                )}
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 border-b border-stone-200 dark:border-slate-800 px-4 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              Add patient details
            </span>
            <span className="text-xs text-rose-600 font-medium">Recording</span>
          </header>

          <div className="flex-1 p-4 space-y-4 overflow-hidden text-sm">
            <div className="flex items-center gap-3 p-3 border border-stone-200 dark:border-slate-800">
              <MicrophoneIcon className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  Listening…
                </p>
                <div className="mt-2 flex gap-0.5 h-4 items-end">
                  {[3, 5, 4, 7, 5, 8, 4, 6, 5, 7, 4, 5].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-[#0052CC]/50"
                      style={{ height: `${h * 2}px` }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400">04:12</span>
            </div>

            <div className="grid grid-cols-2 gap-3 min-h-0">
              <div className="border border-stone-200 dark:border-slate-800 p-3 space-y-2 overflow-hidden">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  SOAP · Subjective
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4">
                  Lower back pain 7/10 for 3 days post lifting. Sharp, left hip.
                  No numbness.
                </p>
              </div>
              <div className="border border-stone-200 dark:border-slate-800 p-3 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Actions
                </p>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 py-1.5 border-b border-stone-100 dark:border-slate-800">
                  Copy to clipboard
                  <ClipboardIcon className="w-4 h-4 text-[#0052CC]" />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 py-1.5">
                  Sync to Epic
                  <span className="text-[9px] uppercase">Soon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="px-4 py-2 text-[11px] text-slate-500 dark:text-slate-500 border-t border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950">
        Screenshot-style preview of Live Scribe in beta
      </p>
    </div>
  );
}
