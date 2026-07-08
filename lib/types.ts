export type DealStatus = "new" | "screening" | "due_diligence" | "ic_approval";

export const DEAL_STATUSES: ReadonlyArray<{ value: DealStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "screening", label: "Screening" },
  { value: "due_diligence", label: "Due Diligence" },
  { value: "ic_approval", label: "IC Approval" },
];

export type SourceTag = "submitted" | "external";

/** Written on intake, replaced by the pipeline once it extracts a real name. */
export const DEAL_PLACEHOLDER_NAME = "Processing…";

export interface RoundDetails {
  raising_amount?: string | null;
  valuation?: string | null;
  prior_investors?: string | null;
}

export interface TractionDetails {
  revenue?: string | null;
  customers?: string | null;
  growth_rate?: string | null;
}

export interface Founder {
  name?: string | null;
  role?: string | null;
  linkedin_url?: string | null;
  background?: string | null;
  source?: SourceTag;
  confidence?: number;
}

export interface ExternalSignal {
  title: string;
  summary?: string;
  url?: string;
  signal_date?: string;
  signal_type?: "positive" | "neutral" | "concerning";
}

export interface Deal {
  id: string;
  company_name: string | null;
  one_liner?: string | null;
  website?: string | null;
  sector?: string | null;
  stage?: string | null;
  /** jsonb, written verbatim from the extraction JSON. */
  round?: RoundDetails | null;
  /** jsonb, written verbatim from the extraction JSON. */
  traction?: TractionDetails | null;
  use_of_funds?: string | null;
  location?: string | null;
  founded_year?: string | null;
  tam?: string | null;
  arr?: string | null;
  status: DealStatus;
  total_score?: number;
  recommendation?: string | null;
  thesis_fit?: string | null;
  concerns?: string | null;
  source_channel?: string | null;
  missing_fields?: string[] | null;
  red_flags?: string[] | null;
  /** Why analysis failed. Null while healthy. */
  processing_error?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * True while the background pipeline is still enriching this deal: either it
 * hasn't resolved a company name yet, or it hasn't scored the deal yet. The
 * pipeline writes the score last, so an unscored deal is never fully analyzed.
 */
export function isDealProcessing(
  deal: Pick<Deal, "company_name" | "total_score">
): boolean {
  const name = deal.company_name?.trim();
  const unnamed = !name || /^processing/i.test(name);
  return unnamed || deal.total_score == null;
}

/** How long to wait for a silent pipeline before calling it stalled. */
export const PROCESSING_TIMEOUT_MS = 5 * 60_000;

export type DealProgress =
  | { state: "ready" }
  | { state: "analyzing" }
  | { state: "failed"; reason: string };

/** Everything you need to chase down a silent pipeline, in one line. */
export const analysisTimedOutReason = (dealId: string) =>
  `Analysis timed out after ${PROCESSING_TIMEOUT_MS / 60_000} minutes — the pipeline never wrote back. ` +
  `Check the n8n execution log for deal_id ${dealId}, confirm N8N_WEBHOOK_URL points at an *active* workflow ` +
  `(the /webhook/ path 404s until the workflow is activated), then re-run it.`;

/**
 * A deal's pipeline progress. `failed` is authoritative: a recorded error means
 * stop waiting. Otherwise fall back to whether enrichment has landed.
 */
export function getDealProgress(
  deal: Pick<Deal, "company_name" | "total_score" | "processing_error">
): DealProgress {
  const reason = deal.processing_error?.trim();
  if (reason) return { state: "failed", reason };
  return isDealProcessing(deal) ? { state: "analyzing" } : { state: "ready" };
}

/** Provenance for deals.<field_name>, carrying the extracted value it describes. */
export interface ExtractedField {
  field_name: string;
  value?: string | null;
  source?: SourceTag | null;
  confidence?: number | null;
}

/** One row per deal. Sub-scores are 0–10; `total` is 0–100. */
export interface Scores {
  thesis_fit?: number | null;
  founder_quality?: number | null;
  traction_quality?: number | null;
  market_timing?: number | null;
  round_attractiveness?: number | null;
  together_edge?: number | null;
  total?: number | null;
  rationale?: string | null;
}

/** The six 0–10 rubric dimensions (everything on Scores except total/rationale). */
export type ScoreDimensionKey = Exclude<keyof Scores, "total" | "rationale">;

/** The rubric, in the order a partner reads it. */
export const SCORE_DIMENSIONS: ReadonlyArray<{
  key: ScoreDimensionKey;
  label: string;
}> = [
  { key: "founder_quality", label: "Founders" },
  { key: "traction_quality", label: "Traction" },
  { key: "market_timing", label: "Market timing" },
  { key: "thesis_fit", label: "Thesis fit" },
  { key: "round_attractiveness", label: "Round" },
  { key: "together_edge", label: "Together edge" },
];

export interface DealDetail extends Deal {
  founders: Founder[];
  extracted_fields: ExtractedField[];
  external_signals: ExternalSignal[];
  // PostgREST embeds a one-to-many relation as an array even when unique.
  scores: Scores[] | Scores | null;
}
