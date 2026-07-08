-- Record why a deal's analysis never completed.
--
-- Set at intake when the pipeline can't be dispatched (webhook down, 404,
-- timeout), and available for the pipeline itself to write when extraction
-- fails. A non-null value means "stop waiting, and here's why" — the UI stops
-- polling and surfaces the message instead of an indefinite "Analyzing…".
--
-- Cleared (set to null) on a successful re-run.
--
-- Idempotent: safe to re-run.

alter table deals
  add column if not exists processing_error text;

comment on column deals.processing_error is
  'Why analysis failed. Null while healthy. Non-null stops the UI from polling.';
