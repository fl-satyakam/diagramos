"use client";

import { memo, useState, useCallback, type FC } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { useDiagramStore } from "@/lib/store";

const CustomEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  selected,
  animated,
  style,
  data,
}) => {
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(String(label || ""));
  const updateEdgeLabel = useDiagramStore((s) => s.updateEdgeLabel);

  const strokeStyle = (data as { strokeStyle?: string } | undefined)?.strokeStyle || "solid";
  const strokeColor = (data as { strokeColor?: string } | undefined)?.strokeColor;
  const strokeWidth = (data as { strokeWidth?: number } | undefined)?.strokeWidth;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditing(true);
      setEditLabel(String(label || ""));
    },
    [label]
  );

  const handleBlur = useCallback(() => {
    setEditing(false);
    updateEdgeLabel(id, editLabel);
  }, [id, editLabel, updateEdgeLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        setEditing(false);
        updateEdgeLabel(id, editLabel);
      }
      if (e.key === "Escape") {
        setEditing(false);
        setEditLabel(String(label || ""));
      }
    },
    [id, editLabel, label, updateEdgeLabel]
  );

  const computedStroke = strokeColor || (selected ? "#6B7280" : "#D1D5DB");
  const computedWidth = strokeWidth || (selected ? 2 : 1.5);

  const dashArray =
    strokeStyle === "dashed"
      ? "6 3"
      : strokeStyle === "dotted"
      ? "2 2"
      : undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: computedStroke,
          strokeWidth: computedWidth,
          strokeDasharray: dashArray,
          ...style,
        }}
        markerEnd="url(#arrow)"
      />
      <EdgeLabelRenderer>
        <div
          className="absolute pointer-events-all nodrag nopan"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          onDoubleClick={handleDoubleClick}
        >
          {editing ? (
            <input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="px-2 py-0.5 text-[11px] rounded-full bg-white border border-blue-400 text-gray-800 outline-none shadow-sm min-w-[60px] text-center"
            />
          ) : label ? (
            <div
              className={`
                text-[10px] px-2 py-0.5 rounded-full cursor-pointer
                bg-white text-gray-600 border shadow-sm
                ${selected ? "border-blue-400 text-gray-800" : "border-gray-200"}
                hover:border-blue-300 transition-colors
              `}
            >
              {label}
            </div>
          ) : (
            <div
              className="text-[10px] px-2 py-0.5 rounded-full cursor-pointer
                bg-transparent text-transparent hover:bg-gray-100 hover:text-gray-400 hover:border-gray-200 hover:border
                transition-all"
            >
              +
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(CustomEdge);
