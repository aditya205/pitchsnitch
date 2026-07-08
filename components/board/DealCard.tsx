"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/cn";
import type { Deal, DealProgress } from "@/lib/types";
import { DealCardContent } from "./DealCardContent";

export function DealCard({
  deal,
  progress,
}: {
  deal: Deal;
  progress?: DealProgress;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id });

  // The browser fires a click after a drag ends on the same element;
  // remember the drag so that click doesn't navigate.
  const wasDragged = useRef(false);
  useEffect(() => {
    if (isDragging) wasDragged.current = true;
  }, [isDragging]);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
      {...listeners}
      {...attributes}
    >
      <Link
        href={`/deal/${deal.id}`}
        draggable={false}
        className="block"
        onClick={(e) => {
          if (wasDragged.current) {
            e.preventDefault();
            wasDragged.current = false;
          }
        }}
      >
        <DealCardContent
          deal={deal}
          progress={progress}
          className="transition-colors hover:border-line-strong"
        />
      </Link>
    </div>
  );
}
