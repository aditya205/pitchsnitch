import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { cn } from "@/lib/cn";
import type { Deal } from "@/lib/types";

const SOURCE_LABELS: Record<string, string> = {
  email: "Email",
  website_form: "Website",
  referral: "Referral",
  event: "Event",
};

// Pure presentation — shared by the draggable card, the drag overlay, and /design.
export function DealCardContent({
  deal,
  className,
}: {
  deal: Deal;
  className?: string;
}) {
  const meta = [deal.sector, deal.stage, deal.round].filter(Boolean).join(" · ");
  const missing = deal.missing_fields ?? [];

  return (
    <Card className={cn("select-none", className)}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate pt-0.5 text-[13px] font-medium leading-5 text-ink">
          {deal.company_name}
        </h3>
        <ScoreRing score={deal.total_score} />
      </div>
      {deal.one_liner && (
        <p className="mt-0.5 line-clamp-2 text-xs leading-[1.45] text-ink-secondary">
          {deal.one_liner}
        </p>
      )}
      {meta && (
        <p className="mt-2 truncate text-[11px] text-ink-tertiary">{meta}</p>
      )}
      <div className="mt-2 flex items-center justify-between">
        {deal.source_channel ? (
          <Badge tone="outline">
            {SOURCE_LABELS[deal.source_channel] ?? deal.source_channel}
          </Badge>
        ) : (
          <span />
        )}
        {missing.length > 0 && (
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
