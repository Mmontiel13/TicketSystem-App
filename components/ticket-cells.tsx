"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface RemainingBarProps {
  arrivalTime: string;
  maxWaitMinutes: number;
  status?: "Pendiente" | "En proceso" | "Terminada";
}

function calcRemaining(arrivalTime: string, maxWaitMinutes: number) {
  const now = Date.now();
  const arrival = new Date(arrivalTime).getTime();
  const maxMs = maxWaitMinutes * 60 * 1000;
  const elapsed = now - arrival;
  const isExpired = elapsed >= maxMs;
  const percentRemaining = isExpired
    ? 0
    : Math.max(0, Math.min(100, ((maxMs - elapsed) / maxMs) * 100));

  // semántico (puedes tokenizarlo después si quieres)
  let barColor: string;
  if (isExpired) barColor = "#ef4444";
  else if (percentRemaining > 50) barColor = "#22c55e";
  else if (percentRemaining > 10) barColor = "#eab308";
  else barColor = "#ef4444";

  const minutesLeft = Math.max(0, Math.floor((maxMs - elapsed) / 60000));
  return { isExpired, percentRemaining, barColor, minutesLeft };
}

// Stable SSR placeholder — no Date.now() called until after mount.
const BAR_PLACEHOLDER = {
  isExpired: false,
  percentRemaining: 0,
  barColor: "#3f3f46",
  minutesLeft: 0,
};

export function RemainingBar({ arrivalTime, maxWaitMinutes, status }: RemainingBarProps) {
  const [mounted, setMounted] = useState(false);
  const [values, setValues] = useState(BAR_PLACEHOLDER);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function update() {
      if (status === "Terminada") {
        setValues({
          isExpired: false,
          percentRemaining: 100,
          barColor: "#22c55e",
          minutesLeft: 0,
        });
      } else {
        setValues(calcRemaining(arrivalTime, maxWaitMinutes));
      }
    }

    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [arrivalTime, maxWaitMinutes, status]);

  const { isExpired, percentRemaining, barColor, minutesLeft } = values;

  return (
    <div className="flex flex-col gap-1 w-[100px]">
      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
        {mounted && (
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percentRemaining}%`, backgroundColor: barColor }}
          />
        )}
      </div>

      <span className="text-[10px] text-muted-foreground tabular-nums min-h-[14px]">
        {mounted
          ? status === "Terminada"
            ? "Completado"
            : isExpired
              ? "Vencido"
              : percentRemaining === 0
                ? ""
                : `${minutesLeft}m restantes`
          : ""}
      </span>
    </div>
  );
}

// ----- Priority badge -----
import { type TicketPriority } from "@/lib/mock-tickets";

interface PriorityBadgeProps {
  priority: TicketPriority;
  expired: boolean;
}

const PRIORITY_DOT: Record<TicketPriority, string> = {
  Alta: "#ef4444",
  Media: "#eab308",
  Baja: "#22c55e",
};

export function PriorityBadge({ priority, expired }: PriorityBadgeProps) {
  if (expired) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border animate-pulse",
          "border-destructive/50 bg-destructive/10 text-destructive"
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" />
        Vencido
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-full inline-block"
        style={{ backgroundColor: PRIORITY_DOT[priority] }}
      />
    </span>
  );
}

// ----- Status badge -----
import { type TicketStatus } from "@/lib/mock-tickets";
import { MinusCircle, CheckCircle2, Loader } from "lucide-react";

interface StatusBadgeProps {
  status: TicketStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<
    TicketStatus,
    { icon: React.ElementType; label: string; className: string }
  > = {
    Pendiente: {
      icon: MinusCircle,
      label: "Pendiente",
      className: "text-muted-foreground border-border bg-muted",
    },
    "En proceso": {
      icon: Loader,
      label: "En proceso",
      className: "text-blue-600 dark:text-blue-300 border-blue-600/30 dark:border-blue-700/50 bg-blue-500/10 dark:bg-blue-950/40",
    },
    Terminada: {
      icon: CheckCircle2,
      label: "Terminada",
      className: "text-green-600 dark:text-green-300 border-green-600/30 dark:border-green-700/50 bg-green-500/10 dark:bg-green-950/40",
    },
  };

  const { icon: Icon, label, className } = map[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
        className
      )}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}

// ----- Type icon -----
import { type TicketType } from "@/lib/mock-tickets";
import { Monitor, Printer, Wifi, HelpCircle } from "lucide-react";

interface TypeIconProps {
  type: TicketType;
}

const TYPE_ICON: Record<TicketType, React.ElementType> = {
  computo: Monitor,
  impresora: Printer,
  red: Wifi,
  otro: HelpCircle,
};

export function TypeIcon({ type }: TypeIconProps) {
  const Icon = TYPE_ICON[type];
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-border bg-muted">
      <Icon size={13} className="text-foreground" />
    </span>
  );
}