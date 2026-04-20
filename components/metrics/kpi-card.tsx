import { Clock, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveIcon } from "@/components/responsive-icon";

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: number;
  trendLabel: string;
  subLabel: string;
}

export function KpiCard({ title, value, icon, trend, trendLabel, subLabel }: KpiCardProps) {
  const isUp = trend >= 0;

  return (
    <div className="flex-1 min-w-0 rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-5 flex flex-col gap-2 sm:gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] sm:text-xs text-foreground font-medium truncate">
          {title}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 text-[9px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0",
            isUp ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600",
            isUp ? "dark:text-emerald-400" : "dark:text-red-400",
          )}
        >
          <ResponsiveIcon icon={isUp ? TrendingUp : TrendingDown} smSize={9} mdSize={11} />
          {isUp ? "+" : ""}
          {trend}%
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm sm:text-base shrink-0">{icon}</span>
        <span className="text-foreground text-lg sm:text-2xl font-bold tracking-tight truncate">
          {value}
        </span>
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-2 sm:pt-3">
        <ResponsiveIcon
          icon={Clock}
          smSize={10}
          mdSize={12}
          className="text-muted-foreground shrink-0"
        />
        <div className="min-w-0">
          <p className="text-[9px] sm:text-[11px] text-foreground/70 leading-tight truncate">
            {trendLabel}
          </p>
          <p className="text-[9px] sm:text-[11px] text-foreground/70 mt-0.5 truncate">
            {subLabel}
          </p>
        </div>
      </div>
    </div>
  );
}