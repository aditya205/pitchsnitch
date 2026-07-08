import { cn } from "@/lib/cn";

type ColumnProps = React.HTMLAttributes<HTMLElement> & {
  title: string;
  count?: number;
  /** Highlights the column, e.g. as an active drop target. */
  active?: boolean;
  ref?: React.Ref<HTMLElement>;
};

export function Column({
  title,
  count,
  active = false,
  className,
  children,
  ...props
}: ColumnProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[calc(100vh-9.5rem)] w-[min(78vw,22rem)] shrink-0 flex-col rounded-xl border transition-colors",
        "xl:w-auto xl:min-w-0 xl:flex-1 xl:shrink",
        active
          ? "border-accent/55 bg-accent-soft/65 shadow-[0_0_0_1px_rgba(255,91,85,0.16)]"
          : "border-line/80 bg-surface/60",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "absolute inset-x-3 top-2 h-0.5 rounded-full bg-accent transition-opacity",
          active ? "opacity-100" : "opacity-0"
        )}
      />
      <header className="flex items-baseline gap-2 px-3 pb-2 pt-3">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-secondary">
          {title}
        </h2>
        {count !== undefined && (
          <span className="text-[11px] tabular-nums text-ink-tertiary">
            {count}
          </span>
        )}
      </header>
      <div className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {children}
      </div>
    </section>
  );
}
