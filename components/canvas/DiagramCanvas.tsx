"use client";

import { useCallback } from "react";
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
import CommentNode from "./CommentNode";
import { useDiagramStore } from "@/lib/store";

const nodeTypes: NodeTypes = {
  custom: CustomNode,
  comment: CommentNode,
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
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
          className="bg-gray-50"
          minZoom={0.1}
          maxZoom={4}
          snapToGrid
          snapGrid={[16, 16]}
          edgesFocusable
          edgesReconnectable
          elementsSelectable
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#e5e7eb"
          />
          <MiniMap
            className="!bg-white !border-gray-200 !rounded-lg"
            nodeColor="#D1D5DB"
            maskColor="rgba(255,255,255,0.7)"
            pannable
            zoomable
          />
          <Controls className="!bg-white !border-gray-200 !shadow-sm !rounded-lg" />
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
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#9CA3AF" />
              </marker>
            </defs>
          </svg>
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
