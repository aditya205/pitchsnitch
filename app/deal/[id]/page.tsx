import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DealAnalysisStatus } from "@/components/deal/DealAnalysisStatus";
import { ScoreRadar } from "@/components/deal/ScoreRadar";
import { SetupNotice } from "@/components/SetupNotice";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { cn } from "@/lib/cn";
import { getDealDetail } from "@/lib/deals";
import {
  getDealProgress,
  SCORE_DIMENSIONS,
  type DealDetail,
  type ExtractedField,
  type Founder,
} from "@/lib/types";

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

const formatDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

function normalizeText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  // jsonb fields like round.prior_investors may arrive as an array.
  if (Array.isArray(value)) {
    const parts = value.map(normalizeText).filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  }
  return null;
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

// round and traction are jsonb blobs written straight from the extraction JSON.
// Guard the shape: jsonb can legally hold a string, number, or array.
function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getRoundDetails(deal: DealDetail) {
  const round = asObject(deal.round);
  return {
    raising_amount: normalizeText(round?.raising_amount),
    valuation: normalizeText(round?.valuation),
    prior_investors: normalizeText(round?.prior_investors),
  };
}

function getTractionDetails(deal: DealDetail) {
  const traction = asObject(deal.traction);
  return {
    revenue: normalizeText(traction?.revenue),
    customers: normalizeText(traction?.customers),
    growth_rate: normalizeText(traction?.growth_rate),
  };
}

// Accepts bare hosts ("acme.com") as well as full URLs; the pipeline emits both.
function getWebsiteLink(website: string | null) {
  if (!website) return null;
  const candidate = /^https?:\/\//i.test(website) ? website : `https://${website}`;
  try {
    const url = new URL(candidate);
    if (!url.hostname.includes(".")) return null;
    return { href: url.toString(), host: url.hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
}

// The pipeline emits a template founder row with every field null. Don't render it.
function hasFounderContent(founder: Founder): boolean {
  return Boolean(
    normalizeText(founder.name) ||
      normalizeText(founder.role) ||
      normalizeText(founder.background) ||
      normalizeText(founder.linkedin_url)
  );
}

export async function generateMetadata(
  props: PageProps<"/deal/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const result = await getDealDetail(id);
  const name = result.ok ? normalizeText(result.deal.company_name) : null;
  const real = name && !/^processing/i.test(name) ? name : null;
  return { title: real ? `${real} — PitchSnitch` : "PitchSnitch" };
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
        ) : result.reason === "unconfigured" ? (
          <SetupNotice message={result.message} />
        ) : (
          <LoadError message={result.message} />
        )}
      </main>
    </div>
  );
}

