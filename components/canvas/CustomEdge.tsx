"use client";

import { memo, useState, useCallback, useRef, useEffect, type FC } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const updateEdgeLabel = useDiagramStore((s) => s.updateEdgeLabel);

  const strokeStyle = (data as any)?.strokeStyle || "solid";
  const strokeColor = (data as any)?.strokeColor;
  const strokeWidth = (data as any)?.strokeWidth;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  // Focus input when editing starts
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEditing = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setEditing(true);
      setEditLabel(String(label || ""));
    },
    [label]
  );

  const commitLabel = useCallback(() => {
    setEditing(false);
    updateEdgeLabel(id, editLabel.trim());
  }, [id, editLabel, updateEdgeLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        commitLabel();
      }
      if (e.key === "Escape") {
        setEditing(false);
        setEditLabel(String(label || ""));
      }
    },
    [commitLabel, label]
  );

  const computedStroke = strokeColor || (selected ? "#6B7280" : "#D1D5DB");
  const computedWidth = strokeWidth || (selected ? 2.5 : 1.5);

  const dashArray =
    strokeStyle === "dashed"
      ? "6 3"
      : strokeStyle === "dotted"
      ? "2 2"
      : undefined;

  return (
    <>
      {/* Invisible fat path for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onDoubleClick={() => startEditing()}
      />
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
        >
          {editing ? (
            <input
              ref={inputRef}
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={handleKeyDown}
              className="px-2.5 py-1 text-xs rounded-full bg-white border-2 border-blue-500 text-gray-800 outline-none shadow-md min-w-[80px] text-center font-medium"
              placeholder="Label..."
            />
          ) : label ? (
            <div
              onDoubleClick={startEditing}
              className={`
                text-[11px] px-2.5 py-0.5 rounded-full cursor-pointer font-medium
                bg-white text-gray-600 border shadow-sm
                ${selected ? "border-blue-400 text-gray-800" : "border-gray-200"}
                hover:border-blue-300 hover:shadow-md transition-all
              `}
            >
              {label}
            </div>
          ) : (
            /* Always-visible "add label" button at edge midpoint */
            <button
              onClick={() => startEditing()}
              className={`
                text-[10px] w-6 h-6 rounded-full cursor-pointer font-bold
                flex items-center justify-center
                transition-all duration-150
                ${selected
                  ? "bg-blue-50 text-blue-500 border-2 border-blue-300 shadow-sm"
                  : "bg-white text-gray-300 border border-gray-200 shadow-sm hover:text-gray-500 hover:border-gray-300 hover:shadow-md"
                }
              `}
              title="Click to add label"
            >
              +
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(CustomEdge);
