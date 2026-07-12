"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  updateDealFields,
  type EditableDealFields,
} from "@/lib/actions";

type Draft = {
  company_name: string;
  one_liner: string;
  website: string;
  sector: string;
  stage: string;
  location: string;
  founded_year: string;
  raising_amount: string;
  valuation: string;
  prior_investors: string;
  tam: string;
  revenue: string;
  growth_rate: string;
  customers: string;
  recommendation: string;
  thesis_fit: string;
  concerns: string;
  missing_fields: string;
  red_flags: string;
};

type LocationSuggestion = {
  label: string;
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function text(value?: string | null) {
  return value ?? "";
}

function toDraft(fields: EditableDealFields): Draft {
  return {
    company_name: text(fields.company_name),
    one_liner: text(fields.one_liner),
    website: text(fields.website),
    sector: text(fields.sector),
    stage: text(fields.stage),
    location: text(fields.location),
    founded_year: text(fields.founded_year),
    raising_amount: text(fields.round?.raising_amount),
    valuation: text(fields.round?.valuation),
    prior_investors: text(fields.round?.prior_investors),
    tam: text(fields.tam),
    revenue: text(fields.traction?.revenue ?? fields.arr),
    growth_rate: text(fields.traction?.growth_rate),
    customers: text(fields.traction?.customers),
    recommendation: text(fields.recommendation),
    thesis_fit: text(fields.thesis_fit),
    concerns: text(fields.concerns),
    missing_fields: (fields.missing_fields ?? []).join("\n"),
    red_flags: (fields.red_flags ?? []).join("\n"),
  };
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitLooseList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toPayload(draft: Draft): EditableDealFields {
  return {
    company_name: draft.company_name,
    one_liner: draft.one_liner,
    website: draft.website,
    sector: draft.sector,
    stage: draft.stage,
    location: draft.location,
    founded_year: draft.founded_year,
    tam: draft.tam,
    arr: draft.revenue,
    recommendation: draft.recommendation,
    thesis_fit: draft.thesis_fit,
    concerns: draft.concerns,
    round: {
      raising_amount: draft.raising_amount,
      valuation: draft.valuation,
      prior_investors: draft.prior_investors,
    },
    traction: {
      revenue: draft.revenue,
      customers: draft.customers,
      growth_rate: draft.growth_rate,
    },
    missing_fields: splitLooseList(draft.missing_fields),
    red_flags: splitLines(draft.red_flags),
  };
}

function changedFields(before: Draft, after: Draft) {
  return (Object.keys(after) as Array<keyof Draft>).filter(
    (key) => before[key] !== after[key]
  );
}

function getFocusable(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0)
  );
}

function focusDialogControl(container: HTMLElement | null) {
  const target =
    container?.querySelector<HTMLElement>("[data-autofocus]") ??
    getFocusable(container)[0] ??
    container;
  target?.focus();
}

