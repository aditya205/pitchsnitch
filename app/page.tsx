import { Board } from "@/components/board/Board";
import { SetupNotice } from "@/components/SetupNotice";
import { BrandBackdrop } from "@/components/ui/BrandBackdrop";
import { getDeals } from "@/lib/deals";

// The pipeline must be fresh on every load.
export const dynamic = "force-dynamic";

export default async function Home() {
  const result = await getDeals();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-accent/25 bg-ink px-6 shadow-[0_1px_0_rgba(33,20,45,0.2)]">
        <span className="font-display text-[34px] font-semibold leading-none text-accent">
          PitchSnitch
        </span>
        {result.ok && (
          <span className="text-xs tabular-nums text-surface/70">
            {result.deals.length} {result.deals.length === 1 ? "deal" : "deals"} in
            pipeline
          </span>
        )}
      </header>
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-5">
        <BrandBackdrop />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          {result.ok ? (
            <Board initialDeals={result.deals} />
          ) : (
            <SetupNotice message={result.message} />
          )}
        </div>
      </main>
    </div>
  );
}
