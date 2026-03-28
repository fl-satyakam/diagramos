import { parseMermaidToFlow } from "./mermaid-to-flow";
import { useDiagramStore } from "../store";

const POSITION_KEY = "diagramos-positions";

/** Save node positions to localStorage so they survive sync/refresh */
function savePositionMap() {
  const { nodes, activeDiagramId } = useDiagramStore.getState();
  if (!activeDiagramId) return;

  try {
    const existing = JSON.parse(localStorage.getItem(POSITION_KEY) || "{}");
    const posMap: Record<string, { x: number; y: number; width?: number; height?: number }> = {};
    for (const n of nodes) {
      posMap[n.id] = {
        x: n.position.x,
        y: n.position.y,
        ...((n.data as any)?.width ? { width: (n.data as any).width } : {}),
        ...((n.data as any)?.height ? { height: (n.data as any).height } : {}),
      };
    }
    existing[activeDiagramId] = posMap;
    localStorage.setItem(POSITION_KEY, JSON.stringify(existing));
  } catch {}
}

/** Load saved positions — from diagram's server-synced nodes or localStorage fallback */
function loadPositionMap(): Record<string, { x: number; y: number; width?: number; height?: number }> | null {
  const { activeDiagramId, diagrams } = useDiagramStore.getState();
  if (!activeDiagramId) return null;

  // Check if the current diagram already has nodes with positions (from DynamoDB)
  const diagram = diagrams.find((d: any) => d.id === activeDiagramId);
  if (diagram && diagram.nodes && diagram.nodes.length > 0) {
    const posMap: Record<string, any> = {};
    for (const n of diagram.nodes) {
      if (n.position) {
        posMap[n.id] = {
          x: n.position.x,
          y: n.position.y,
          ...((n.data as any)?.width ? { width: (n.data as any).width } : {}),
          ...((n.data as any)?.height ? { height: (n.data as any).height } : {}),
        };
      }
    }
    if (Object.keys(posMap).length > 0) return posMap;
  }

  // Fallback to localStorage
  try {
    const existing = JSON.parse(localStorage.getItem(POSITION_KEY) || "{}");
    return existing[activeDiagramId] || null;
  } catch {
    return null;
  }
}

/**
 * Manual sync: Code → Canvas
 * Deterministic parser, then restores saved positions if available.
 */
export async function syncCodeToCanvas() {
  const { mermaidCode, setSyncStatus, setNodes, setEdges, pushHistory } =
    useDiagramStore.getState();

  setSyncStatus("syncing");
  try {
    const { nodes, edges } = await parseMermaidToFlow(mermaidCode);

    // Restore saved positions (from previous saves or manual arrangements)
    const posMap = loadPositionMap();
    if (posMap) {
      for (const node of nodes) {
        const saved = posMap[node.id];
        if (saved) {
          node.position = { x: saved.x, y: saved.y };
          if (saved.width || saved.height) {
            (node.data as any).width = saved.width;
            (node.data as any).height = saved.height;
          }
        }
      }
    }

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
 * Saves positions before syncing, uses LLM or deterministic fallback.
 */
export async function syncCanvasToCode() {
  const { nodes, edges, setSyncStatus, pushHistory } =
    useDiagramStore.getState();

  // Always save positions before syncing
  savePositionMap();

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
    const code = clientFallbackSync(nodes, edges);
    pushHistory();
    useDiagramStore.setState({ mermaidCode: code, syncStatus: "synced" });
  }
}

/** Also save positions when user hits Save */
export function savePositions() {
  savePositionMap();
}

/** Client-side deterministic fallback */
function clientFallbackSync(nodes: any[], edges: any[]): string {
  const lines: string[] = ["graph TD"];
  for (const n of nodes) {
    if (n.type === "comment") continue; // skip comment nodes from mermaid
    const id = sanitizeId(n.id);
    const label = (n.data as any)?.label || n.id;
    const shape = (n.data as any)?.shape || "rect";
    switch (shape) {
      case "diamond":
        lines.push(`    ${id}{${label}}`);
        break;
      case "round":
        lines.push(`    ${id}(${label})`);
        break;
      default:
        lines.push(`    ${id}[${label}]`);
    }
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
