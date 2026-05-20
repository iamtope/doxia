const SCRIBE_URL =
  process.env.NEXT_PUBLIC_SCRIBE_SERVICE_URL || "http://127.0.0.1:8001";

export const NOTE_IMPORT_ACCEPT =
  ".txt,.pdf,image/jpeg,image/png,image/webp,image/gif,application/pdf";

export const NOTE_IMPORT_MAX_BYTES = 10 * 1024 * 1024;

function isTxtFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return file.type === "text/plain" || lower.endsWith(".txt");
}

/** Read note content from .txt locally, or PDF/image via scribe-service. */
export async function extractTextFromNoteFile(file: File): Promise<string> {
  if (isTxtFile(file)) {
    return (await file.text()).trim();
  }

  if (file.size > NOTE_IMPORT_MAX_BYTES) {
    throw new Error("File is too large (max 10 MB).");
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${SCRIBE_URL}/scribe/extract-note-text`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let message = "Could not read file";
    try {
      const body = await res.json();
      const detail = body?.detail;
      if (typeof detail === "string") message = detail;
      else if (Array.isArray(detail) && detail[0]?.msg) message = detail[0].msg;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const data = (await res.json()) as { text?: string };
  return (data.text || "").trim();
}
