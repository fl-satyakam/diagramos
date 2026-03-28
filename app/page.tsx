"use client";

import { useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useDiagramStore } from "@/lib/store";
import { syncCodeToCanvas } from "@/lib/sync/sync-engine";
import DiagramLibrary from "@/components/sidebar/DiagramLibrary";
import Toolbar from "@/components/toolbar/Toolbar";
import FormatToolbar from "@/components/toolbar/FormatToolbar";
import Dashboard from "@/components/dashboard/Dashboard";
import { TooltipProvider } from "@/components/ui/tooltip";

const DiagramCanvas = dynamic(
  () => import("@/components/canvas/DiagramCanvas"),
  { ssr: false }
);
const CodeEditor = dynamic(
  () => import("@/components/editor/CodeEditor"),
  { ssr: false }
);
const AIChatPanel = dynamic(
  () => import("@/components/chat/AIChatPanel"),
  { ssr: false }
);

function EditorView() {
  const sidebarOpen = useDiagramStore((s) => s.sidebarOpen);
  const chatOpen = useDiagramStore((s) => s.chatOpen);
  const toggleSidebar = useDiagramStore((s) => s.toggleSidebar);
  const toggleChat = useDiagramStore((s) => s.toggleChat);
  const undo = useDiagramStore((s) => s.undo);
  const redo = useDiagramStore((s) => s.redo);
  const saveDiagram = useDiagramStore((s) => s.saveDiagram);

  // Initial parse on load
  useEffect(() => {
    const timer = setTimeout(() => {
      syncCodeToCanvas();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(saveDiagram, 10000);
    return () => clearInterval(interval);
  }, [saveDiagram]);

  // Global keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      if (meta && e.key === "k") {
        e.preventDefault();
        toggleChat();
      }
      if (meta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (meta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (meta && e.key === "s") {
        e.preventDefault();
        saveDiagram();
      }
    },
    [toggleSidebar, toggleChat, undo, redo, saveDiagram]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
      <Toolbar />

      <div className="flex flex-1 min-h-0 relative">
        {/* Sidebar */}
        {sidebarOpen && <DiagramLibrary />}

        {/* Canvas */}
        <div className="flex-1 min-w-0 relative">
          <DiagramCanvas />
          {/* Format Toolbar - floating over canvas */}
          <FormatToolbar />
        </div>

        {/* Code Editor */}
        <div className="w-[400px] border-l border-gray-200 flex-shrink-0">
          <CodeEditor />
        </div>

        {/* AI Chat */}
        {chatOpen && <AIChatPanel />}
      </div>
    </div>
  );
}

export default function Home() {
  const view = useDiagramStore((s) => s.view);
  const loadDiagrams = useDiagramStore((s) => s.loadDiagrams);

  // Load diagrams on mount
  useEffect(() => {
    loadDiagrams();
  }, [loadDiagrams]);

  return (
    <TooltipProvider>
      {view === "home" ? <Dashboard /> : <EditorView />}
    </TooltipProvider>
  );
}
