import type { Node, Edge } from "@xyflow/react";
import mermaid from "mermaid";

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
}

interface RawEdge {
  source: string;
  target: string;
  label: string;
  style: string;
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
        rawNodes.set(sourceId, {
          id: sourceId,
          label: sourceLabel,
          shape: edgeMatch[2] ? "rect" : edgeMatch[3] ? "diamond" : edgeMatch[4] ? "round" : "rect",
        });
      } else if (!rawNodes.has(sourceId)) {
        rawNodes.set(sourceId, { id: sourceId, label: sourceId, shape: "rect" });
      }

      if (targetLabel && !rawNodes.has(targetId)) {
        rawNodes.set(targetId, {
          id: targetId,
          label: targetLabel,
          shape: edgeMatch[9] ? "rect" : edgeMatch[10] ? "diamond" : edgeMatch[11] ? "round" : "rect",
        });
      } else if (!rawNodes.has(targetId)) {
        rawNodes.set(targetId, { id: targetId, label: targetId, shape: "rect" });
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
      const label = nodeMatch[2] || nodeMatch[3] || nodeMatch[4] || nodeMatch[5] || nodeMatch[6] || id;
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
        rawNodes.set(id, { id, label, shape });
      }
    }
  }

  // Auto-layout: simple grid/tree layout
  const nodeArray = Array.from(rawNodes.values());
  const nodes: Node[] = layoutNodes(nodeArray, rawEdges);

  const edges: Edge[] = rawEdges.map((e, i) => ({
    id: `e-${i}-${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    label: e.label || undefined,
    type: "custom",
    animated: e.style === "dashed",
    style: e.style === "thick" ? { strokeWidth: 3 } : undefined,
  }));

  return { nodes, edges };
}

function layoutNodes(rawNodes: RawNode[], rawEdges: RawEdge[]): Node[] {
  if (rawNodes.length === 0) return [];

  // Build adjacency for topological ordering
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  const nodeIds = new Set(rawNodes.map((n) => n.id));

  for (const e of rawEdges) {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
    outgoing.set(e.source, [...(outgoing.get(e.source) || []), e.target]);
    incoming.set(e.target, [...(incoming.get(e.target) || []), e.source]);
  }

  // Find roots (no incoming edges)
  const roots = rawNodes.filter(
    (n) => !incoming.has(n.id) || incoming.get(n.id)!.length === 0
  );
  if (roots.length === 0 && rawNodes.length > 0) {
    roots.push(rawNodes[0]);
  }

  // BFS level assignment
  const levels = new Map<string, number>();
  const queue = roots.map((r) => r.id);
  for (const id of queue) levels.set(id, 0);

  let qi = 0;
  while (qi < queue.length) {
    const current = queue[qi++];
    const level = levels.get(current)!;
    const children = outgoing.get(current) || [];
    for (const child of children) {
      if (!levels.has(child) || levels.get(child)! < level + 1) {
        levels.set(child, level + 1);
        if (!queue.includes(child)) queue.push(child);
      }
    }
  }

  // Assign levels to nodes without edges
  for (const n of rawNodes) {
    if (!levels.has(n.id)) levels.set(n.id, 0);
  }

  // Group by level
  const byLevel = new Map<number, RawNode[]>();
  for (const n of rawNodes) {
    const lvl = levels.get(n.id) || 0;
    byLevel.set(lvl, [...(byLevel.get(lvl) || []), n]);
  }

  const SPACING_X = 220;
  const SPACING_Y = 120;

  const nodes: Node[] = [];
  const sortedLevels = Array.from(byLevel.keys()).sort((a, b) => a - b);

  for (const level of sortedLevels) {
    const levelNodes = byLevel.get(level)!;
    const totalWidth = (levelNodes.length - 1) * SPACING_X;
    const startX = -totalWidth / 2;

    for (let i = 0; i < levelNodes.length; i++) {
      const rn = levelNodes[i];
      nodes.push({
        id: rn.id,
        type: "custom",
        position: {
          x: startX + i * SPACING_X + 300,
          y: level * SPACING_Y + 60,
        },
        data: {
          label: rn.label,
          shape: rn.shape,
        },
      });
    }
  }

  return nodes;
}
