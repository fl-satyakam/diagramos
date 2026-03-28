"use client";

import { useDiagramStore } from "@/lib/store";
import { syncCodeToCanvas } from "@/lib/sync/sync-engine";
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
  RefreshCw,
  PanelLeft,
  Check,
  Loader2,
  AlertCircle,
  Image,
  FileCode,
  FileText,
  Copy,
  Plus,
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

  const activeDiagram = diagrams.find((d) => d.id === activeDiagramId);

  const handleExportPng = async () => {
    const el = document.querySelector(".react-flow") as HTMLElement;
    if (!el) return;
    try {
      const url = await toPng(el, {
        backgroundColor: "#09090b",
        pixelRatio: 2,
      });
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

  const syncIcon = {
    synced: <Check className="h-3 w-3 text-zinc-500" />,
    syncing: <Loader2 className="h-3 w-3 text-zinc-500 animate-spin" />,
    diverged: <RefreshCw className="h-3 w-3 text-amber-500" />,
    error: <AlertCircle className="h-3 w-3 text-red-500" />,
  };

  const syncLabel = {
    synced: "Synced",
    syncing: "Syncing...",
    diverged: "Diverged",
    error: "Sync error",
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
      </div>

      {/* Center */}
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

        <button
          onClick={syncCodeToCanvas}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
          title="Click to force sync from code"
        >
          {syncIcon[syncStatus]}
          <span>{syncLabel[syncStatus]}</span>
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
