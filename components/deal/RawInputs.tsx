import { RAW_INPUT_VIDEO_SOURCE, type RawInput } from "@/lib/types";

// Provenance is the point of the tool: a partner should always be able to get
// back to the exact material a deal sheet was built from.

const SOURCE_LABELS: Record<string, string> = {
  upload: "Uploaded",
  video: "Pitch video",
  email: "Email",
  website_form: "Website form",
  n8n: "Pipeline",
};

const sourceLabel = (source?: string | null) =>
  (source && SOURCE_LABELS[source]) || "Submitted";

const formatDateTime = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

/** Strip the signature so the filename is readable. */
function fileName(fileUrl: string): string {
  try {
    const path = new URL(fileUrl).pathname;
    return decodeURIComponent(path.split("/").pop() ?? "attachment");
  } catch {
    return "attachment";
  }
}

function hasContent(input: RawInput) {
  return Boolean(input.raw_text?.trim() || input.file_url);
}

export function RawInputs({ inputs }: { inputs: RawInput[] }) {
  const usable = inputs.filter(hasContent);

  return (
    <section className="border-t border-line pt-6">
      {usable.length === 0 ? (
        <>
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
            Source material
          </h2>
          <p className="text-[13px] text-ink-tertiary">
            No original inputs recorded for this deal.
          </p>
        </>
      ) : (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary transition-colors hover:text-ink-secondary">
            <span
              aria-hidden="true"
              className="inline-block transition-transform group-open:rotate-90"
            >
              ›
            </span>
            Source material
            <span className="font-sans text-[11px] normal-case tracking-normal text-ink-tertiary">
              ({usable.length} {usable.length === 1 ? "input" : "inputs"})
            </span>
          </summary>

          <ul className="mt-4 space-y-4">
            {usable.map((input) => {
              const timestamp = formatDateTime(input.created_at);
              const isVideo = input.source === RAW_INPUT_VIDEO_SOURCE;
              const text = input.raw_text?.trim();

              return (
                <li key={input.id} className="rounded-card border border-line bg-surface/70 p-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-secondary">
                      {sourceLabel(input.source)}
                    </span>
                    {timestamp && (
                      <span className="text-[11px] tabular-nums text-ink-tertiary">
                        {timestamp}
                      </span>
                    )}
                  </div>

                  {text && (
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-ink-secondary">
                      {text}
                    </pre>
                  )}

                  {input.file_url && (
                    <p className="mt-2">
                      <a
                        href={input.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-w-0 max-w-full items-center gap-1 text-[13px] text-accent hover:underline"
                      >
                        <span className="truncate">
                          {isVideo ? "Watch pitch video" : "Open"}: {fileName(input.file_url)}
                        </span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    </p>
                  )}

                  {isVideo && !text && (
                    <p className="mt-1.5 text-[11px] text-ink-tertiary">
                      Awaiting transcription.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}
