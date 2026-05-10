export type TemplateSource = "builtin" | "community" | "user";

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  sections: string[];
  source: TemplateSource;
  /** Extra guidance for the note-generation model */
  instructions?: string;
}

const STORAGE_USER = "doxia_user_templates_v1";

export const BUILTIN_TEMPLATES: TemplateDef[] = [
  {
    id: "builtin-soap",
    name: "SOAP",
    description: "Subjective, Objective, Assessment, Plan",
    sections: ["SUBJECTIVE", "OBJECTIVE", "ASSESSMENT", "PLAN"],
    source: "builtin",
  },
  {
    id: "builtin-dap",
    name: "DAP",
    description: "Data, Assessment, Plan",
    sections: ["DATA", "ASSESSMENT", "PLAN"],
    source: "builtin",
  },
  {
    id: "builtin-birp",
    name: "BIRP",
    description: "Behavior, Intervention, Response, Plan",
    sections: ["BEHAVIOR", "INTERVENTION", "RESPONSE", "PLAN"],
    source: "builtin",
  },
  {
    id: "builtin-progress",
    name: "Progress note",
    description: "Brief interval history and plan",
    sections: ["INTERVAL_HISTORY", "CURRENT_STATUS", "ASSESSMENT", "PLAN"],
    source: "builtin",
  },
];

/** Curated community-style templates (local catalog; users can duplicate into “My templates”) */
export const COMMUNITY_TEMPLATES: TemplateDef[] = [
  {
    id: "cmty-patient-explainer",
    name: "Patient explainer letter",
    description: "Plain-language explanation of condition and plan",
    sections: ["GREETING", "WHAT_WE_FOUND", "WHAT_IT_MEANS", "NEXT_STEPS", "QUESTIONS"],
    source: "community",
    instructions:
      "Write in warm, eighth-grade reading level. Avoid unexplained jargon. Use short paragraphs.",
  },
  {
    id: "cmty-ed-admission",
    name: "ED admission note",
    description: "Emergency department presentation-focused note",
    sections: ["CHIEF_COMPLAINT", "HPI", "ROS_PERTINENT", "PMH_MEDS_ALLERGIES", "EXAM", "DIAGNOSTIC_EVALUATION", "ED_COURSE", "DISPOSITION_PLAN"],
    source: "community",
    instructions: "Orient to acute ED workflow; emphasize decision-making and risk.",
  },
  {
    id: "cmty-discharge-instructions",
    name: "Discharge & follow-up",
    description: "After-visit summary style instructions",
    sections: ["VISIT_SUMMARY", "HOME_CARE", "MEDICATIONS", "WARNINGS", "FOLLOW_UP", "WHO_TO_CONTACT"],
    source: "community",
  },
  {
    id: "cmty-supervision",
    name: "Clinical supervision note",
    description: "Case review / supervision documentation",
    sections: ["CASE_SUMMARY", "CLINICAL_QUESTION", "DISCUSSION", "LEARNING_POINTS", "PLAN"],
    source: "community",
  },
  {
    id: "cmty-team-meeting",
    name: "Team meeting note",
    description: "Multi-disciplinary discussion minutes",
    sections: ["ATTENDEES", "AGENDA", "DISCUSSION", "ACTION_ITEMS", "FOLLOW_UP"],
    source: "community",
    instructions:
      "Assume multiple speakers; summarize decisions and accountable owners briefly.",
  },
  {
    id: "cmty-allied-health",
    name: "Allied health session",
    description: "Therapy-oriented structured note",
    sections: ["GOALS", "INTERVENTIONS", "RESPONSE_PROGRESS", "ASSESSMENT", "HOME_PROGRAM", "PLAN"],
    source: "community",
  },
];

export interface StoredUserTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

function safeParseStored(): StoredUserTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function persist(users: StoredUserTemplate[]) {
  localStorage.setItem(STORAGE_USER, JSON.stringify(users));
}

export function getUserStoredTemplates(): StoredUserTemplate[] {
  return safeParseStored().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function storedToDef(s: StoredUserTemplate): TemplateDef {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    sections: s.sections,
    source: "user",
    instructions: s.instructions,
  };
}

export function getUserTemplates(): TemplateDef[] {
  return getUserStoredTemplates().map(storedToDef);
}

export function saveUserTemplate(input: Omit<StoredUserTemplate, "id" | "createdAt" | "updatedAt"> & { id?: string }): StoredUserTemplate {
  const now = new Date().toISOString();
  const list = safeParseStored();
  const id = input.id || `user-${crypto.randomUUID()}`;
  const existing = input.id ? list.find((x) => x.id === input.id) : undefined;
  const row: StoredUserTemplate = {
    id,
    name: input.name.trim(),
    description: input.description.trim(),
    sections: input.sections.map((s) => s.trim()).filter(Boolean),
    instructions: input.instructions?.trim() || undefined,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  const next = existing
    ? list.map((x) => (x.id === id ? row : x))
    : [...list, row];
  persist(next);
  return row;
}

export function deleteUserTemplate(id: string) {
  persist(safeParseStored().filter((x) => x.id !== id));
}

export function duplicateCommunityToUser(t: TemplateDef): StoredUserTemplate {
  return saveUserTemplate({
    name: t.name,
    description: t.description,
    sections: [...t.sections],
    instructions: t.instructions,
  });
}

export function getTemplateById(id: string): TemplateDef | null {
  const b = BUILTIN_TEMPLATES.find((x) => x.id === id);
  if (b) return b;
  const c = COMMUNITY_TEMPLATES.find((x) => x.id === id);
  if (c) return c;
  const u = getUserStoredTemplates().find((x) => x.id === id);
  if (u) return storedToDef(u);
  return null;
}

/** Everything selectable on the Scribe page */
export function listTemplatesForScribe(): TemplateDef[] {
  return [
    ...BUILTIN_TEMPLATES,
    ...COMMUNITY_TEMPLATES,
    ...getUserTemplates(),
  ];
}

/** Heuristic: lines in ALL CAPS or markdown headings become section keys */
export function inferSectionsFromNoteSample(text: string): string[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const keys: string[] = [];
  for (const line of lines) {
    const h = line.replace(/^#{1,6}\s*/, "");
    const upper =
      h.length <= 42 &&
      h === h.toUpperCase() &&
      /[A-Z]/.test(h) &&
      !/^\d+\.?$/.test(h);
    if (upper) keys.push(h.replace(/\s+/g, "_"));
    if (keys.length >= 14) break;
  }
  if (keys.length > 0) return Array.from(new Set(keys));
  return ["SECTION_1", "SECTION_2", "SECTION_3"];
}
