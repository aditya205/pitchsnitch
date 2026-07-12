"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Pulse } from "@/components/ui/Pulse";
import { cn } from "@/lib/cn";

type Status = "idle" | "submitting" | "success" | "error";
type IntakeFileKind = "document" | "video";
type SelectedIntakeFile = {
  file: File;
  kind: IntakeFileKind;
};

const DOC_ACCEPT = ".pdf,.docx,.doc";
const DOC_EXTENSIONS = [".pdf", ".docx", ".doc"];
const DOC_MAX_BYTES = 20 * 1024 * 1024;

const VIDEO_ACCEPT = ".mp4,.mov";
const VIDEO_EXTENSIONS = [".mp4", ".mov"];
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

const FILE_ACCEPT = `${DOC_ACCEPT},${VIDEO_ACCEPT}`;

const megabytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)}MB`;

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusable(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.getAttribute("aria-hidden") !== "true" &&
      (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0)
  );
}

function focusDialogControl(container: HTMLElement | null) {
  if (!container) return;
  const preferred = container.querySelector<HTMLElement>("[data-autofocus]");
  const target = preferred ?? getFocusable(container)[0] ?? container;
  target.focus();
}

function fileExtension(file: File) {
  const lower = file.name.toLowerCase();
  const dot = lower.lastIndexOf(".");
  return dot === -1 ? "" : lower.slice(dot);
}

function fileKind(file: File): IntakeFileKind | null {
  const extension = fileExtension(file);
  if (
    DOC_EXTENSIONS.includes(extension) ||
    file.type === "application/pdf" ||
    file.type === "application/msword" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "document";
  }

  if (
    VIDEO_EXTENSIONS.includes(extension) ||
    file.type === "video/mp4" ||
    file.type === "video/quicktime"
  ) {
    return "video";
  }

  return null;
}

export function AddDealDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<SelectedIntakeFile | null>(
    null
  );
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  // Remounts the file inputs to clear their internal value on reset.
  const [inputKey, setInputKey] = useState(0);

  const canSubmit =
    (text.trim().length > 0 || selectedFile !== null) && status !== "submitting";
  const submitting = status === "submitting";

  function reset() {
    setText("");
    setSelectedFile(null);
    setStatus("idle");
    setMessage(null);
    setInputKey((k) => k + 1);
  }

  function handleClose() {
    if (status === "submitting") return; // don't abandon an in-flight request
    reset();
    onClose();
  }

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

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
    if (!open || status !== "success") return;
    const frame = window.requestAnimationFrame(() =>
      focusDialogControl(panelRef.current)
    );
    return () => window.cancelAnimationFrame(frame);
  }, [open, status]);

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      handleClose();
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

  function pickFiles(selected: FileList | File[]) {
    const files = Array.from(selected);
    if (files.length === 0) return;

    let picked: SelectedIntakeFile | null = null;
    const warnings: string[] = [];

    for (const selectedFile of files) {
      const kind = fileKind(selectedFile);
      if (!kind) {
        warnings.push(`${selectedFile.name} is not a supported file type.`);
        continue;
      }

      const maxBytes = kind === "document" ? DOC_MAX_BYTES : VIDEO_MAX_BYTES;
      if (selectedFile.size > maxBytes) {
        warnings.push(
          `${selectedFile.name} is too large (max ${megabytes(maxBytes)}).`
        );
        continue;
      }

      if (picked) {
        warnings.push(`Only one file can be attached; skipped ${selectedFile.name}.`);
        continue;
      }

      picked = { file: selectedFile, kind };
    }

    if (picked) {
      setSelectedFile(picked);
    }

    if (warnings.length > 0) {
      setMessage(warnings.join(" "));
      setStatus("error");
    } else {
      setMessage(null);
      if (status === "error") setStatus("idle");
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setStatus("submitting");
    setMessage(null);

    const body = new FormData();
    if (text.trim()) body.set("raw_text", text.trim());
    if (selectedFile) body.set("file", selectedFile.file);

    try {
      const res = await fetch("/api/deals/create", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      const warnings: string[] = Array.isArray(data.warnings) ? [...data.warnings] : [];

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close"
        onClick={handleClose}
        className="absolute inset-0 bg-ink/20"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-deal-title"
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-[-8px_0_24px_rgba(33,20,45,0.10)]"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5">
          <h2 id="add-deal-title" className="text-sm font-medium text-ink">
            Add deal
          </h2>
          <button
            type="button"
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
            onAddAnother={reset}
            onClose={handleClose}
          />
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <FilePicker
                key={`files-${inputKey}`}
                selectedFile={selectedFile}
                onPick={pickFiles}
                onRemove={() => setSelectedFile(null)}
                autoFocus
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
                    ? selectedFile?.kind === "video"
                      ? "Uploading video…"
                      : selectedFile
                        ? "Uploading file…"
                        : "Creating deal…"
                    : "Add one file, text, or both."}
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
  selectedFile,
  onPick,
  onRemove,
  autoFocus = false,
}: {
  selectedFile: SelectedIntakeFile | null;
  onPick: (files: FileList | File[]) => void;
  onRemove: () => void;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    onPick(event.dataTransfer.files);
  }

  return (
    <div>
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
        File
      </span>
      <p className="mt-1 text-xs text-ink-tertiary">
        Drop or choose one deck, memo, or pitch video. PDF, DOCX, DOC, MP4, or MOV.
      </p>
      <div className="mt-2">
        <button
          type="button"
          data-autofocus={autoFocus ? "" : undefined}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-line-strong",
            "px-3 py-5 text-center text-[13px] text-ink-secondary transition-colors",
            "hover:border-ink-tertiary hover:bg-surface-sunken",
            "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
            dragging && "border-accent bg-accent-soft/35 text-ink"
          )}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragging(false);
          }}
          onDrop={handleDrop}
        >
          <span className="font-medium text-ink">
            Drop one file here or choose a file
          </span>
          <span className="mt-1 text-[11px] text-ink-tertiary">
            Deck max {megabytes(DOC_MAX_BYTES)} · video max{" "}
            {megabytes(VIDEO_MAX_BYTES)}
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={FILE_ACCEPT}
          className="hidden"
          onChange={(event) => {
            if (event.target.files) onPick(event.target.files);
            event.currentTarget.value = "";
          }}
        />

        {selectedFile && (
          <div className="mt-2 space-y-2">
            <SelectedFile
              label={selectedFile.kind === "video" ? "Pitch video" : "Attachment"}
              file={selectedFile.file}
              note={
                selectedFile.kind === "video"
                  ? "Will be transcribed after upload."
                  : undefined
              }
              onRemove={onRemove}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SelectedFile({
  label,
  file,
  note,
  onRemove,
}: {
  label: string;
  file: File;
  note?: string;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-md border border-line bg-surface-sunken px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[13px] text-ink">
          <span className="text-ink-tertiary">{label}: </span>
          {file.name}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-xs text-ink-tertiary transition-colors hover:text-ink"
        >
          Remove
        </button>
      </div>
      {note && <p className="mt-0.5 text-[11px] text-ink-tertiary">{note}</p>}
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
        <Button variant="primary" onClick={onClose} data-autofocus>
          Done
        </Button>
      </div>
    </div>
  );
}
