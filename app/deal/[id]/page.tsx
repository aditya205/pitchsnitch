import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SetupNotice } from "@/components/SetupNotice";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { cn } from "@/lib/cn";
import { getDealDetail } from "@/lib/deals";
import type { DealDetail, ExtractedField } from "@/lib/types";

// A deal sheet must always reflect the live record.
export const dynamic = "force-dynamic";

const FIELD_LABELS: Record<string, string> = {
  arr: "ARR",
  tam: "TAM",
  revenue: "Revenue",
  growth: "Growth",
  customers: "Customers",
  round: "Round",
  valuation: "Valuation",
  use_of_funds: "Use of funds",
  founders: "Founders",
  website: "Website",
  one_liner: "One-liner",
};

const fieldLabel = (name: string) =>
  FIELD_LABELS[name] ?? name.replaceAll("_", " ");

const SIGNAL_DOTS: Record<string, string> = {
  positive: "bg-positive",
  neutral: "bg-line-strong",
  concerning: "bg-caution",
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));

export async function generateMetadata(
  props: PageProps<"/deal/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const result = await getDealDetail(id);
  return {
    title: result.ok
      ? `${result.deal.company_name} — PitchSnitch`
      : "PitchSnitch",
  };
}

export default async function DealPage(props: PageProps<"/deal/[id]">) {
  const { id } = await props.params;
  const result = await getDealDetail(id);

  if (!result.ok && result.reason === "not_found") notFound();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-surface px-6">
        <Link
          href="/"
          className="text-[13px] text-ink-secondary transition-colors hover:text-ink"
        >
          ← Pipeline
        </Link>
        <span className="text-[13px] font-semibold tracking-tight text-ink-tertiary">
          PitchSnitch
        </span>
      </header>
      <main className="flex flex-1 flex-col px-6 py-8">
        {result.ok ? (
          <DealSheet deal={result.deal} />
        ) : (
          <SetupNotice message={result.message} />
        )}
      </main>
    </div>
  );
}

