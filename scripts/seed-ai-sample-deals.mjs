import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!url || url.startsWith("your-") || !serviceKey || serviceKey.startsWith("your-")) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY before seeding."
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const daysAgo = (days) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const sampleIds = [
  "bbbbbbbb-0000-4000-8000-000000000001",
  "bbbbbbbb-0000-4000-8000-000000000002",
  "bbbbbbbb-0000-4000-8000-000000000003",
];

const deals = [
  {
    id: sampleIds[0],
    company_name: "VellumGrid AI",
    one_liner:
      "AI control-room copilot for electric utilities that turns grid telemetry into operator-ready restoration plans.",
    website: "https://vellumgrid.ai",
    sector: "AI Infrastructure",
    stage: "Seed",
    location: "Bengaluru, India",
    founded_year: "2024",
    tam: "$12.4B",
    arr: "$720K ARR",
    round: {
      raising_amount: "$4.5M",
      valuation: "$22M pre",
      prior_investors:
        "Speciale Invest, Powerhouse Ventures, angels from GE Digital",
    },
    traction: {
      revenue: "$720K ARR",
      customers: "7 paid utility pilots, 2 annual contracts",
      growth_rate: "11x ARR since Jan 2026",
    },
    red_flags: [
      "Sales cycles depend on utility procurement windows.",
      "Model recommendations need continued human-in-the-loop review for outage restoration.",
    ],
    use_of_funds:
      "Hire 5 grid-solutions engineers, finish NERC CIP readiness, and convert 4 pilots into annual contracts.",
    why_it_fits:
      "Strong fit with the fund's AI-native infrastructure thesis: high-stakes industrial workflows, proprietary operational data, and a wedge where software can become the daily system of action.",
    concerns:
      "The product is mission-critical, so enterprise security and reliability diligence need to be deeper than a normal seed SaaS process.",
    status: "due_diligence",
    total_score: 86,
    recommendation:
      "Proceed to deep diligence. Strong founder-market fit, clear urgency from grid operators, and a credible path from copilot to operating layer.",
    source_channel: "sample",
    missing_fields: [],
    processing_error: null,
    created_at: daysAgo(18),
  },
  {
    id: sampleIds[1],
    company_name: "CipherLedger AI",
    one_liner:
      "AI compliance analyst that automates SOC 2, KYC, and transaction-monitoring evidence for fintech teams.",
    website: "https://cipherledger.ai",
    sector: "AI Application Software",
    stage: "Series A",
    location: "New York, NY",
    founded_year: "2022",
    tam: "$18B",
    arr: "$3.2M ARR",
    round: {
      raising_amount: "$12M",
      valuation: "$68M pre",
      prior_investors:
        "Homebrew, XYZ Venture Capital, ComplianceTech angels",
    },
    traction: {
      revenue: "$3.2M ARR",
      customers: "42 fintech customers, including 5 public-company subsidiaries",
      growth_rate: "3.1x YoY with 141% net revenue retention",
    },
    red_flags: [
      "Crowded compliance automation category.",
      "Needs proof that LLM outputs reduce analyst review time without increasing false negatives.",
    ],
    use_of_funds:
      "Expand the evidence graph, launch EU data residency, and hire 4 enterprise AEs.",
    why_it_fits:
      "Fits the Together AI application layer: compliance teams have expensive manual workflows, strong audit trails, and clear willingness to pay for trustworthy automation.",
    concerns:
      "Competitive pressure is real; diligence should confirm retention by product depth rather than compliance-budget expansion alone.",
    status: "screening",
    total_score: 82,
    recommendation:
      "Take a partner meeting. Metrics are strong and the buyer pain is acute, but differentiation against Vanta, Drata, and Alloy-adjacent workflows needs pressure testing.",
    source_channel: "sample",
    missing_fields: [],
    processing_error: null,
    created_at: daysAgo(9),
  },
  {
    id: sampleIds[2],
    company_name: "AsterCare AI",
    one_liner:
      "Ambient AI intake and prior-authorization assistant for specialty clinics.",
    website: "https://astercare.ai",
    sector: "Healthcare AI",
    stage: "Seed",
    location: "San Francisco, CA",
    founded_year: "2023",
    tam: "$31B",
    arr: "$1.1M ARR",
    round: {
      raising_amount: "$6M",
      valuation: "$34M cap",
      prior_investors:
        "General Catalyst Scout Fund, health-system angels, Operator Partners",
    },
    traction: {
      revenue: "$1.1M ARR",
      customers: "63 clinics across 8 specialty groups",
      growth_rate: "18% MoM revenue growth over the last 6 months",
    },
    red_flags: [
      "HIPAA and clinical safety workflows require careful review.",
      "Potential dependency on EHR integration partners for rollout speed.",
    ],
    use_of_funds:
      "Complete Epic and Athenahealth integrations, expand the clinical QA team, and support 120 additional clinic deployments.",
    why_it_fits:
      "Excellent AI-native workflow fit: repetitive administrative labor, measurable ROI, high-frequency usage, and a path into clinical operations data.",
    concerns:
      "Need to verify that time savings persist after onboarding and that specialty clinics are not over-served by horizontal ambient scribe vendors.",
    status: "ic_approval",
    total_score: 89,
    recommendation:
      "Bring to IC. Best combination of urgency, traction, and Together edge among the current AI application deals.",
    source_channel: "sample",
    missing_fields: [],
    processing_error: null,
    created_at: daysAgo(4),
  },
];

