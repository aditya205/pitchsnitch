import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Pulse } from "@/components/ui/Pulse";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { cn } from "@/lib/cn";
import { getDealProgress, type Deal, type DealProgress } from "@/lib/types";

function firstTag(value: string | null | undefined): string | null {
  const tag = value?.split(/[,/]/)[0]?.trim();
  return tag || null;
}

// Pure presentation — shared by the draggable card, the drag overlay, and /design.
// `progress` is passed in when the board knows better than the row does (e.g. a
// client-side timeout); otherwise it's derived from the deal.
export function DealCardContent({
  deal,
  progress = getDealProgress(deal),
  className,
}: {
  deal: Deal;
  progress?: DealProgress;
  className?: string;
}) {
  const settled = progress.state === "ready";
  const name = deal.company_name?.trim();
  // Mid-pipeline the name may still be the placeholder; don't show it verbatim.
  const title =
    !name || /^processing/i.test(name) ? "New submission" : name;

  const sector = firstTag(deal.sector);
  const stage = firstTag(deal.stage);

  return (
    <Card className={cn("select-none", className)}>
      <div className="flex items-start justify-between gap-2">
        <h3
          className={cn(
            "min-w-0 truncate font-display text-[18px] font-semibold leading-5",
            settled ? "text-ink" : "text-ink-secondary"
          )}
        >
          {title}
        </h3>
        {/* No empty ring while pending — a score isn't missing, it hasn't run. */}
        {settled && <ScoreRing score={deal.total_score} />}
      </div>

      {progress.state === "analyzing" && (
        <p className="mt-1 flex items-center gap-1.5 text-xs leading-[1.45] text-ink-tertiary">
          <Pulse />
          Analyzing…
        </p>
      )}

      {progress.state === "failed" && (
        <p
          className="mt-1 flex items-center gap-1.5 text-xs leading-[1.45] text-negative"
          title={progress.reason}
        >
          <span className="size-1.5 shrink-0 rounded-full bg-negative" />
          Analysis failed
        </p>
      )}

      {(sector || stage) && (
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
          {sector && (
            <Badge
              tone="outline"
              title={sector}
              className="max-w-[11rem] truncate"
            >
              {sector}
            </Badge>
          )}
          {stage && (
            <Badge
              tone="accent"
              title={stage}
              className="max-w-[9rem] truncate"
            >
              {stage}
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}
