# Deploying to Vercel

## Prerequisites
- Vercel account with Git connected to this repo.
- RevenueCat sandbox keys and a product in an active offering.
  - `NEXT_PUBLIC_REVENUECAT_API_KEY`: your sandbox public API key.
  - `NEXT_PUBLIC_REVENUECAT_EARLY_ACCESS_PRODUCT_ID`: product identifier from the offering (e.g., `doxia_lifetime_499`).

## Vercel Configuration
1. Import the project into Vercel.
2. Set Environment Variables (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_REVENUECAT_API_KEY`
   - `NEXT_PUBLIC_REVENUECAT_EARLY_ACCESS_PRODUCT_ID`
3. Framework preset: **Next.js**.
4. Build command: `npm run build` (default).
5. Output directory: `.vercel/output` (handled by Next automatically).

## Notes
- RevenueCat Web SDK must run client-side; avoid using it in server components or API routes.
- Ensure the product is in the current offering for the same key you’re using (sandbox vs production).
- After purchase, entitlements refresh is handled in `RevenueCatContext`.

