"use client";

import { memo, useState, useCallback, useRef, useEffect, type FC } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
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

const CustomNode: FC<NodeProps> = ({ id, data, selected }) => {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState((data as { label?: string })?.label || "");
  const [resizing, setResizing] = useState(false);
  const [nodeSize, setNodeSize] = useState({ width: 0, height: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const updateNodeLabel = useDiagramStore((s) => s.updateNodeLabel);
  const shape = (data as { shape?: string })?.shape || "rect";
  const color = (data as { color?: string })?.color || "white";
  const borderStyle = (data as { borderStyle?: string })?.borderStyle || "solid";
  const fontSize = (data as { fontSize?: string })?.fontSize;

  const colorSet = PASTEL_COLORS[color] || PASTEL_COLORS.white;
  const isDiamond = shape === "diamond";
  const isPill = shape === "pill";
  const isRound = shape === "round";

  const handleDoubleClick = useCallback(() => {
    setEditing(true);
    setLabel((data as { label?: string })?.label || "");
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
        setLabel((data as { label?: string })?.label || "");
      }
    },
    [id, label, data, updateNodeLabel]
  );

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setResizing(true);
      const rect = nodeRef.current?.getBoundingClientRect();
      startPos.current = {
        x: e.clientX,
        y: e.clientY,
        w: rect?.width || 120,
        h: rect?.height || 40,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startPos.current.x;
        const dy = ev.clientY - startPos.current.y;
        setNodeSize({
          width: Math.max(80, startPos.current.w + dx),
          height: Math.max(32, startPos.current.h + dy),
        });
      };

      const handleMouseUp = () => {
        setResizing(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    []
  );

  const sizeStyle: React.CSSProperties =
    nodeSize.width > 0
      ? { width: nodeSize.width, height: nodeSize.height }
      : isDiamond
      ? { width: 100, height: 100 }
      : isRound
      ? { width: 80, height: 80 }
      : {};

  return (
    <div
      ref={nodeRef}
      className={`
        group relative text-center transition-all duration-150
        ${shapeClasses[shape] || shapeClasses.rect}
        ${isDiamond ? "flex items-center justify-center" : "px-4 py-2"}
        ${isPill ? "px-6 py-2" : ""}
        ${isRound ? "flex items-center justify-center" : ""}
        ${selected ? "ring-2 ring-blue-500 ring-offset-1" : ""}
      `}
      style={{
        background: colorSet.bg,
        border: `${borderStyle === "dashed" ? "2px dashed" : "1px solid"} ${
          selected ? "#3B82F6" : colorSet.border
        }`,
        boxShadow: selected
          ? "0 0 0 1px rgba(59,130,246,0.2)"
          : "0 1px 3px rgba(0,0,0,0.06)",
        minWidth: isDiamond || isRound ? undefined : 80,
        fontSize: fontSize || "0.875rem",
        color: "#1f2937",
        ...sizeStyle,
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Handles - subtle, appear on hover */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-gray-300 !border-gray-400 !-top-1 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-gray-300 !border-gray-400 !-bottom-1 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-gray-300 !border-gray-400 !-left-1 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-gray-300 !border-gray-400 !-right-1 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {editing ? (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className={`
            bg-transparent text-center w-full outline-none text-gray-900
            border-b border-blue-400
            ${isDiamond ? "-rotate-45 text-xs" : "text-sm"}
          `}
        />
      ) : (
        <span
          className={`
            ${isDiamond ? "-rotate-45 block text-xs" : "text-sm"}
            font-medium text-gray-700
          `}
        >
          {(data as { label?: string })?.label || id}
        </span>
      )}

      {/* Resize handle - bottom right corner */}
      {selected && !isDiamond && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-10"
          style={{
            background: "transparent",
          }}
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            className="absolute bottom-0.5 right-0.5"
          >
            <path d="M8 0L8 8L0 8Z" fill="#93C5FD" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default memo(CustomNode);
