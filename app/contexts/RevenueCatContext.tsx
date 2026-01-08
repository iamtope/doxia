"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
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

  // USE REF FOR THE SDK: This allows immediate access without waiting for state re-renders
  const sdkRef = useRef<any>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  const fetchInfo = async (sdk: any) => {
    try {
      const info = await sdk.getCustomerInfo();
      setCustomerInfo(info);
    } catch (err) {
      console.error("RevenueCat: Failed to fetch customer info", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (typeof window === "undefined") return;
      try {
        const mod = await import("@revenuecat/purchases-js");

        // 1. Handle different export styles
        // The most common way for @revenuecat/purchases-js is { Purchases: Class }
        const PurchasesClass =
          (mod as any).Purchases ||
          (mod as any).default?.Purchases ||
          (mod as any).default;

        if (!PurchasesClass || typeof PurchasesClass.configure !== "function") {
          console.error(
            "RevenueCat: Could not find Purchases class in module",
            mod
          );
          throw new Error("Could not find Purchases object in module");
        }

        // 2. Configure - Use an anonymous ID if none provided
        await PurchasesClass.configure({
          apiKey: REVENUECAT_API_KEY,
          appUserId: PurchasesClass.generateRevenueCatAnonymousAppUserId(),
        });

        // 3. Get the instance - the static configure returns it,
        // but getSharedInstance is safer to ensure we have the configured singleton
        const sdkInstance =
          typeof PurchasesClass.getSharedInstance === "function"
            ? PurchasesClass.getSharedInstance()
            : PurchasesClass;

        // 4. Store the SDK in the Ref
        sdkRef.current = sdkInstance;

        console.log("RevenueCat: SDK configured and instance stored.");
        await fetchInfo(sdkInstance);
      } catch (err) {
        console.error("RevenueCat: Initialization failed", err);
      } finally {
        setIsLoading(false);
      }
    };

    initPromiseRef.current = init();
  }, []);

  const purchaseProduct = async (productId: string, appUserID?: string) => {
    // 1. Wait for init if it's still running
    if (initPromiseRef.current) {
      await initPromiseRef.current;
    }

    // 2. Access the SDK via Ref
    const sdk = sdkRef.current;
    if (!sdk) {
      throw new Error("Billing SDK failed to initialize. Check your API key.");
    }

    try {
      console.log("RevenueCat: Starting purchase for product", productId);

      // If an email (appUserID) is provided, identify the user first
      // so the purchase is linked to their email in the dashboard.
      if (appUserID) {
        try {
          if (typeof sdk.identifyUser === "function") {
            await sdk.identifyUser(appUserID);
            console.log("RevenueCat: User identified as", appUserID);
          } else if (typeof sdk.changeUser === "function") {
            await sdk.changeUser(appUserID);
            console.log("RevenueCat: User changed to", appUserID);
          }
        } catch (identErr) {
          console.warn(
            "RevenueCat: Identification failed, continuing with purchase",
            identErr
          );
        }
      }

      // In version 1.x, getOfferings is an instance method.
      // If sdk is the instance, it should be there.
      // If for some reason sdk is still the class, we'll try to get the shared instance.
      let offerings;
      if (typeof sdk.getOfferings === "function") {
        offerings = await sdk.getOfferings();
      } else if (
        sdk.getSharedInstance &&
        typeof sdk.getSharedInstance().getOfferings === "function"
      ) {
        offerings = await sdk.getSharedInstance().getOfferings();
      } else {
        console.error("RevenueCat: sdk object details:", {
          keys: Object.keys(sdk),
          protoKeys: Object.keys(Object.getPrototypeOf(sdk) || {}),
          sdk,
        });
        throw new Error(
          "getOfferings not available on RevenueCat SDK instance."
        );
      }

      const currentOffering = offerings?.current;
      if (!currentOffering) {
        throw new Error(
          "No active offerings found in your RevenueCat dashboard."
        );
      }

      const pkg = currentOffering.availablePackages.find(
        (p: any) =>
          p.webBillingProduct?.identifier === productId ||
          p.product?.identifier === productId ||
          p.identifier === productId
      );

      if (pkg) {
        // purchasePackage is an instance method
        const result = await sdk.purchasePackage(pkg, appUserID);
        setCustomerInfo(result.customerInfo);
      } else {
        // Fallback: search all offerings, not just current
        const allPackages = Object.values(offerings.all).flatMap(
          (o: any) => o.availablePackages
        );

        // Log available IDs to help debugging
        const availableIds = allPackages.map(
          (p: any) =>
            p.webBillingProduct?.identifier ||
            p.product?.identifier ||
            p.identifier
        );
        console.log(
          "RevenueCat: Available product IDs in dashboard:",
          availableIds
        );

        const fallbackPkg = allPackages.find(
          (p: any) =>
            p.webBillingProduct?.identifier === productId ||
            p.product?.identifier === productId ||
            p.identifier === productId
        );

        if (fallbackPkg) {
          const result = await sdk.purchasePackage(fallbackPkg, appUserID);
          setCustomerInfo(result.customerInfo);
        } else {
          throw new Error(
            `Product "${productId}" not found. Available IDs: ${availableIds.join(
              ", "
            )}`
          );
        }
      }
    } catch (err: any) {
      if (err.userCancelled || err.errorCode === 1) return; // ErrorCode.UserCancelledError = 1
      console.error("RevenueCat: Purchase failed", err);
      throw err;
    }
  };

  const refreshCustomerInfo = async () => {
    if (sdkRef.current) await fetchInfo(sdkRef.current);
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
