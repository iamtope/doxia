"use client";

import { useState, useEffect } from "react";
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
  QueueListIcon,
} from "@heroicons/react/24/outline";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../contexts/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-trust-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    {
      icon: Squares2X2Icon,
      label: "Dashboard",
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      icon: MicrophoneIcon,
      label: "Live Scribe",
      href: "/dashboard/scribe",
      active: pathname === "/dashboard/scribe",
    },
    {
      icon: DocumentTextIcon,
      label: "Patient Notes",
      href: "/dashboard/notes",
      active: pathname === "/dashboard/notes",
    },
    {
      icon: QueueListIcon,
      label: "Templates",
      href: "#",
      active: false,
      comingSoon: true,
    },
    {
      icon: UsersIcon,
      label: "Team Sync",
      href: "#",
      active: false,
      comingSoon: true,
    },
    {
      icon: ArrowPathIcon,
      label: "EHR Integrations",
      href: "/dashboard/integrations",
      active: pathname?.startsWith("/dashboard/integrations") ?? false,
    },
  ];

  const bottomItems = [
    {
      icon: QuestionMarkCircleIcon,
      label: "Support",
      href: "/dashboard/support",
    },
    { icon: Cog6ToothIcon, label: "Settings", href: "#" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } border-r border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 transition-all duration-300 flex flex-col z-30`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800/50">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-trust-blue flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg italic">d</span>
            </div>
            {isSidebarOpen && (
              <>
                <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">
                  doxia
                </span>
                <span className="text-[8px] font-black uppercase tracking-tighter bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-md">
                  Beta
                </span>
              </>
            )}
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => item.comingSoon && e.preventDefault()}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                item.active
                  ? "bg-trust-blue/5 text-trust-blue shadow-sm border border-trust-blue/10"
                  : item.comingSoon
                  ? "text-slate-400 cursor-not-allowed opacity-70"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span>{item.label}</span>}
              </div>
              {isSidebarOpen && item.comingSoon && (
                <span className="text-[8px] font-black uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-400">
                  Soon
                </span>
              )}
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
              {navItems.find((i) => i.active)?.label || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                  {user.fullName}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {user.email}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-tighter italic shadow-sm">
                {getInitials(user.fullName)}
              </div>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2" />
            <button
              onClick={logout}
              className="text-sm font-bold text-slate-500 hover:text-rose-500 transition-colors"
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
