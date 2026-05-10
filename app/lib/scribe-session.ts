const TRIAL_START_KEY = "doxia_trial_started_at";
const TRIAL_DAYS = 14;

export function getTrialDaysRemaining(): number {
  if (typeof window === "undefined") return TRIAL_DAYS;
  let raw = localStorage.getItem(TRIAL_START_KEY);
  if (!raw || Number.isNaN(Number(raw))) {
    raw = String(Date.now());
    localStorage.setItem(TRIAL_START_KEY, raw);
  }
  const start = parseInt(raw, 10);
  const end = start + TRIAL_DAYS * 86_400_000;
  const left = Math.ceil((end - Date.now()) / 86_400_000);
  return Math.max(0, left);
}

export const SCRIBE_LANGUAGES: { code: string; label: string }[] = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Spanish (Spain)" },
  { code: "es-MX", label: "Spanish (Mexico)" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "pt-BR", label: "Portuguese (Brazil)" },
  { code: "it-IT", label: "Italian" },
];
