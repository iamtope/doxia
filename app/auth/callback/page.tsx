"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const error = searchParams.get("error");
    if (error) {
      router.replace("/login?error=google");
      return;
    }

    const accessToken = searchParams.get("access_token");
    const userRaw = searchParams.get("user");

    if (!accessToken || !userRaw) {
      router.replace("/login?error=incomplete");
      return;
    }

    try {
      const user = JSON.parse(userRaw) as {
        id: number;
        email: string;
        fullName: string;
      };
      if (!user?.id || !user?.email) {
        throw new Error("Invalid user payload");
      }
      login(accessToken, user);
    } catch {
      router.replace("/login?error=invalid");
    }
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <p className="text-slate-500 dark:text-slate-400 text-sm">Completing sign-in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
