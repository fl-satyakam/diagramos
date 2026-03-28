"use client";

import { memo, useState, useCallback, type FC } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useDiagramStore } from "@/lib/store";

const shapeStyles: Record<string, string> = {
  rect: "rounded-md",
  diamond: "rotate-45",
  round: "rounded-full",
  subroutine: "rounded-md border-double border-4",
};

const CustomNode: FC<NodeProps> = ({ id, data, selected }) => {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState((data as { label?: string })?.label || "");
  const updateNodeLabel = useDiagramStore((s) => s.updateNodeLabel);
  const shape = (data as { shape?: string })?.shape || "rect";

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

  const isDiamond = shape === "diamond";

  return (
    <div
      className={`
        relative px-4 py-2 min-w-[80px] text-center
        bg-zinc-900 border text-zinc-100 text-sm
        transition-all duration-150
        ${selected ? "border-zinc-400 shadow-[0_0_0_1px_rgba(161,161,170,0.3)]" : "border-zinc-700"}
        ${shapeStyles[shape] || shapeStyles.rect}
        ${isDiamond ? "w-[100px] h-[100px] flex items-center justify-center" : ""}
        hover:border-zinc-500
      `}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-zinc-500 !border-zinc-700 !-top-1"
      />

      {editing ? (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className={`
            bg-transparent text-center w-full outline-none text-zinc-100
            border-b border-zinc-500
            ${isDiamond ? "-rotate-45" : ""}
          `}
        />
      ) : (
        <span className={isDiamond ? "-rotate-45 block text-xs" : ""}>
          {(data as { label?: string })?.label || id}
        </span>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-zinc-500 !border-zinc-700 !-bottom-1"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-zinc-500 !border-zinc-700 !-left-1"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-zinc-500 !border-zinc-700 !-right-1"
      />
    </div>
  );
};

export default memo(CustomNode);
