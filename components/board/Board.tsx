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
import { Button } from "@/components/ui/Button";
import { Column } from "@/components/ui/Column";
import { updateDealStatus } from "@/lib/actions";
import { useAutoRefresh } from "@/lib/useAutoRefresh";
import {
  analysisTimedOutReason,
  DEAL_STATUSES,
  getDealProgress,
  PROCESSING_TIMEOUT_MS,
  type Deal,
  type DealProgress,
  type DealStatus,
} from "@/lib/types";
import { AddDealDialog } from "./AddDealDialog";
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
  const [addOpen, setAddOpen] = useState(false);
  // Status writes in flight. A refetch that lands mid-write would serve the old
  // status and flash the card back to its previous column.
  const [pendingMoves, setPendingMoves] = useState(0);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settled = activeId === null && pendingMoves === 0;

  // router.refresh() (from polling, or after adding a deal) delivers a new
  // initialDeals. Sync it in during render — the React-blessed alternative to a
  // setState effect — but never on top of an unsettled optimistic move.
  const [syncedFrom, setSyncedFrom] = useState(initialDeals);
  if (initialDeals !== syncedFrom && settled) {
    setSyncedFrom(initialDeals);
    setDeals(initialDeals);
  }

  // Poll only while the pipeline is still working on something, and only when
  // the board is settled. Stops once everything is analyzed — or once a deal has
  // been "Analyzing…" long enough that the pipeline is clearly never coming back.
  const analyzingIds = deals
    .filter((d) => getDealProgress(d).state === "analyzing")
    .map((d) => d.id);

  const timedOut = useAutoRefresh(settled && analyzingIds.length > 0, {
    timeoutMs: PROCESSING_TIMEOUT_MS,
    resetKey: analyzingIds.join(","),
  });

  // A stalled deal has no recorded error — synthesize one so the card and the
  // hover text explain what to check.
  const progressFor = (deal: Deal): DealProgress => {
    const progress = getDealProgress(deal);
    return timedOut && progress.state === "analyzing"
      ? { state: "failed", reason: analysisTimedOutReason(deal.id) }
      : progress;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;
  const validStatuses = new Set(DEAL_STATUSES.map((s) => s.value));

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

    if (!validStatuses.has(over.id as DealStatus)) return;

    const target = over.id as DealStatus;
    const deal = deals.find((d) => d.id === active.id);
    if (!deal || deal.status === target) return;

    const previous = deals;
    setDeals((current) =>
      current.map((d) => (d.id === deal.id ? { ...d, status: target } : d))
    );

    setPendingMoves((n) => n + 1);
    updateDealStatus(deal.id, target)
      .then((result) => {
        if (!result.ok) {
          setDeals(previous);
          const name = deal.company_name?.trim() || "deal";
          showError(`Couldn't move ${name} — ${result.message}`);
        }
      })
      .finally(() => setPendingMoves((n) => n - 1));
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between">
        {error ? (
          <p className="text-[13px] text-negative" role="alert">
            {error}
          </p>
        ) : (
          <span />
        )}
        <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
          Add deal
        </Button>
      </div>

      {deals.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-24 text-center">
          <p className="text-sm font-medium text-ink-secondary">
            No deals in the pipeline yet.
          </p>
          <p className="text-[13px] text-ink-tertiary">
            Add one to get started — new submissions appear in New.
          </p>
        </div>
      ) : (
        <DndContext
          id="pitchsnitch-board"
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="flex min-h-0 min-w-0 flex-1 items-stretch gap-3 overflow-x-auto pb-4">
            {DEAL_STATUSES.map(({ value, label }) => (
              <BoardColumn
                key={value}
                status={value}
                label={label}
                deals={deals.filter((d) => d.status === value)}
                progressFor={progressFor}
              />
            ))}
          </div>
          <DragOverlay>
            {activeDeal && (
              <div className="scale-[1.01] rotate-[0.5deg] shadow-[0_10px_28px_rgba(29,29,27,0.14)]">
                <DealCardContent
                  deal={activeDeal}
                  progress={progressFor(activeDeal)}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <AddDealDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function BoardColumn({
  status,
  label,
  deals,
  progressFor,
}: {
  status: DealStatus;
  label: string;
  deals: Deal[];
  progressFor: (deal: Deal) => DealProgress;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <Column ref={setNodeRef} title={label} count={deals.length} active={isOver}>
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} progress={progressFor(deal)} />
      ))}
    </Column>
  );
}
