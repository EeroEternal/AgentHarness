"use client";

import { Send } from "lucide-react";
import { useChatStore } from "@agentharness/core/chat";
import { useTranslation } from "@agentharness/core";
import { useState, useRef, useEffect, useCallback } from "react";

const INITIAL_BOTTOM = 80;
const INITIAL_RIGHT = 16;
const DRAG_THRESHOLD = 5;
const SNAP_THRESHOLD = 80;

export function ChatFab() {
  const { t } = useTranslation();
  const isOpen = useChatStore((s) => s.isOpen);
  const toggle = useChatStore((s) => s.toggle);

  const [bottom, setBottom] = useState(INITIAL_BOTTOM);
  const [right, setRight] = useState(INITIAL_RIGHT);

  const bottomRef = useRef(INITIAL_BOTTOM);
  const rightRef = useRef(INITIAL_RIGHT);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startBottom = useRef(INITIAL_BOTTOM);
  const startRight = useRef(INITIAL_RIGHT);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startBottom.current = bottomRef.current;
    startRight.current = rightRef.current;
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;

    if (!hasDragged.current && (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)) {
      hasDragged.current = true;
    }

    if (!hasDragged.current) return;

    const newBottom = startBottom.current - deltaY;
    const newRight = startRight.current - deltaX;

    const btnWidth = buttonRef.current?.offsetWidth || 120;
    const btnHeight = buttonRef.current?.offsetHeight || 40;
    const maxBottom = window.innerHeight - btnHeight - 10;
    const minBottom = 10;
    const maxRight = window.innerWidth - btnWidth - 10;
    const minRight = 10;

    const clampedBottom = Math.max(minBottom, Math.min(maxBottom, newBottom));
    const clampedRight = Math.max(minRight, Math.min(maxRight, newRight));
    setBottom(clampedBottom);
    setRight(clampedRight);
    bottomRef.current = clampedBottom;
    rightRef.current = clampedRight;
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (hasDragged.current) {
      const deltaX = e.clientX - startX.current;
      if (deltaX < -SNAP_THRESHOLD) {
        setBottom(INITIAL_BOTTOM);
        setRight(INITIAL_RIGHT);
      }
    } else {
      toggle();
    }
  }, [toggle]);

  useEffect(() => {
    bottomRef.current = bottom;
    rightRef.current = right;
  });

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  if (isOpen) return null;

  return (
    <button
      ref={buttonRef}
      onMouseDown={handleMouseDown}
      className="fixed z-50 flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-grab active:cursor-grabbing select-none"
      style={{
        bottom: `${bottom}px`,
        right: `${right}px`,
      }}
    >
      <Send className="size-3.5" />
      {t("chat.askHarness", "Ask Harness")}
    </button>
  );
}
