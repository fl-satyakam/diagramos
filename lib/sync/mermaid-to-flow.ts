import type { Node, Edge } from "@xyflow/react";
import mermaid from "mermaid";
import { autoLayout } from "../auto-layout";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  flowchart: { curve: "basis" },
});

interface ParsedDiagram {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Parse Mermaid code into React Flow nodes and edges.
 * Uses a combination of mermaid.js render + SVG parsing for position,
 * and regex for structure extraction.
 */
export async function parseMermaidToFlow(
  code: string
): Promise<ParsedDiagram> {
  const trimmed = code.trim();
  if (!trimmed) return { nodes: [], edges: [] };

  try {
    // Parse using regex for reliable node/edge extraction
    return parseWithRegex(trimmed);
  } catch (err) {
    console.warn("Mermaid parse failed:", err);
    return { nodes: [], edges: [] };
  }
}

interface RawNode {
  id: string;
  label: string;
  shape: string;
  color?: string;
}

interface RawEdge {
  source: string;
  target: string;
  label: string;
  style: string;
}

function extractColor(rawLabel: string) {
  let label = rawLabel;
  let color = "white";
  const match = rawLabel.match(/:::(white|blue|green|red|orange|purple|yellow|gray)/i);
  if (match) {
    color = match[1].toLowerCase();
    label = rawLabel.replace(match[0], "").trim();
  }
  return { label, color };
}

function parseWithRegex(code: string): ParsedDiagram {
  const lines = code.split("\n").map((l) => l.trim()).filter(Boolean);
  const rawNodes = new Map<string, RawNode>();
  const rawEdges: RawEdge[] = [];

  // Skip header line
  const headerPatterns = [
    /^(graph|flowchart)\s+(TD|TB|BT|LR|RL)/i,
    /^sequenceDiagram/i,
    /^classDiagram/i,
    /^stateDiagram/i,
    /^erDiagram/i,
  ];

  for (const line of lines) {
    if (headerPatterns.some((p) => p.test(line))) continue;
    if (/^(subgraph|end|%%)/i.test(line)) continue;
    if (/^(style|class|linkStyle)\s/i.test(line)) continue;

    // Edge patterns: A --> B, A -->|label| B, A -- text --> B
    const edgeMatch = line.match(
      /^(\w[\w-]*)\s*(?:\[([^\]]*)\]|\{([^}]*)\}|\(([^)]*)\)|>([^<\]]*)\]|)?\s*(-->|--[->]|-.->|-\.->|==>|---|-\.-|~~>)\s*(?:\|([^|]*)\|\s*)?(\w[\w-]*)\s*(?:\[([^\]]*)\]|\{([^}]*)\}|\(([^)]*)\)|>([^<\]]*)\]|)?/
    );

    if (edgeMatch) {
      const sourceId = edgeMatch[1];
      const sourceLabel = edgeMatch[2] || edgeMatch[3] || edgeMatch[4] || edgeMatch[5] || "";
      const arrowType = edgeMatch[6];
      const edgeLabel = edgeMatch[7] || "";
      const targetId = edgeMatch[8];
      const targetLabel = edgeMatch[9] || edgeMatch[10] || edgeMatch[11] || edgeMatch[12] || "";

      if (sourceLabel && !rawNodes.has(sourceId)) {
        const { label, color } = extractColor(sourceLabel);
        rawNodes.set(sourceId, {
          id: sourceId,
          label,
          shape: edgeMatch[2] ? "rect" : edgeMatch[3] ? "diamond" : edgeMatch[4] ? "round" : "rect",
          color,
        });
      } else if (!rawNodes.has(sourceId)) {
        rawNodes.set(sourceId, { id: sourceId, label: sourceId, shape: "rect", color: "white" });
      }

      if (targetLabel && !rawNodes.has(targetId)) {
        const { label, color } = extractColor(targetLabel);
        rawNodes.set(targetId, {
          id: targetId,
          label,
          shape: edgeMatch[9] ? "rect" : edgeMatch[10] ? "diamond" : edgeMatch[11] ? "round" : "rect",
          color,
        });
      } else if (!rawNodes.has(targetId)) {
        rawNodes.set(targetId, { id: targetId, label: targetId, shape: "rect", color: "white" });
      }

      rawEdges.push({
        source: sourceId,
        target: targetId,
        label: edgeLabel,
        style: arrowType.includes(".") ? "dashed" : arrowType.includes("=") ? "thick" : "default",
      });
      continue;
    }

    // Standalone node: A[Label] or B{Label} or C(Label)
    const nodeMatch = line.match(
      /^(\w[\w-]*)\s*(?:\[([^\]]*)\]|\{([^}]*)\}|\(([^)]*)\)|\[\[([^\]]*)\]\]|>([^\]]*)\])$/
    );
    if (nodeMatch) {
      const id = nodeMatch[1];
      const rawLabel = nodeMatch[2] || nodeMatch[3] || nodeMatch[4] || nodeMatch[5] || nodeMatch[6] || id;
      const { label, color } = extractColor(rawLabel);
      const shape = nodeMatch[2]
        ? "rect"
        : nodeMatch[3]
        ? "diamond"
        : nodeMatch[4]
        ? "round"
        : nodeMatch[5]
        ? "subroutine"
        : "rect";
      if (!rawNodes.has(id)) {
        rawNodes.set(id, { id, label, shape, color });
      }
    }
  }

  // Auto-layout: using dagre via autoLayout
  const nodeArray = Array.from(rawNodes.values());
  const initialNodes: Node[] = nodeArray.map((rn) => ({
    id: rn.id,
    type: "custom",
    position: { x: 0, y: 0 },
    data: {
      label: rn.label,
      shape: rn.shape,
      color: rn.color || "white",
    },
  }));

  const edges: Edge[] = rawEdges.map((e, i) => ({
    id: `e-${i}-${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    label: e.label || undefined,
    type: "custom",
    animated: e.style === "dashed",
    style: e.style === "thick" ? { strokeWidth: 3 } : undefined,
  }));

  const nodes = autoLayout(initialNodes, edges, { direction: "TB" });

  return { nodes, edges };
}
