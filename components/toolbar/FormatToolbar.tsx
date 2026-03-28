"use client";

import { useDiagramStore } from "@/lib/store";
import {
  Circle,
  Square,
  Diamond,
  Minus,
  Bold,
  Italic,
  Palette,
  ArrowRight,
  ArrowLeftRight,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const NODE_COLORS = [
  { name: "white", value: "white", bg: "#ffffff", border: "#e5e7eb" },
  { name: "blue", value: "blue", bg: "#DBEAFE", border: "#93C5FD" },
  { name: "green", value: "green", bg: "#D1FAE5", border: "#6EE7B7" },
  { name: "red", value: "red", bg: "#FEE2E2", border: "#FCA5A5" },
  { name: "orange", value: "orange", bg: "#FED7AA", border: "#FDBA74" },
  { name: "purple", value: "purple", bg: "#E9D5FF", border: "#C4B5FD" },
  { name: "yellow", value: "yellow", bg: "#FEF9C3", border: "#FDE68A" },
  { name: "gray", value: "gray", bg: "#F3F4F6", border: "#D1D5DB" },
];

const EDGE_COLORS = [
  { name: "gray", value: "#D1D5DB" },
  { name: "dark", value: "#6B7280" },
  { name: "blue", value: "#93C5FD" },
  { name: "green", value: "#6EE7B7" },
  { name: "red", value: "#FCA5A5" },
  { name: "orange", value: "#FDBA74" },
  { name: "purple", value: "#C4B5FD" },
  { name: "yellow", value: "#FDE68A" },
];

export default function FormatToolbar() {
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const updateNodeStyle = useDiagramStore((s) => s.updateNodeStyle);
  const updateEdgeStyle = useDiagramStore((s) => s.updateEdgeStyle);

  const [showNodeColors, setShowNodeColors] = useState(false);
  const [showEdgeColors, setShowEdgeColors] = useState(false);

  const selectedNodes = nodes.filter((n) => n.selected);
  const selectedEdges = edges.filter((e) => e.selected);

  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;

  if (!hasSelection) return null;

  const handleNodeColor = (color: string) => {
    selectedNodes.forEach((n) => updateNodeStyle(n.id, { color }));
    setShowNodeColors(false);
  };

  const handleNodeShape = (shape: string) => {
    selectedNodes.forEach((n) => {
      useDiagramStore.setState((state) => ({
        nodes: state.nodes.map((node) =>
          node.id === n.id
            ? { ...node, data: { ...node.data, shape } }
            : node
        ),
      }));
    });
  };

  const handleNodeBorder = (borderStyle: string) => {
    selectedNodes.forEach((n) => updateNodeStyle(n.id, { borderStyle }));
  };

  const handleEdgeStyle = (strokeStyle: string) => {
    selectedEdges.forEach((e) => updateEdgeStyle(e.id, { strokeStyle }));
  };

  const handleEdgeColor = (strokeColor: string) => {
    selectedEdges.forEach((e) => updateEdgeStyle(e.id, { strokeColor }));
    setShowEdgeColors(false);
  };

  const handleEdgeWidth = (strokeWidth: number) => {
    selectedEdges.forEach((e) => updateEdgeStyle(e.id, { strokeWidth }));
  };

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1.5 
      bg-white border border-gray-200 rounded-xl shadow-lg">
      
      {/* Node formatting */}
      {selectedNodes.length > 0 && (
        <>
          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNodeColors(!showNodeColors);
                setShowEdgeColors(false);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
                text-gray-600 hover:bg-gray-100 transition-colors"
              title="Node color"
            >
              <Palette className="h-3.5 w-3.5" />
              <ChevronDown className="h-2.5 w-2.5" />
            </button>
            {showNodeColors && (
              <div className="absolute top-full left-0 mt-1 p-1.5 bg-white border border-gray-200 rounded-lg shadow-lg flex gap-1 z-50">
                {NODE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handleNodeColor(c.value)}
                    className="w-6 h-6 rounded-md border border-gray-200 hover:scale-110 transition-transform"
                    style={{ background: c.bg }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-200" />

          {/* Shape buttons */}
          <button
            onClick={() => handleNodeShape("rect")}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Rectangle"
          >
            <Square className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleNodeShape("round")}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Circle"
          >
            <Circle className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleNodeShape("diamond")}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Diamond"
          >
            <Diamond className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleNodeShape("pill")}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Pill"
          >
            <Minus className="h-3.5 w-3.5 border border-gray-400 rounded-full" />
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-200" />

          {/* Border style */}
          <button
            onClick={() => handleNodeBorder("solid")}
            className="px-2 py-1 rounded-md text-[10px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Solid border"
          >
            Solid
          </button>
          <button
            onClick={() => handleNodeBorder("dashed")}
            className="px-2 py-1 rounded-md text-[10px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Dashed border"
          >
            Dashed
          </button>
        </>
      )}

      {/* Edge formatting */}
      {selectedEdges.length > 0 && (
        <>
          {selectedNodes.length > 0 && (
            <div className="h-5 w-px bg-gray-300 mx-1" />
          )}

          {/* Edge color */}
          <div className="relative">
            <button
              onClick={() => {
                setShowEdgeColors(!showEdgeColors);
                setShowNodeColors(false);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
                text-gray-600 hover:bg-gray-100 transition-colors"
              title="Edge color"
            >
              <Palette className="h-3.5 w-3.5" />
              <ChevronDown className="h-2.5 w-2.5" />
            </button>
            {showEdgeColors && (
              <div className="absolute top-full left-0 mt-1 p-1.5 bg-white border border-gray-200 rounded-lg shadow-lg flex gap-1 z-50">
                {EDGE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handleEdgeColor(c.value)}
                    className="w-6 h-6 rounded-md border border-gray-200 hover:scale-110 transition-transform"
                    style={{ background: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-200" />

          {/* Edge style */}
          <button
            onClick={() => handleEdgeStyle("solid")}
            className="px-2 py-1 rounded-md text-[10px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Solid line"
          >
            ━━
          </button>
          <button
            onClick={() => handleEdgeStyle("dashed")}
            className="px-2 py-1 rounded-md text-[10px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Dashed line"
          >
            ┅┅
          </button>
          <button
            onClick={() => handleEdgeStyle("dotted")}
            className="px-2 py-1 rounded-md text-[10px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Dotted line"
          >
            ┈┈
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-200" />

          {/* Edge width */}
          <button
            onClick={() => handleEdgeWidth(1)}
            className="px-1.5 py-1 rounded-md text-[10px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Thin"
          >
            <div className="w-4 h-px bg-gray-500" />
          </button>
          <button
            onClick={() => handleEdgeWidth(2)}
            className="px-1.5 py-1 rounded-md text-[10px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Medium"
          >
            <div className="w-4 h-0.5 bg-gray-500" />
          </button>
          <button
            onClick={() => handleEdgeWidth(3.5)}
            className="px-1.5 py-1 rounded-md text-[10px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Thick"
          >
            <div className="w-4 h-1 bg-gray-500 rounded-full" />
          </button>
        </>
      )}
    </div>
  );
}
