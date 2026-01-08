"use client";

import { useState } from "react";
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

export default function Features() {
  const features = [
    {
      icon: <MicrophoneIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "Ambient Listening",
      description:
        "High-accuracy capture even in noisy clinics. Built for overlapping voices, accents, and real-world clinical chaos.",
    },
    {
      icon: <DocumentTextIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "Flexible Reporting (SOAP, DAP)",
      description:
        "Generate reports in your preferred format. Support for SOAP, DAP, BIRP, and custom clinical letterhead templates.",
    },
    {
      icon: <UsersIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "Team Collaboration",
      description:
        "Share notes securely with your care team. Assign tasks, leave internal comments, and streamline multi-provider workflows.",
    },
    {
      icon: <GlobeAltIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "Local & Multi-Language",
      description:
        "Optimized for local accents and medical terminology. Full support for multiple languages and regional clinical standards.",
    },
    {
      icon: <ArrowPathRoundedSquareIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "EHR Compatibility",
      description:
        "Works alongside Epic, Cerner, and Athena via secure copy-paste. Seamless, secure, and no complex IT integrations required.",
    },
    {
      icon: <ShieldCheckIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "Privacy-First Design",
      description:
        "Zero audio storage and end-to-end encryption. HIPAA & GDPR compliance is engineered into the core of Doxia.",
    },
    {
      icon: <SparklesIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "Custom Template Engine",
      description:
        "Create your own templates for specific specialties. Doxia learns your writing style and replicates it across all reports.",
    },
    {
      icon: <ClockIcon className="h-9 w-9 text-[#0052CC]" />,
      title: "Ultra-Low Latency",
      description:
        "Get your drafted report seconds after the consult. Doxia uses edge-computing to ensure your notes are ready when you are.",
    },
  ];

  return (
    <>
      <Navbar />
      <main>
        {/* Page Hero */}
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
            <div className="pill mx-auto text-sm font-semibold text-slate-600 dark:text-slate-200 w-fit">
              Clinical Precision. Apple-Level Polish.
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              Reclaim Your Time. <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052CC] to-indigo-500">
                Precision Workflows.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Ambient listening, multi-template reporting, and seamless team
              sync—all built to disappear into your workflow.
            </p>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-4 bg-white dark:bg-slate-950 relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {features.map((feature, index) => (
              <motion.div
                key={index}
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

                <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 shadow-inner group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-slate-800 transition-all duration-500">
                  <div className="w-8 h-8 transition-transform duration-500 group-hover:rotate-6">
                    {feature.icon}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-auto pt-4 flex items-center gap-2 text-trust-blue font-bold text-sm opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">
                  Learn more <span>&rarr;</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
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
                  Founder’s Deal
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
                    Get Lifetime Access - $4.99
                  </Link>
                  <p className="text-white/70 text-sm font-medium">
                    30-day money-back guarantee. No subscriptions.
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
