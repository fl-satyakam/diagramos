import type { Node, Edge } from "@xyflow/react";

/**
 * Convert React Flow nodes/edges to Mermaid code via LLM API.
 * Falls back to a simple deterministic serializer if the API is unavailable.
 */
export async function flowToMermaid(
  nodes: Node[],
  edges: Edge[]
): Promise<string> {
  if (nodes.length === 0) return "graph TD\n    A[Start]";

  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes: serializeNodes(nodes), edges: serializeEdges(edges) }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.mermaidCode) return data.mermaidCode;
    }
  } catch {
    // API not available, use fallback
  }

  return deterministicFlowToMermaid(nodes, edges);
}

function serializeNodes(nodes: Node[]) {
  return nodes.map((n) => ({
    id: n.id,
    label: (n.data as { label?: string })?.label || n.id,
    shape: (n.data as { shape?: string })?.shape || "rect",
    x: n.position.x,
    y: n.position.y,
  }));
}

function serializeEdges(edges: Edge[]) {
  return edges.map((e) => ({
    source: e.source,
    target: e.target,
    label: typeof e.label === "string" ? e.label : "",
    animated: e.animated || false,
  }));
}

/**
 * Deterministic fallback: generate Mermaid from nodes/edges without LLM.
 */
function deterministicFlowToMermaid(nodes: Node[], edges: Edge[]): string {
  const lines: string[] = ["graph TD"];

  // Emit node definitions
  for (const node of nodes) {
    const label = (node.data as { label?: string })?.label || node.id;
    const shape = (node.data as { shape?: string })?.shape || "rect";
    const id = sanitizeId(node.id);

    switch (shape) {
      case "diamond":
        lines.push(`    ${id}{${label}}`);
        break;
      case "round":
        lines.push(`    ${id}(${label})`);
        break;
      case "subroutine":
        lines.push(`    ${id}[[${label}]]`);
        break;
      default:
        lines.push(`    ${id}[${label}]`);
    }
  }

  // Emit edges
  for (const edge of edges) {
    const src = sanitizeId(edge.source);
    const tgt = sanitizeId(edge.target);
    const label = typeof edge.label === "string" && edge.label ? edge.label : "";
    const arrow = edge.animated ? "-.->" : "-->";

    if (label) {
      lines.push(`    ${src} ${arrow}|${label}| ${tgt}`);
    } else {
      lines.push(`    ${src} ${arrow} ${tgt}`);
    }
  }

  return lines.join("\n");
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}
