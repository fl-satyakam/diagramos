"use client";

import { memo, useState, useCallback, useRef, useEffect, type FC } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useDiagramStore } from "@/lib/store";
import { MessageSquare } from "lucide-react";

const CommentNode: FC<NodeProps> = ({ id, data, selected }) => {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState((data as { label?: string })?.label || "Add a comment...");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateNodeLabel = useDiagramStore((s) => s.updateNodeLabel);

  const isActive = selected || expanded || editing;

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editing]);

  const handleClick = useCallback(() => {
    if (!expanded) {
      setExpanded(true);
    }
  }, [expanded]);

  const handleDoubleClick = useCallback(() => {
    setExpanded(true);
    setEditing(true);
    setText((data as { label?: string })?.label || "");
  }, [data]);

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (text.trim()) {
      updateNodeLabel(id, text);
    }
  }, [id, text, updateNodeLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditing(false);
        setText((data as { label?: string })?.label || "");
      }
    },
    [data]
  );

  // Collapse when deselected
  useEffect(() => {
    if (!selected && !editing) {
      setExpanded(false);
    }
  }, [selected, editing]);

  const displayText = (data as { label?: string })?.label || "Add a comment...";
  const previewText =
    displayText.length > 24 ? displayText.slice(0, 24) + "…" : displayText;

  if (!isActive) {
    // Collapsed state: small icon with preview
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer
          bg-yellow-50 border border-yellow-200 shadow-sm
          hover:shadow-md hover:border-yellow-300 transition-all"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <MessageSquare className="h-3.5 w-3.5 text-yellow-600 flex-shrink-0" />
        <span className="text-[11px] text-yellow-800 truncate max-w-[120px]">
          {previewText}
        </span>
      </div>
    );
  }

  // Expanded state
  return (
    <div
      className={`
        rounded-lg shadow-md transition-all min-w-[180px] max-w-[280px]
        ${selected ? "ring-2 ring-blue-400 ring-offset-1" : ""}
      `}
      style={{
        background: "#FFF9C4",
        border: "1px solid #FDE68A",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
        <MessageSquare className="h-3 w-3 text-yellow-700" />
        <span className="text-[10px] font-semibold text-yellow-800 uppercase tracking-wider">
          Comment
        </span>
      </div>

      {/* Content */}
      <div className="px-3 pb-2.5">
        {editing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            rows={3}
            className="w-full bg-transparent text-xs text-yellow-900 outline-none resize-none
              placeholder:text-yellow-600"
            placeholder="Type a comment..."
          />
        ) : (
          <p className="text-xs text-yellow-900 whitespace-pre-wrap leading-relaxed">
            {displayText}
          </p>
        )}
      </div>

      {/* Subtle handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-1.5 !h-1.5 !bg-yellow-400 !border-yellow-500 !-top-0.5 opacity-0 group-hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-1.5 !h-1.5 !bg-yellow-400 !border-yellow-500 !-bottom-0.5 opacity-0 group-hover:opacity-100"
      />
    </div>
  );
};

export default memo(CommentNode);
