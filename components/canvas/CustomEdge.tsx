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

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEditing = useCallback(() => {
    setEditing(true);
    setEditLabel(String(label || ""));
  }, [label]);

  const commitLabel = useCallback(() => {
    setEditing(false);
    updateEdgeLabel(id, editLabel.trim());
  }, [id, editLabel, updateEdgeLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Enter") commitLabel();
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
      {/* 
        EdgeLabelRenderer renders in an HTML overlay above the SVG canvas.
        This is the ONLY reliable way to get click/input events on edges.
        The "+" button and label are rendered here with pointer-events enabled.
      */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
            zIndex: 10,
          }}
          className="nodrag nopan"
        >
          {editing ? (
            <input
              ref={inputRef}
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ pointerEvents: "all" }}
              className="px-3 py-1 text-xs rounded-full bg-white border-2 border-blue-500 text-gray-800 outline-none shadow-lg min-w-[100px] text-center font-medium"
              placeholder="Type label..."
            />
          ) : label ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                startEditing();
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              style={{ pointerEvents: "all", cursor: "pointer" }}
              className={`
                text-[11px] px-3 py-1 rounded-full font-medium select-none
                bg-white text-gray-600 border shadow-sm
                ${selected ? "border-blue-400 text-gray-800" : "border-gray-200"}
                hover:border-blue-300 hover:shadow-md transition-all
              `}
            >
              {label}
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                startEditing();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ pointerEvents: "all" }}
              className={`
                w-7 h-7 rounded-full font-bold text-sm
                flex items-center justify-center
                transition-all duration-150 cursor-pointer
                ${selected
                  ? "bg-blue-100 text-blue-600 border-2 border-blue-400 shadow-sm"
                  : "bg-white text-gray-400 border-2 border-gray-200 shadow-sm hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                }
              `}
              title="Click to add label"
              type="button"
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