const founders = [
  {
    deal_id: sampleIds[0],
    name: "Nisha Rao",
    role: "Co-founder & CEO",
    linkedin_url: "https://www.linkedin.com/in/nisharao-vellumgrid",
    background:
      "Former GE Digital grid-ops product lead; shipped outage-management software used by 30+ utilities across Asia and Europe.",
    source: "submitted",
    confidence: 0.97,
  },
  {
    deal_id: sampleIds[0],
    name: "Arjun Mehta",
    role: "Co-founder & CTO",
    linkedin_url: "https://www.linkedin.com/in/arjunmehta-gridai",
    background:
      "Ex-DeepMind applied scientist focused on time-series forecasting; built reinforcement-learning control systems for energy assets.",
    source: "external",
    confidence: 0.82,
  },
  {
    deal_id: sampleIds[1],
    name: "Maya Chen",
    role: "Co-founder & CEO",
    linkedin_url: "https://www.linkedin.com/in/mayachen-cipherledger",
    background:
      "Former Stripe compliance lead; owned KYC and monitoring operations for high-growth fintech platforms.",
    source: "submitted",
    confidence: 0.96,
  },
  {
    deal_id: sampleIds[1],
    name: "Leo Martinez",
    role: "Co-founder & CTO",
    linkedin_url: "https://www.linkedin.com/in/leomartinez-ai",
    background:
      "Built graph-risk infrastructure at Chainalysis and led applied LLM tooling for investigation workflows.",
    source: "external",
    confidence: 0.78,
  },
  {
    deal_id: sampleIds[2],
    name: "Dr. Priya Nair",
    role: "Co-founder & CEO",
    linkedin_url: "https://www.linkedin.com/in/priyanair-md",
    background:
      "Practicing rheumatologist and former medical director at a 120-clinic specialty group.",
    source: "submitted",
    confidence: 0.95,
  },
  {
    deal_id: sampleIds[2],
    name: "Evan Brooks",
    role: "Co-founder & CTO",
    linkedin_url: "https://www.linkedin.com/in/evanbrooks-ai",
    background:
      "Ex-Abridge ML engineer; shipped production ambient documentation models across hospital deployments.",
    source: "external",
    confidence: 0.81,
  },
];

