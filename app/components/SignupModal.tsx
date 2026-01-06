"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRevenueCat } from "../contexts/RevenueCatContext";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const [formData, setFormData] = useState({
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error" | "info";
  } | null>(null);

  const { purchaseProduct } = useRevenueCat();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const PRODUCT_ID =
    process.env.NEXT_PUBLIC_REVENUECAT_EARLY_ACCESS_PRODUCT_ID!;

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.email) return;
    const run = async () => {
      setIsLoading(true);
      try {
        await purchaseProduct(PRODUCT_ID, formData.email);
        setToast({
          message: "Payment successful! Lifetime access activated.",
          tone: "success",
        });
        setFormData({ email: "" });
        onClose();
      } catch (err: any) {
        if (err?.userCancelled) {
          // user cancelled; no alert needed
        } else {
          setToast({
            message:
              err?.message?.length > 0
                ? `Payment failed: ${err.message}`
                : "Payment failed. Please try again.",
            tone: "error",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    run();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white/90 dark:bg-slate-900/90 border border-white/60 dark:border-slate-800/80 rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-x-10 -top-16 h-32 bg-gradient-to-r from-[#0052CC] to-indigo-500 opacity-40 blur-3xl rounded-full pointer-events-none" />
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-3xl font-light text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          &times;
        </button>

        <div className="mb-6">
          <div className="pill w-fit mb-3 text-sm font-semibold text-slate-600 dark:text-slate-200">
            Early access
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Get Lifetime Access
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pay $4.99 once. Own it forever.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium text-slate-700 dark:text-slate-300">
              Email to receive your access *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0052CC] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#0052CC] to-indigo-500 text-white py-3 rounded-xl font-semibold hover:shadow-[0_20px_60px_-30px_rgba(0,82,204,0.8)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Pay $4.99 & Get Access"}
          </button>
        </form>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-semibold text-white ${
              toast.tone === "success"
                ? "bg-emerald-500"
                : toast.tone === "error"
                ? "bg-rose-500"
                : "bg-slate-700"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
