"use client";

import { RevenueCatProvider } from "./contexts/RevenueCatContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <RevenueCatProvider>{children}</RevenueCatProvider>;
}

