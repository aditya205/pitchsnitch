-- Dev seed: a realistic pipeline snapshot across all four stages.
-- Resets all deal data — do not run against anything you care about.

truncate table deals cascade;

insert into deals
  (id, company_name, one_liner, website, sector, stage, round, valuation, use_of_funds, location, founded_year, tam, arr, revenue, growth, customers, status, total_score, recommendation, thesis_fit, concerns, source_channel, missing_fields, created_at)
values
  -- New
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Corridor', 'Payment rails for cross-border payroll in Southeast Asia.', 'https://corridor.example.com', 'Fintech', 'Seed', '$3M', null, null, 'Singapore', '2024', null, null, null, null, '9 pilot customers across ID and PH', 'new', null, null, null, null, 'email', '{arr,tam}', now() - interval '2 days'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'Hollowcore', 'Precast concrete marketplace connecting fabricators to mid-size developers.', 'https://hollowcore.example.com', 'Marketplaces', 'Pre-seed', '$1.2M SAFE', '$8M cap', null, 'Austin, TX', '2025', '$4.1B', null, null, null, null, 'new', null, null, null, null, 'website_form', '{arr}', now() - interval '1 day'),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'Fieldnote', 'Agronomy copilot that turns satellite and soil data into per-acre planting plans.', 'https://fieldnote.example.com', 'AgTech', 'Seed', '$2.5M', '$14M cap', null, 'Des Moines, IA', '2023', '$8.7B', '$180K', null, '2.1x YoY', '46 farm accounts in the Midwest', 'new', 58, null, null, null, 'referral', '{}', now() - interval '4 days'),

  -- Screening
  ('aaaaaaaa-0000-4000-8000-000000000004', 'Lightflask', 'Observability for LLM pipelines with replayable traces.', 'https://lightflask.example.com', 'Dev Tools', 'Seed', '$4M', '$28M cap', 'Eval tooling, 4 engineering hires', 'San Francisco, CA', '2024', null, '$310K', null, '18% MoM', '72 teams on paid plans, two Fortune 500 pilots', 'screening', 72, null, 'LLM infra observability sits inside the fund''s dev-tools thesis; replayable traces are a wedge into eval and regression tooling.', null, 'email', '{tam}', now() - interval '9 days'),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'Bramble Health', 'Virtual-first pediatric behavioral care billed through Medicaid.', 'https://bramble.example.com', 'Healthcare', 'Series A', '$9M', '$40M pre', 'Two-state expansion, clinician hiring', 'Columbus, OH', '2022', '$21B', '$1.4M', '$1.6M TTM', '2.4x YoY', '11 Medicaid MCO contracts across 3 states', 'screening', 64, null, null, 'Reimbursement rates vary by state; unit economics hinge on clinician utilization.', 'referral', '{}', now() - interval '12 days'),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'Kelpworks', 'Turns farmed kelp into food-grade packaging films.', 'https://kelpworks.example.com', 'Climate', 'Pre-seed', '$1.5M SAFE', '$8M cap', 'Pilot production line', 'Portland, ME', '2024', '$2.9B', null, null, null, 'LOIs with two CPG brands', 'screening', 41, null, null, 'Pre-revenue; film performance unproven outside lab conditions.', 'event', '{arr}', now() - interval '7 days'),

  -- Due diligence
  ('7f1e8a4c-2b3d-4e5f-9a6b-1c2d3e4f5a6b', 'Statline', 'Real-time revenue reconciliation for usage-based SaaS billing.', 'https://statline.example.com', 'Fintech', 'Series A', '$12M', '$48M pre', 'GTM hires (8), EU data residency, SOC 2 Type II', 'New York, NY', '2022', '$14B', '$2.1M', '$2.3M TTM', '3.1x YoY', '38 paying, incl. three public API-first companies', 'due_diligence', 81, 'Advance — strong wedge into a painful workflow; watch competitive density around billing platforms.', 'Usage-based billing is the fund''s core B2B infra thesis; Statline owns the reconciliation layer every billing stack needs but none provides.', 'Maxio moving into reconciliation; pricing pressure possible. Head of Sales seat empty during a GTM-heavy raise.', 'referral', '{}', now() - interval '21 days'),
  ('aaaaaaaa-0000-4000-8000-000000000008', 'Porto Robotics', 'Autonomous yard trucks for container terminals.', 'https://porto.example.com', 'Robotics', 'Series A', '$15M', '$95M pre', 'Fleet expansion to 3 new terminals, safety certification', 'Rotterdam, NL', '2021', '$11B', '$3.8M', '$4.6M TTM', '1.9x YoY', 'APM Terminals, ECT Rotterdam, 2 paid pilots', 'due_diligence', 77, null, 'Autonomy in constrained industrial environments — closer to the fund''s software core than open-road AV.', 'Hardware capex intensity; 9–14 month sales cycles.', 'email', '{}', now() - interval '18 days'),

  -- IC approval
  ('9b2c7d5e-4f6a-4b8c-8d9e-2f3a4b5c6d7e', 'Meridian OS', 'System of record for multi-entity accounting at global startups.', 'https://meridianos.example.com', 'B2B SaaS', 'Series A', '$10M', '$52M pre', 'US expansion, treasury module, 12 engineering hires', 'London, UK', '2021', '$18B', '$2.9M', '$3.2M TTM', '3x YoY', '210 customers; 74% on multi-entity plans; NRR 128%', 'ic_approval', 88, 'Recommend investment — category-defining team, efficient growth, clear expansion path into treasury.', 'Core fintech-infrastructure thesis; multi-entity accounting is underserved by both ERPs and startups, with expansion into treasury.', 'VP Sales departure unexplained; US go-to-market unproven.', 'referral', '{}', now() - interval '35 days'),
  ('aaaaaaaa-0000-4000-8000-000000000010', 'Anchorlight', 'Continuous compliance monitoring for defense suppliers.', 'https://anchorlight.example.com', 'Cybersecurity', 'Seed', '$5M', '$30M pre', 'FedRAMP path, compliance content team, 6 hires', 'Arlington, VA', '2023', '$6.2B', '$740K', null, '22% MoM', '31 defense suppliers, incl. two primes', 'ic_approval', 84, 'Recommend investment — regulatory tailwind (CMMC 2.0) and unusually strong early logos.', 'Compliance automation with a regulatory forcing function; recurring revenue with audit-season stickiness.', 'CMMC enforcement timing could slip 12+ months.', 'event', '{}', now() - interval '41 days');

