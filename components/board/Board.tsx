"use client";

import { useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Column } from "@/components/ui/Column";
import { updateDealStatus } from "@/lib/actions";
import { DEAL_STATUSES, type Deal, type DealStatus } from "@/lib/types";
import { DealCard } from "./DealCard";
import { DealCardContent } from "./DealCardContent";

// Prefer the column under the pointer; fall back to overlap for keyboard drags.
const collisionDetection: CollisionDetection = (args) => {
  const byPointer = pointerWithin(args);
  return byPointer.length > 0 ? byPointer : rectIntersection(args);
};

export function Board({ initialDeals }: { initialDeals: Deal[] }) {
  const [deals, setDeals] = useState(initialDeals);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  function showError(message: string) {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 5000);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const target = over.id as DealStatus;
    const deal = deals.find((d) => d.id === active.id);
    if (!deal || deal.status === target) return;

    const previous = deals;
    setDeals((current) =>
      current.map((d) => (d.id === deal.id ? { ...d, status: target } : d))
    );

    updateDealStatus(deal.id, target).then((result) => {
      if (!result.ok) {
        setDeals(previous);
        showError(`Couldn't move ${deal.company_name} — ${result.message}`);
      }
    });
  }

  if (deals.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 py-24 text-center">
        <p className="text-sm font-medium text-ink-secondary">
          No deals in the pipeline yet.
        </p>
        <p className="text-[13px] text-ink-tertiary">
          New submissions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      {error && (
        <p className="text-[13px] text-negative" role="alert">
          {error}
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex flex-1 items-start gap-3 overflow-x-auto pb-4">
          {DEAL_STATUSES.map(({ value, label }) => (
            <BoardColumn
              key={value}
              status={value}
              label={label}
              deals={deals.filter((d) => d.status === value)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDeal && (
            <div className="rotate-[0.5deg] shadow-[0_8px_24px_rgba(29,29,27,0.12)]">
              <DealCardContent deal={activeDeal} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function BoardColumn({
  status,
  label,
  deals,
}: {
  status: DealStatus;
  label: string;
  deals: Deal[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <Column ref={setNodeRef} title={label} count={deals.length} active={isOver}>
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} />
      ))}
    </Column>
  );
}
