import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

export function Progress({
  value,
  className,
  barClassName,
  showLabel,
  size = "md",
}: ProgressProps) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-secondary",
          sizes[size],
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all duration-500 ease-out",
            barClassName,
          )}
          style={{ width: `${safe}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="font-medium tabular-nums text-foreground">
            {safe}%
          </span>
        </div>
      )}
    </div>
  );
}
