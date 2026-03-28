import { parseMermaidToFlow } from "./mermaid-to-flow";
import { flowToMermaid } from "./flow-to-mermaid";
import { useDiagramStore } from "../store";

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 1500;

/**
 * Trigger sync from code → canvas.
 * This is the deterministic direction (no LLM needed).
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
 * Trigger sync from canvas → code.
 * Uses LLM or deterministic fallback.
 */
export async function syncCanvasToCode() {
  const { nodes, edges, setSyncStatus, setMermaidCode, pushHistory } =
    useDiagramStore.getState();

  setSyncStatus("syncing");
  try {
    const code = await flowToMermaid(nodes, edges);
    pushHistory();
    // Set code without triggering activePane change to "code"
    useDiagramStore.setState({ mermaidCode: code, syncStatus: "synced" });
  } catch (err) {
    console.error("Canvas → Code sync failed:", err);
    setSyncStatus("error");
  }
}

/**
 * Debounced sync from canvas changes.
 */
export function debouncedCanvasSync() {
  if (syncTimeout) clearTimeout(syncTimeout);
  useDiagramStore.setState({ syncStatus: "diverged" });
  syncTimeout = setTimeout(() => {
    syncCanvasToCode();
  }, DEBOUNCE_MS);
}

/**
 * Debounced sync from code changes.
 */
let codeTimeout: ReturnType<typeof setTimeout> | null = null;
export function debouncedCodeSync() {
  if (codeTimeout) clearTimeout(codeTimeout);
  useDiagramStore.setState({ syncStatus: "diverged" });
  codeTimeout = setTimeout(() => {
    syncCodeToCanvas();
  }, DEBOUNCE_MS);
}