insert into founders (deal_id, name, role, linkedin_url, background, source, confidence) values
  ('7f1e8a4c-2b3d-4e5f-9a6b-1c2d3e4f5a6b', 'Dana Whitfield', 'CEO', 'https://linkedin.com/in/danawhitfield', 'Ex-Stripe billing PM; built usage-based invoicing for the top 50 API companies.', 'submitted', 0.95),
  ('7f1e8a4c-2b3d-4e5f-9a6b-1c2d3e4f5a6b', 'Arjun Mehta', 'CTO', 'https://linkedin.com/in/arjunmehta', 'Former staff engineer at Plaid; led the transactions ledger rewrite.', 'external', 0.82),
  ('9b2c7d5e-4f6a-4b8c-8d9e-2f3a4b5c6d7e', 'Ines Kovač', 'CEO', 'https://linkedin.com/in/ineskovac', 'Second-time founder; sold FX-ops startup Ledgerly to Adyen in 2019.', 'submitted', 0.97),
  ('9b2c7d5e-4f6a-4b8c-8d9e-2f3a4b5c6d7e', 'Tom Osei', 'CTO', 'https://linkedin.com/in/tomosei', 'Ex-Xero principal engineer; deep multi-currency GL experience.', 'external', 0.78),
  ('aaaaaaaa-0000-4000-8000-000000000008', 'Jeroen van Dijk', 'CEO', 'https://linkedin.com/in/jeroenvandijk', 'Former director of terminal automation at Kalmar; 15 years in port logistics.', 'submitted', 0.9),
  ('aaaaaaaa-0000-4000-8000-000000000010', 'Maya Reyes', 'CEO', 'https://linkedin.com/in/mayareyes', 'Former CISO at a defense prime subcontractor; led CMMC readiness practice at Deloitte.', 'submitted', 0.96),
  ('aaaaaaaa-0000-4000-8000-000000000010', 'Caleb Stone', 'CTO', 'https://linkedin.com/in/calebstone', 'Ex-NSA; built continuous-monitoring pipelines at Expel.', 'external', 0.74);

