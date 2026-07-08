-- Reconcile the schema with the extraction pipeline's contract.
--
-- Contract: the pipeline writes Claude's extraction JSON straight into `deals`.
-- Every top-level key of that JSON is a column here; the two nested objects
-- (round, traction) are jsonb blobs so no flattening is needed on write.
--
--   company_name, one_liner, sector, stage, website, founded_year, tam, arr,
--   round {raising_amount, valuation, prior_investors},
--   traction {revenue, customers, growth_rate},
--   missing_fields[], red_flags[]
--
-- `founders` is written to its own child table. `scores` is one row per deal
-- with a named column per rubric dimension.
--
-- Idempotent: safe to re-run.

------------------------------------------------------------------------------
-- deals: the pipeline's write target
------------------------------------------------------------------------------

-- The pipeline emits company_name: null before extraction resolves a name.
-- The UI renders "Untitled company" for that case.
alter table deals alter column company_name drop not null;

alter table deals
  -- Nested objects from the extraction JSON, stored verbatim.
  add column if not exists round jsonb,
  add column if not exists traction jsonb,
  -- Top-level array from the extraction JSON.
  add column if not exists red_flags text[] not null default '{}',
  -- Analyst-authored fields, not produced by extraction.
  add column if not exists use_of_funds text,
  add column if not exists thesis_fit text,
  add column if not exists concerns text;

-- missing_fields is already text[]; make its default explicit and non-null so
-- the UI never has to distinguish null from empty.
alter table deals alter column missing_fields set default '{}';
update deals set missing_fields = '{}' where missing_fields is null;
alter table deals alter column missing_fields set not null;

------------------------------------------------------------------------------
-- scores: one row per deal, a named column per rubric dimension
------------------------------------------------------------------------------

-- Present in the live database already; created here so a fresh database
-- built from these migrations lands on the identical shape.
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals (id) on delete cascade,
  thesis_fit integer,
  founder_quality integer,
  traction_quality integer,
  market_timing integer,
  round_attractiveness integer,
  together_edge integer,
  total integer,
  rationale text
);

create table if not exists extracted_fields (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals (id) on delete cascade,
  field_name text not null,
  value text,
  source text,
  confidence numeric
);

-- Sub-scores are 0-10; total is 0-100. Constraints were absent.
-- Clamp any existing out-of-range data before enforcing, so this cannot fail.
update scores set
  thesis_fit           = least(greatest(thesis_fit, 0), 10),
  founder_quality      = least(greatest(founder_quality, 0), 10),
  traction_quality     = least(greatest(traction_quality, 0), 10),
  market_timing        = least(greatest(market_timing, 0), 10),
  round_attractiveness = least(greatest(round_attractiveness, 0), 10),
  together_edge        = least(greatest(together_edge, 0), 10),
  total                = least(greatest(total, 0), 100);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'scores_subscores_range') then
    alter table scores add constraint scores_subscores_range check (
      (thesis_fit           is null or thesis_fit           between 0 and 10) and
      (founder_quality      is null or founder_quality      between 0 and 10) and
      (traction_quality     is null or traction_quality     between 0 and 10) and
      (market_timing        is null or market_timing        between 0 and 10) and
      (round_attractiveness is null or round_attractiveness between 0 and 10) and
      (together_edge        is null or together_edge        between 0 and 10)
    );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'scores_total_range') then
    alter table scores add constraint scores_total_range
      check (total is null or total between 0 and 100);
  end if;
end $$;

-- Exactly one scores row per deal, so the pipeline can upsert on deal_id.
-- Collapse any pre-existing duplicates first, keeping the most recent.
delete from scores s
  using scores keep
  where s.deal_id = keep.deal_id
    and s.id < keep.id;

create unique index if not exists scores_deal_id_key on scores (deal_id);

------------------------------------------------------------------------------
-- extracted_fields: field-level provenance, carrying the value it describes
------------------------------------------------------------------------------

-- One provenance row per (deal, field) so the pipeline can upsert.
delete from extracted_fields e
  using extracted_fields keep
  where e.deal_id = keep.deal_id
    and e.field_name = keep.field_name
    and e.id < keep.id;

create unique index if not exists extracted_fields_deal_field_key
  on extracted_fields (deal_id, field_name);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'extracted_fields_source_check') then
    alter table extracted_fields add constraint extracted_fields_source_check
      check (source in ('submitted', 'external'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'extracted_fields_confidence_range') then
    alter table extracted_fields add constraint extracted_fields_confidence_range
      check (confidence is null or confidence between 0 and 1);
  end if;
end $$;

------------------------------------------------------------------------------
-- Indexes for the reads the app actually performs
------------------------------------------------------------------------------

create index if not exists deals_status_idx on deals (status);
create index if not exists founders_deal_id_idx on founders (deal_id);
create index if not exists external_signals_deal_id_idx on external_signals (deal_id);
create index if not exists extracted_fields_deal_id_idx on extracted_fields (deal_id);

alter table scores enable row level security;
alter table extracted_fields enable row level security;
