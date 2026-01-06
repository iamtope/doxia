"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
// Import the type, but do not import the library at the top level to avoid SSR issues
import type { CustomerInfo } from "@revenuecat/purchases-js";

const REVENUECAT_API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY!;

interface RevenueCatContextValue {
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  refreshCustomerInfo: () => Promise<void>;
  purchaseProduct: (productId: string, appUserID?: string) => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextValue | undefined>(
  undefined
);

export function RevenueCatProvider({ children }: { children: ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasesSDK, setPurchasesSDK] = useState<any>(null);

  // Separate refresh logic that accepts the SDK as an argument for the init phase
  const fetchInfo = async (sdk: any) => {
    try {
      const info = await sdk.getCustomerInfo();
      setCustomerInfo(info);
    } catch (err) {
      console.error("RevenueCat: Failed to fetch customer info", err);
      setCustomerInfo(null);
    }
  };

  const refreshCustomerInfo = async () => {
    if (!purchasesSDK) return;
    setIsLoading(true);
    await fetchInfo(purchasesSDK);
    setIsLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Dynamic import to prevent "window is not defined" during Next.js SSR
        const { Purchases } = await import("@revenuecat/purchases-js");

        if (!mounted) return;

        await (Purchases as any).configure({ apiKey: REVENUECAT_API_KEY });
        setPurchasesSDK(Purchases as any);

        // Initial data fetch
        await fetchInfo(Purchases);
      } catch (err) {
        console.error("RevenueCat: Initialization failed", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  const purchaseProduct = async (productId: string, appUserID?: string) => {
    const sdk = purchasesSDK as any;
    if (!sdk) throw new Error("Billing SDK not initialized.");

    try {
      // 1. Handle Login if appUserID is provided
      if (appUserID) {
        const loginResult = await sdk.logIn?.(appUserID);
        if (loginResult?.customerInfo)
          setCustomerInfo(loginResult.customerInfo);
      }

      // 2. Get Offerings
      const offerings = await sdk.getOfferings();
      const currentOffering = offerings?.current;

      if (!currentOffering) throw new Error("No active offerings found.");

      // 3. Find the package matching your productId
      const pkg = currentOffering.availablePackages.find(
        (p: any) =>
          p?.product?.identifier === productId ||
          p?.storeProduct?.identifier === productId
      );

      if (pkg) {
        const { customerInfo: updatedInfo } = await sdk.purchasePackage(pkg);
        if (updatedInfo) setCustomerInfo(updatedInfo);
      } else {
        // Fallback: If not in current offering, try to find in any offering
        console.warn(`Product ${productId} not found in current offering.`);
        throw new Error("Product not found in current offering.");
      }
    } catch (err: any) {
      // Handle user cancellation specifically if needed
      if (err.userCancelled) {
        console.log("User cancelled the purchase");
        return;
      }
      throw err;
    }
  };

  return (
    <RevenueCatContext.Provider
      value={{ customerInfo, isLoading, refreshCustomerInfo, purchaseProduct }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat() {
  const ctx = useContext(RevenueCatContext);
  if (!ctx)
    throw new Error("useRevenueCat must be used within RevenueCatProvider");
  return ctx;
}
