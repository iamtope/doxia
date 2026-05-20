export const GATEWAY_BASE =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3003";

export function getGoogleAuthUrl(): string {
  return `${GATEWAY_BASE}/auth/google`;
}
