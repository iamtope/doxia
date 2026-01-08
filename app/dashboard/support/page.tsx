"use client";

import { motion } from "framer-motion";
import { 
  ChatBubbleLeftRightIcon, 
  EnvelopeIcon, 
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  BookOpenIcon
} from "@heroicons/react/24/outline";

export default function Support() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Support Center</h1>
        <p className="text-slate-500 dark:text-slate-400">How can we help you today, Doctor?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {[
          {
            icon: ChatBubbleLeftRightIcon,
            title: "Live Chat",
            desc: "Talk to our clinical support team in real-time.",
            action: "Start Chat",
            color: "text-trust-blue",
            bg: "bg-trust-blue/5"
          },
          {
            icon: EnvelopeIcon,
            title: "Email Support",
            desc: "Send us a ticket and we'll reply within 2 hours.",
            action: "Send Email",
            color: "text-emerald-600",
            bg: "bg-emerald-500/5"
          }
        ].map((item, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -4 }}
            className="card p-8 flex flex-col gap-6"
          >
            <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
            <button className="pill w-full justify-center font-bold text-slate-700 dark:text-slate-200">
              {item.action}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: BookOpenIcon, label: "Help Documentation" },
            { icon: QuestionMarkCircleIcon, label: "FAQS" },
            { icon: ShieldCheckIcon, label: "Security & Compliance" },
          ].map((item, i) => (
            <button key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all text-left">
              <item.icon className="w-5 h-5 text-slate-400" />
              <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-trust-blue/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 space-y-4">
          <h3 className="text-2xl font-bold tracking-tight">Need a BAA signed?</h3>
          <p className="text-slate-400 dark:text-slate-500 max-w-md">
            If your clinic requires a signed Business Associate Agreement, please reach out to our compliance team.
          </p>
          <button className="bg-trust-blue text-white dark:bg-slate-900 dark:text-white px-6 py-2.5 rounded-full font-bold text-sm">
            Contact Compliance
          </button>
        </div>
      </div>
    </div>
  );
}

