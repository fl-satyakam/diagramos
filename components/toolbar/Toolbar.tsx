"use client";

import { useState } from "react";
import { useDiagramStore } from "@/lib/store";
import { syncCodeToCanvas, syncCanvasToCode } from "@/lib/sync/sync-engine";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Undo2,
  Redo2,
  Download,
  Sparkles,
  PanelLeft,
  Check,
  Loader2,
  AlertCircle,
  Image,
  FileCode,
  FileText,
  Copy,
  Plus,
  ArrowRightToLine,
  ArrowLeftToLine,
  Save,
} from "lucide-react";
import { toPng, toSvg } from "html-to-image";

export default function Toolbar() {
  const syncStatus = useDiagramStore((s) => s.syncStatus);
  const undo = useDiagramStore((s) => s.undo);
  const redo = useDiagramStore((s) => s.redo);
  const toggleSidebar = useDiagramStore((s) => s.toggleSidebar);
  const toggleChat = useDiagramStore((s) => s.toggleChat);
  const sidebarOpen = useDiagramStore((s) => s.sidebarOpen);
  const chatOpen = useDiagramStore((s) => s.chatOpen);
  const mermaidCode = useDiagramStore((s) => s.mermaidCode);
  const addNode = useDiagramStore((s) => s.addNode);
  const activeDiagramId = useDiagramStore((s) => s.activeDiagramId);
  const diagrams = useDiagramStore((s) => s.diagrams);
  const saveDiagram = useDiagramStore((s) => s.saveDiagram);

  const [syncing, setSyncing] = useState<"code" | "canvas" | null>(null);

  const activeDiagram = diagrams.find((d) => d.id === activeDiagramId);

  const handleSyncCodeToCanvas = async () => {
    setSyncing("canvas");
    await syncCodeToCanvas();
    setSyncing(null);
  };

  const handleSyncCanvasToCode = async () => {
    setSyncing("code");
    await syncCanvasToCode();
    setSyncing(null);
  };

  const handleSave = () => {
    saveDiagram();
    useDiagramStore.setState({ syncStatus: "synced" });
  };

  const handleExportPng = async () => {
    const el = document.querySelector(".react-flow") as HTMLElement;
    if (!el) return;
    try {
      const url = await toPng(el, { backgroundColor: "#09090b", pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeDiagram?.name || "diagram"}.png`;
      a.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    }
  };

  const handleExportSvg = async () => {
    const el = document.querySelector(".react-flow") as HTMLElement;
    if (!el) return;
    try {
      const url = await toSvg(el, { backgroundColor: "#09090b" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeDiagram?.name || "diagram"}.svg`;
      a.click();
    } catch (err) {
      console.error("SVG export failed:", err);
    }
  };

  const handleExportMermaid = () => {
    const blob = new Blob([mermaidCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDiagram?.name || "diagram"}.mmd`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMermaid = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
    } catch {}
  };

  const syncStatusIcon = {
    synced: <Check className="h-3 w-3 text-emerald-500" />,
    syncing: <Loader2 className="h-3 w-3 text-zinc-500 animate-spin" />,
    diverged: <div className="h-2 w-2 rounded-full bg-amber-500" />,
    error: <AlertCircle className="h-3 w-3 text-red-500" />,
  };

  return (
    <div className="flex items-center justify-between h-10 px-3 border-b border-zinc-800 bg-zinc-950">
      {/* Left */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${sidebarOpen ? "text-zinc-300" : "text-zinc-500"} hover:text-zinc-300`}
          onClick={toggleSidebar}
          title="Toggle sidebar (⌘B)"
        >
          <PanelLeft className="h-3.5 w-3.5" />
        </Button>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <span className="text-xs text-zinc-300 font-medium truncate max-w-[200px]">
          {activeDiagram?.name || "Untitled"}
        </span>

        <div className="ml-2">
          {syncStatusIcon[syncStatus]}
        </div>
      </div>

      {/* Center — Sync Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
          onClick={() => addNode("New Node")}
          title="Add node"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
          onClick={undo}
          title="Undo (⌘Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
          onClick={redo}
          title="Redo (⌘⇧Z)"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        {/* Sync: Code → Canvas */}
        <button
          onClick={handleSyncCodeToCanvas}
          disabled={syncing !== null}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 disabled:opacity-40 transition-colors"
          title="Sync code → canvas"
        >
          {syncing === "canvas" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ArrowRightToLine className="h-3 w-3" />
          )}
          <span>Code → Canvas</span>
        </button>

        {/* Sync: Canvas → Code */}
        <button
          onClick={handleSyncCanvasToCode}
          disabled={syncing !== null}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 disabled:opacity-40 transition-colors"
          title="Sync canvas → code"
        >
          {syncing === "code" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ArrowLeftToLine className="h-3 w-3" />
          )}
          <span>Canvas → Code</span>
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        {/* Save */}
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
          title="Save (⌘S)"
        >
          <Save className="h-3 w-3" />
          <span>Save</span>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-zinc-900 border-zinc-800 text-zinc-300"
          >
            <DropdownMenuItem onClick={handleExportPng} className="text-xs gap-2">
              <Image className="h-3.5 w-3.5" />
              Export PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportSvg} className="text-xs gap-2">
              <FileText className="h-3.5 w-3.5" />
              Export SVG
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem onClick={handleExportMermaid} className="text-xs gap-2">
              <FileCode className="h-3.5 w-3.5" />
              Download .mmd
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyMermaid} className="text-xs gap-2">
              <Copy className="h-3.5 w-3.5" />
              Copy Mermaid
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${chatOpen ? "text-zinc-300 bg-zinc-800/50" : "text-zinc-500"} hover:text-zinc-300`}
          onClick={toggleChat}
          title="AI Edit (⌘K)"
        >
          <Sparkles className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