const externalSignals = [
  {
    deal_id: sampleIds[0],
    title: "VellumGrid selected for national smart-grid modernization cohort",
    summary:
      "Program acceptance gives the team access to 4 additional utility pilots and operational telemetry datasets.",
    url: "https://news.example.com/vellumgrid-smart-grid-cohort",
    signal_date: "2026-06-22",
    signal_type: "positive",
  },
  {
    deal_id: sampleIds[0],
    title: "Large utilities accelerate spend on AI-assisted outage response",
    summary:
      "Budget commentary from utility CIOs validates the category timing, especially around restoration planning and crew dispatch.",
    url: "https://news.example.com/utility-ai-outage-response",
    signal_date: "2026-05-16",
    signal_type: "positive",
  },
  {
    deal_id: sampleIds[1],
    title: "CipherLedger announces SOC 2 evidence graph for fintechs",
    summary:
      "Product launch frames the wedge beyond checklist compliance and toward reusable audit intelligence.",
    url: "https://news.example.com/cipherledger-evidence-graph",
    signal_date: "2026-06-12",
    signal_type: "positive",
  },
  {
    deal_id: sampleIds[1],
    title: "Compliance automation market sees aggressive bundling from incumbents",
    summary:
      "Vanta and Drata both expanded AI review features, raising the bar for clear differentiation.",
    url: "https://news.example.com/compliance-ai-bundling",
    signal_date: "2026-05-28",
    signal_type: "concerning",
  },
  {
    deal_id: sampleIds[2],
    title: "AsterCare signs multi-site rollout with Pacific Arthritis Group",
    summary:
      "Initial deployment covers 19 clinics with prior-auth workflow automation and intake summarization.",
    url: "https://news.example.com/astercare-pacific-arthritis",
    signal_date: "2026-06-30",
    signal_type: "positive",
  },
  {
    deal_id: sampleIds[2],
    title: "CMS prior-authorization rule increases urgency for automation",
    summary:
      "Regulatory timeline creates pressure for clinics to reduce manual authorization turnaround times.",
    url: "https://news.example.com/cms-prior-auth-automation",
    signal_date: "2026-04-03",
    signal_type: "positive",
  },
];

const extractedFields = [
  {
    deal_id: sampleIds[0],
    field_name: "one_liner",
    value: deals[0].one_liner,
    source: "submitted",
    confidence: 0.98,
  },
  {
    deal_id: sampleIds[0],
    field_name: "website",
    value: deals[0].website,
    source: "external",
    confidence: 0.83,
  },
  {
    deal_id: sampleIds[0],
    field_name: "round",
    value: deals[0].round.raising_amount,
    source: "submitted",
    confidence: 0.96,
  },
  {
    deal_id: sampleIds[0],
    field_name: "valuation",
    value: deals[0].round.valuation,
    source: "submitted",
    confidence: 0.91,
  },
  {
    deal_id: sampleIds[0],
    field_name: "tam",
    value: deals[0].tam,
    source: "external",
    confidence: 0.69,
  },
  {
    deal_id: sampleIds[0],
    field_name: "prior_investors",
    value: deals[0].round.prior_investors,
    source: "submitted",
    confidence: 0.94,
  },
  {
    deal_id: sampleIds[0],
    field_name: "revenue",
    value: deals[0].traction.revenue,
    source: "submitted",
    confidence: 0.95,
  },
  {
    deal_id: sampleIds[0],
    field_name: "growth",
    value: deals[0].traction.growth_rate,
    source: "submitted",
    confidence: 0.92,
  },
  {
    deal_id: sampleIds[0],
    field_name: "customers",
    value: deals[0].traction.customers,
    source: "submitted",
    confidence: 0.93,
  },
  {
    deal_id: sampleIds[1],
    field_name: "one_liner",
    value: deals[1].one_liner,
    source: "submitted",
    confidence: 0.97,
  },
  {
    deal_id: sampleIds[1],
    field_name: "website",
    value: deals[1].website,
    source: "external",
    confidence: 0.8,
  },
  {
    deal_id: sampleIds[1],
    field_name: "round",
    value: deals[1].round.raising_amount,
    source: "submitted",
    confidence: 0.96,
  },
  {
    deal_id: sampleIds[1],
    field_name: "valuation",
    value: deals[1].round.valuation,
    source: "submitted",
    confidence: 0.89,
  },
  {
    deal_id: sampleIds[1],
    field_name: "tam",
    value: deals[1].tam,
    source: "external",
    confidence: 0.66,
  },
  {
    deal_id: sampleIds[1],
    field_name: "prior_investors",
    value: deals[1].round.prior_investors,
    source: "submitted",
    confidence: 0.93,
  },
  {
    deal_id: sampleIds[1],
    field_name: "revenue",
    value: deals[1].traction.revenue,
    source: "submitted",
    confidence: 0.95,
  },
  {
    deal_id: sampleIds[1],
    field_name: "growth",
    value: deals[1].traction.growth_rate,
    source: "submitted",
    confidence: 0.91,
  },
  {
    deal_id: sampleIds[1],
    field_name: "customers",
    value: deals[1].traction.customers,
    source: "submitted",
    confidence: 0.94,
  },
  {
    deal_id: sampleIds[2],
    field_name: "one_liner",
    value: deals[2].one_liner,
    source: "submitted",
    confidence: 0.98,
  },
  {
    deal_id: sampleIds[2],
    field_name: "website",
    value: deals[2].website,
    source: "external",
    confidence: 0.82,
  },
  {
    deal_id: sampleIds[2],
    field_name: "round",
    value: deals[2].round.raising_amount,
    source: "submitted",
    confidence: 0.97,
  },
  {
    deal_id: sampleIds[2],
    field_name: "valuation",
    value: deals[2].round.valuation,
    source: "submitted",
    confidence: 0.9,
  },
  {
    deal_id: sampleIds[2],
    field_name: "tam",
    value: deals[2].tam,
    source: "external",
    confidence: 0.71,
  },
  {
    deal_id: sampleIds[2],
    field_name: "prior_investors",
    value: deals[2].round.prior_investors,
    source: "submitted",
    confidence: 0.94,
  },
  {
    deal_id: sampleIds[2],
    field_name: "revenue",
    value: deals[2].traction.revenue,
    source: "submitted",
    confidence: 0.96,
  },
  {
    deal_id: sampleIds[2],
    field_name: "growth",
    value: deals[2].traction.growth_rate,
    source: "submitted",
    confidence: 0.92,
  },
  {
    deal_id: sampleIds[2],
    field_name: "customers",
    value: deals[2].traction.customers,
    source: "submitted",
    confidence: 0.95,
  },
];

