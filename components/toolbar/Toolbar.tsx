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
  MessageSquare,
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
  const addCommentNode = useDiagramStore((s) => s.addCommentNode);
  const activeDiagramId = useDiagramStore((s) => s.activeDiagramId);
  const diagrams = useDiagramStore((s) => s.diagrams);
  const saveDiagram = useDiagramStore((s) => s.saveDiagram);

  const [syncing, setSyncing] = useState<"code" | "canvas" | null>(null);
  const [saveAnimating, setSaveAnimating] = useState(false);

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

  const handleSave = async () => {
    // First sync canvas → code so the mermaid editor is up to date
    setSyncing("code");
    await syncCanvasToCode();
    setSyncing(null);
    // Then persist everything to localStorage
    saveDiagram();
    useDiagramStore.setState({ syncStatus: "synced" });
    setSaveAnimating(true);
    setTimeout(() => setSaveAnimating(false), 1500);
  };

  const handleExportPng = async () => {
    const el = document.querySelector(".react-flow") as HTMLElement;
    if (!el) return;
    try {
      const url = await toPng(el, { backgroundColor: "#fafafa", pixelRatio: 2 });
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
      const url = await toSvg(el, { backgroundColor: "#fafafa" });
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

  // Smart save button renderer
  const renderSaveButton = () => {
    if (syncStatus === "syncing" || syncing !== null) {
      return (
        <button
          disabled
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold
            bg-gray-100 text-gray-400 cursor-not-allowed"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </button>
      );
    }

    if (syncStatus === "diverged") {
      return (
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold
            bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm"
          title="Save (⌘S)"
        >
          <Save className="h-3 w-3" />
          <span>Save</span>
        </button>
      );
    }

    if (syncStatus === "error") {
      return (
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold
            bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          title="Retry save"
        >
          <AlertCircle className="h-3 w-3" />
          <span>Error</span>
        </button>
      );
    }

    // Synced
    return (
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold
          bg-emerald-50 text-emerald-600 transition-all ${saveAnimating ? "scale-105" : ""}`}
      >
        <Check className="h-3 w-3" />
        <span>Synced</span>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between h-11 px-3 border-b border-gray-200 bg-white">
      {/* Left */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${sidebarOpen ? "text-gray-700" : "text-gray-400"} hover:text-gray-700 hover:bg-gray-100`}
          onClick={toggleSidebar}
          title="Toggle sidebar (⌘B)"
        >
          <PanelLeft className="h-3.5 w-3.5" />
        </Button>

        <div className="h-4 w-px bg-gray-200 mx-1" />

        <span className="text-xs text-gray-800 font-semibold truncate max-w-[200px]">
          {activeDiagram?.name || "Untitled"}
        </span>

        <div className="ml-2">
          {renderSaveButton()}
        </div>
      </div>

      {/* Center — Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          onClick={() => addNode("New Node")}
          title="Add node"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          onClick={() => addCommentNode()}
          title="Add comment"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </Button>

        <div className="h-4 w-px bg-gray-200 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          onClick={undo}
          title="Undo (⌘Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          onClick={redo}
          title="Redo (⌘⇧Z)"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>

        <div className="h-4 w-px bg-gray-200 mx-1" />

        {/* Sync: Code → Canvas */}
        <button
          onClick={handleSyncCodeToCanvas}
          disabled={syncing !== null}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium
            text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors"
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
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium
            text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors"
          title="Sync canvas → code"
        >
          {syncing === "code" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ArrowLeftToLine className="h-3 w-3" />
          )}
          <span>Canvas → Code</span>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-white border-gray-200 text-gray-700"
          >
            <DropdownMenuItem onClick={handleExportPng} className="text-xs gap-2">
              <Image className="h-3.5 w-3.5" />
              Export PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportSvg} className="text-xs gap-2">
              <FileText className="h-3.5 w-3.5" />
              Export SVG
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-100" />
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

        <div className="h-4 w-px bg-gray-200 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${chatOpen ? "text-blue-600 bg-blue-50" : "text-gray-500"} hover:text-blue-600 hover:bg-blue-50`}
          onClick={toggleChat}
          title="AI Edit (⌘K)"
        >
          <Sparkles className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
