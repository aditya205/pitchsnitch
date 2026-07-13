-- Three standalone sample deals: one strong fintech-infra (82), one mid (63),
-- one early/weak (34). Written against the pipeline contract: round/traction
-- are jsonb, red_flags is text[], scores is one row of named 0-10 dimensions.
--
-- Requires 0001 + 0003 + 0004. Re-runnable — deletes only its own rows first.

delete from deals where id in (
  'bbbbbbbb-0000-4000-8000-000000000001',
  'bbbbbbbb-0000-4000-8000-000000000002',
  'bbbbbbbb-0000-4000-8000-000000000003'
);

insert into deals
  (id, company_name, one_liner, website, sector, stage, location, founded_year, tam, arr,
   round, traction, red_flags, use_of_funds, why_it_fits, concerns,
   status, total_score, recommendation, source_channel, missing_fields, created_at)
values
  (
    'bbbbbbbb-0000-4000-8000-000000000001', 'Ledgerline',
    'Double-entry ledger API for fintechs that can''t afford to get balances wrong.',
    'https://ledgerline.example.com', 'Fintech Infrastructure', 'Series A',
    'New York, NY', '2022', '$9.5B', '$1.85M',
    '{"raising_amount":"$10M","valuation":"$55M pre","prior_investors":"Susa Ventures, Basis Set"}'::jsonb,
    '{"revenue":"$2.0M TTM","customers":"24 fintechs, incl. two unicorn neobanks","growth_rate":"3.4x YoY"}'::jsonb,
    array['Formance''s open-source ledger is gaining traction with early-stage teams; pricing pressure likely at the low end.'],
    '12 engineering hires, SOC 2 Type II + PCI, EU data region',
    'Core fintech-infrastructure thesis: every fintech rebuilds a ledger badly; Ledgerline sells the correctness layer as an API.',
    'Enterprise pipeline claims need confirmatory diligence.',
    'due_diligence', 82,
    'Advance to IC — cleanest wedge we''ve seen into fintech''s ledger layer.',
    'referral', '{}', now() - interval '16 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000002', 'Quarry',
    'Procurement analytics for mid-market manufacturers.',
    'https://quarry.example.com', 'B2B SaaS', 'Seed',
    'Pittsburgh, PA', '2023', '$5.4B', '$420K',
    '{"raising_amount":"$3.5M","valuation":"$18M cap","prior_investors":"Draper Triangle"}'::jsonb,
    '{"revenue":null,"customers":"19 plants across 11 manufacturers","growth_rate":"2.2x YoY"}'::jsonb,
    array['Epicor bundles a competing procurement dashboard at no extra cost.'],
    'First AE hires, ERP integrations (NetSuite, Epicor)',
    'Vertical data plays in unglamorous industries fit the fund''s track record, though procurement sits a step removed from core infrastructure.',
    'Pilots run 90+ days and the champion often lacks budget authority; sales efficiency unproven.',
    'screening', 63, null, 'email', '{}', now() - interval '8 days'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000003', 'Pantryloop',
    'Reusable packaging network for grocery delivery in dense metros.',
    'https://pantryloop.example.com', 'Climate', 'Pre-seed',
    'Brooklyn, NY', '2025', null, null,
    '{"raising_amount":"$900K SAFE","valuation":"$6M cap","prior_investors":null}'::jsonb,
    '{"revenue":null,"customers":"600-household pilot with FreshDirect (concluded)","growth_rate":null}'::jsonb,
    array[
      'Solo founder with no technical co-founder.',
      'FreshDirect pilot ended without conversion.',
      'Unit economics need >80% return rates; pilot achieved 64%.'
    ],
    null, null,
    'Pilot ended without renewal; return-rate economics unproven at scale.',
    'new', 34, null, 'website_form', '{arr,tam}', now() - interval '3 days'
  );

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

-- Provenance: field_name names a deals column; value is what was extracted.
insert into extracted_fields (deal_id, field_name, value, source, confidence) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'tam', '$9.5B', 'external', 0.68),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'arr', '$1.85M', 'submitted', 0.97),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'traction', '3.4x YoY', 'submitted', 0.94),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'tam', '$5.4B', 'external', 0.62),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'arr', '$420K', 'submitted', 0.95),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'customers', '600-household pilot with FreshDirect', 'external', 0.66);

-- One scores row per deal: six 0-10 dimensions, a 0-100 total, one rationale.
insert into scores (deal_id, founder_quality, traction_quality, market_timing, thesis_fit, round_attractiveness, together_edge, total, rationale) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 9, 8, 8, 9, 7, 8, 82,
   'Ledger product owner from Modern Treasury paired with the engineer who scaled Marqeta''s. 3.4x YoY on $1.85M ARR with two unicorn logos. OSS alternative caps pricing at the low end, but the wedge is dead-center thesis.'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 7, 6, 6, 6, 7, 6, 63,
   'Relevant vertical PM experience with a thin commercial bench. Real budget line, but ERP incumbents bundle adjacent features and long pilots slow the ramp.'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 4, 2, 4, 3, 4, 3, 34,
   'Solo founder without logistics-tech depth. Single pilot concluded without renewal; return-rate economics unsolved at 64% against an 80% breakeven. Outside the fund''s software focus.');
