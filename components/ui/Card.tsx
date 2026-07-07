import { cn } from "@/lib/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface p-3",
        "shadow-[0_1px_2px_rgba(29,29,27,0.04)]",
        className
      )}
      {...props}
    />
  );
}
