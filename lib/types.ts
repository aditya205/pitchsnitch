export type DealStatus = "new" | "screening" | "due_diligence" | "ic_approval";

export const DEAL_STATUSES: ReadonlyArray<{ value: DealStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "screening", label: "Screening" },
  { value: "due_diligence", label: "Due Diligence" },
  { value: "ic_approval", label: "IC Approval" },
];

export type SourceTag = "submitted" | "external";

export interface Founder {
  name: string;
  role?: string;
  linkedin_url?: string;
  background?: string;
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
  company_name: string;
  one_liner?: string;
  website?: string;
  sector?: string;
  stage?: string;
  round?: string;
  valuation?: string;
  use_of_funds?: string;
  location?: string;
  founded_year?: string;
  tam?: string;
  arr?: string;
  revenue?: string;
  growth?: string;
  customers?: string;
  status: DealStatus;
  total_score?: number;
  recommendation?: string;
  thesis_fit?: string;
  concerns?: string;
  source_channel?: string;
  missing_fields?: string[];
  created_at?: string;
  updated_at?: string;
}

/** Provenance metadata: where the value in deals.<field_name> came from. */
export interface ExtractedField {
  field_name: string;
  source: SourceTag;
  confidence?: number;
  source_url?: string;
}

export interface ScoreDimension {
  dimension: string;
  score: number;
  rationale?: string;
  position: number;
}

export interface DealDetail extends Deal {
  founders: Founder[];
  extracted_fields: ExtractedField[];
  external_signals: ExternalSignal[];
  scores: ScoreDimension[];
}
