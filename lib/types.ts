export type DealStatus = "new" | "screening" | "due_diligence" | "ic_approval";

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
  location?: string;
  founded_year?: string;
  tam?: string;
  arr?: string;
  status: DealStatus;
  total_score?: number;
  recommendation?: string;
  source_channel?: string;
  missing_fields?: string[];
  created_at?: string;
  updated_at?: string;
}
