import type { DataTab } from "@/lib/metrics/metrics.types";

interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  dataTab: DataTab;
}

export function ChartTooltip({ active, payload, label, dataTab }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const value = payload?.[0]?.value;
  if (value == null) return null;

  const unit = dataTab === "Tickets" ? "tickets" : "usuarios";

  return (
    <div className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-border bg-popover/90 backdrop-blur-md text-[10px] sm:text-xs text-popover-foreground shadow-lg">
      {label && <p className="text-foreground/70 mb-0.5 sm:mb-1">{label}</p>}
      <p className="font-semibold text-foreground">
        {value} {unit}
      </p>
    </div>
  );
}