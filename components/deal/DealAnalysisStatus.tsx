"use client";

import { Pulse } from "@/components/ui/Pulse";
import { useAutoRefresh } from "@/lib/useAutoRefresh";
import {
  analysisTimedOutReason,
  PROCESSING_TIMEOUT_MS,
  type DealProgress,
} from "@/lib/types";

/**
 * The deal sheet's pipeline status strip. Keeps the page live while the
 * background pipeline enriches the deal, stops polling when it finishes or
 * stalls, and renders a debuggable reason when it doesn't.
 */
export function DealAnalysisStatus({
  dealId,
  progress,
}: {
  dealId: string;
  progress: DealProgress;
}) {
  const analyzing = progress.state === "analyzing";

  const timedOut = useAutoRefresh(analyzing, {
    timeoutMs: PROCESSING_TIMEOUT_MS,
    resetKey: dealId,
  });

  if (progress.state === "ready") return null;

  if (analyzing && !timedOut) {
    return (
      <p className="mt-5 flex items-center gap-1.5 text-[13px] text-ink-tertiary">
        <Pulse />
        Analyzing… this page updates on its own.
      </p>
    );
  }

  const reason =
    progress.state === "failed"
      ? progress.reason
      : analysisTimedOutReason(dealId);

  return <AnalysisError reason={reason} dealId={dealId} />;
}

function AnalysisError({ reason, dealId }: { reason: string; dealId: string }) {
  return (
    <div
      role="alert"
      className="mt-5 rounded-card border border-negative/25 bg-negative/[0.03] p-3.5"
    >
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-negative">
        <span className="size-1.5 shrink-0 rounded-full bg-negative" />
        Analysis failed
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">
        {reason}
      </p>
      <p className="mt-2 font-mono text-[11px] text-ink-tertiary">
        deal_id {dealId}
      </p>
    </div>
  );
}
