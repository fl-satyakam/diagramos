"use client";

import { memo, useState, useCallback, useRef, type FC } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
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
  const [label, setLabel] = useState((data as any)?.label || "");
  const nodeRef = useRef<HTMLDivElement>(null);
  const updateNodeLabel = useDiagramStore((s) => s.updateNodeLabel);
  const setNodes = useDiagramStore((s) => s.setNodes);
  const nodes = useDiagramStore((s) => s.nodes);

  const shape = (data as any)?.shape || "rect";
  const color = (data as any)?.color || "white";
  const borderStyle = (data as any)?.borderStyle || "solid";
  const fontSize = (data as any)?.fontSize;
  const nodeWidth = (data as any)?.width;
  const nodeHeight = (data as any)?.height;

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

  // Resize via mouse drag — writes dimensions into node.data so it persists
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const rect = nodeRef.current?.getBoundingClientRect();
      if (!rect) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = rect.width;
      const startH = rect.height;

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const newW = Math.max(80, startW + dx);
        const newH = Math.max(32, startH + dy);

        // Write directly to node data for persistence
        const updated = nodes.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, width: newW, height: newH } }
            : n
        );
        setNodes(updated);
      };

      const handleMouseUp = () => {
        useDiagramStore.setState({ syncStatus: "diverged" });
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [id, nodes, setNodes]
  );

  // Build size style
  const sizeStyle: React.CSSProperties = {};
  if (nodeWidth && nodeHeight) {
    sizeStyle.width = nodeWidth;
    sizeStyle.height = nodeHeight;
  } else if (isDiamond) {
    sizeStyle.width = 100;
    sizeStyle.height = 100;
  } else if (isRound) {
    sizeStyle.width = 80;
    sizeStyle.height = 80;
  }

  return (
    <div
      ref={nodeRef}
      className={`
        group relative text-center transition-all duration-150
        ${shapeClasses[shape] || shapeClasses.rect}
        ${isDiamond ? "flex items-center justify-center" : "px-4 py-2"}
        ${shape === "pill" ? "px-6 py-2" : ""}
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
        overflow: "hidden",
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Handles */}
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
            font-medium text-gray-700 select-none
          `}
        >
          {(data as any)?.label || id}
        </span>
      )}

      {/* Resize handle — visible when selected */}
      {selected && !isDiamond && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute -bottom-1 -right-1 w-4 h-4 cursor-se-resize z-10 flex items-center justify-center"
          title="Drag to resize"
        >
          <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 border border-blue-600 shadow-sm" />
        </div>
      )}
    </div>
  );
};

export default memo(CustomNode);
