"use client";

import { memo, useState, useCallback, type FC } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { useDiagramStore } from "@/lib/store";

const shapeClasses: Record<string, string> = {
  rect: "rounded-lg",
  diamond: "rotate-45 rounded-sm",
  round: "rounded-full",
  pill: "rounded-full",
};

const PASTEL_COLORS: Record<string, { bg: string; border: string }> = {
  white: { bg: "#ffffff", border: "#e5e7eb" },
  blue: { bg: "#DBEAFE", border: "#93C5FD" },
  green: { bg: "#D1FAE5", border: "#6EE7B7" },
  red: { bg: "#FEE2E2", border: "#FCA5A5" },
  orange: { bg: "#FED7AA", border: "#FDBA74" },
  purple: { bg: "#E9D5FF", border: "#C4B5FD" },
  yellow: { bg: "#FEF9C3", border: "#FDE68A" },
  gray: { bg: "#F3F4F6", border: "#D1D5DB" },
};

const HANDLE_STYLE: React.CSSProperties = {
  width: 10,
  height: 10,
  background: "#94a3b8",
  border: "2px solid #cbd5e1",
  borderRadius: "50%",
};

const CustomNode: FC<NodeProps> = ({ id, data, selected }) => {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState((data as any)?.label || "");
  const updateNodeLabel = useDiagramStore((s) => s.updateNodeLabel);

  const shape = (data as any)?.shape || "rect";
  const color = (data as any)?.color || "white";
  const borderStyle = (data as any)?.borderStyle || "solid";
  const fontSize = (data as any)?.fontSize;

  const colorSet = PASTEL_COLORS[color] || PASTEL_COLORS.white;
  const isDiamond = shape === "diamond";
  const isRound = shape === "round";

  const handleDoubleClick = useCallback(() => {
    setEditing(true);
    setLabel((data as any)?.label || "");
  }, [data]);

  const handleBlur = useCallback(() => {
    setEditing(false);
    updateNodeLabel(id, label);
  }, [id, label, updateNodeLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        setEditing(false);
        updateNodeLabel(id, label);
      }
      if (e.key === "Escape") {
        setEditing(false);
        setLabel((data as any)?.label || "");
      }
    },
    [id, label, data, updateNodeLabel]
  );

  return (
    <>
      {/* React Flow's built-in resizer — handles all drag conflicts properly */}
      <NodeResizer
        isVisible={!!selected && !isDiamond}
        minWidth={80}
        minHeight={32}
        lineStyle={{
          border: "none",
          background: "transparent",
        }}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: "#3B82F6",
          border: "2px solid white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />

      <div
        className={`
          relative text-center w-full h-full flex items-center justify-center
          ${shapeClasses[shape] || shapeClasses.rect}
          ${isDiamond ? "" : "px-4 py-2"}
          ${shape === "pill" ? "px-6 py-2" : ""}
        `}
        style={{
          background: colorSet.bg,
          border: `${borderStyle === "dashed" ? "2px dashed" : "1px solid"} ${
            selected ? "#3B82F6" : colorSet.border
          }`,
          boxShadow: selected
            ? "0 0 0 1px rgba(59,130,246,0.2)"
            : "0 1px 3px rgba(0,0,0,0.06)",
          minWidth: isDiamond || isRound ? 80 : 80,
          minHeight: isDiamond || isRound ? 80 : 32,
          fontSize: fontSize || "0.875rem",
          color: "#1f2937",
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Connection Handles */}
        <Handle type="target" position={Position.Top} style={{ ...HANDLE_STYLE, top: -5 }} />
        <Handle type="source" position={Position.Bottom} style={{ ...HANDLE_STYLE, bottom: -5 }} />
        <Handle type="target" position={Position.Left} id="left" style={{ ...HANDLE_STYLE, left: -5 }} />
        <Handle type="source" position={Position.Right} id="right" style={{ ...HANDLE_STYLE, right: -5 }} />

        {editing ? (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className={`
              bg-transparent text-center outline-none text-gray-900
              border-b border-blue-400
              ${isDiamond ? "-rotate-45 text-xs w-[80px]" : "text-sm w-full min-w-[100px]"}
            `}
          />
        ) : (
          <span
            className={`
              ${isDiamond ? "-rotate-45 block text-xs max-w-[100px]" : "text-sm max-w-[200px]"}
              font-medium text-gray-700 select-none break-words whitespace-pre-wrap
            `}
          >
            {(data as any)?.label || id}
          </span>
        )}
      </div>
    </>
  );
};

export default memo(CustomNode);
