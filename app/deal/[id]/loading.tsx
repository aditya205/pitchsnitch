import { Skeleton } from "@/components/ui/Skeleton";

// Mirrors the deal sheet's real silhouette: header, ask/traction tiles, and the
// score card. Kept in step with page.tsx so nothing shifts when data lands.
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-accent/25 bg-ink px-6 shadow-[0_1px_0_rgba(33,20,45,0.2)]">
        <Skeleton className="h-4 w-20 bg-surface/20" />
        <span className="font-display text-[34px] font-semibold leading-none text-accent">
          PitchSnitch
        </span>
      </header>

      <main className="flex flex-1 flex-col px-6 py-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Skeleton className="size-[52px] rounded-full" />
              <Skeleton className="h-7 w-28 rounded-md" />
            </div>
          </div>

          <Skeleton className="mt-6 h-3 w-3/4" />

          <div className="mt-8 space-y-8">
            {/* The ask, then traction. */}
            {[3, 4].map((tiles, section) => (
              <div key={section} className="border-t border-line pt-6">
                <Skeleton className="mb-4 h-3 w-24" />
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                  {Array.from({ length: tiles }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Team. */}
            <div className="border-t border-line pt-6">
              <Skeleton className="mb-4 h-3 w-16" />
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-full max-w-sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Score card: hero figure beside the radar. */}
            <div className="border-t border-line pt-6">
              <Skeleton className="mb-4 h-3 w-32" />
              <div className="grid items-center gap-6 rounded-card border border-line p-5 md:grid-cols-[auto_minmax(15rem,1fr)]">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-14 w-28" />
                  <Skeleton className="h-3 w-full max-w-xs" />
                </div>
                <Skeleton className="aspect-[4/3] max-h-64 w-full rounded-md" />
              </div>
              <div className="mt-6 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
