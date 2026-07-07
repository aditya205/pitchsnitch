-- Three standalone sample deals: one strong fintech-infra (82), one mid (63),
-- one early/weak (34). Safe to run with or without seed.sql; re-runnable —
-- deletes only its own rows first (children cascade).

delete from deals where id in (
  'bbbbbbbb-0000-4000-8000-000000000001',
  'bbbbbbbb-0000-4000-8000-000000000002',
  'bbbbbbbb-0000-4000-8000-000000000003'
);

insert into deals
  (id, company_name, one_liner, website, sector, stage, round, valuation, use_of_funds, location, founded_year, tam, arr, revenue, growth, customers, status, total_score, recommendation, thesis_fit, concerns, source_channel, missing_fields, created_at)
values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'Ledgerline', 'Double-entry ledger API for fintechs that can''t afford to get balances wrong.', 'https://ledgerline.example.com', 'Fintech Infrastructure', 'Series A', '$10M', '$55M pre', '12 engineering hires, SOC 2 Type II + PCI, EU data region', 'New York, NY', '2022', '$9.5B', '$1.85M', '$2.0M TTM', '3.4x YoY', '24 fintechs, incl. two unicorn neobanks', 'due_diligence', 82, 'Advance to IC — cleanest wedge we''ve seen into fintech''s ledger layer; verify the enterprise pipeline claims during confirmatory diligence.', 'Core fintech-infrastructure thesis: every fintech rebuilds a ledger badly; Ledgerline sells the correctness layer as an API with usage-based pricing.', 'Formance''s open-source ledger is gaining traction with early-stage teams; pricing pressure likely at the low end of market.', 'referral', '{}', now() - interval '16 days'),

  ('bbbbbbbb-0000-4000-8000-000000000002', 'Quarry', 'Procurement analytics for mid-market manufacturers.', 'https://quarry.example.com', 'B2B SaaS', 'Seed', '$3.5M', '$18M cap', 'First AE hires, ERP integrations (NetSuite, Epicor)', 'Pittsburgh, PA', '2023', '$5.4B', '$420K', null, '2.2x YoY', '19 plants across 11 manufacturers', 'screening', 63, null, 'Vertical data plays in unglamorous industries fit the fund''s track record, though procurement sits a step removed from core infrastructure.', 'Pilots run 90+ days and the champion often lacks budget authority; sales efficiency unproven.', 'email', '{}', now() - interval '8 days'),

  ('bbbbbbbb-0000-4000-8000-000000000003', 'Pantryloop', 'Reusable packaging network for grocery delivery in dense metros.', 'https://pantryloop.example.com', 'Climate', 'Pre-seed', '$900K SAFE', '$6M cap', null, 'Brooklyn, NY', '2025', null, null, null, null, '600-household pilot with FreshDirect (concluded)', 'new', 34, null, null, 'Solo founder; pilot ended without conversion; unit economics depend on return rates above 80%, pilot achieved 64%.', 'website_form', '{arr,tam}', now() - interval '3 days');

insert into founders (deal_id, name, role, linkedin_url, background, source, confidence) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'Priya Raman', 'CEO', 'https://linkedin.com/in/priyaraman', 'Led the ledger product at Modern Treasury; before that payments risk at Square.', 'submitted', 0.96),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'Felix Braun', 'CTO', 'https://linkedin.com/in/felixbraun', 'Staff engineer at Marqeta; owned the core issuing ledger through 10x transaction growth.', 'external', 0.79),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Elena Marsh', 'CEO', 'https://linkedin.com/in/elenamarsh', 'PM for supplier analytics at SPS Commerce; grew the product line to $30M ARR.', 'submitted', 0.93),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Derek Cho', 'CTO', 'https://linkedin.com/in/derekcho', 'Forward-deployed engineer at Palantir on industrial supply-chain deployments.', 'external', 0.71),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'Jonah Fields', 'CEO', 'https://linkedin.com/in/jonahfields', 'Operations manager at Blue Apron; ran last-mile logistics for the Northeast region.', 'submitted', 0.90);

insert into external_signals (deal_id, title, summary, url, signal_date, signal_type) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'Ledgerline named in Forbes Fintech 50', 'List placement citing 3.4x growth and adoption by two unicorn neobanks.', 'https://news.example.com/ledgerline-fintech50', '2026-04-14', 'positive'),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'Formance raises $18M Series A for open-source ledger', 'Direct competitor with an OSS motion; strong developer traction at the low end.', 'https://news.example.com/formance-series-a', '2026-06-09', 'concerning'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Quarry signs 3-year agreement with Wabtec supplier network', 'Multi-plant rollout across a tier-1 rail supplier network.', 'https://news.example.com/quarry-wabtec', '2026-06-18', 'positive'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Epicor launches procurement dashboard add-on', 'Incumbent ERP shipping overlapping analytics bundled at no extra cost.', 'https://news.example.com/epicor-dashboard', '2026-04-22', 'concerning'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'Wins NYC circular-economy grant ($75K)', 'Non-dilutive city grant for reusable packaging pilots.', 'https://news.example.com/pantryloop-grant', '2026-03-05', 'positive'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'FreshDirect pilot ends without renewal', 'Six-month pilot concluded; grocer cites return-rate economics.', 'https://news.example.com/pantryloop-freshdirect', '2026-05-30', 'concerning');

insert into extracted_fields (deal_id, field_name, source, confidence, source_url) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'tam', 'external', 0.68, 'https://news.example.com/ledger-infra-market-2026'),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'arr', 'submitted', 0.97, null),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'growth', 'submitted', 0.94, null),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'customers', 'external', 0.73, 'https://news.example.com/ledgerline-fintech50'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'tam', 'external', 0.62, 'https://news.example.com/procurement-software-market'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'arr', 'submitted', 0.95, null),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'customers', 'external', 0.66, 'https://news.example.com/pantryloop-freshdirect');

insert into scores (deal_id, dimension, score, rationale, position) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'Team', 86, 'Ledger product owner from Modern Treasury paired with the engineer who scaled Marqeta''s.', 1),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'Market', 76, 'Every fintech needs one; OSS alternative caps pricing at the low end.', 2),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'Traction', 84, '3.4x YoY at $1.85M ARR; two unicorn logos with expanding usage.', 3),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'Product', 83, 'Correctness guarantees and audit trails incumbents don''t offer as an API.', 4),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'Thesis Fit', 88, 'Dead-center fintech-infrastructure thesis.', 5),

  ('bbbbbbbb-0000-4000-8000-000000000002', 'Team', 68, 'Relevant vertical PM experience; commercial bench thin beyond the CEO.', 1),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Market', 62, 'Real budget line, but ERP incumbents bundle adjacent features.', 2),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Traction', 58, '$420K ARR growing 2.2x; long pilots slow the ramp.', 3),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Product', 66, 'ERP integrations are a genuine moat if they land NetSuite and Epicor.', 4),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Thesis Fit', 61, 'Vertical SaaS adjacency, not core infrastructure.', 5),

  ('bbbbbbbb-0000-4000-8000-000000000003', 'Team', 45, 'Solo founder; ops background without logistics-tech or consumer depth.', 1),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'Market', 40, 'Regulatory tailwinds exist but adoption depends on grocer margins.', 2),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'Traction', 22, 'Single pilot, concluded without renewal.', 3),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'Product', 38, 'Return-rate economics unsolved; 64% vs the 80% breakeven.', 4),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'Thesis Fit', 30, 'Outside the fund''s software focus; capital-intensive ops.', 5);
