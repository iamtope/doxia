"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SparklesIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "../components/ThemeToggle";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function Signup() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    specialty: "",
    clinicName: "",
    password: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast.error("Please accept the Terms and Privacy Policy.");
      return;
    }
    setIsSubmitting(true);
    try {
      const GATEWAY_BASE =
        process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3003";
      const response = await fetch(`${GATEWAY_BASE}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.access_token && data.user) {
          toast.success("Welcome to Doxia! Opening Live Scribe…");
          login(data.access_token, data.user);
        } else {
          toast.success("Account created! Please log in.");
          window.location.href = "/login";
        }
      } else {
        const error = await response.json();
        toast.error(error.message || "Signup failed. Email might be taken.");
      }
    } catch (err) {
      console.error("Error during signup:", err);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      <div className="md:w-[40%] bg-gradient-to-br from-[#0052CC] to-indigo-700 p-12 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="text-3xl font-bold tracking-tight">
            doxia
          </Link>
          <div className="mt-20 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="pill bg-white/10 border-white/20 text-white w-fit"
            >
              Open beta — free to use
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Ready to automate your clinical workflow?
            </h1>
            <p className="text-xl text-white/80 leading-relaxed max-w-md">
              After signup you&apos;ll land in Live Scribe to record your first
              encounter and generate a structured note.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6 mt-12 md:mt-0">
          <div className="rounded-2xl bg-white/10 border border-white/20 p-5 text-sm space-y-2">
            <p className="font-bold">Beta includes</p>
            <ul className="text-white/80 space-y-1 list-disc list-inside">
              <li>SOAP, DAP, BIRP &amp; custom templates</li>
              <li>Diarization, billing codes, copy to EHR</li>
              <li>30 min per session · 2 hrs total per account</li>
            </ul>
            <Link href="/pricing" className="text-white/90 underline text-xs">
              Full beta details
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold">Privacy-first</p>
              <p className="text-sm text-white/60 text-pretty">
                Do not use real patient PHI until HIPAA is announced.
              </p>
            </div>
          </div>
          <div className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Doxia.
          </div>
        </div>
      </div>

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
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Create your account
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              You&apos;ll go straight to Live Scribe — no extra login step.
            </p>
          </div>

          <GoogleSignInButton label="Sign up with Google" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-50 dark:bg-slate-950 px-3 text-slate-400 font-bold tracking-wider">
                or with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. John Doe"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-trust-blue/20 focus:border-trust-blue outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="john@clinic.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-trust-blue/20 focus:border-trust-blue outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Specialty
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Family Medicine"
                    value={formData.specialty}
                    onChange={(e) =>
                      setFormData({ ...formData, specialty: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-trust-blue/20 focus:border-trust-blue outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Wellness Clinic"
                    value={formData.clinicName}
                    onChange={(e) =>
                      setFormData({ ...formData, clinicName: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-trust-blue/20 focus:border-trust-blue outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-trust-blue/20 focus:border-trust-blue outline-none transition-all"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 rounded border-slate-300 text-trust-blue focus:ring-trust-blue"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="text-trust-blue font-semibold hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-trust-blue font-semibold hover:underline">
                  Privacy Policy
                </Link>
                . I understand beta is not for real patient PHI.
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-trust-blue hover:bg-trust-blue/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-trust-blue/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
              <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="text-center text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-trust-blue font-bold hover:underline"
            >
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
