"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentArrowUpIcon,
  GlobeAltIcon,
  TrashIcon,
  PencilSquareIcon,
  Square2StackIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import {
  BUILTIN_TEMPLATES,
  COMMUNITY_TEMPLATES,
  type TemplateDef,
  getUserTemplates,
  saveUserTemplate,
  deleteUserTemplate,
  duplicateCommunityToUser,
  inferSectionsFromNoteSample,
  getUserStoredTemplates,
  type StoredUserTemplate,
} from "../../lib/clinical-templates";

type Tab = "all" | "mine" | "community";

export default function TemplatesLibraryPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [mine, setMine] = useState<TemplateDef[]>(getUserTemplates);
  const refreshMine = () => setMine(getUserTemplates());

  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<StoredUserTemplate | null>(null);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSectionsRaw, setFormSectionsRaw] = useState(
    "SUBJECTIVE\nOBJECTIVE\nASSESSMENT\nPLAN",
  );
  const [formInstructions, setFormInstructions] = useState("");

  const [uploadText, setUploadText] = useState("");

  const rows = useMemo(() => {
    const builtin = BUILTIN_TEMPLATES.map((t) => ({
      ...t,
      rowKind: "built-in" as const,
    }));
    const community = COMMUNITY_TEMPLATES.map((t) => ({
      ...t,
      rowKind: "community" as const,
    }));
    const user = mine.map((t) => ({ ...t, rowKind: "yours" as const }));
    let list: (TemplateDef & { rowKind: string })[] = [
      ...user,
      ...builtin,
      ...community,
    ];
    if (tab === "mine") list = user;
    if (tab === "community") list = community;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [tab, query, mine]);

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormDesc("");
    setFormSectionsRaw("SECTION_ONE\nSECTION_TWO\nSECTION_THREE");
    setFormInstructions("");
    setCreateOpen(true);
  };

  const openEdit = (row: TemplateDef) => {
    if (row.source !== "user") return;
    const stored = getUserStoredTemplates().find((r) => r.id === row.id);
    if (!stored) return;
    setEditing(stored);
    setFormName(stored.name);
    setFormDesc(stored.description);
    setFormSectionsRaw(stored.sections.join("\n"));
    setFormInstructions(stored.instructions || "");
    setCreateOpen(true);
  };

  const parseSections = () =>
    formSectionsRaw
      .split(/\r?\n/)
      .map((s) =>
        s
          .trim()
          .replace(/\s+/g, "_")
          .toUpperCase(),
      )
      .filter(Boolean);

  const submitForm = () => {
    const sections = parseSections();
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }
    if (sections.length === 0) {
      toast.error("Add at least one section (one per line)");
      return;
    }
    saveUserTemplate({
      id: editing?.id,
      name: formName,
      description: formDesc || "Custom template",
      sections,
      instructions: formInstructions || undefined,
    });
    refreshMine();
    toast.success(editing ? "Template updated" : "Template created");
    setCreateOpen(false);
    setEditing(null);
  };

  const onUploadAnalyze = () => {
    const sections = inferSectionsFromNoteSample(uploadText);
    setFormSectionsRaw(sections.join("\n"));
    if (!formName.trim()) setFormName("Imported template");
    if (!formDesc.trim()) setFormDesc("Derived from uploaded note outline");
    setUploadOpen(false);
    setCreateOpen(true);
    toast.success("Suggested sections applied — tweak and save.");
  };

  const addCommunity = (t: TemplateDef) => {
    duplicateCommunityToUser(t);
    refreshMine();
    toast.success(`“${t.name}” added to My templates`);
  };

  const removeUser = (id: string) => {
    deleteUserTemplate(id);
    refreshMine();
    toast.success("Removed from My templates");
  };

  const duplicateUser = (t: TemplateDef) => {
    if (t.source !== "user") return;
    const s = mine.find((m) => m.id === t.id);
    if (!s) return;
    saveUserTemplate({
      name: `${s.name} (copy)`,
      description: s.description,
      sections: [...s.sections],
      instructions: s.instructions,
    });
    refreshMine();
    toast.success("Duplicated template");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight font-serif">
            Library
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
            Standard clinical formats, community layouts, and your own prompts.
            Saved templates appear in the{" "}
            <Link
              href="/dashboard/scribe"
              className="text-trust-blue font-semibold hover:underline"
            >
              Live Scribe
            </Link>{" "}
            picker.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-trust-blue/40 transition-colors"
          >
            <DocumentArrowUpIcon className="w-5 h-5 text-slate-500" />
            Import from note
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3d2936] hover:bg-[#4a3542] text-white text-sm font-semibold shadow-lg shadow-black/10"
          >
            <PlusIcon className="w-5 h-5" />
            Create template
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xl">
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a template…"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-trust-blue/20 outline-none"
          />
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        {(
          [
            ["all", "All"],
            ["mine", "My templates"],
            ["community", "Community"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`px-4 py-3 text-sm font-semibold rounded-t-xl transition-colors border-b-2 -mb-px ${
              tab === k
                ? "border-trust-blue text-trust-blue bg-trust-blue/5"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Template</th>
                <th className="px-4 py-4 hidden md:table-cell">Sections</th>
                <th className="px-4 py-4 hidden lg:table-cell">Source</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-16 text-center text-slate-500"
                  >
                    No templates match your search.
                  </td>
                </tr>
              )}
              {(rows as (TemplateDef & { rowKind: string })[]).map((row, i) => (
                <tr
                  key={`${row.id}-${i}`}
                  className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-[#fcf9f9] dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      {row.name}
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                        Note
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-md">
                      {row.description}
                    </p>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell text-xs text-slate-500 font-mono max-w-[200px] truncate">
                    {row.sections.length} · {row.sections.slice(0, 2).join(", ")}
                    {row.sections.length > 2 ? "…" : ""}
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {row.source === "community" && (
                        <GlobeAltIcon className="w-4 h-4 text-sky-500" />
                      )}
                      {row.source === "builtin" && "Doxia"}
                      {row.source === "community" && "Community"}
                      {row.source === "user" && "Just me"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex flex-wrap gap-1 justify-end">
                      {row.source === "community" && (
                        <button
                          type="button"
                          className="p-2 rounded-lg text-trust-blue hover:bg-trust-blue/10"
                          title="Save to My templates"
                          onClick={() => addCommunity(row)}
                        >
                          <Square2StackIcon className="w-5 h-5" />
                        </button>
                      )}
                      {row.source === "user" && (
                        <>
                          <button
                            type="button"
                            className="p-2 rounded-lg text-slate-500 hover:text-trust-blue hover:bg-trust-blue/10"
                            onClick={() => duplicateUser(row)}
                            title="Duplicate"
                          >
                            <Square2StackIcon className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            className="p-2 rounded-lg text-slate-500 hover:text-trust-blue hover:bg-trust-blue/10"
                            onClick={() => openEdit(row)}
                            title="Edit"
                          >
                            <PencilSquareIcon className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10"
                            onClick={() => removeUser(row.id)}
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setCreateOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
            <h2 className="text-xl font-serif font-semibold text-slate-900 dark:text-white">
              {editing ? "Edit template" : "Create template"}
            </h2>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
              Name
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
              Description
              <input
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm"
              />
            </label>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
              Sections (one per line; becomes JSON keys)
              <textarea
                value={formSectionsRaw}
                onChange={(e) => setFormSectionsRaw(e.target.value)}
                rows={6}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm font-mono"
              />
            </label>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
              Optional AI instructions
              <textarea
                value={formInstructions}
                onChange={(e) => setFormInstructions(e.target.value)}
                rows={3}
                placeholder="e.g. Use bullet lists in PLAN; keep HPI concise."
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm"
              />
            </label>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitForm}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#3d2936] text-white hover:bg-[#4a3542]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setUploadOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
            <h2 className="text-xl font-serif font-semibold text-slate-900 dark:text-white">
              Import structure from note
            </h2>
            <p className="text-sm text-slate-500">
              Paste sample text below. Lines that look like headings (often ALL
              CAPS) seed section names; tweak them in the next step.
            </p>
            <textarea
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm"
              placeholder="Paste a note or outline..."
            />
            <div className="flex gap-3 justify-between items-center pt-2">
              <label className="text-sm text-trust-blue font-semibold cursor-pointer">
                Or choose .txt file
                <input
                  type="file"
                  accept=".txt,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => setUploadText(String(r.result || ""));
                    r.readAsText(f);
                  }}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onUploadAnalyze}
                  disabled={!uploadText.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-trust-blue text-white disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