function DealSheet({ deal }: { deal: DealDetail }) {
  const provenance = new Map(deal.extracted_fields.map((f) => [f.field_name, f]));
  const meta = [
    deal.sector,
    deal.stage,
    deal.location,
    deal.founded_year && `Founded ${deal.founded_year}`,
  ].filter(Boolean);
  const missing = deal.missing_fields ?? [];

  return (
    <article className="mx-auto w-full max-w-2xl">
      {/* Header */}
      <header>
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-tight text-ink">
              {deal.company_name}
            </h1>
            {deal.one_liner && (
              <p className="mt-1 text-[15px] leading-normal text-ink-secondary">
                {deal.one_liner}
              </p>
            )}
            <p className="mt-2 text-xs text-ink-tertiary">
              {meta.join(" · ")}
              {deal.website && (
                <>
                  {meta.length > 0 && " · "}
                  <a
                    href={deal.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline"
                  >
                    {new URL(deal.website).hostname} ↗
                  </a>
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1">
            <ScoreRing score={deal.total_score} size={52} />
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
              Score
            </span>
          </div>
        </div>
        {deal.recommendation && (
          <div className="mt-5 border-l-2 border-ink pl-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
              Recommendation
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-ink">
              {deal.recommendation}
            </p>
          </div>
        )}
        <p className="mt-5 text-[11px] text-ink-tertiary">
          Fields tagged <ExtTag /> were enriched from the web — hover for
          confidence, click for the source. Untagged fields are
          founder-submitted.
        </p>
      </header>

      <div className="mt-8 space-y-8">
        {/* The ask */}
        <Section title="The ask">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Tile label="Round" value={deal.round} prov={provenance.get("round")} />
            <Tile
              label="Valuation"
              value={deal.valuation}
              prov={provenance.get("valuation")}
            />
            <Tile label="TAM" value={deal.tam} prov={provenance.get("tam")} />
            <Tile
              label="Use of funds"
              value={deal.use_of_funds}
              prov={provenance.get("use_of_funds")}
              className="col-span-full"
            />
          </dl>
        </Section>

        {/* Traction */}
        <Section title="Traction">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Tile label="ARR" value={deal.arr} prov={provenance.get("arr")} />
            <Tile
              label="Revenue"
              value={deal.revenue}
              prov={provenance.get("revenue")}
            />
            <Tile
              label="Growth"
              value={deal.growth}
              prov={provenance.get("growth")}
            />
            <Tile
              label="Customers"
              value={deal.customers}
              prov={provenance.get("customers")}
              className="col-span-2 sm:col-span-1"
            />
          </dl>
        </Section>

        {/* Team */}
        <Section title="Team">
          {deal.founders.length === 0 ? (
            <Empty>No founder data yet.</Empty>
          ) : (
            <div className="space-y-4">
              {deal.founders.map((founder) => (
                <div key={founder.name}>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-medium text-ink">
                      {founder.name}
                    </span>
                    {founder.role && (
                      <span className="text-xs text-ink-tertiary">
                        {founder.role}
                      </span>
                    )}
                    {founder.source === "external" && (
                      <ExtTag confidence={founder.confidence} />
                    )}
                    {founder.linkedin_url && (
                      <a
                        href={founder.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-accent hover:underline"
                      >
                        LinkedIn ↗
                      </a>
                    )}
                  </div>
                  {founder.background && (
                    <p className="mt-0.5 text-[13px] leading-relaxed text-ink-secondary">
                      {founder.background}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Thesis */}
        <Section title="Why it fits">
          {deal.thesis_fit ? (
            <p className="text-sm leading-relaxed text-ink-secondary">
              {deal.thesis_fit}
            </p>
          ) : (
            <Empty>No thesis rationale yet.</Empty>
          )}
        </Section>

        {/* Signals */}
        <Section title="Recent signals">
          {deal.external_signals.length === 0 ? (
            <Empty>No web signals gathered yet.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {deal.external_signals.map((signal) => (
                <li key={signal.title} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="flex w-24 shrink-0 items-center gap-1.5 self-start pt-1">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        SIGNAL_DOTS[signal.signal_type ?? "neutral"]
                      )}
                    />
                    <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
                      {signal.signal_type ?? "neutral"}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      {signal.url ? (
                        <a
                          href={signal.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-[13px] font-medium text-ink hover:underline"
                        >
                          {signal.title} ↗
                        </a>
                      ) : (
                        <span className="truncate text-[13px] font-medium text-ink">
                          {signal.title}
                        </span>
                      )}
                      {signal.signal_date && (
                        <span className="shrink-0 text-[11px] text-ink-tertiary">
                          {formatDate(signal.signal_date)}
                        </span>
                      )}
                    </div>
                    {signal.summary && (
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-secondary">
                        {signal.summary}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Concerns & gaps */}
        <Section title="Concerns & gaps">
          {deal.concerns ? (
            <p className="text-sm leading-relaxed text-ink-secondary">
              {deal.concerns}
            </p>
          ) : (
            missing.length === 0 && <Empty>No open concerns or gaps.</Empty>
          )}
          {missing.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
                <span className="size-1.5 rounded-full bg-caution" />
                Missing
              </span>
              {missing.map((field) => (
                <Badge key={field} tone="outline">
                  {fieldLabel(field)}
                </Badge>
              ))}
            </div>
          )}
        </Section>

        {/* Score breakdown */}
        <Section title="Score breakdown">
          {deal.scores.length === 0 ? (
            <Empty>Not yet scored.</Empty>
          ) : (
            <div className="space-y-3">
              {deal.scores.map((s) => (
                <div key={s.dimension}>
                  <div className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs text-ink-secondary">
                      {s.dimension}
                    </span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-ink"
                        style={{ width: `${Math.max(0, Math.min(100, s.score))}%` }}
                      />
                    </div>
                    <span className="w-7 shrink-0 text-right text-xs font-medium tabular-nums text-ink">
                      {s.score}
                    </span>
                  </div>
                  {s.rationale && (
                    <p className="ml-[92px] mt-1 text-xs leading-relaxed text-ink-tertiary">
                      {s.rationale}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Tile({
  label,
  value,
  prov,
  className,
}: {
  label: string;
  value?: string | null;
  prov?: ExtractedField;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
        {label}
        {prov?.source === "external" && (
          <ExtTag confidence={prov.confidence} sourceUrl={prov.source_url} />
        )}
      </dt>
      <dd
        className={cn(
          "mt-1 text-sm leading-snug",
          value ? "font-medium text-ink" : "text-ink-tertiary"
        )}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

// The provenance marker: web-enriched fields wear this; untagged = submitted.
function ExtTag({
  confidence,
  sourceUrl,
}: {
  confidence?: number;
  sourceUrl?: string;
}) {
  const tooltip =
    typeof confidence === "number"
      ? `Web-enriched · ${Math.round(confidence * 100)}% confidence`
      : "Web-enriched";
  const tag = (
    <span
      title={tooltip}
      className="inline-flex h-4 items-center rounded-[4px] border border-dashed border-line-strong px-1 align-middle text-[9.5px] font-medium uppercase tracking-[0.08em] text-ink-tertiary"
    >
      ext
    </span>
  );
  return sourceUrl ? (
    <a href={sourceUrl} target="_blank" rel="noreferrer">
      {tag}
    </a>
  ) : (
    tag
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-ink-tertiary">{children}</p>;
}
