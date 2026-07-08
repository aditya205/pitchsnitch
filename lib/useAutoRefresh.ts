"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Options = {
  intervalMs?: number;
  /** Give up after this long. Omit to poll indefinitely. */
  timeoutMs?: number;
  /** Restarts the timeout window when it changes (e.g. a new deal arrives). */
  resetKey?: string;
};

/**
 * Re-fetch the current route on an interval while `active` is true.
 *
 * Used to surface writes made by the background pipeline. We poll the server
 * (which reads with the secret key) rather than subscribing to Supabase
 * Realtime from the browser, because Realtime authenticates as the anon role
 * and RLS denies it every row. See supabase/migrations/0005_lock_down_rls.sql.
 *
 * A self-scheduling timeout — not setInterval — so a slow refresh can never
 * stack requests. Skips ticks while the tab is hidden, and refreshes once on
 * return so a backgrounded view is never stale.
 *
 * Returns true once `timeoutMs` elapses without `active` going false, i.e. the
 * work never finished. Polling stops at that point rather than running forever.
 */
export function useAutoRefresh(active: boolean, options: Options = {}): boolean {
  const { intervalMs = 4000, timeoutMs, resetKey } = options;
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  // Restart the window when the thing we're waiting on changes. Sync during
  // render rather than in an effect (see React docs on derived state).
  const [seenKey, setSeenKey] = useState(resetKey);
  if (resetKey !== seenKey) {
    setSeenKey(resetKey);
    if (timedOut) setTimedOut(false);
  }

  useEffect(() => {
    if (!active || timedOut) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const deadline =
      timeoutMs === undefined ? Infinity : Date.now() + timeoutMs;

    const schedule = () => {
      timer = setTimeout(() => {
        if (cancelled) return;
        if (Date.now() >= deadline) {
          setTimedOut(true); // effect re-runs and tears the loop down
          return;
        }
        if (document.visibilityState === "visible") router.refresh();
        schedule();
      }, intervalMs);
    };

    const onVisible = () => {
      if (!cancelled && document.visibilityState === "visible") router.refresh();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, timedOut, intervalMs, timeoutMs, router]);

  return timedOut && active;
}
