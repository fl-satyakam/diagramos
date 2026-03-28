"use client";

import { useState } from "react";
import { useDiagramStore } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  FileText,
  Trash2,
  Search,
  ChevronLeft,
  GitBranch,
  Network,
  Workflow,
  Database,
  Box,
} from "lucide-react";

const templateIcons: Record<string, typeof FileText> = {
  flowchart: Workflow,
  sequence: GitBranch,
  class: Box,
  state: Network,
  er: Database,
  blank: FileText,
};

export default function DiagramLibrary() {
  const diagrams = useDiagramStore((s) => s.diagrams);
  const activeDiagramId = useDiagramStore((s) => s.activeDiagramId);
  const createDiagram = useDiagramStore((s) => s.createDiagram);
  const deleteDiagram = useDiagramStore((s) => s.deleteDiagram);
  const renameDiagram = useDiagramStore((s) => s.renameDiagram);
  const setActiveDiagram = useDiagramStore((s) => s.setActiveDiagram);
  const toggleSidebar = useDiagramStore((s) => s.toggleSidebar);

  const [search, setSearch] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const filtered = diagrams.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (template: string) => {
    const name = `New ${template.charAt(0).toUpperCase() + template.slice(1)}`;
    createDiagram(name, template);
    setShowTemplates(false);
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameDiagram(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 w-[240px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Diagrams
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            onClick={toggleSidebar}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Template picker */}
      {showTemplates && (
        <div className="px-2 py-2 border-b border-gray-200 space-y-1">
          {["flowchart", "sequence", "class", "state", "er", "blank"].map(
            (t) => {
              const Icon = templateIcons[t] || FileText;
              return (
                <button
                  key={t}
                  onClick={() => handleCreate(t)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                >
                  <Icon className="h-3.5 w-3.5 text-gray-400" />
                  <span className="capitalize">{t}</span>
                </button>
              );
            }
          )}
        </div>
      )}

      {/* Search */}
      <div className="px-2 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-7 pl-7 text-xs bg-gray-50 border-gray-200 text-gray-700 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Diagram list */}
      <ScrollArea className="flex-1">
        <div className="px-2 space-y-0.5">
          {filtered.map((d) => (
            <div
              key={d.id}
              className={`
                group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer
                transition-colors text-xs
                ${
                  d.id === activeDiagramId
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }
              `}
              onClick={() => setActiveDiagram(d.id)}
              onDoubleClick={() => {
                setEditingId(d.id);
                setEditName(d.name);
              }}
            >
              {editingId === d.id ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleRename(d.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(d.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  className="bg-transparent flex-1 outline-none text-gray-900"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className={`h-3 w-3 flex-shrink-0 ${
                      d.id === activeDiagramId ? "text-blue-500" : "text-gray-400"
                    }`} />
                    <span className="truncate">{d.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDiagram(d.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-200">
        <span className="text-[10px] text-gray-400">
          {diagrams.length} diagram{diagrams.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
