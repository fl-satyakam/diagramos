import { parseMermaidToFlow } from "./mermaid-to-flow";
import { useDiagramStore } from "../store";

/**
 * Manual sync: Code → Canvas
 * Deterministic parser, no LLM needed.
 */
export async function syncCodeToCanvas() {
  const { mermaidCode, setSyncStatus, setNodes, setEdges, pushHistory } =
    useDiagramStore.getState();

  setSyncStatus("syncing");
  try {
    const { nodes, edges } = await parseMermaidToFlow(mermaidCode);
    pushHistory();
    setNodes(nodes);
    setEdges(edges);
    setSyncStatus("synced");
  } catch (err) {
    console.error("Code → Canvas sync failed:", err);
    setSyncStatus("error");
  }
}

/**
 * Manual sync: Canvas → Code
 * Uses LLM via /api/sync with deterministic fallback.
 */
export async function syncCanvasToCode() {
  const { nodes, edges, setSyncStatus, pushHistory } =
    useDiagramStore.getState();

  if (nodes.length === 0) {
    useDiagramStore.setState({ mermaidCode: "graph TD\n    A[Start]", syncStatus: "synced" });
    return;
  }

  setSyncStatus("syncing");
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nodes: nodes.map((n) => ({
          id: n.id,
          label: (n.data as any)?.label || n.id,
          position: n.position,
          shape: (n.data as any)?.shape || "rect",
        })),
        edges: edges.map((e) => ({
          source: e.source,
          target: e.target,
          label: e.label || "",
          animated: e.animated || false,
        })),
      }),
    });

    if (!res.ok) throw new Error("Sync API failed");

    const data = await res.json();
    if (data.mermaidCode) {
      pushHistory();
      useDiagramStore.setState({
        mermaidCode: data.mermaidCode,
        syncStatus: "synced",
      });
    }
  } catch (err) {
    console.error("Canvas → Code sync failed:", err);
    // Deterministic client-side fallback
    const code = clientFallbackSync(nodes, edges);
    pushHistory();
    useDiagramStore.setState({ mermaidCode: code, syncStatus: "synced" });
  }
}

/** Client-side deterministic fallback */
function clientFallbackSync(nodes: any[], edges: any[]): string {
  const lines: string[] = ["graph TD"];
  for (const n of nodes) {
    const id = sanitizeId(n.id);
    const label = (n.data as any)?.label || n.id;
    lines.push(`    ${id}[${label}]`);
  }
  for (const e of edges) {
    const src = sanitizeId(e.source);
    const tgt = sanitizeId(e.target);
    const label = e.label || "";
    if (label) {
      lines.push(`    ${src} -->|${label}| ${tgt}`);
    } else {
      lines.push(`    ${src} --> ${tgt}`);
    }
  }
  return lines.join("\n");
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}
