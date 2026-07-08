import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DealAnalysisStatus } from "@/components/deal/DealAnalysisStatus";
import { DownloadPdfButton } from "@/components/deal/DownloadPdfButton";
import { RawInputs } from "@/components/deal/RawInputs";
import { ScoreRadar } from "@/components/deal/ScoreRadar";
import { SetupNotice } from "@/components/SetupNotice";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { cn } from "@/lib/cn";
import { getDealDetail, getRawInputs } from "@/lib/deals";
import {
  getDealProgress,
  SCORE_DIMENSIONS,
  type DealDetail,
  type ExtractedField,
  type Founder,
  type RawInput,
} from "@/lib/types";

// A deal sheet must always reflect the live record.
export const dynamic = "force-dynamic";

const FIELD_LABELS: Record<string, string> = {
  arr: "ARR",
  tam: "TAM",
  revenue: "Revenue",
  growth: "Growth",
  growth_rate: "Growth",
  customers: "Customers",
  round: "Round",
  raising_amount: "Round",
  valuation: "Valuation",
  prior_investors: "Prior investors",
  use_of_funds: "Use of funds",
  founders: "Founders",
  website: "Website",
  one_liner: "One-liner",
  traction: "Traction",
};

// Unknown field names still need to read as labels, not as column names.
const fieldLabel = (name: string) => {
  const known = FIELD_LABELS[name];
  if (known) return known;
  const words = name.replaceAll("_", " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * extracted_fields.field_name isn't a closed set — the extractor may name the
 * same value `growth` or `growth_rate`. Accept every alias so a provenance tag
 * never silently goes missing.
 */
const PROVENANCE_ALIASES: Record<string, string[]> = {
  round: ["round", "raising_amount"],
  valuation: ["valuation", "round.valuation"],
  prior_investors: ["prior_investors", "investors"],
  growth: ["growth", "growth_rate"],
  revenue: ["revenue"],
  customers: ["customers"],
  tam: ["tam"],
  arr: ["arr"],
  use_of_funds: ["use_of_funds"],
  one_liner: ["one_liner", "description"],
  website: ["website"],
};

function provenanceFor(
  map: Map<string, ExtractedField>,
  field: string
): ExtractedField | undefined {
  for (const alias of PROVENANCE_ALIASES[field] ?? [field]) {
    const hit = map.get(alias);
    if (hit) return hit;
  }
  return undefined;
}

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

/**
 * `founders` has no created_at, so the query falls back to ordering by uuid —
 * i.e. randomly. A partner expects the CEO first. Rank by role, keeping the
 * original order within a rank so the sort stays stable.
 */
const ROLE_RANK = [/chief exec|\bceo\b/i, /founder/i, /\bcto\b|chief tech/i];

function founderRank(founder: Founder): number {
  const role = founder.role ?? "";
  const hit = ROLE_RANK.findIndex((pattern) => pattern.test(role));
  return hit === -1 ? ROLE_RANK.length : hit;
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

  // Only the sheet renders source material, so don't pay for it on error paths.
  const rawInputs = result.ok ? await getRawInputs(id) : [];

  return (
    <div className="flex flex-1 flex-col">
      <header className="no-print flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface/90 px-6 shadow-[0_1px_0_rgba(255,91,85,0.08)]">
        <Link
          href="/"
          className="text-[13px] text-ink-secondary transition-colors hover:text-accent"
        >
          ← Pipeline
        </Link>
        <span className="font-display text-[24px] font-semibold leading-none text-accent">
          PitchSnitch
        </span>
      </header>
      <main className="flex flex-1 flex-col px-6 py-8">
        {result.ok ? (
          <DealSheet deal={result.deal} rawInputs={rawInputs} />
        ) : result.reason === "unconfigured" ? (
          <SetupNotice message={result.message} />
        ) : (
          <LoadError message={result.message} />
        )}
      </main>
    </div>
  );
}

function DealSheet({
  deal,
  rawInputs,
}: {
  deal: DealDetail;
  rawInputs: RawInput[];
}) {
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
  const founders = (deal.founders ?? [])
    .filter(hasFounderContent)
    .map((founder, index) => ({ founder, index }))
    .sort((a, b) => founderRank(a.founder) - founderRank(b.founder) || a.index - b.index)
    .map(({ founder }) => founder);
  const concerns = normalizeText(deal.concerns);
  const recommendation = normalizeText(deal.recommendation);
  const thesisFit = normalizeText(deal.thesis_fit);

  return (
    <article className="deal-sheet mx-auto w-full max-w-2xl">
      {/* Header */}
      <header>
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="font-display text-[34px] font-semibold leading-none text-ink">
              {companyName}
            </h1>
            {oneLiner ? (
              <p className="mt-1 text-[15px] leading-normal text-ink-secondary">
                {oneLiner}{" "}
                <Prov prov={provenanceFor(provenance, "one_liner")} />
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
                  </a>{" "}
                  <Prov prov={provenanceFor(provenance, "website")} />
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {progress.state === "ready" && (
              <div className="flex flex-col items-center gap-1">
                <ScoreRing score={totalScore} size={52} />
                <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
                  Score
                </span>
              </div>
            )}
            <div className="no-print">
              <DownloadPdfButton dealId={deal.id} />
            </div>
          </div>
        </div>

        <div className="no-print">
          <DealAnalysisStatus dealId={deal.id} progress={progress} />
        </div>

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
        <p className="mt-5 text-[11px] leading-relaxed text-ink-tertiary">
          Fields tagged <ExtTag /> were enriched from the web — hover one for its
          confidence. Untagged fields came from the founders.
        </p>
      </header>

      <div className="mt-8 space-y-8">
        {/* The ask */}
        <Section title="The ask">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Tile
              label="Round"
              value={roundDetails.raising_amount}
              prov={provenanceFor(provenance, "round")}
            />
            <Tile
              label="Valuation"
              value={roundDetails.valuation}
              prov={provenanceFor(provenance, "valuation")}
            />
            <Tile
              label="TAM"
              value={deal.tam}
              prov={provenanceFor(provenance, "tam")}
            />
            <Tile
              label="Prior investors"
              value={roundDetails.prior_investors}
              prov={provenanceFor(provenance, "prior_investors")}
              className="col-span-full"
            />
            <Tile
              label="Use of funds"
              value={deal.use_of_funds}
              prov={provenanceFor(provenance, "use_of_funds")}
              className="col-span-full"
            />
          </dl>
        </Section>

        {/* Traction */}
        <Section title="Traction">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Tile
              label="ARR"
              value={deal.arr}
              prov={provenanceFor(provenance, "arr")}
            />
            <Tile
              label="Revenue"
              value={tractionDetails.revenue}
              prov={provenanceFor(provenance, "revenue")}
            />
            <Tile
              label="Growth"
              value={tractionDetails.growth_rate}
              prov={provenanceFor(provenance, "growth")}
            />
            <Tile
              label="Customers"
              value={tractionDetails.customers}
              prov={provenanceFor(provenance, "customers")}
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
              {signals.map((signal, index) => {
                const tone = signal.signal_type ?? "neutral";
                const date = signal.signal_date && formatDate(signal.signal_date);
                return (
                  <li
                    key={`${signal.url ?? signal.title}-${index}`}
                    className="py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      {/* Never colour alone: the dot is paired with the word. */}
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            SIGNAL_DOTS[tone]
                          )}
                        />
                        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
                          {tone}
                        </span>
                      </span>
                      {signal.url ? (
                        <a
                          href={signal.url}
                          target="_blank"
                          rel="noreferrer"
                          className="min-w-0 flex-1 text-[13px] font-medium text-ink hover:underline"
                        >
                          {signal.title} ↗
                        </a>
                      ) : (
                        <span className="min-w-0 flex-1 text-[13px] font-medium text-ink">
                          {signal.title}
                        </span>
                      )}
                      {date && (
                        <span className="shrink-0 text-[11px] tabular-nums text-ink-tertiary">
                          {date}
                        </span>
                      )}
                    </div>
                    {signal.summary && (
                      <p className="mt-1 text-xs leading-relaxed text-ink-secondary">
                        {signal.summary}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* Concerns, red flags, and data gaps read as one honest assessment
            rather than three sections each announcing their own emptiness. */}
        <Section title="Concerns & gaps">
          {!concerns && redFlags.length === 0 && missing.length === 0 ? (
            <Empty>Nothing flagged. No concerns, no red flags, no data gaps.</Empty>
          ) : (
            <div className="space-y-5">
              {concerns && (
                <p className="text-sm leading-relaxed text-ink-secondary">
                  {concerns}
                </p>
              )}

              {redFlags.length > 0 && (
                <div>
                  <SubHeading>Red flags</SubHeading>
                  <ul className="mt-2 space-y-1.5">
                    {redFlags.map((flag, index) => (
                      <li
                        key={`${flag}-${index}`}
                        className="flex items-start gap-2 text-sm leading-relaxed text-ink-secondary"
                      >
                        <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-caution" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {missing.length > 0 && (
                <div>
                  <SubHeading>Missing from the pitch</SubHeading>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {missing.map((field, index) => (
                      <Badge key={`${field}-${index}`} tone="outline">
                        {fieldLabel(field)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Score breakdown */}
        <Section title="Score breakdown">
          {!scoredDimensions.length ? (
            <Empty>Not yet scored.</Empty>
          ) : (
            <>
              {/* The hero figure and the radar are one unit: the number says how
                  good, the shape says why. The header already carries the ring,
                  so it isn't repeated here. */}
              <div className="mb-6 grid items-center gap-6 rounded-card border border-line bg-surface/85 p-5 shadow-[0_2px_14px_rgba(33,20,45,0.05)] md:grid-cols-[auto_minmax(15rem,1fr)]">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
                    Total score
                  </p>
                  <p className="mt-1 font-display text-6xl font-semibold leading-none text-accent">
                    {typeof totalScore === "number" ? totalScore : "—"}
                    <span className="ml-1.5 font-sans text-sm font-medium text-ink-tertiary">
                      /100
                    </span>
                  </p>
                  {scoreRationale && (
                    <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-secondary">
                      {scoreRationale}
                    </p>
                  )}
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
                    <span className="w-24 shrink-0 text-xs text-ink-secondary sm:w-28">
                      {label}
                    </span>
                    <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-ink"
                        // Sub-scores are 0–10.
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="w-11 shrink-0 text-right text-xs font-medium tabular-nums text-ink">
                      {score}
                      <span className="text-ink-tertiary">/10</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

        {/* The appendix: where all of the above came from. */}
        <RawInputs inputs={rawInputs} />
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
        {display && <Prov prov={prov} />}
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

/**
 * The single place that decides whether a field earns a provenance tag, so the
 * rule ("external gets tagged, submitted stays bare") can't drift between the
 * header, the tiles, and the team list.
 */
function Prov({ prov }: { prov?: ExtractedField }) {
  if (prov?.source !== "external") return null;
  return <ExtTag confidence={prov.confidence} />;
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-secondary">
      {children}
    </p>
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
