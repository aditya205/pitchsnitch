-- Canonical narrative field for the one-pager's "Why it fits" section.
--
-- `scores.thesis_fit` remains the numeric 0-10 rubric dimension. Older app
-- builds used `deals.thesis_fit` for narrative copy; keep that legacy column
-- but migrate its contents into the clearer `why_it_fits` text column.

alter table deals
  add column if not exists why_it_fits text;

update deals
set why_it_fits = thesis_fit
where why_it_fits is null
  and thesis_fit is not null;

comment on column deals.why_it_fits is
  'Narrative explanation for the one-pager Why it fits section.';
