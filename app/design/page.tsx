import { DealCardContent } from "@/components/board/DealCardContent";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Column } from "@/components/ui/Column";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Deal } from "@/lib/types";

// Internal reference page: the design foundation rendered for approval.

const sampleDeals: Deal[] = [
  {
    id: "sample-1",
    company_name: "Statline",
    one_liner: "Real-time revenue reconciliation for usage-based SaaS billing.",
    sector: "Fintech",
    stage: "Series A",
    location: "San Francisco, California, United States",
    round: { raising_amount: "$12M" },
    status: "due_diligence",
    total_score: 81,
    source_channel: "referral",
    missing_fields: [],
  },
  {
    id: "sample-2",
    company_name: "Corridor",
    one_liner: "Payment rails for cross-border payroll in Southeast Asia.",
    sector: "Fintech",
    stage: "Seed",
    location: "Singapore",
    round: { raising_amount: "$3M" },
    status: "new",
    total_score: 58,
    source_channel: "email",
    missing_fields: ["arr", "tam"],
  },
  // Freshly submitted; the background pipeline hasn't enriched it yet.
  {
    id: "sample-3",
    company_name: "Processing…",
    status: "new",
    source_channel: "upload",
    missing_fields: [],
  },
  // The pipeline never ran; the reason is recorded and shown on hover.
  {
    id: "sample-4",
    company_name: "Processing…",
    status: "new",
    source_channel: "upload",
    missing_fields: [],
    processing_error:
      "The deal was saved, but the analysis pipeline rejected the request: POST https://…/webhook/… returned 404 Not Found.",
  },
];

const swatches = [
  { name: "canvas", className: "bg-canvas" },
  { name: "surface", className: "bg-surface" },
  { name: "surface-sunken", className: "bg-surface-sunken" },
  { name: "line", className: "bg-line" },
  { name: "ink-tertiary", className: "bg-ink-tertiary" },
  { name: "ink-secondary", className: "bg-ink-secondary" },
  { name: "ink", className: "bg-ink" },
  { name: "accent", className: "bg-accent" },
  { name: "accent-soft", className: "bg-accent-soft" },
  { name: "caution", className: "bg-caution" },
  { name: "negative", className: "bg-negative" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-10">
        <h1 className="font-display text-4xl font-semibold leading-none text-ink">
          Design foundation
        </h1>
        <p className="mt-1 text-[13px] text-ink-secondary">
          Cream surfaces, deep plum ink, and coral accents. Geist for utility,
          Cormorant for brand moments.
        </p>
      </header>

      <div className="space-y-10">
        <Section title="Palette">
          <div className="flex flex-wrap gap-3">
            {swatches.map((s) => (
              <div key={s.name} className="space-y-1.5">
                <div
                  className={`h-12 w-20 rounded-md border border-line ${s.className}`}
                />
                <p className="text-[11px] text-ink-tertiary">{s.name}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Type">
          <div className="space-y-2">
            <p className="font-display text-4xl font-semibold leading-none text-ink">
              Display title — Cormorant semibold
            </p>
            <p className="text-sm font-medium text-ink">
              Section heading — 14 medium
            </p>
            <p className="text-sm text-ink-secondary">
              Body — 14 regular, secondary ink for supporting copy.
            </p>
            <p className="text-xs text-ink-tertiary">
              Caption / meta — 12 regular, tertiary ink.
            </p>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-secondary">
              Overline — 11 medium, tracked
            </p>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary">Add deal</Button>
            <Button variant="secondary">Export</Button>
            <Button variant="ghost">Dismiss</Button>
            <Button variant="primary" size="sm">
              Add deal
            </Button>
            <Button variant="secondary" size="sm">
              Export
            </Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">Fintech</Badge>
            <Badge tone="outline">Referral</Badge>
            <Badge tone="accent">Scored</Badge>
          </div>
        </Section>

        <Section title="Score ring">
          <div className="flex items-center gap-4">
            <ScoreRing score={88} />
            <ScoreRing score={64} />
            <ScoreRing score={41} />
            <ScoreRing />
            <p className="text-xs text-ink-tertiary">
              88 · 64 · 41 · not yet scored
            </p>
          </div>
        </Section>

        <Section title="Card">
          <Card className="max-w-sm p-4">
            <h3 className="text-sm font-medium text-ink">Thesis fit</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">
              Vertical software with a payments wedge in an overlooked market.
              Matches the fund&apos;s B2B infrastructure thesis.
            </p>
          </Card>
        </Section>

        <Section title="Column with deal cards">
          <Column title="Due Diligence" count={sampleDeals.length}>
            {sampleDeals.map((deal) => (
              <DealCardContent key={deal.id} deal={deal} />
            ))}
          </Column>
        </Section>

        <Section title="Skeleton">
          <Card className="max-w-sm space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-7 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/5" />
          </Card>
        </Section>
      </div>
    </div>
  );
}
