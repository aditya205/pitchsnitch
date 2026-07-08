import { BoardSkeleton } from "@/components/board/BoardSkeleton";

// The header is part of the page (not the layout), so it must be mirrored here
// or it would pop in when the board resolves.
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface/90 px-6 shadow-[0_1px_0_rgba(255,91,85,0.08)]">
        <span className="font-display text-[24px] font-semibold leading-none text-accent">
          PitchSnitch
        </span>
      </header>
      <main className="flex min-h-0 flex-1 flex-col px-6 py-5">
        <BoardSkeleton />
      </main>
    </div>
  );
}
