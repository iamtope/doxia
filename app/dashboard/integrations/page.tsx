"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";

type EhrProvider = "epic" | "cerner";

interface ProviderMeta {
  provider: EhrProvider;
  displayName: string;
  configured: boolean;
}

interface ConnectionRow {
  provider: EhrProvider;
  fhirBaseUrl: string;
  patientId?: string | null;
  encounterId?: string | null;
  fhirUser?: string | null;
  scope?: string | null;
  accessTokenExpiresAt?: string;
}

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3003";

export default function IntegrationsPage() {
  const { token } = useAuth();
  const params = useSearchParams();
  const ehrFlag = params.get("ehr");
  const ehrProvider = params.get("provider");
  const ehrMessage = params.get("message");

  const [providers, setProviders] = useState<ProviderMeta[]>([]);
  const [connections, setConnections] = useState<
    Record<string, ConnectionRow | null>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`${GATEWAY_URL}/ehr/providers`),
        fetch(`${GATEWAY_URL}/ehr/connections`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (!pRes.ok) throw new Error(`providers: ${pRes.status}`);
      if (!cRes.ok) throw new Error(`connections: ${cRes.status}`);
      const pBody = await pRes.json();
      const cBody = await cRes.json();
      setProviders(pBody.providers);
      const map: Record<string, ConnectionRow | null> = {};
      for (const meta of pBody.providers as ProviderMeta[]) map[meta.provider] = null;
      for (const row of cBody.connections as ConnectionRow[]) map[row.provider] = row;
      setConnections(map);
    } catch (err: any) {
      toast.error(err.message || "Could not load integrations");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!ehrFlag) return;
    const label = ehrProvider ? ` (${ehrProvider})` : "";
    if (ehrFlag === "connected") {
      toast.success(`Connected to EHR${label} successfully`);
    } else if (ehrFlag === "error") {
      toast.error(ehrMessage || `EHR connect failed${label}`);
    }
  }, [ehrFlag, ehrProvider, ehrMessage]);

  const connect = (provider: EhrProvider) => {
    if (!token) {
      toast.error("You must be logged in");
      return;
    }
    window.location.href = `${GATEWAY_URL}/ehr/${provider}/authorize?token=${encodeURIComponent(token)}`;
  };

  const disconnect = async (provider: EhrProvider) => {
    if (!token) return;
    setBusy(provider);
    try {
      const res = await fetch(`${GATEWAY_URL}/ehr/${provider}/connection`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      toast.success(`${provider} disconnected`);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Disconnect failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          EHR Integrations
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Connect Doxia to your EHR over SMART on FHIR R4. Sessions can then
          pull patient context (conditions, allergies, medications, vitals) and
          push finalized notes back as <code>DocumentReference</code> resources.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ArrowPathIcon className="w-5 h-5 animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="grid gap-4">
          {providers.map((meta) => {
            const conn = connections[meta.provider];
            const expiresIn = conn?.accessTokenExpiresAt
              ? Math.max(
                  0,
                  Math.round(
                    (new Date(conn.accessTokenExpiresAt).getTime() -
                      Date.now()) /
                      1000,
                  ),
                )
              : null;

            return (
              <div
                key={meta.provider}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {conn ? (
                        <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-slate-400" />
                      )}
                      <h2 className="font-semibold text-slate-900 dark:text-white">
                        {meta.displayName}
                      </h2>
                      {!meta.configured && (
                        <span className="text-[10px] font-black uppercase tracking-tighter bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-md">
                          Not configured
                        </span>
                      )}
                    </div>

                    {conn ? (
                      <dl className="mt-4 text-sm space-y-1 text-slate-600 dark:text-slate-400">
                        <div className="flex gap-2">
                          <dt className="font-medium w-32">FHIR base</dt>
                          <dd className="truncate">{conn.fhirBaseUrl}</dd>
                        </div>
                        {conn.fhirUser && (
                          <div className="flex gap-2">
                            <dt className="font-medium w-32">Clinician</dt>
                            <dd className="truncate">{conn.fhirUser}</dd>
                          </div>
                        )}
                        {conn.patientId && (
                          <div className="flex gap-2">
                            <dt className="font-medium w-32">Launch patient</dt>
                            <dd className="truncate">{conn.patientId}</dd>
                          </div>
                        )}
                        {conn.scope && (
                          <div className="flex gap-2">
                            <dt className="font-medium w-32">Scopes</dt>
                            <dd className="truncate">{conn.scope}</dd>
                          </div>
                        )}
                        {expiresIn !== null && (
                          <div className="flex gap-2">
                            <dt className="font-medium w-32">Token expires in</dt>
                            <dd>
                              {expiresIn > 60
                                ? `${Math.round(expiresIn / 60)} min`
                                : `${expiresIn} s`}
                            </dd>
                          </div>
                        )}
                        <div className="pt-2">
                          <Link
                            href={`/dashboard/integrations/${meta.provider}`}
                            className="text-xs font-semibold text-trust-blue hover:underline"
                          >
                            Test patient read →
                          </Link>
                        </div>
                      </dl>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                        {meta.configured
                          ? `Authorize Doxia with ${meta.displayName} to enable patient reads and note write-backs.`
                          : `Set ${meta.provider.toUpperCase()}_CLIENT_ID and ${meta.provider.toUpperCase()}_REDIRECT_URI in ehr-service .env, then restart.`}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {conn ? (
                      <button
                        onClick={() => disconnect(meta.provider)}
                        disabled={busy === meta.provider}
                        className="px-4 py-2 text-sm font-semibold rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-900/20 disabled:opacity-50"
                      >
                        {busy === meta.provider ? "..." : "Disconnect"}
                      </button>
                    ) : (
                      <button
                        onClick={() => connect(meta.provider)}
                        disabled={!meta.configured}
                        className="px-4 py-2 text-sm font-semibold rounded-xl bg-trust-blue text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 text-sm text-slate-600 dark:text-slate-400 space-y-2">
        <p className="font-semibold text-slate-900 dark:text-white">
          Adding another vendor
        </p>
        <p>
          Doxia&apos;s EHR layer speaks standard SMART on FHIR R4. To add Athena,
          eClinicalWorks, Meditech, or any other R4 vendor, drop a config entry
          in <code>ehr-service/src/providers/provider-registry.ts</code> and set
          the matching env vars — no new microservice required.
        </p>
      </div>
    </div>
  );
}
