"use client";

import { useState, useEffect, useMemo } from "react";
import { useDiagramStore, type Diagram } from "@/lib/store";
import { Plus, Search, FileText, Clock, ChevronRight } from "lucide-react";

const TEMPLATES = [
  { key: "flowchart", label: "Flowchart", icon: "🔀" },
  { key: "sequence", label: "Sequence", icon: "↔️" },
  { key: "class", label: "Class Diagram", icon: "🏗️" },
  { key: "state", label: "State Machine", icon: "🔄" },
  { key: "er", label: "ER Diagram", icon: "🗃️" },
  { key: "blank", label: "Blank", icon: "📄" },
];

function relativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function codePreview(code: string): string {
  const lines = code.split("\n").filter((l) => l.trim());
  return lines.slice(0, 3).join("\n");
}

function diagramTypeLabel(code: string): string {
  const first = code.trim().split("\n")[0]?.toLowerCase() || "";
  if (first.startsWith("graph") || first.startsWith("flowchart")) return "Flowchart";
  if (first.startsWith("sequencediagram")) return "Sequence";
  if (first.startsWith("classdiagram")) return "Class";
  if (first.startsWith("statediagram")) return "State";
  if (first.startsWith("erdiagram")) return "ER Diagram";
  if (first.startsWith("gantt")) return "Gantt";
  if (first.startsWith("pie")) return "Pie Chart";
  return "Diagram";
}

export default function Dashboard() {
  const diagrams = useDiagramStore((s) => s.diagrams);
  const loadDiagrams = useDiagramStore((s) => s.loadDiagrams);
  const setActiveDiagram = useDiagramStore((s) => s.setActiveDiagram);
  const createDiagram = useDiagramStore((s) => s.createDiagram);

  const [search, setSearch] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadDiagrams();
  }, [loadDiagrams]);

  const filtered = useMemo(() => {
    if (!search.trim()) return diagrams;
    const q = search.toLowerCase();
    return diagrams.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.mermaidCode.toLowerCase().includes(q)
    );
  }, [diagrams, search]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.updatedAt - a.updatedAt),
    [filtered]
  );

  const handleNewDiagram = (templateKey: string) => {
    const name = `Untitled ${diagramTypeLabel(templateKey === "blank" ? "graph TD" : templateKey)}`;
    createDiagram(name, templateKey);
    setShowTemplates(false);
  };

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
              DiagramOS
            </h1>
          </div>

          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Diagram
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search diagrams..."
            className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-colors"
          />
        </div>

        {/* Diagram count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {sorted.length} diagram{sorted.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </p>
        </div>

        {/* Grid */}
        {sorted.length === 0 && !search ? (
          <div className="text-center py-20">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              No diagrams yet
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Create your first diagram to get started
            </p>
            <button
              onClick={() => setShowTemplates(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Diagram
            </button>
          </div>
        ) : sorted.length === 0 && search ? (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              No results found
            </h3>
            <p className="text-xs text-gray-400">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* New diagram card */}
            <button
              onClick={() => setShowTemplates(true)}
              className="group flex flex-col items-center justify-center gap-3 p-6 bg-white border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-sm transition-all min-h-[180px]"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Plus className="h-5 w-5 text-gray-500" />
              </div>
              <span className="text-sm text-gray-500 font-medium">
                New Diagram
              </span>
            </button>

            {/* Diagram cards */}
            {sorted.map((diagram) => (
              <DiagramCard
                key={diagram.id}
                diagram={diagram}
                onClick={() => setActiveDiagram(diagram.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Template picker modal */}
      {showTemplates && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
          onClick={() => setShowTemplates(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              New Diagram
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Choose a template to get started
            </p>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleNewDiagram(t.key)}
                  className="group flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all text-left"
                >
                  <span className="text-lg">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {t.label}
                    </span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTemplates(false)}
              className="mt-4 w-full text-center text-xs text-gray-400 hover:text-gray-600 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DiagramCard({
  diagram,
  onClick,
}: {
  diagram: Diagram;
  onClick: () => void;
}) {
  const typeLabel = diagramTypeLabel(diagram.mermaidCode);
  const preview = codePreview(diagram.mermaidCode);
  const updated = relativeTime(diagram.updatedAt);

  return (
    <button
      onClick={onClick}
      className="group flex flex-col text-left bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-gray-300 transition-all min-h-[180px]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 w-full">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {diagram.name}
          </h3>
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
            {typeLabel}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-0.5" />
      </div>

      {/* Code preview */}
      <div className="flex-1 mb-3 w-full">
        <pre className="text-[10px] text-gray-400 font-mono leading-relaxed overflow-hidden line-clamp-3">
          {preview}
        </pre>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 w-full">
        <Clock className="h-3 w-3" />
        <span>{updated}</span>
      </div>
    </button>
  );
}
