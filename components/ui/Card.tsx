import { cn } from "@/lib/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-line-strong/45 bg-surface p-3",
        "shadow-[0_2px_10px_rgba(33,20,45,0.04)]",
        className
      )}
      {...props}
    />
  );
}
