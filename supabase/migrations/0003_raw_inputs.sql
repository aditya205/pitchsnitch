-- Raw intake: the unprocessed text/file a deal was created from, before the
-- pipeline extracts structured fields. Idempotent — the table may already exist.

create table if not exists raw_inputs (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals (id) on delete cascade,
  source text,                     -- 'upload' | 'n8n' | future channels
  raw_text text,                   -- pasted email / WhatsApp / founder notes
  file_url text,                   -- storage path in the deal-files bucket
  created_at timestamptz not null default now()
);

create index if not exists raw_inputs_deal_id_idx on raw_inputs (deal_id);

alter table raw_inputs enable row level security;

-- The private storage bucket 'deal-files' is created via the storage API
-- (see scripts/ensure-bucket or the API route's lazy check), not SQL, because
-- buckets live in storage.buckets and are managed through Supabase's storage
-- service rather than plain DDL.
