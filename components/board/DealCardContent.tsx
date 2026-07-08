import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Pulse } from "@/components/ui/Pulse";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { cn } from "@/lib/cn";
import { getDealProgress, type Deal, type DealProgress } from "@/lib/types";

const SOURCE_LABELS: Record<string, string> = {
  email: "Email",
  website_form: "Website",
  referral: "Referral",
  event: "Event",
  upload: "Upload",
};

function describeRound(round: Deal["round"]) {
  if (!round) return null;
  const values = [round.raising_amount, round.valuation].filter(Boolean);
  return values.join(" · ") || null;
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

  const meta = [deal.sector, deal.stage, describeRound(deal.round)]
    .filter(Boolean)
    .join(" · ");
  const missing = deal.missing_fields ?? [];

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

      {settled && (
        <>
          {deal.one_liner && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-[1.45] text-ink-secondary">
              {deal.one_liner}
            </p>
          )}
          {meta && (
            <p className="mt-2 truncate text-[11px] text-ink-tertiary">{meta}</p>
          )}
        </>
      )}

      <div className="mt-2 flex items-center justify-between">
        {deal.source_channel ? (
          <Badge tone="outline">
            {SOURCE_LABELS[deal.source_channel] ?? deal.source_channel}
          </Badge>
        ) : (
          <span />
        )}
        {/* Gaps aren't known until analysis finishes, so hold the dot until then. */}
        {settled && missing.length > 0 && (
          <span
            className="size-1.5 rounded-full bg-caution"
            title={`Missing: ${missing.join(", ")}`}
            aria-label={`Missing fields: ${missing.join(", ")}`}
          />
        )}
      </div>
    </Card>
  );
}