insert into external_signals (deal_id, title, summary, url, signal_date, signal_type) values
  ('7f1e8a4c-2b3d-4e5f-9a6b-1c2d3e4f5a6b', 'Statline raises $2M seed led by Susa Ventures', 'TechCrunch coverage of the seed round, 14 months before the current raise.', 'https://news.example.com/statline-seed', '2025-05-02', 'positive'),
  ('7f1e8a4c-2b3d-4e5f-9a6b-1c2d3e4f5a6b', 'Maxio launches native reconciliation module', 'Adjacent incumbent shipping overlapping functionality; pricing undercuts Statline.', 'https://news.example.com/maxio-recon', '2026-05-18', 'concerning'),
  ('9b2c7d5e-4f6a-4b8c-8d9e-2f3a4b5c6d7e', 'Meridian OS named in Sifted "B2B SaaS to watch"', 'Editorial list placement; cites 3x YoY growth and low churn.', 'https://news.example.com/meridian-sifted', '2026-03-11', 'positive'),
  ('9b2c7d5e-4f6a-4b8c-8d9e-2f3a4b5c6d7e', 'Head of Sales departure', 'LinkedIn shows VP Sales left after 11 months; no replacement announced.', 'https://news.example.com/meridian-vp-sales', '2026-06-20', 'neutral'),
  ('aaaaaaaa-0000-4000-8000-000000000008', 'Kalmar announces autonomous terminal tractor partnership', 'Incumbent equipment maker partnering with a Porto competitor on yard autonomy.', 'https://news.example.com/kalmar-autonomy', '2026-06-02', 'concerning'),
  ('aaaaaaaa-0000-4000-8000-000000000010', 'Anchorlight wins AFWERX SBIR Phase II contract', '$1.2M non-dilutive award for continuous-monitoring deployment with the Air Force.', 'https://news.example.com/anchorlight-afwerx', '2026-04-28', 'positive');

-- Field-level provenance: which deal fields came from the web vs the founders.
insert into extracted_fields (deal_id, field_name, source, confidence, source_url) values
  ('7f1e8a4c-2b3d-4e5f-9a6b-1c2d3e4f5a6b', 'tam', 'external', 0.72, 'https://news.example.com/saas-billing-market-2026'),
  ('7f1e8a4c-2b3d-4e5f-9a6b-1c2d3e4f5a6b', 'arr', 'submitted', 0.98, null),
  ('7f1e8a4c-2b3d-4e5f-9a6b-1c2d3e4f5a6b', 'growth', 'submitted', 0.95, null),
  ('9b2c7d5e-4f6a-4b8c-8d9e-2f3a4b5c6d7e', 'growth', 'external', 0.64, 'https://news.example.com/meridian-sifted'),
  ('9b2c7d5e-4f6a-4b8c-8d9e-2f3a4b5c6d7e', 'tam', 'external', 0.58, 'https://news.example.com/global-accounting-software-market'),
  ('9b2c7d5e-4f6a-4b8c-8d9e-2f3a4b5c6d7e', 'arr', 'submitted', 0.97, null),
  ('9b2c7d5e-4f6a-4b8c-8d9e-2f3a4b5c6d7e', 'customers', 'submitted', 0.95, null),
  ('aaaaaaaa-0000-4000-8000-000000000008', 'customers', 'external', 0.81, 'https://news.example.com/port-technology-porto'),
  ('aaaaaaaa-0000-4000-8000-000000000008', 'tam', 'external', 0.66, 'https://news.example.com/terminal-automation-market'),
  ('aaaaaaaa-0000-4000-8000-000000000010', 'tam', 'external', 0.70, 'https://news.example.com/grc-defense-market'),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'tam', 'external', 0.55, 'https://news.example.com/sustainable-packaging-market'),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'tam', 'external', 0.61, 'https://news.example.com/pediatric-behavioral-market'),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'arr', 'submitted', 0.93, null);

