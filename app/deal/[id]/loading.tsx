import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-surface px-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </header>
      <main className="flex flex-1 flex-col px-6 py-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1 space-y-2.5">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="size-[52px] shrink-0 rounded-full" />
          </div>
          <div className="mt-10 space-y-8">
            {[3, 4, 2].map((tiles, section) => (
              <div key={section} className="border-t border-line pt-6">
                <Skeleton className="mb-4 h-3 w-24" />
                <div className="grid grid-cols-3 gap-6">
                  {Array.from({ length: tiles }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="border-t border-line pt-6">
              <Skeleton className="mb-4 h-3 w-24" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-3.5 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
