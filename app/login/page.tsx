"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "../components/ThemeToggle";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const oauthErrorShown = useRef(false);

  useEffect(() => {
    if (oauthErrorShown.current) return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (!err) return;
    oauthErrorShown.current = true;
    if (err === "google") {
      toast.error("Google sign-in failed. Please try again.");
    } else if (err === "incomplete" || err === "invalid") {
      toast.error("Could not complete Google sign-in.");
    }
    window.history.replaceState({}, "", "/login");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const GATEWAY_BASE = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3003";
      const response = await fetch(`${GATEWAY_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Login success:", data);
        toast.success("Welcome back!");
        login(data.access_token, data.user);
      } else {
        const error = await response.json();
        console.error("Login failed:", error);
        toast.error(error.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error("Error during login:", err);
      toast.error("Something went wrong. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute top-8 right-8">
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 bg-grid dark:bg-grid-dark opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <Link
            href="/"
            className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight"
          >
            doxia
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-6">
            Welcome back
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Log in to your account to continue.
          </p>
        </div>

        <div className="glass rounded-[32px] p-8 md:p-10 shadow-2xl border-white/40 dark:border-slate-800/60">
          <GoogleSignInButton label="Continue with Google" />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 dark:bg-slate-900/80 px-3 text-slate-400 font-bold tracking-wider">
                or with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-trust-blue/20 focus:border-trust-blue outline-none transition-all"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-trust-blue/20 focus:border-trust-blue outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-xl shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isSubmitting ? "Logging In..." : "Log In"}
              <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-trust-blue font-bold hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-10 text-center text-xs text-slate-400 uppercase tracking-widest font-bold">
          Security-First Design
        </div>
      </motion.div>
    </div>
  );
}
