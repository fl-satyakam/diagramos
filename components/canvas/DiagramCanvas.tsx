"use client";

import { useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";
import { useDiagramStore } from "@/lib/store";
import { debouncedCanvasSync } from "@/lib/sync/sync-engine";

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

export default function DiagramCanvas() {
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const onNodesChange = useDiagramStore((s) => s.onNodesChange);
  const onEdgesChange = useDiagramStore((s) => s.onEdgesChange);
  const onConnect = useDiagramStore((s) => s.onConnect);
  const deleteSelected = useDiagramStore((s) => s.deleteSelected);

  const prevNodesRef = useRef(nodes);
  const prevEdgesRef = useRef(edges);

  // Detect meaningful canvas changes and trigger sync
  useEffect(() => {
    const nodesChanged =
      JSON.stringify(nodes.map((n) => ({ id: n.id, pos: n.position, data: n.data }))) !==
      JSON.stringify(prevNodesRef.current.map((n) => ({ id: n.id, pos: n.position, data: n.data })));
    const edgesChanged =
      JSON.stringify(edges.map((e) => ({ s: e.source, t: e.target, l: e.label }))) !==
      JSON.stringify(prevEdgesRef.current.map((e) => ({ s: e.source, t: e.target, l: e.label })));

    if (nodesChanged || edgesChanged) {
      const activePane = useDiagramStore.getState().activePane;
      if (activePane === "canvas") {
        debouncedCanvasSync();
      }
    }

    prevNodesRef.current = nodes;
    prevEdgesRef.current = edges;
  }, [nodes, edges]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      }
    },
    [deleteSelected]
  );

  return (
    <div className="h-full w-full" onKeyDown={handleKeyDown} tabIndex={0}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          defaultEdgeOptions={{ type: "custom" }}
          proOptions={{ hideAttribution: true }}
          className="bg-zinc-950"
          minZoom={0.1}
          maxZoom={4}
          snapToGrid
          snapGrid={[16, 16]}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#27272a"
          />
          <MiniMap
            className="!bg-zinc-900 !border-zinc-800"
            nodeColor="#3f3f46"
            maskColor="rgba(0,0,0,0.7)"
            pannable
            zoomable
          />
          <Controls
            className="!bg-zinc-900 !border-zinc-800 !shadow-none [&>button]:!bg-zinc-900 [&>button]:!border-zinc-700 [&>button]:!text-zinc-400 [&>button:hover]:!bg-zinc-800"
          />
          <svg>
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#52525b" />
              </marker>
            </defs>
          </svg>
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
