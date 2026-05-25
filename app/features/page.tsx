"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MicrophoneIcon,
  DocumentTextIcon,
  ArrowPathRoundedSquareIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  UsersIcon,
  SparklesIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type FeatureStatus = "live" | "beta" | "roadmap";

export default function Features() {
  const features: {
    icon: React.ReactNode;
    title: string;
    description: string;
    status: FeatureStatus;
  }[] = [
    {
      icon: <MicrophoneIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "Ambient Listening",
      description:
        "High-accuracy capture in real clinics. Built for overlapping voices, accents, and real-world clinical dialogue.",
      status: "live",
    },
    {
      icon: <DocumentTextIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "Flexible Reporting (SOAP, DAP)",
      description:
        "Generate SOAP, DAP, BIRP, or custom templates. Edit sections before copying into your EHR.",
      status: "live",
    },
    {
      icon: <UsersIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "Team Collaboration",
      description:
        "Roadmap: share notes with your care team, assign tasks, and streamline multi-provider workflows.",
      status: "roadmap",
    },
    {
      icon: <GlobeAltIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "Local & Multi-Language",
      description:
        "Multiple speech languages in Live Scribe. Optimized for regional accents and medical terminology.",
      status: "beta",
    },
    {
      icon: <ArrowPathRoundedSquareIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "EHR Compatibility",
      description:
        "Copy-paste into any EHR today. Epic and Cerner SMART on FHIR OAuth in Integrations; direct push from scribe is coming soon.",
      status: "beta",
    },
    {
      icon: <ShieldCheckIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "Privacy-First Design",
      description:
        "Zero audio retention, PII scrubbing on transcripts. HIPAA compliance and BAAs are on the roadmap.",
      status: "live",
    },
    {
      icon: <SparklesIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "Custom Template Engine",
      description:
        "Create specialty templates in beta. Style learning across reports is planned for a future release.",
      status: "beta",
    },
    {
      icon: <ClockIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "Fast Note Generation",
      description:
        "Drafted reports seconds after you stop recording. Built for low-latency workflows during beta.",
      status: "live",
    },
  ];

  const statusLabel: Record<FeatureStatus, string> = {
    live: "Available now",
    beta: "In beta",
    roadmap: "Roadmap",
  };

  const statusClass: Record<FeatureStatus, string> = {
    live: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
    beta: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
    roadmap: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
  };

  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden pt-24 pb-16 px-4 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/4 -top-24 h-96 w-96 bg-[#0052CC]/10 blur-[120px] rounded-full" />
            <div className="absolute right-1/4 bottom-0 h-96 w-96 bg-indigo-400/10 blur-[120px] rounded-full" />
            <div className="absolute inset-0 bg-grid dark:bg-grid-dark opacity-40" />
          </div>

          <motion.div
            className="relative max-w-5xl mx-auto text-center space-y-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              Reclaim Your Time.{" "}
              <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052CC] to-indigo-500">
                Precision Workflows.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Ambient listening and multi-template reporting are live in beta.
              Team sync and direct EHR push are on the roadmap.
            </p>
          </motion.div>
        </section>

        <section className="py-24 px-4 bg-white dark:bg-slate-950 relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl p-8 flex flex-col gap-6 hover:shadow-2xl hover:border-trust-blue/30 dark:hover:border-trust-blue/30 transition-all duration-500"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                  delay: index * 0.05,
                }}
              >
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-trust-blue/5 blur-3xl group-hover:bg-trust-blue/10 transition-colors duration-500" />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                    {feature.icon}
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-md ${statusClass[feature.status]}`}
                  >
                    {statusLabel[feature.status]}
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="py-24 px-4 bg-white dark:bg-slate-950">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#0052CC] to-indigo-700 p-12 md:p-20 text-center shadow-[0_40px_100px_-20px_rgba(0,82,204,0.5)]"
            >
              <div className="absolute inset-0 bg-grid dark:bg-grid-dark opacity-10" />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-8">
                <div className="pill mx-auto bg-white/10 border-white/20 text-white">
                  Open Beta
                </div>
                <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                  Ready to automate your <br className="hidden md:block" />
                  clinical workflow?
                </h2>
                <div className="flex flex-col items-center gap-4">
                  <Link
                    href="/signup"
                    className="bg-white text-slate-900 px-12 py-5 rounded-full text-xl font-bold hover:shadow-[0_20px_50px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all duration-300"
                  >
                    Join the Free Beta
                  </Link>
                  <p className="text-white/70 text-sm font-medium">
                    No credit card required.{" "}
                    <Link href="/pricing" className="underline hover:text-white">
                      Beta limits
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
