"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, X, ExternalLink, Tag, Trash2, Search, Loader2 } from "lucide-react";
import type { Tool } from "@/lib/types";

export default function Home() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  // preview state
  const [previewUrl, setPreviewUrl] = useState("");
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // search
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // ── fetch tools ────────────────────────────────────────────────────────────
  async function fetchTools() {
    setLoading(true);
    const res = await fetch("/api/tools");
    const data = await res.json();
    setTools(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchTools(); }, []);

  // ── live preview: debounce URL changes ───────────────────────────────────
  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      try {
        const normalized = url.startsWith("http") ? url : `https://${url}`;
        new URL(normalized); // throws if invalid
        setPreviewUrl(normalized);
      } catch {
        setPreviewUrl("");
      }
    }, 600);
  }, [url]);

  // ── tag helpers ───────────────────────────────────────────────────────────
  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase();
      if (t && !tags.includes(t)) setTags([...tags, t]);
      setTagInput("");
    }
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  // ── save ─────────────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    setSaving(true);
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url: normalized, description, tags }),
    });
    if (res.ok) {
      const saved: Tool = await res.json();
      setTools([saved, ...tools]);
      setName(""); setUrl(""); setDescription(""); setTags([]); setTagInput("");
      setPreviewUrl(""); setShowForm(false);
    }
    setSaving(false);
  }

  // ── delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    await fetch(`/api/tools/${id}`, { method: "DELETE" });
    setTools(tools.filter((t) => t.id !== id));
  }

  // ── filter ────────────────────────────────────────────────────────────────
  const allTags = [...new Set(tools.flatMap((t) => t.tags))].sort();

  const filtered = tools.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.url.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchTag = !activeTag || t.tags.includes(activeTag);
    return matchSearch && matchTag;
  });

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ── header ── */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              🛠 Tool Vault
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your personal collection of discovered tools
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4" />
            Add Tool
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* ── add form ── */}
        {showForm && (
          <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                Add a new tool
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* left: form fields */}
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Tool name *
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Linear, Raycast, Excalidraw"
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:bg-zinc-900"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    URL *
                  </label>
                  <input
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:bg-zinc-900"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this tool do? Why is it useful?"
                    rows={3}
                    className="resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:bg-zinc-900"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Tags{" "}
                    <span className="font-normal text-zinc-400">
                      (press Enter or comma to add)
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 focus-within:border-zinc-400 focus-within:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:focus-within:border-zinc-500 dark:focus-within:bg-zinc-900">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white dark:bg-zinc-50 dark:text-zinc-900"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          className="hover:opacity-70"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={addTag}
                      placeholder={tags.length === 0 ? "design, productivity, ai…" : ""}
                      className="min-w-[120px] flex-1 bg-transparent text-sm text-zinc-900 outline-none dark:text-zinc-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving || !name.trim() || !url.trim()}
                  className="mt-1 flex items-center justify-center gap-2 rounded-full bg-zinc-900 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save Tool"
                  )}
                </button>
              </form>

              {/* right: live preview */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Live preview
                </p>
                <div className="relative flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800" style={{ minHeight: 280 }}>
                  {previewUrl ? (
                    <iframe
                      key={previewUrl}
                      src={previewUrl}
                      title="Site preview"
                      className="h-full w-full"
                      style={{ minHeight: 280, pointerEvents: "none" }}
                      sandbox="allow-scripts allow-same-origin"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-400 dark:text-zinc-600" style={{ minHeight: 280 }}>
                      <div className="text-center">
                        <ExternalLink className="mx-auto mb-2 h-8 w-8 opacity-30" />
                        <p className="text-sm">Enter a URL to see a preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── search + tag filter ── */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1" style={{ minWidth: 200 }}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools…"
              className="w-full rounded-full border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTag(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  activeTag === null
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "border border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                All
              </button>
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTag(activeTag === t ? null : t)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                    activeTag === t
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "border border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  <Tag className="h-3 w-3" />
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── tool grid ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
            <ExternalLink className="mb-4 h-12 w-12 opacity-20" />
            <p className="text-sm">
              {tools.length === 0
                ? "No tools saved yet. Add your first one!"
                : "No tools match your search."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ── ToolCard ─────────────────────────────────────────────────────────────────
function ToolCard({
  tool,
  onDelete,
}: {
  tool: Tool;
  onDelete: (id: string) => void;
}) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      {/* preview thumbnail — click to expand */}
      <button
        onClick={() => setShowPreview((v) => !v)}
        className="relative h-36 w-full flex-none overflow-hidden bg-zinc-100 dark:bg-zinc-800"
        title={showPreview ? "Click to collapse preview" : "Click to expand preview"}
      >
        {showPreview ? (
          <iframe
            src={tool.url}
            title={`${tool.name} preview`}
            className="h-full w-full"
            style={{ pointerEvents: "none", transform: "scale(0.8)", transformOrigin: "top left", width: "125%", height: "125%" }}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ExternalLink className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">
              Click to preview
            </span>
          </div>
        )}
      </button>

      {/* content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-zinc-900 leading-tight dark:text-zinc-50">
            {tool.name}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              title="Open site"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={() => onDelete(tool.id)}
              className="text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400"
              title="Delete tool"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="text-xs text-zinc-400 truncate dark:text-zinc-500">
          {tool.url}
        </p>

        {tool.description && (
          <p className="text-sm text-zinc-600 leading-relaxed dark:text-zinc-400 line-clamp-2">
            {tool.description}
          </p>
        )}

        {tool.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {tool.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
