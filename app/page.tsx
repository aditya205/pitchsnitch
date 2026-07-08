import { Board } from "@/components/board/Board";
import { SetupNotice } from "@/components/SetupNotice";
import { getDeals } from "@/lib/deals";

// The pipeline must be fresh on every load.
export const dynamic = "force-dynamic";

export default async function Home() {
  const result = await getDeals();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface/90 px-6 shadow-[0_1px_0_rgba(255,91,85,0.08)]">
        <span className="font-display text-[24px] font-semibold leading-none text-accent">
          PitchSnitch
        </span>
        {result.ok && (
          <span className="text-xs tabular-nums text-ink-tertiary">
            {result.deals.length} {result.deals.length === 1 ? "deal" : "deals"} in
            pipeline
          </span>
        )}
      </header>
      <main className="flex min-h-0 flex-1 flex-col px-6 py-5">
        {result.ok ? (
          <Board initialDeals={result.deals} />
        ) : (
          <SetupNotice message={result.message} />
        )}
      </main>
    </div>
  );
}
