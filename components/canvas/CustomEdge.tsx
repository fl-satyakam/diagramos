"use client";

import { memo, type FC } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
} from "@xyflow/react";

const CustomEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  selected,
  animated,
  style,
}) => {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? "#a1a1aa" : "#52525b",
          strokeWidth: selected ? 2 : 1.5,
          ...style,
        }}
        markerEnd="url(#arrow)"
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className={`
              absolute text-[10px] px-1.5 py-0.5 rounded
              bg-zinc-800 text-zinc-400 border border-zinc-700
              pointer-events-all nodrag nopan
              ${selected ? "text-zinc-200 border-zinc-500" : ""}
            `}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(CustomEdge);