-- Sub-scores behind each total, in display order.
insert into scores (deal_id, dimension, score, rationale, position) values
  ('aaaaaaaa-0000-4000-8000-000000000003', 'Team', 62, 'Domain-strong agronomists; no ML depth on the founding team.', 1),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'Market', 64, 'Large but consolidating buyer base.', 2),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'Traction', 48, 'Early revenue, single-region.', 3),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'Product', 60, 'Compelling demo; per-acre accuracy unvalidated at scale.', 4),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'Thesis Fit', 55, 'Adjacent to thesis, not core.', 5),

  ('aaaaaaaa-0000-4000-8000-000000000004', 'Team', 70, 'Strong infra background; first-time founders.', 1),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'Market', 68, 'Crowded observability space, fast-growing niche.', 2),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'Traction', 78, '18% MoM with credible logos.', 3),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'Product', 74, 'Replayable traces resonate in user calls.', 4),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'Thesis Fit', 70, 'Dev-tools core, competitive field.', 5),

  ('aaaaaaaa-0000-4000-8000-000000000005', 'Team', 66, 'Clinical credibility; thin commercial bench.', 1),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'Market', 72, 'Underserved pediatric Medicaid population.', 2),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'Traction', 61, 'MCO contracts signed; utilization ramping slowly.', 3),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'Product', 58, 'Care model differentiated; platform is standard telehealth.', 4),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'Thesis Fit', 62, 'Healthcare is a secondary thesis area.', 5),

  ('aaaaaaaa-0000-4000-8000-000000000006', 'Team', 52, 'Materials science PhDs; no manufacturing scale-up experience.', 1),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'Market', 44, 'Real demand signal, long adoption cycles.', 2),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'Traction', 28, 'Pre-revenue, LOIs only.', 3),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'Product', 46, 'Lab results promising; shelf-life unsolved.', 4),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'Thesis Fit', 38, 'Outside core focus; opportunistic look.', 5),

  ('7f1e8a4c-2b3d-4e5f-9a6b-1c2d3e4f5a6b', 'Team', 84, 'Ex-Stripe billing PM and Plaid staff engineer; direct ownership of the problem.', 1),
  ('7f1e8a4c-2b3d-4e5f-9a6b-1c2d3e4f5a6b', 'Market', 74, 'Billing platforms crowding in; wedge defensible but giants adjacent.', 2),
  ('7f1e8a4c-2b3d-4e5f-9a6b-1c2d3e4f5a6b', 'Traction', 83, '3.1x YoY on $2.1M ARR with negligible logo churn.', 3),
  ('7f1e8a4c-2b3d-4e5f-9a6b-1c2d3e4f5a6b', 'Product', 80, 'Replayable reconciliation is differentiated; integration surface still thin.', 4),
  ('7f1e8a4c-2b3d-4e5f-9a6b-1c2d3e4f5a6b', 'Thesis Fit', 86, 'Squarely inside the B2B infrastructure thesis.', 5),

  ('aaaaaaaa-0000-4000-8000-000000000008', 'Team', 78, 'Deep port-logistics operators; strong technical bench.', 1),
  ('aaaaaaaa-0000-4000-8000-000000000008', 'Market', 80, 'Terminal automation spend accelerating globally.', 2),
  ('aaaaaaaa-0000-4000-8000-000000000008', 'Traction', 72, 'Two flagship terminals; pilots converting slowly.', 3),
  ('aaaaaaaa-0000-4000-8000-000000000008', 'Product', 82, 'Best-in-class safety record over 14 months of operation.', 4),
  ('aaaaaaaa-0000-4000-8000-000000000008', 'Thesis Fit', 68, 'Hardware-heavy — at the edge of the fund''s software focus.', 5),

  ('9b2c7d5e-4f6a-4b8c-8d9e-2f3a4b5c6d7e', 'Team', 92, 'Repeat founder with a relevant exit to Adyen; exceptional early hires.', 1),
  ('9b2c7d5e-4f6a-4b8c-8d9e-2f3a4b5c6d7e', 'Market', 82, 'Multi-entity accounting underserved by both ERPs and startups.', 2),
  ('9b2c7d5e-4f6a-4b8c-8d9e-2f3a4b5c6d7e', 'Traction', 88, '3x YoY, 128% NRR, efficient burn.', 3),
  ('9b2c7d5e-4f6a-4b8c-8d9e-2f3a4b5c6d7e', 'Product', 85, 'Deep multi-currency GL; migration tooling reduces switching cost.', 4),
  ('9b2c7d5e-4f6a-4b8c-8d9e-2f3a4b5c6d7e', 'Thesis Fit', 90, 'Core fintech-infrastructure thesis with expansion into treasury.', 5),

  ('aaaaaaaa-0000-4000-8000-000000000010', 'Team', 82, 'CISO-grade founder credibility with the buyer.', 1),
  ('aaaaaaaa-0000-4000-8000-000000000010', 'Market', 86, 'CMMC 2.0 creates a compliance forcing function across 80k suppliers.', 2),
  ('aaaaaaaa-0000-4000-8000-000000000010', 'Traction', 79, '22% MoM off a small base; two primes as design partners.', 3),
  ('aaaaaaaa-0000-4000-8000-000000000010', 'Product', 81, 'Continuous monitoring vs point-in-time audits is the right wedge.', 4),
  ('aaaaaaaa-0000-4000-8000-000000000010', 'Thesis Fit', 88, 'Security + compliance automation is a named fund priority.', 5);
