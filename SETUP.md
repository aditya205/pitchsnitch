# PitchSnitch Setup

## Database Setup

Your Supabase project is configured in `.env.local`.

**Your live database predates these migrations and is missing the pipeline's
columns.** Run this in the Supabase dashboard → SQL Editor:

- `supabase/migrations/0004_pipeline_contract.sql`

It is idempotent and brings the database in line with the extraction contract:
adds `round`/`traction` (jsonb), `red_flags`, `use_of_funds`, `thesis_fit`,
`concerns`; drops `NOT NULL` on `company_name`; and adds range + uniqueness
constraints to `scores` and `extracted_fields`.

Then, for sample data:

- `supabase/samples.sql` — three deals (Ledgerline 82, Quarry 63, Pantryloop 34)

### The pipeline contract

The extraction step writes Claude's JSON straight into a `deals` row. Every
top-level key of that JSON is a column; the two nested objects are jsonb blobs:

```json
{ "company_name": null, "one_liner": null, "sector": null, "stage": null,
  "website": null, "founded_year": null, "tam": null, "arr": null,
  "founders": [{ "name": null, "role": null, "linkedin_url": null, "background": null }],
  "round": { "raising_amount": null, "valuation": null, "prior_investors": null },
  "traction": { "revenue": null, "customers": null, "growth_rate": null },
  "missing_fields": [], "red_flags": [] }
```

`founders` goes to its own child table. `scores` is **one row per deal** with a
named column per rubric dimension (`founder_quality`, `traction_quality`,
`market_timing`, `thesis_fit`, `round_attractiveness`, `together_edge`), each
0–10, plus a 0–100 `total` and a single `rationale`.

### Migration files

| File | Status |
| --- | --- |
| `0001_init.sql` | Applied — `deals`, `founders`, `external_signals` |
| `0002_deal_sheet.sql` | **Superseded, no-op.** Encoded a rejected schema |
| `0003_raw_inputs.sql` | Applied — `raw_inputs` intake table |
| `0004_pipeline_contract.sql` | **Run this** — reconciles everything above |

## Running locally

```bash
npm run dev
# http://localhost:3000
```

## Project structure

- `app/` — Next.js app router (pages, API routes)
- `components/ui/` — design system primitives (Button, Card, Badge, ScoreRing, etc.)
- `components/board/` — Kanban board (dnd-kit for drag-drop)
- `lib/` — server-side data layer (Supabase client, queries, actions)
- `supabase/` — migrations, seed data, samples
