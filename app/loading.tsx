import { BoardSkeleton } from "@/components/board/BoardSkeleton";
import { BrandBackdrop } from "@/components/ui/BrandBackdrop";

// The header is part of the page (not the layout), so it must be mirrored here
// or it would pop in when the board resolves.
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-accent/25 bg-ink px-6 shadow-[0_1px_0_rgba(33,20,45,0.2)]">
        <span className="font-display text-[34px] font-semibold leading-none text-accent">
          PitchSnitch
        </span>
      </header>
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-5">
        <BrandBackdrop />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <BoardSkeleton />
        </div>
      </main>
    </div>
  );
}
