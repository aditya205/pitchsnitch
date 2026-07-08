"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Status = "idle" | "submitting" | "success" | "error";

const ACCEPT = ".pdf,.docx,.doc";
const MAX_BYTES = 20 * 1024 * 1024;

export function AddDealDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit =
    (text.trim().length > 0 || file !== null) && status !== "submitting";

  function reset() {
    setText("");
    setFile(null);
    setStatus("idle");
    setMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    if (status === "submitting") return; // don't abandon an in-flight request
    reset();
    onClose();
  }

  function handleFile(selected: File | null) {
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > MAX_BYTES) {
      setMessage("File is too large (max 20MB).");
      setStatus("error");
      return;
    }
    setFile(selected);
    setMessage(null);
    if (status === "error") setStatus("idle");
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setStatus("submitting");
    setMessage(null);

    const body = new FormData();
    if (text.trim()) body.set("raw_text", text.trim());
    if (file) body.set("file", file);

    try {
      const res = await fetch("/api/deals/create", {
        method: "POST",
        body,
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      // Non-fatal warnings (e.g. webhook down): deal exists, surface the caveat.
      if (Array.isArray(data.warnings) && data.warnings.length > 0) {
        setMessage(data.warnings.join(" "));
      }
      // Pull the new "Processing…" card into the board.
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Network error. Your deal was not created — please try again.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={handleClose}
        className="absolute inset-0 bg-ink/20"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-deal-title"
        className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-[-8px_0_24px_rgba(29,29,27,0.08)]"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 id="add-deal-title" className="text-sm font-medium text-ink">
            Add deal
          </h2>
          <button
            onClick={handleClose}
            disabled={status === "submitting"}
            className="text-ink-tertiary transition-colors hover:text-ink disabled:opacity-40"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        {status === "success" ? (
          <SuccessState
            message={message}
            onAddAnother={reset}
            onClose={handleClose}
          />
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* File upload */}
              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
                  Attachment
                </label>
                <p className="mt-1 text-xs text-ink-tertiary">
                  Pitch deck or memo — PDF or DOCX. Optional.
                </p>
                <div className="mt-2">
                  {file ? (
                    <div className="flex items-center justify-between rounded-md border border-line bg-surface-sunken px-3 py-2">
                      <span className="min-w-0 truncate text-[13px] text-ink">
                        {file.name}
                      </span>
                      <button
                        onClick={() => handleFile(null)}
                        className="ml-2 shrink-0 text-xs text-ink-tertiary hover:text-ink"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label
                      className={cn(
                        "flex cursor-pointer items-center justify-center rounded-md border border-dashed border-line-strong",
                        "px-3 py-4 text-[13px] text-ink-secondary transition-colors hover:border-ink-tertiary hover:bg-surface-sunken"
                      )}
                    >
                      Choose a file
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPT}
                        className="sr-only"
                        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Paste box */}
              <div>
                <label
                  htmlFor="raw-text"
                  className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary"
                >
                  Paste email, WhatsApp, or founder notes
                </label>
                <textarea
                  id="raw-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={10}
                  placeholder="Paste the raw pitch here — we'll extract company, team, traction, and the ask."
                  className={cn(
                    "mt-2 w-full resize-y rounded-md border border-line bg-surface px-3 py-2.5",
                    "text-[13px] leading-relaxed text-ink placeholder:text-ink-tertiary",
                    "focus:border-accent focus:outline-none"
                  )}
                />
              </div>

              {status === "error" && message && (
                <p className="text-[13px] text-negative" role="alert">
                  {message}
                </p>
              )}
            </div>

            <footer className="flex items-center justify-between border-t border-line px-5 py-3.5">
              <span className="text-xs text-ink-tertiary">
                {status === "submitting"
                  ? "Creating deal…"
                  : "Add a file, text, or both."}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={handleClose} disabled={status === "submitting"}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  {status === "submitting" ? "Submitting…" : "Add deal"}
                </Button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function SuccessState({
  message,
  onAddAnother,
  onClose,
}: {
  message: string | null;
  onAddAnother: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
        ✓
      </div>
      <div>
        <p className="text-sm font-medium text-ink">Deal added</p>
        <p className="mt-1 text-[13px] text-ink-secondary">
          It&apos;s in the New column while the pipeline extracts the details.
        </p>
      </div>
      {message && (
        <p className="max-w-xs text-xs leading-relaxed text-caution" role="alert">
          {message}
        </p>
      )}
      <div className="mt-1 flex items-center gap-2">
        <Button variant="secondary" onClick={onAddAnother}>
          Add another
        </Button>
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
