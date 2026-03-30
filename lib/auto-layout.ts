import Dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";

export interface LayoutOptions {
  direction?: "TB" | "LR" | "BT" | "RL";
  nodeSpacing?: number;
  rankSpacing?: number;
}

const DEFAULT_NODE_WIDTH = 172;
const DEFAULT_NODE_HEIGHT = 60;
const COMMENT_NODE_WIDTH = 200;
const COMMENT_NODE_HEIGHT = 80;

/**
 * Auto-layout nodes using dagre directed graph algorithm.
 * Distributes nodes cleanly with spacing, removes overlaps.
 * Comment nodes that aren't connected are placed in a sidebar column.
 */
export function autoLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] {
  const {
    direction = "TB",
    nodeSpacing = 50,
    rankSpacing = 80,
  } = options;

  if (nodes.length === 0) return nodes;

  // Separate connected vs orphan comment nodes
  const connectedNodeIds = new Set<string>();
  for (const edge of edges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }

  const graphNodes: Node[] = [];
  const floatingComments: Node[] = [];

  for (const node of nodes) {
    if (node.type === "comment" && !connectedNodeIds.has(node.id)) {
      floatingComments.push(node);
    } else {
      graphNodes.push(node);
    }
  }

  // Build dagre graph for connected nodes
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 40,
    marginy: 40,
  });

  for (const node of graphNodes) {
    const isComment = node.type === "comment";
    const w = (node.measured?.width) || (isComment ? COMMENT_NODE_WIDTH : DEFAULT_NODE_WIDTH);
    const h = (node.measured?.height) || (isComment ? COMMENT_NODE_HEIGHT : DEFAULT_NODE_HEIGHT);
    g.setNode(node.id, { width: w, height: h });
  }

  for (const edge of edges) {
    // Only add edges where both nodes are in the graph
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  Dagre.layout(g);

  // Apply positions from dagre
  const layoutedNodes = new Map<string, Node>();
  let maxX = 0;

  for (const node of graphNodes) {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      const w = dagreNode.width || DEFAULT_NODE_WIDTH;
      const h = dagreNode.height || DEFAULT_NODE_HEIGHT;
      const x = dagreNode.x - w / 2;
      const y = dagreNode.y - h / 2;
      if (x + w > maxX) maxX = x + w;
      layoutedNodes.set(node.id, {
        ...node,
        position: { x, y },
      });
    } else {
      layoutedNodes.set(node.id, node);
    }
  }

  // Place floating comments in a column to the right
  const commentStartX = maxX + 100;
  let commentY = 40;
  for (const comment of floatingComments) {
    layoutedNodes.set(comment.id, {
      ...comment,
      position: { x: commentStartX, y: commentY },
    });
    commentY += COMMENT_NODE_HEIGHT + 30;
  }

  // Return in original order
  return nodes.map((n) => layoutedNodes.get(n.id) || n);
}
