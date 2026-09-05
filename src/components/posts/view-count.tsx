import { Eye } from "lucide-react";

interface ViewCountProps {
  count: number;
  className?: string;
}

function formatCount(count: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(count);
}

export default function ViewCount({ count, className = "" }: ViewCountProps) {
  const safeCount = Math.max(0, count);

  return (
    <span
      title={`${safeCount.toLocaleString("en-US")} ${safeCount === 1 ? "view" : "views"}`}
      className={`inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-muted-foreground ${className}`}
    >
      <Eye aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.7} />
      <span>
        {formatCount(safeCount)} {safeCount === 1 ? "view" : "views"}
      </span>
    </span>
  );
}
