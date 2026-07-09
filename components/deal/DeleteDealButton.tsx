"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { deleteDeal } from "@/lib/actions";

export function DeleteDealButton({
  dealId,
  companyName,
}: {
  dealId: string;
  companyName: string;
}) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    cancelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, pending]);

  function close() {
    if (pending) return;
    setOpen(false);
    setError(null);
    triggerRef.current?.focus();
  }

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteDeal(dealId);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        router.replace("/");
        router.refresh();
      } catch {
        setError("The deal could not be deleted. Please try again.");
      }
    });
  }

  return (
    <>
      <Button
        ref={triggerRef}
        variant="danger"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Delete deal
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close delete confirmation"
            className="absolute inset-0 bg-ink/25"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-deal-title"
            aria-describedby="delete-deal-description"
            className="relative w-full max-w-sm rounded-card border border-line bg-surface p-5 shadow-[0_16px_44px_rgba(33,20,45,0.16)]"
          >
            <h2 id="delete-deal-title" className="text-sm font-medium text-ink">
              Delete {companyName}?
            </h2>
            <p
              id="delete-deal-description"
              className="mt-2 text-[13px] leading-relaxed text-ink-secondary"
            >
              This permanently removes the deal, its analysis, source material,
              and uploaded files. This cannot be undone.
            </p>

            {error && (
              <p className="mt-3 text-[13px] text-negative" role="alert">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button
                ref={cancelRef}
                variant="ghost"
                onClick={close}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                disabled={pending}
              >
                {pending ? "Deleting…" : "Delete deal"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
