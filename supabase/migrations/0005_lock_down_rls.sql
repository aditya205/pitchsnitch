-- SECURITY: close public access to the deal pipeline.
--
-- The live database was created without row level security. Because the
-- publishable (anon) key is embedded in every browser bundle by design, this
-- means anyone who loads the app can read every deal, every founder, and every
-- raw_inputs row (raw pitch emails and uploaded decks) — and can insert and
-- delete deals at will. Verified against the live database on 2026-07-08.
--
-- PitchSnitch reads and writes exclusively through the server-side secret key
-- (see lib/supabaseAdmin.ts), which bypasses RLS. So enabling RLS with **no
-- policies** locks out the anon role completely and changes nothing about how
-- the app works.
--
-- Consequence: browser-side Supabase Realtime will receive no rows, because it
-- subscribes as the anon role. That is intentional. Live updates are delivered
-- by polling the server instead. If you later add authentication and want
-- Realtime in the browser, add SELECT policies scoped to authenticated fund
-- members here — never a blanket `using (true)`.
--
-- Idempotent: safe to re-run.

alter table deals             enable row level security;
alter table founders          enable row level security;
alter table external_signals  enable row level security;
alter table raw_inputs        enable row level security;

-- These two may not exist on very old databases; guard the calls.
do $$
begin
  if to_regclass('public.extracted_fields') is not null then
    execute 'alter table extracted_fields enable row level security';
  end if;
  if to_regclass('public.scores') is not null then
    execute 'alter table scores enable row level security';
  end if;
end $$;

-- Deliberately no policies. With RLS on and zero policies, the anon and
-- authenticated roles can do nothing; the secret key still has full access.
-- Revoke the default grants too, so a future policy can't silently widen access.
revoke all on deals            from anon, authenticated;
revoke all on founders         from anon, authenticated;
revoke all on external_signals from anon, authenticated;
revoke all on raw_inputs       from anon, authenticated;

do $$
begin
  if to_regclass('public.extracted_fields') is not null then
    execute 'revoke all on extracted_fields from anon, authenticated';
  end if;
  if to_regclass('public.scores') is not null then
    execute 'revoke all on scores from anon, authenticated';
  end if;
end $$;
