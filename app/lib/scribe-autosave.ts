const DRAFT_KEY = "doxia_scribe_draft_v1";
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type ScribeDraft = {
  sessionTitle: string;
  encounterContext: string;
  transcriptChunks: string[];
  selectedTemplateId: string;
  speechLang: string;
  currentSessionId: string | null;
  sessionTime: number;
  generatedNote: Record<string, unknown> | null;
  editNote: Record<string, string>;
  billingCodes: unknown[];
  patientSummary: string;
  rawTranscript: string;
  speakerUtterances: {
    speaker: string | null;
    text: string;
    start: number;
    end: number;
    segment_id?: string | null;
  }[];
  diarizationEnabled: boolean;
  savedNoteId: number | null;
  updatedAt: string;
};

export function loadScribeDraft(): ScribeDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as ScribeDraft;
    if (!draft?.updatedAt) return null;
    const age = Date.now() - new Date(draft.updatedAt).getTime();
    if (age > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function saveScribeDraft(draft: ScribeDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* quota exceeded — ignore */
  }
}

export function clearScribeDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}