function DealSheet({ deal }: { deal: DealDetail }) {
  // Relations come back null (not []) when absent.
  const provenance = new Map(
    (deal.extracted_fields ?? []).map((f) => [f.field_name, f])
  );
  const signals = deal.external_signals ?? [];

  // PostgREST embeds the unique scores row as a one-element array.
  const scores = Array.isArray(deal.scores) ? deal.scores[0] : deal.scores;
  const scoredDimensions = SCORE_DIMENSIONS.flatMap(({ key, label }) => {
    const score = scores?.[key];
    return typeof score === "number" && Number.isFinite(score)
      ? [{ key, label, score: Math.max(0, Math.min(10, score)) }]
      : [];
  });
  const scoreRationale = normalizeText(scores?.rationale);
  // The pipeline's computed total wins; fall back to the denormalized column.
  const totalScore =
    typeof scores?.total === "number" ? scores.total : deal.total_score;

  // Pipeline state drives the status strip below the header, and tells the
  // em-dashes apart from "we looked and there's nothing".
  const progress = getDealProgress({
    company_name: deal.company_name,
    total_score: totalScore,
    processing_error: deal.processing_error,
  });
  const rawName = normalizeText(deal.company_name);
  // Never show the intake placeholder verbatim.
  const companyName =
    !rawName || /^processing/i.test(rawName) ? "New submission" : rawName;
  const oneLiner = normalizeText(deal.one_liner);
  const sector = normalizeText(deal.sector);
  const stage = normalizeText(deal.stage);
  const location = normalizeText(deal.location);
  const foundedYear = normalizeText(deal.founded_year);
  const meta = [sector, stage, location, foundedYear && `Founded ${foundedYear}`].filter(Boolean);
  const missing = normalizeList(deal.missing_fields);
  const redFlags = normalizeList(deal.red_flags);
  const roundDetails = getRoundDetails(deal);
  const tractionDetails = getTractionDetails(deal);
  const websiteLink = getWebsiteLink(normalizeText(deal.website));
  const founders = (deal.founders ?? []).filter(hasFounderContent);
  const concerns = normalizeText(deal.concerns);
  const recommendation = normalizeText(deal.recommendation);
  const thesisFit = normalizeText(deal.thesis_fit);

  return (
    <article className="mx-auto w-full max-w-2xl">
      {/* Header */}
      <header>
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-tight text-ink">
              {companyName}
            </h1>
            {oneLiner ? (
              <p className="mt-1 text-[15px] leading-normal text-ink-secondary">
                {oneLiner}
              </p>
            ) : (
              <p className="mt-1 text-[13px] text-ink-tertiary">No one-liner provided.</p>
            )}
            <p className="mt-2 text-xs text-ink-tertiary">
              {meta.length > 0 ? meta.join(" · ") : !websiteLink && "Details pending"}
              {websiteLink && (
                <>
                  {meta.length > 0 && " · "}
                  <a
                    href={websiteLink.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline"
                  >
                    {websiteLink.host} ↗
                  </a>
                </>
              )}
            </p>
          </div>
          {progress.state === "ready" && (
            <div className="flex shrink-0 flex-col items-center gap-1">
              <ScoreRing score={totalScore} size={52} />
              <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
                Score
              </span>
            </div>
          )}
        </div>

        <DealAnalysisStatus dealId={deal.id} progress={progress} />

        {recommendation && (
          <div className="mt-5 border-l-2 border-ink pl-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
              Recommendation
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-ink">
              {recommendation}
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
            <Tile
              label="Round"
              value={roundDetails.raising_amount}
              prov={provenance.get("round")}
            />
            <Tile
              label="Valuation"
              value={roundDetails.valuation}
              prov={provenance.get("valuation")}
            />
            <Tile label="TAM" value={deal.tam} prov={provenance.get("tam")} />
            <Tile
              label="Prior investors"
              value={roundDetails.prior_investors}
              prov={provenance.get("prior_investors")}
              className="col-span-full"
            />
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
              value={tractionDetails.revenue}
              prov={provenance.get("revenue")}
            />
            <Tile
              label="Growth"
              value={tractionDetails.growth_rate}
              prov={provenance.get("growth_rate")}
            />
            <Tile
              label="Customers"
              value={tractionDetails.customers}
              prov={provenance.get("customers")}
              className="col-span-2 sm:col-span-1"
            />
          </dl>
        </Section>

        {/* Team */}
        <Section title="Team">
          {founders.length === 0 ? (
            <Empty>No founder data yet.</Empty>
          ) : (
            <div className="space-y-4">
              {founders.map((founder, index) => {
                const founderName = normalizeText(founder.name) ?? "Founder details pending";
                const founderRole = normalizeText(founder.role);
                const founderBackground = normalizeText(founder.background);
                const founderLinkedIn = normalizeText(founder.linkedin_url);

                return (
                  <div key={`${founderName}-${index}`}>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm font-medium text-ink">
                        {founderName}
                      </span>
                      {founderRole && (
                        <span className="text-xs text-ink-tertiary">
                          {founderRole}
                        </span>
                      )}
                      {founder.source === "external" && (
                        <ExtTag confidence={founder.confidence} />
                      )}
                      {founderLinkedIn && (
                        <a
                          href={founderLinkedIn}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-accent hover:underline"
                        >
                          LinkedIn ↗
                        </a>
                      )}
                    </div>
                    {founderBackground && (
                      <p className="mt-0.5 text-[13px] leading-relaxed text-ink-secondary">
                        {founderBackground}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Thesis */}
        <Section title="Why it fits">
          {thesisFit ? (
            <p className="text-sm leading-relaxed text-ink-secondary">
              {thesisFit}
            </p>
          ) : (
            <Empty>No thesis rationale yet.</Empty>
          )}
        </Section>

        {/* Signals */}
        <Section title="Recent signals">
          {signals.length === 0 ? (
            <Empty>No web signals gathered yet.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {signals.map((signal, index) => (
                <li
                  key={`${signal.url ?? signal.title}-${index}`}
                  className="flex gap-3 py-2.5 first:pt-0 last:pb-0"
                >
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
                      {signal.signal_date && formatDate(signal.signal_date) && (
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
          {concerns ? (
            <p className="text-sm leading-relaxed text-ink-secondary">{concerns}</p>
          ) : (
            <Empty>No analyst concerns recorded.</Empty>
          )}
        </Section>

        <Section title="Missing fields">
          {missing.length === 0 ? (
            <Empty>No fields marked as missing.</Empty>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {missing.map((field, index) => (
                <Badge key={`${field}-${index}`} tone="outline">
                  {fieldLabel(field)}
                </Badge>
              ))}
            </div>
          )}
        </Section>

        <Section title="Red flags">
          {redFlags.length === 0 ? (
            <Empty>No red flags captured yet.</Empty>
          ) : (
            <ul className="space-y-2">
              {redFlags.map((flag, index) => (
                <li
                  key={`${flag}-${index}`}
                  className="flex items-start gap-2 text-sm text-ink-secondary"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-caution" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Score breakdown */}
        <Section title="Score breakdown">
          {!scoredDimensions.length ? (
            <Empty>Not yet scored.</Empty>
          ) : (
            <>
              <div className="mb-5 grid gap-5 rounded-card border border-line bg-surface p-4 sm:grid-cols-[minmax(0,0.7fr)_minmax(14rem,1fr)]">
                <div className="flex items-center gap-3 sm:block">
                  <ScoreRing score={totalScore} size={72} />
                  <div className="sm:mt-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
                      Total score
                    </p>
                    <p className="mt-0.5 text-3xl font-semibold leading-none tracking-tight text-ink">
                      {typeof totalScore === "number" ? totalScore : "—"}
                      <span className="ml-1 text-sm font-medium text-ink-tertiary">
                        /100
                      </span>
                    </p>
                  </div>
                </div>
                <ScoreRadar
                  data={scoredDimensions.map(({ label, score }) => ({
                    label,
                    score,
                  }))}
                />
              </div>
              <div className="space-y-2.5">
                {scoredDimensions.map(({ key, label, score }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs text-ink-secondary">
                      {label}
                    </span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-ink"
                        // Sub-scores are 0–10.
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums text-ink">
                      {score}
                      <span className="text-ink-tertiary">/10</span>
                    </span>
                  </div>
                ))}
              </div>
              {scoreRationale && (
                <p className="mt-4 text-[13px] leading-relaxed text-ink-secondary">
                  {scoreRationale}
                </p>
              )}
            </>
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
  // Normalize here so every call site is safe against "" and whitespace-only values.
  const display = normalizeText(value);
  return (
    <div className={className}>
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
        {label}
        {/* Only claim provenance when there's actually a value to attribute. */}
        {display && prov?.source === "external" && (
          <ExtTag confidence={prov.confidence} />
        )}
      </dt>
      <dd
        className={cn(
          "mt-1 text-sm leading-snug",
          display ? "font-medium text-ink" : "text-ink-tertiary"
        )}
      >
        {display ?? "—"}
      </dd>
    </div>
  );
}

// The provenance marker: web-enriched fields wear this; untagged = submitted.
function ExtTag({ confidence }: { confidence?: number | null }) {
  const tooltip =
    typeof confidence === "number" && Number.isFinite(confidence)
      ? `Web-enriched · ${Math.round(confidence * 100)}% confidence`
      : "Web-enriched";
  return (
    <span
      title={tooltip}
      className="inline-flex h-4 items-center rounded-[4px] border border-dashed border-line-strong px-1 align-middle text-[9.5px] font-medium uppercase tracking-[0.08em] text-ink-tertiary"
    >
      ext
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-ink-tertiary">{children}</p>;
}

function LoadError({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="max-w-md rounded-card border border-line bg-surface p-5">
        <h2 className="text-sm font-medium text-ink">Couldn&apos;t load this deal</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">
          {message}
        </p>
      </div>
    </div>
  );
}
