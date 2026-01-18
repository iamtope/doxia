"use client";

import { RevenueCatProvider } from "./contexts/RevenueCatContext";
import { AuthProvider } from "./contexts/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RevenueCatProvider>{children}</RevenueCatProvider>
    </AuthProvider>
  );
}
