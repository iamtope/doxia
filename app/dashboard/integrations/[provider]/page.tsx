"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowPathIcon,
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../contexts/AuthContext";

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3003";

const SUPPORTED = ["epic", "cerner"] as const;
type Provider = (typeof SUPPORTED)[number];

interface Connection {
  connected: boolean;
  provider: Provider;
  fhirBaseUrl?: string;
  patientId?: string | null;
  fhirUser?: string | null;
  scope?: string | null;
  accessTokenExpiresAt?: string;
}

export default function ProviderDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const provider = String(params?.provider || "") as Provider;

  const [status, setStatus] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const valid = (SUPPORTED as readonly string[]).includes(provider);

  const fetchStatus = useCallback(async () => {
    if (!token || !valid) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${GATEWAY_URL}/ehr/${provider}/connection`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setStatus(data);
      if (data.patientId) setPatientId(data.patientId);
    } catch (err: any) {
      toast.error(err.message || "Could not load status");
    } finally {
      setLoading(false);
    }
  }, [token, provider, valid]);

  useEffect(() => {
    if (!valid) {
      router.replace("/dashboard/integrations");
      return;
    }
    fetchStatus();
  }, [valid, fetchStatus, router]);

  const fetchPatient = async () => {
    if (!token || !patientId) return;
    setPreviewLoading(true);
    setPreview(null);
    try {
      const res = await fetch(
        `${GATEWAY_URL}/ehr/${provider}/patient/${encodeURIComponent(patientId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.message || `Failed: ${res.status}`);
      }
      setPreview(body);
    } catch (err: any) {
      toast.error(err.message || "Patient fetch failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  if (!valid) return null;

  const displayName =
    provider === "epic" ? "Epic" : provider === "cerner" ? "Cerner / Oracle Health" : provider;

  const samplePatientHint =
    provider === "epic"
      ? "e.g. erXuFYUfucBZaryVksYEcMg3"
      : provider === "cerner"
        ? "e.g. 12724066"
        : "";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/dashboard/integrations"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        All integrations
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {displayName}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          SMART on FHIR R4 connection details and patient-read tester.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ArrowPathIcon className="w-5 h-5 animate-spin" /> Loading...
        </div>
      ) : !status?.connected ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-600 dark:text-slate-400">
          Not connected. Go back to{" "}
          <Link
            href="/dashboard/integrations"
            className="text-trust-blue font-semibold hover:underline"
          >
            Integrations
          </Link>{" "}
          and click <strong>Connect</strong> next to {displayName}.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Connection
            </h3>
            <dl className="mt-4 text-sm space-y-1 text-slate-600 dark:text-slate-400">
              <div className="flex gap-2">
                <dt className="font-medium w-32">FHIR base</dt>
                <dd className="truncate">{status.fhirBaseUrl}</dd>
              </div>
              {status.fhirUser && (
                <div className="flex gap-2">
                  <dt className="font-medium w-32">Clinician</dt>
                  <dd className="truncate">{status.fhirUser}</dd>
                </div>
              )}
              {status.patientId && (
                <div className="flex gap-2">
                  <dt className="font-medium w-32">Launch patient</dt>
                  <dd className="truncate">{status.patientId}</dd>
                </div>
              )}
              {status.scope && (
                <div className="flex gap-2">
                  <dt className="font-medium w-32">Scopes</dt>
                  <dd className="truncate">{status.scope}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Test a patient read
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter a FHIR patient id to verify the connection works.
            </p>
            <div className="flex gap-2 mt-4">
              <input
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder={samplePatientHint}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-mono"
              />
              <button
                onClick={fetchPatient}
                disabled={previewLoading || !patientId}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-50 flex items-center gap-2"
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                Fetch
              </button>
            </div>
            {preview && (
              <pre className="mt-4 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 overflow-x-auto max-h-96">
                {JSON.stringify(preview, null, 2)}
              </pre>
            )}
          </div>
        </>
      )}
    </div>
  );
}
