import { cn } from "@/lib/cn";

/**
 * A quiet, slowly breathing dot. Signals background work without shouting —
 * neutral ink, never an accent or status color. Honors reduced-motion.
 */
export function Pulse({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-1.5 shrink-0 rounded-full bg-ink-tertiary",
        "animate-pulse motion-reduce:animate-none",
        className
      )}
    />
  );
}
