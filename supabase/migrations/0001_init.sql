-- PitchSnitch core schema: deal pipeline, founders, external signals.

create type deal_status as enum ('new', 'screening', 'due_diligence', 'ic_approval');
create type founder_source as enum ('submitted', 'external');
create type signal_type as enum ('positive', 'neutral', 'concerning');

create table deals (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  one_liner text,
  website text,
  sector text,
  stage text,
  round text, -- the ask for the current raise, e.g. "$2.5M SAFE"
  location text,
  founded_year text,
  tam text,
  arr text,
  status deal_status not null default 'new',
  total_score integer check (total_score between 0 and 100),
  recommendation text,
  source_channel text,
  missing_fields text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table founders (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals (id) on delete cascade,
  name text not null,
  role text,
  linkedin_url text,
  background text,
  source founder_source not null default 'submitted',
  confidence numeric check (confidence between 0 and 1),
  created_at timestamptz not null default now()
);

create table external_signals (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals (id) on delete cascade,
  title text not null,
  summary text,
  url text,
  signal_date date,
  signal_type signal_type not null default 'neutral',
  created_at timestamptz not null default now()
);

create index deals_status_idx on deals (status);
create index founders_deal_id_idx on founders (deal_id);
create index external_signals_deal_id_idx on external_signals (deal_id);

create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger deals_set_updated_at
  before update on deals
  for each row execute function set_updated_at();

-- All reads/writes go through the server-side service-role client, which
-- bypasses RLS. Keeping RLS enabled with no policies means the anon key
-- can read nothing if it ever leaks into a client bundle.
alter table deals enable row level security;
alter table founders enable row level security;
alter table external_signals enable row level security;
