"use client";

import { useRef, useCallback, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useDiagramStore } from "@/lib/store";

export default function CodeEditor() {
  const mermaidCode = useDiagramStore((s) => s.mermaidCode);
  const setMermaidCode = useDiagramStore((s) => s.setMermaidCode);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const isInternalUpdate = useRef(false);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Register Mermaid language
    monaco.languages.register({ id: "mermaid" });
    monaco.languages.setMonarchTokensProvider("mermaid", {
      keywords: [
        "graph", "flowchart", "sequenceDiagram", "classDiagram",
        "stateDiagram", "stateDiagram-v2", "erDiagram", "gantt",
        "pie", "gitGraph", "journey", "quadrantChart",
        "subgraph", "end", "participant", "actor",
        "class", "style", "linkStyle", "click",
        "TD", "TB", "BT", "LR", "RL",
      ],
      operators: ["-->", "---", "-.->", "==>", "-->>", "->>", "<<-->>", "~~>"],
      tokenizer: {
        root: [
          [/%%.*/,"comment"],
          [/\b(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|gantt|pie|gitGraph|journey|subgraph|end)\b/, "keyword"],
          [/\b(TD|TB|BT|LR|RL)\b/, "keyword"],
          [/-->|---|-\.->|==>|-->>|->>|~~>/, "operator"],
          [/\|[^|]*\|/, "string"],
          [/\[[^\]]*\]/, "string.bracket"],
          [/\{[^}]*\}/, "string.curly"],
          [/\([^)]*\)/, "string.paren"],
          [/"[^"]*"/, "string"],
          [/'[^']*'/, "string"],
          [/[a-zA-Z_]\w*/, "identifier"],
          [/\d+/, "number"],
        ],
      },
    });

    monaco.languages.setLanguageConfiguration("mermaid", {
      comments: { lineComment: "%%" },
      brackets: [
        ["[", "]"],
        ["{", "}"],
        ["(", ")"],
      ],
      autoClosingPairs: [
        { open: "[", close: "]" },
        { open: "{", close: "}" },
        { open: "(", close: ")" },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: "|", close: "|" },
      ],
    });

    monaco.languages.registerCompletionItemProvider("mermaid", {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        const suggestions = [
          "graph TD", "graph LR", "flowchart TD", "flowchart LR",
          "subgraph", "end", "sequenceDiagram", "classDiagram",
          "stateDiagram-v2", "erDiagram",
        ].map((label) => ({
          label,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: label,
          range,
        }));
        return { suggestions };
      },
    });
  }, []);

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (isInternalUpdate.current) return;
      if (value !== undefined) {
        // Just update the store — no auto-sync
        // User will manually click sync to push to canvas
        useDiagramStore.setState({
          mermaidCode: value,
          activePane: "code",
          syncStatus: "diverged",
        });
      }
    },
    []
  );

  // Update editor when code changes externally (e.g., from AI chat)
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== mermaidCode) {
        isInternalUpdate.current = true;
        editorRef.current.setValue(mermaidCode);
        isInternalUpdate.current = false;
      }
    }
  }, [mermaidCode]);

  return (
    <div className="h-full w-full flex flex-col bg-zinc-950">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-zinc-950">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          Mermaid
        </span>
        <span className="text-[10px] text-zinc-600 font-mono">.mmd</span>
      </div>
      <div className="flex-1">
        <Editor
          defaultLanguage="mermaid"
          value={mermaidCode}
          onChange={handleChange}
          onMount={handleMount}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            lineHeight: 20,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            lineNumbers: "on",
            glyphMargin: false,
            folding: true,
            wordWrap: "on",
            renderLineHighlight: "gutter",
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            bracketPairColorization: { enabled: true },
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
