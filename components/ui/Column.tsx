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
        "flex w-[300px] shrink-0 flex-col rounded-xl border transition-colors",
        active
          ? "border-accent/40 bg-accent-soft/50"
          : "border-line/70 bg-surface-sunken/60",
        className
      )}
      {...props}
    >
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
