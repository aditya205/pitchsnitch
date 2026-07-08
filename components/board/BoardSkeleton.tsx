import { Card } from "@/components/ui/Card";
import { Column } from "@/components/ui/Column";
import { Skeleton } from "@/components/ui/Skeleton";
import { DEAL_STATUSES } from "@/lib/types";

// Card counts per column, so the skeleton has the silhouette of a real board
// instead of four identical stacks.
const CARDS_PER_COLUMN = [3, 2, 2, 1];

function DealCardSkeleton() {
  return (
    <Card className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="size-7 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/5" />
      <Skeleton className="h-[18px] w-16 rounded-[5px]" />
    </Card>
  );
}

export function BoardSkeleton() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-end">
        <Skeleton className="h-7 w-20 rounded-md" />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 items-stretch gap-3 overflow-x-auto pb-4">
        {DEAL_STATUSES.map(({ value, label }, columnIndex) => (
          <Column key={value} title={label}>
            {Array.from({ length: CARDS_PER_COLUMN[columnIndex] }).map((_, i) => (
              <DealCardSkeleton key={i} />
            ))}
          </Column>
        ))}
      </div>
    </div>
  );
}
