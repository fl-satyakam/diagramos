"use client";

import { useState, useRef, useEffect } from "react";
import { useDiagramStore, type AIModel } from "@/lib/store";
import { syncCodeToCanvas } from "@/lib/sync/sync-engine";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Send, X, Sparkles, Trash2, ChevronDown } from "lucide-react";

const MODEL_OPTIONS: { value: AIModel; label: string; badge?: string }[] = [
  { value: "gemini", label: "Gemini Flash" },
  { value: "sonnet", label: "Claude Sonnet", badge: "Bedrock" },
  { value: "opus", label: "Claude Opus", badge: "Bedrock" },
];

function ModelLabel(model: AIModel): string {
  return MODEL_OPTIONS.find((m) => m.value === model)?.label || "Gemini Flash";
}

export default function AIChatPanel() {
  const chatMessages = useDiagramStore((s) => s.chatMessages);
  const addChatMessage = useDiagramStore((s) => s.addChatMessage);
  const clearChat = useDiagramStore((s) => s.clearChat);
  const toggleChat = useDiagramStore((s) => s.toggleChat);
  const mermaidCode = useDiagramStore((s) => s.mermaidCode);
  const aiModel = useDiagramStore((s) => s.aiModel);
  const setAiModel = useDiagramStore((s) => s.setAiModel);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close model picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modelRef.current && !modelRef.current.contains(e.target as HTMLElement)) {
        setModelPickerOpen(false);
      }
    }
    if (modelPickerOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [modelPickerOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const message = input.trim();
    setInput("");
    addChatMessage({ role: "user", content: message });
    setLoading(true);

    try {
      const history = chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          currentMermaid: mermaidCode,
          history,
          model: aiModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        if (data.mermaidCode) {
          useDiagramStore.getState().pushHistory();
          useDiagramStore.setState({
            mermaidCode: data.mermaidCode,
            syncStatus: "diverged",
          });
          await syncCodeToCanvas();

          addChatMessage({
            role: "assistant",
            content: `✅ ${data.explanation || "Diagram updated."}`,
          });
        } else if (data.explanation) {
          addChatMessage({
            role: "assistant",
            content: data.explanation,
          });
        } else if (data.error) {
          addChatMessage({
            role: "assistant",
            content: `⚠️ ${data.error}`,
          });
        }
      } else {
        const errData = await res.json().catch(() => null);
        addChatMessage({
          role: "assistant",
          content: errData?.error || "API not configured. Add GEMINI_API_KEY to .env.local",
        });
      }
    } catch {
      addChatMessage({
        role: "assistant",
        content: "Failed to connect to AI. Check the dev server.",
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 w-[340px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            AI Assistant
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            onClick={clearChat}
            title="Clear chat"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            onClick={toggleChat}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-3 overflow-y-auto min-h-0">
        {chatMessages.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <Sparkles className="h-8 w-8 text-gray-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs text-gray-600 font-medium">Ask anything about your diagram</p>
              <p className="text-[10px] text-gray-400">
                Edit, explain, or improve your Mermaid diagrams
              </p>
            </div>
            <div className="space-y-1.5 pt-2">
              {[
                "Explain this diagram",
                "Add a database node after the API",
                "Convert to left-right layout",
                "Add error handling branches",
                "What could I improve?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="block w-full text-left text-[11px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2.5 py-1.5 rounded-md transition-colors"
                >
                  → {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-3">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "text-gray-800 bg-blue-50 rounded-lg px-3 py-2 ml-6"
                  : "text-gray-700 bg-gray-50 rounded-lg px-3 py-2 mr-6 border border-gray-100"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-400 px-3 py-2 bg-gray-50 rounded-lg mr-6 border border-gray-100">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span>Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask or edit..."
            className="flex-1 h-8 px-3 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
            disabled={loading}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 flex-shrink-0"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Model picker */}
        <div className="flex items-center justify-between mt-2 px-1" ref={modelRef}>
          <div className="relative">
            <button
              onClick={() => setModelPickerOpen(!modelPickerOpen)}
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span>Model: {ModelLabel(aiModel)}</span>
              <ChevronDown className="h-2.5 w-2.5" />
            </button>

            {modelPickerOpen && (
              <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] z-50">
                {MODEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setAiModel(opt.value);
                      setModelPickerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      aiModel === opt.value
                        ? "text-gray-900 font-medium"
                        : "text-gray-600"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="flex items-center gap-1.5">
                      {opt.badge && (
                        <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {opt.badge}
                        </span>
                      )}
                      {aiModel === opt.value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-[9px] text-gray-300">
            {aiModel === "gemini" ? "Gemini" : "Bedrock"}
          </span>
        </div>
      </div>
    </div>
  );
}