const scores = [
  {
    deal_id: sampleIds[0],
    founder_quality: 9,
    traction_quality: 8,
    market_timing: 9,
    thesis_fit: 9,
    round_attractiveness: 7,
    together_edge: 9,
    total: 86,
    rationale:
      "Deep grid-ops founder-market fit, strong early utility pull, and a clear AI-native system-of-action wedge. Main diligence risk is reliability/security depth for mission-critical deployments.",
  },
  {
    deal_id: sampleIds[1],
    founder_quality: 8,
    traction_quality: 8,
    market_timing: 8,
    thesis_fit: 8,
    round_attractiveness: 7,
    together_edge: 8,
    total: 82,
    rationale:
      "Strong fintech compliance operator plus technical risk-graph depth, with $3.2M ARR and strong NRR. The category is crowded, so product differentiation must hold up under customer calls.",
  },
  {
    deal_id: sampleIds[2],
    founder_quality: 9,
    traction_quality: 9,
    market_timing: 9,
    thesis_fit: 9,
    round_attractiveness: 8,
    together_edge: 9,
    total: 89,
    rationale:
      "Excellent clinical-founder insight, rapid clinic adoption, and a painful administrative workflow with near-term regulatory tailwinds. Strong IC candidate if safety and EHR diligence check out.",
  },
];

const rawInputs = [
  {
    deal_id: sampleIds[0],
    source: "sample",
    raw_text:
      "Founder note: VellumGrid AI is raising a $4.5M seed to help utilities convert live grid telemetry into restoration plans. Current traction: $720K ARR, 7 paid pilots, 2 annual utility contracts, and 11x ARR growth since January.",
    file_url: null,
  },
  {
    deal_id: sampleIds[1],
    source: "sample",
    raw_text:
      "Inbound referral: CipherLedger AI is a Series A fintech compliance copilot raising $12M. The company has $3.2M ARR, 42 fintech customers, and 141% net revenue retention across SOC 2, KYC, and monitoring workflows.",
    file_url: null,
  },
  {
    deal_id: sampleIds[2],
    source: "sample",
    raw_text:
      "Partner memo: AsterCare AI is raising $6M at a $34M cap. Product handles ambient intake and prior authorization for specialty clinics. Traction: $1.1M ARR, 63 clinics, 18% MoM growth, and a signed 19-clinic rollout.",
    file_url: null,
  },
];

async function run(label, promise) {
  const { error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
}

await run("delete existing sample deals", db.from("deals").delete().in("id", sampleIds));
await run("insert sample deals", db.from("deals").insert(deals));
await run("insert sample founders", db.from("founders").insert(founders));
await run(
  "insert sample external signals",
  db.from("external_signals").insert(externalSignals)
);
await run(
  "insert sample extracted fields",
  db.from("extracted_fields").insert(extractedFields)
);
await run("insert sample scores", db.from("scores").insert(scores));
await run("insert sample raw inputs", db.from("raw_inputs").insert(rawInputs));

console.log("Seeded 3 AI sample deals:");
for (const deal of deals) {
  console.log(`- ${deal.company_name} (${deal.stage}, ${deal.status}, ${deal.total_score})`);
}