export function EditDealFieldsButton({
  dealId,
  initialFields,
}: {
  dealId: string;
  initialFields: EditableDealFields;
}) {
  const router = useRouter();
  const locationListId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [baseline, setBaseline] = useState(() => toDraft(initialFields));
  const [draft, setDraft] = useState(() => toDraft(initialFields));
  const [locationSuggestions, setLocationSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openEditor() {
    const next = toDraft(initialFields);
    setBaseline(next);
    setDraft(next);
    setLocationSuggestions([]);
    setError(null);
    setOpen(true);
  }

  function closeEditor() {
    if (pending) return;
    setOpen(false);
    setLocationSuggestions([]);
    setError(null);
  }

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : triggerRef.current;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() =>
      focusDialogControl(panelRef.current)
    );

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const query = draft.location.trim();
    if (query.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query });
        const response = await fetch(`/api/locations?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          suggestions?: LocationSuggestion[];
        };
        setLocationSuggestions(data.suggestions ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setLocationSuggestions([]);
        }
      }
    }, 160);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [draft.location, open]);

  const visibleLocationSuggestions =
    open && draft.location.trim().length >= 2 ? locationSuggestions : [];

  function updateField(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeEditor();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusable(panelRef.current);
    if (focusable.length === 0) {
      event.preventDefault();
      panelRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dirty = changedFields(baseline, draft);
    if (dirty.length === 0) {
      closeEditor();
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await updateDealFields(dealId, toPayload(draft), dirty);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setOpen(false);
        router.refresh();
      } catch {
        setError("The fields could not be saved. Please try again.");
      }
    });
  }

  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="sm"
        onClick={openEditor}
      >
        Edit fields
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close field editor"
            onClick={closeEditor}
            className="absolute inset-0 bg-ink/25"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-fields-title"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            className="relative flex h-full w-full max-w-2xl flex-col border-l border-line bg-surface shadow-[-8px_0_24px_rgba(33,20,45,0.10)]"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5">
              <h2 id="edit-fields-title" className="text-sm font-medium text-ink">
                Edit fetched fields
              </h2>
              <button
                type="button"
                onClick={closeEditor}
                disabled={pending}
                className="text-ink-tertiary transition-colors hover:text-ink disabled:opacity-40"
                aria-label="Close"
              >
                x
              </button>
            </header>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">
                <FieldGroup title="Company">
                  <Field
                    label="Company name"
                    value={draft.company_name}
                    onChange={(value) => updateField("company_name", value)}
                    autoFocus
                  />
                  <Field
                    label="One-liner"
                    value={draft.one_liner}
                    onChange={(value) => updateField("one_liner", value)}
                    multiline
                    className="sm:col-span-2"
                  />
                  <Field
                    label="Website"
                    value={draft.website}
                    onChange={(value) => updateField("website", value)}
                  />
                  <Field
                    label="Sector"
                    value={draft.sector}
                    onChange={(value) => updateField("sector", value)}
                  />
                  <Field
                    label="Stage"
                    value={draft.stage}
                    onChange={(value) => updateField("stage", value)}
                  />
                  <LocationField
                    label="Location"
                    value={draft.location}
                    onChange={(value) => updateField("location", value)}
                    listId={locationListId}
                    suggestions={visibleLocationSuggestions}
                  />
                  <Field
                    label="Founded year"
                    value={draft.founded_year}
                    onChange={(value) => updateField("founded_year", value)}
                  />
                </FieldGroup>

                <FieldGroup title="The ask">
                  <Field
                    label="Round"
                    value={draft.raising_amount}
                    onChange={(value) => updateField("raising_amount", value)}
                  />
                  <Field
                    label="Valuation"
                    value={draft.valuation}
                    onChange={(value) => updateField("valuation", value)}
                  />
                  <Field
                    label="TAM"
                    value={draft.tam}
                    onChange={(value) => updateField("tam", value)}
                  />
                  <Field
                    label="Prior investors"
                    value={draft.prior_investors}
                    onChange={(value) => updateField("prior_investors", value)}
                    className="sm:col-span-2"
                  />
                </FieldGroup>

                <FieldGroup title="Traction">
                  <Field
                    label="Revenue"
                    value={draft.revenue}
                    onChange={(value) => updateField("revenue", value)}
                  />
                  <Field
                    label="Growth rate"
                    value={draft.growth_rate}
                    onChange={(value) => updateField("growth_rate", value)}
                  />
                  <Field
                    label="Customers"
                    value={draft.customers}
                    onChange={(value) => updateField("customers", value)}
                    className="sm:col-span-2"
                  />
                </FieldGroup>

                <FieldGroup title="Notes">
                  <Field
                    label="Recommendation"
                    value={draft.recommendation}
                    onChange={(value) => updateField("recommendation", value)}
                    multiline
                    className="sm:col-span-2"
                  />
                  <Field
                    label="Why it fits"
                    value={draft.thesis_fit}
                    onChange={(value) => updateField("thesis_fit", value)}
                    multiline
                    className="sm:col-span-2"
                  />
                  <Field
                    label="Concerns"
                    value={draft.concerns}
                    onChange={(value) => updateField("concerns", value)}
                    multiline
                    className="sm:col-span-2"
                  />
                  <Field
                    label="Missing fields"
                    value={draft.missing_fields}
                    onChange={(value) => updateField("missing_fields", value)}
                    multiline
                  />
                  <Field
                    label="Red flags"
                    value={draft.red_flags}
                    onChange={(value) => updateField("red_flags", value)}
                    multiline
                  />
                </FieldGroup>

                {error && (
                  <p className="text-[13px] text-negative" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-5 py-3.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeEditor}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={pending}>
                  {pending ? "Saving..." : "Save changes"}
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function LocationField({
  label,
  value,
  onChange,
  listId,
  suggestions,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  listId: string;
  suggestions: LocationSuggestion[];
}) {
  const controlClass = cn(
    "mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2",
    "text-[13px] leading-relaxed text-ink placeholder:text-ink-tertiary",
    "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
  );

  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
        {label}
      </span>
      <input
        value={value}
        list={listId}
        autoComplete="off"
        placeholder="City, region, or country"
        onChange={(event) => onChange(event.target.value)}
        className={controlClass}
      />
      <datalist id={listId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion.label} value={suggestion.label} />
        ))}
      </datalist>
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  autoFocus = false,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const controlClass = cn(
    "mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2",
    "text-[13px] leading-relaxed text-ink placeholder:text-ink-tertiary",
    "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
  );

  return (
    <label className={cn("block", className)}>
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
        {label}
      </span>
      {multiline ? (
        <textarea
          data-autofocus={autoFocus ? "" : undefined}
          value={value}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          className={controlClass}
        />
      ) : (
        <input
          data-autofocus={autoFocus ? "" : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={controlClass}
        />
      )}
    </label>
  );
}
