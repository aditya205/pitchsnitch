import { cn } from "@/lib/cn";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "outline" | "accent";
};

const tones = {
  neutral: "bg-surface-sunken text-ink-secondary",
  outline: "border border-line bg-surface/70 text-ink-tertiary",
  accent: "bg-accent-soft text-accent",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] items-center rounded-[5px] px-1.5 text-[11px] font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
