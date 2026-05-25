import { redirect } from "next/navigation";

const GATEWAY =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3003";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

/** Google may redirect here if redirect_uri points at the frontend; forward to the gateway. */
export default function GoogleOAuthGatewayForward({ searchParams }: Props) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, value);
    }
  }
  const q = params.toString();
  redirect(`${GATEWAY}/auth/google/callback${q ? `?${q}` : ""}`);
}
