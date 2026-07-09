import { cn } from "@/lib/cn";

type ButtonProps = React.ComponentPropsWithRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

const variants = {
  primary: "bg-accent text-surface hover:bg-accent/85",
  secondary:
    "border border-line-strong bg-surface text-ink hover:border-accent/35 hover:bg-accent-soft/35",
  ghost: "text-ink-secondary hover:bg-accent-soft/35 hover:text-ink",
  danger:
    "border border-negative/30 bg-surface text-negative hover:border-negative/50 hover:bg-negative/5",
};

const sizes = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-8 px-3 text-[13px]",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium",
        "transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
