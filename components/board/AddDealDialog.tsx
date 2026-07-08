"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Pulse } from "@/components/ui/Pulse";
import { cn } from "@/lib/cn";

type Status = "idle" | "submitting" | "success" | "error";

const DOC_ACCEPT = ".pdf,.docx,.doc";
const DOC_MAX_BYTES = 20 * 1024 * 1024;

const VIDEO_ACCEPT = ".mp4,.mov";
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

const megabytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)}MB`;

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
  const [video, setVideo] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  // Survives into the success screen so we can promise transcription.
  const [videoAttached, setVideoAttached] = useState(false);
  // Remounts the file inputs to clear their internal value on reset.
  const [inputKey, setInputKey] = useState(0);

  const canSubmit =
    (text.trim().length > 0 || file !== null || video !== null) &&
    status !== "submitting";

  function reset() {
    setText("");
    setFile(null);
    setVideo(null);
    setStatus("idle");
    setMessage(null);
    setVideoAttached(false);
    setInputKey((k) => k + 1);
  }

  function handleClose() {
    if (status === "submitting") return; // don't abandon an in-flight request
    reset();
    onClose();
  }

  function pick(
    selected: File | null,
    maxBytes: number,
    set: (f: File | null) => void
  ) {
    if (!selected) {
      set(null);
      return;
    }
    if (selected.size > maxBytes) {
      setMessage(`That file is too large (max ${megabytes(maxBytes)}).`);
      setStatus("error");
      return;
    }
    set(selected);
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
      const res = await fetch("/api/deals/create", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      const warnings: string[] = Array.isArray(data.warnings) ? [...data.warnings] : [];

      // The video rides on a second request: the deal must exist to own it.
      // A failure here is non-fatal — the deal is already saved.
      if (video && data.deal_id) {
        const videoBody = new FormData();
        videoBody.set("deal_id", data.deal_id);
        videoBody.set("video", video);
        try {
          const videoRes = await fetch("/api/deals/video", {
            method: "POST",
            body: videoBody,
          });
          if (videoRes.ok) {
            setVideoAttached(true);
          } else {
            const videoData = await videoRes.json().catch(() => ({}));
            warnings.push(
              `The deal was saved, but the video didn't upload: ${
                videoData.error ?? `HTTP ${videoRes.status}`
              }`
            );
          }
        } catch {
          warnings.push("The deal was saved, but the video upload failed.");
        }
      }

      setStatus("success");
      if (warnings.length > 0) setMessage(warnings.join(" "));
      // Pull the new "Processing…" card into the board.
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Network error. Your deal was not created — please try again.");
    }
  }

  if (!open) return null;

  const submitting = status === "submitting";

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
        className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-[-8px_0_24px_rgba(33,20,45,0.10)]"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5">
          <h2 id="add-deal-title" className="text-sm font-medium text-ink">
            Add deal
          </h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-ink-tertiary transition-colors hover:text-ink disabled:opacity-40"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        {status === "success" ? (
          <SuccessState
            message={message}
            videoAttached={videoAttached}
            onAddAnother={reset}
            onClose={handleClose}
          />
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <FilePicker
                key={`doc-${inputKey}`}
                label="Attachment"
                hint="Pitch deck or memo — PDF or DOCX. Optional."
                accept={DOC_ACCEPT}
                file={file}
                onPick={(f) => pick(f, DOC_MAX_BYTES, setFile)}
                cta="Choose a file"
              />

              <FilePicker
                key={`video-${inputKey}`}
                label="Pitch video"
                hint={`Founder video or demo — MP4 or MOV, up to ${megabytes(
                  VIDEO_MAX_BYTES
                )}. Optional.`}
                accept={VIDEO_ACCEPT}
                file={video}
                onPick={(f) => pick(f, VIDEO_MAX_BYTES, setVideo)}
                cta="Choose a video"
                note="Will be transcribed after upload."
              />

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
                  rows={8}
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

            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-5 py-3.5">
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-ink-tertiary">
                {submitting && <Pulse />}
                <span className="truncate">
                  {submitting
                    ? video
                      ? "Uploading video…"
                      : "Creating deal…"
                    : "Add a file, a video, text, or any combination."}
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="ghost" onClick={handleClose} disabled={submitting}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
                  {submitting ? "Submitting…" : "Add deal"}
                </Button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function FilePicker({
  label,
  hint,
  accept,
  file,
  onPick,
  cta,
  note,
}: {
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  onPick: (file: File | null) => void;
  cta: string;
  note?: string;
}) {
  return (
    <div>
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
        {label}
      </span>
      <p className="mt-1 text-xs text-ink-tertiary">{hint}</p>
      <div className="mt-2">
        {file ? (
          <div className="rounded-md border border-line bg-surface-sunken px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-[13px] text-ink">
                {file.name}
              </span>
              <button
                onClick={() => onPick(null)}
                className="shrink-0 text-xs text-ink-tertiary transition-colors hover:text-ink"
              >
                Remove
              </button>
            </div>
            {note && (
              <p className="mt-0.5 text-[11px] text-ink-tertiary">{note}</p>
            )}
          </div>
        ) : (
          <label
            className={cn(
              "flex cursor-pointer items-center justify-center rounded-md border border-dashed border-line-strong",
              "px-3 py-4 text-[13px] text-ink-secondary transition-colors",
              "hover:border-ink-tertiary hover:bg-surface-sunken"
            )}
          >
            {cta}
            <input
              type="file"
              accept={accept}
              className="sr-only"
              onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>
    </div>
  );
}

function SuccessState({
  message,
  videoAttached,
  onAddAnother,
  onClose,
}: {
  message: string | null;
  videoAttached: boolean;
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

      {videoAttached && (
        <p className="flex items-center gap-1.5 text-[13px] text-ink-secondary">
          <Pulse />
          Video attached — it will be transcribed.
        </p>
      )}

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
