"use client";

import { useState, useRef, useEffect } from "react";
import { useDiagramStore } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X, Sparkles, Trash2 } from "lucide-react";

export default function AIChatPanel() {
  const chatMessages = useDiagramStore((s) => s.chatMessages);
  const addChatMessage = useDiagramStore((s) => s.addChatMessage);
  const clearChat = useDiagramStore((s) => s.clearChat);
  const toggleChat = useDiagramStore((s) => s.toggleChat);
  const mermaidCode = useDiagramStore((s) => s.mermaidCode);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const message = input.trim();
    setInput("");
    addChatMessage({ role: "user", content: message });
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, currentMermaid: mermaidCode }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.mermaidCode) {
          useDiagramStore.setState({ mermaidCode: data.mermaidCode, activePane: "code" });
          addChatMessage({
            role: "assistant",
            content: data.explanation || "Done! Diagram updated.",
          });
        } else {
          addChatMessage({
            role: "assistant",
            content: data.error || "Something went wrong.",
          });
        }
      } else {
        addChatMessage({
          role: "assistant",
          content: "API not configured. Add your API key to use AI features.",
        });
      }
    } catch {
      addChatMessage({
        role: "assistant",
        content: "Failed to connect. Make sure the API is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-l border-zinc-800 w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            AI Edit
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
            onClick={clearChat}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
            onClick={toggleChat}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-3" ref={scrollRef}>
        {chatMessages.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <Sparkles className="h-8 w-8 text-zinc-700 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs text-zinc-500">Edit your diagram with AI</p>
              <p className="text-[10px] text-zinc-600">
                &quot;Add a load balancer before the API&quot;
              </p>
            </div>
            <div className="space-y-1.5 pt-2">
              {[
                "Add a database node",
                "Connect A to C",
                "Make it a sequence diagram",
                "Add error handling flow",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                  }}
                  className="block w-full text-left text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 px-2 py-1.5 rounded transition-colors"
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
              className={`text-xs leading-relaxed ${
                msg.role === "user"
                  ? "text-zinc-200 bg-zinc-800/50 rounded-lg px-3 py-2"
                  : "text-zinc-400 px-1"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 px-1">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span>Thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-zinc-800">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Describe your edit..."
            className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-300 placeholder:text-zinc-600"
            disabled={loading}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-zinc-500 hover:text-zinc-300"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
