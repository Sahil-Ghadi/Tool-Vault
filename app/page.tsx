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

  useEffect(() => {
    fetchTools();
  }, []);

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
      setName("");
      setUrl("");
      setDescription("");
      setTags([]);
      setTagInput("");
      setPreviewUrl("");
      setShowForm(false);
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
    <div className="min-h-screen bg-white">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 py-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <h1 className="swiss-heading text-2xl md:text-4xl lg:text-5xl flex-none">
              TOOL VAULT
            </h1>
            <span className="hidden md:block text-black/30 flex-none">—</span>
            <p className="hidden md:block text-xs lg:text-sm uppercase tracking-wide font-medium truncate">
              YOUR PERSONAL COLLECTION OF DISCOVERED TOOLS
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex-none h-12 md:h-14 px-6 md:px-8 bg-black text-white uppercase tracking-widest text-xs font-bold transition-all duration-150 hover:bg-[#FF3000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3000] focus-visible:ring-offset-2"
            style={{ borderRadius: 0 }}
          >
            <Plus className="inline h-4 w-4 mr-2 transition-transform duration-200" style={{ transform: showForm ? 'rotate(45deg)' : 'rotate(0deg)' }} />
            {showForm ? "CLOSE" : "ADD"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 lg:px-12 py-12">
        {/* ── ADD FORM ── */}
        {showForm && (
          <div className="mb-12 border-4 border-black bg-[#F2F2F2] swiss-grid-pattern relative">
            <div className="p-8 md:p-12">
              <div className="mb-8">
                <h2 className="swiss-heading text-2xl md:text-4xl">ADD NEW TOOL</h2>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* LEFT: form fields */}
                <form onSubmit={handleSave} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="swiss-label text-black">TOOL NAME *</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="LINEAR, RAYCAST, EXCALIDRAW"
                      className="border-b-2 border-black bg-transparent px-0 py-3 text-base font-medium uppercase tracking-wide placeholder:text-black/30 focus:outline-none focus:border-[#FF3000] transition-colors duration-150"
                      style={{ borderRadius: 0 }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="swiss-label text-black">URL *</label>
                    <input
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="border-b-2 border-black bg-transparent px-0 py-3 text-base font-medium tracking-wide placeholder:text-black/30 focus:outline-none focus:border-[#FF3000] transition-colors duration-150"
                      style={{ borderRadius: 0 }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="swiss-label text-black">DESCRIPTION</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What does this tool do? Why is it useful?"
                      rows={3}
                      className="resize-none border-2 border-black bg-white px-4 py-3 text-sm leading-relaxed placeholder:text-black/30 focus:outline-none focus:border-[#FF3000] transition-colors duration-150"
                      style={{ borderRadius: 0 }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="swiss-label text-black">
                      TAGS <span className="font-normal opacity-60">(PRESS ENTER OR COMMA)</span>
                    </label>
                    <div className="flex flex-wrap gap-2 border-2 border-black bg-white px-4 py-3 focus-within:border-[#FF3000] transition-colors duration-150" style={{ borderRadius: 0 }}>
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="flex items-center gap-2 bg-black text-white px-3 py-1 text-xs uppercase tracking-wider font-bold"
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() => removeTag(t)}
                            className="hover:text-[#FF3000] transition-colors duration-150"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={addTag}
                        placeholder={tags.length === 0 ? "DESIGN, PRODUCTIVITY, AI" : ""}
                        className="min-w-[140px] flex-1 bg-transparent text-sm font-medium uppercase tracking-wide placeholder:text-black/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving || !name.trim() || !url.trim()}
                    className="mt-4 h-14 bg-black text-white uppercase tracking-[0.15em] text-xs font-bold transition-all duration-150 hover:bg-[#FF3000] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3000] focus-visible:ring-offset-2"
                    style={{ borderRadius: 0 }}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
                        SAVING…
                      </>
                    ) : (
                      "SAVE TOOL"
                    )}
                  </button>
                </form>

                {/* RIGHT: live preview */}
                <div className="flex flex-col gap-3">
                  <p className="swiss-label text-black">LIVE PREVIEW</p>
                  <div
                    className="relative flex-1 overflow-hidden border-4 border-black bg-white"
                    style={{ minHeight: 360 }}
                  >
                    {previewUrl ? (
                      <iframe
                        key={previewUrl}
                        src={previewUrl}
                        title="Site preview"
                        className="h-full w-full"
                        style={{ minHeight: 360, pointerEvents: "none" }}
                        sandbox="allow-scripts allow-same-origin"
                      />
                    ) : (
                      <div
                        className="flex h-full items-center justify-center text-black/20"
                        style={{ minHeight: 360 }}
                      >
                        <div className="text-center">
                          <ExternalLink className="mx-auto mb-3 h-12 w-12" />
                          <p className="swiss-label">ENTER A URL TO SEE PREVIEW</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SEARCH + TAG FILTER ── */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <div className="relative flex-1" style={{ minWidth: 240 }}>
            <Search className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH TOOLS..."
              className="w-full border-b-2 border-black bg-transparent py-3 pl-8 pr-4 text-sm font-medium uppercase tracking-wide placeholder:text-black/30 focus:outline-none focus:border-[#FF3000] transition-colors duration-150"
              style={{ borderRadius: 0 }}
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTag(null)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-150 border-2 ${
                  activeTag === null
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-black hover:bg-[#FF3000] hover:text-white hover:border-[#FF3000]"
                }`}
                style={{ borderRadius: 0 }}
              >
                ALL
              </button>
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTag(activeTag === t ? null : t)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-150 border-2 ${
                    activeTag === t
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-black hover:bg-[#FF3000] hover:text-white hover:border-[#FF3000]"
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  <Tag className="h-3 w-3" />
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── TOOL GRID ── */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-black" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-black/40 border-4 border-black bg-[#F2F2F2] swiss-dots">
            <ExternalLink className="mb-6 h-16 w-16" />
            <p className="swiss-label text-lg">
              {tools.length === 0
                ? "NO TOOLS SAVED YET. ADD YOUR FIRST ONE!"
                : "NO TOOLS MATCH YOUR SEARCH."}
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="swiss-heading text-2xl md:text-4xl">
                COLLECTION ({filtered.length})
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((tool) => (
                <ToolCard key={tool.id} tool={tool} onDelete={handleDelete} />
              ))}
            </div>
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
  return (
    <div className="group relative flex flex-col overflow-hidden border-4 border-black bg-white transition-all duration-200 hover:translate-x-1 hover:-translate-y-1">
      {/* preview thumbnail — automatic preview */}
      <div className="relative h-48 w-full flex-none overflow-hidden bg-[#F2F2F2] swiss-diagonal border-b-4 border-black">
        <iframe
          src={tool.url}
          title={`${tool.name} preview`}
          className="h-full w-full"
          style={{
            pointerEvents: "none",
            transform: "scale(0.75)",
            transformOrigin: "top left",
            width: "133%",
            height: "133%",
          }}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      {/* content */}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex-1 text-xl font-black uppercase tracking-tight leading-tight">
            {tool.name}
          </h3>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black transition-colors duration-150 hover:text-[#FF3000] focus-visible:outline-none focus-visible:text-[#FF3000]"
              title="Open site"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
            <button
              onClick={() => onDelete(tool.id)}
              className="text-black/30 transition-colors duration-150 hover:text-[#FF3000] focus-visible:outline-none focus-visible:text-[#FF3000]"
              title="Delete tool"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <p className="text-xs font-medium uppercase tracking-wide text-black/40 truncate border-b border-black/10 pb-2">
          {tool.url}
        </p>

        {tool.description && (
          <p className="text-sm leading-relaxed text-black/70 line-clamp-3">
            {tool.description}
          </p>
        )}

        {tool.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t-2 border-black/10">
            {tool.tags.map((t) => (
              <span
                key={t}
                className="bg-[#F2F2F2] border border-black/20 px-3 py-1 text-xs font-bold uppercase tracking-wider"
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
