-- Deal sheet: ask/traction/thesis columns, field-level provenance, sub-scores.

alter table deals
  add column valuation text,
  add column use_of_funds text,
  add column revenue text,
  add column growth text,
  add column customers text,
  add column thesis_fit text,
  add column concerns text;

-- Provenance metadata for deal fields. The value lives in the deals column
-- named by field_name; this table records where it came from. Absent row =
-- founder-submitted (the default assumption the UI states in its legend).
create table extracted_fields (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals (id) on delete cascade,
  field_name text not null,
  source text not null check (source in ('submitted', 'external')),
  confidence numeric check (confidence between 0 and 1),
  source_url text,
  created_at timestamptz not null default now(),
  unique (deal_id, field_name)
);

-- Sub-scores behind deals.total_score, one row per dimension.
create table scores (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals (id) on delete cascade,
  dimension text not null,
  score integer not null check (score between 0 and 100),
  rationale text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (deal_id, dimension)
);

alter table extracted_fields enable row level security;
alter table scores enable row level security;
