"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SparklesIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "../components/ThemeToggle";

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    specialty: "",
    clinicName: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signup attempt:", formData);
    // Always login for now as per user request
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Left Side - Branding & Info */}
      <div className="md:w-[40%] bg-gradient-to-br from-[#0052CC] to-indigo-700 p-12 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        
        <div className="relative z-10">
          <Link href="/" className="text-3xl font-bold tracking-tight">doxia</Link>
          <div className="mt-20 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="pill bg-white/10 border-white/20 text-white w-fit"
            >
              Join the future of medicine
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Ready to automate your clinical workflow?
            </h1>
            <p className="text-xl text-white/80 leading-relaxed max-w-md">
              Get lifetime access to the most intuitive AI medical scribe ever built.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-8 mt-12 md:mt-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold">Apple-Level Polish</p>
              <p className="text-sm text-white/60 text-pretty">Designed to feel like native medical software.</p>
            </div>
          </div>
          <div className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Doxia. HIPAA & GDPR Compliant.
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 p-8 md:p-24 flex items-center justify-center relative">
        <div className="absolute top-8 right-8">
          <ThemeToggle />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Create your account</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Start your journey towards effortless documentation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-trust-blue/20 focus:border-trust-blue outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="john@clinic.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-trust-blue/20 focus:border-trust-blue outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Specialty</label>
                  <input
                    type="text"
                    required
                    placeholder="Family Medicine"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-trust-blue/20 focus:border-trust-blue outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Clinic Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Wellness Clinic"
                    value={formData.clinicName}
                    onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-trust-blue/20 focus:border-trust-blue outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-trust-blue/20 focus:border-trust-blue outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-trust-blue hover:bg-trust-blue/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-trust-blue/20 transition-all flex items-center justify-center gap-2 group"
            >
              Create Account
              <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="text-center text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-trust-blue font-bold hover:underline">Log in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

