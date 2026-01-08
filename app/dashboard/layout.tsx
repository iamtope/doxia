"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  MicrophoneIcon, 
  DocumentTextIcon, 
  Squares2X2Icon, 
  Cog6ToothIcon,
  ArrowPathIcon,
  UsersIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";
import ThemeToggle from "../components/ThemeToggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { icon: Squares2X2Icon, label: "Dashboard", href: "/dashboard", active: false },
    { icon: MicrophoneIcon, label: "Live Scribe", href: "/dashboard/scribe", active: true },
    { icon: DocumentTextIcon, label: "Patient Notes", href: "#", active: false },
    { icon: UsersIcon, label: "Team Sync", href: "#", active: false },
    { icon: ArrowPathIcon, label: "EHR Sync", href: "#", active: false },
  ];

  const bottomItems = [
    { icon: QuestionMarkCircleIcon, label: "Support", href: "/dashboard/support" },
    { icon: Cog6ToothIcon, label: "Settings", href: "#" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } border-r border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 transition-all duration-300 flex flex-col z-30`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800/50">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-trust-blue flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg italic">d</span>
            </div>
            {isSidebarOpen && <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">doxia</span>}
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                item.active 
                  ? "bg-trust-blue/5 text-trust-blue shadow-sm border border-trust-blue/10" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 space-y-1">
          {bottomItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
          <div className="px-3 py-2.5">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-8 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg md:hidden"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-widest">
              Live Scribe Session
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-tighter italic">JD</div>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2" />
            <button 
              onClick={() => router.push("/")}
              className="text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

