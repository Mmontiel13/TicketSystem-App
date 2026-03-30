"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Ticket,
  Users,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_TICKETS } from "@/lib/mock-tickets";
import { useUser } from "@/lib/user-context";

// ─── KPI derived from mock data ─────────────────────────────────────────────────────────────
const totalTickets = MOCK_TICKETS.length;
const pendingTickets = MOCK_TICKETS.filter((t) => t.status === "Pendiente").length;

// ─── Chart data ─────────────────────────────────────────────────────────────
// 90 days of synthetic daily pending-ticket counts
function generateChartData(days: number) {
  const data: { label: string; value: number }[] = [];
  const now = new Date();
  // Seed values for a realistic wave-like curve
  const seeds: Record<number, number[]> = {
    90: [
      2, 3, 4, 5, 6, 7, 9, 11, 14, 17, 20, 24, 28, 30, 31, 30, 28, 25, 22, 20,
      18, 16, 14, 12, 11, 10, 9, 9, 10, 11, 13, 15, 18, 21, 24, 26, 27, 26, 24,
      22, 20, 18, 16, 15, 14, 13, 12, 12, 13, 14, 15, 16, 17, 18, 19, 20, 20,
      19, 18, 17, 16, 15, 14, 14, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
      25, 26, 27, 28, 29, 30,
    ],
    30: [
      10, 11, 12, 13, 15, 17, 19, 21, 22, 21, 19, 17, 15, 13, 12, 12, 13, 14,
      15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    ],
    7: [14, 16, 18, 22, 25, 27, 30],
  };
  const values = seeds[days] ?? seeds[30];
  // Only show labels for specific dates to avoid crowding
  const labelInterval = days === 7 ? 1 : days === 30 ? 7 : 14;

  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const day = d.getDate();
    const month = d.toLocaleString("es-MX", { month: "long" });
    const monthCap = month.charAt(0).toUpperCase() + month.slice(1);
    const showLabel = i % labelInterval === 0 || i === days - 1;

    data.push({
      label: showLabel ? `${monthCap} ${day}` : "",
      value: values[i] ?? Math.round(10 + Math.random() * 20),
    });
  }
  return data;
}

type RangeKey = 90 | 30 | 7;
type DataTab = "Tickets" | "Usuarios";

// ─── KPI Card ────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: number; // percent, positive = up
  trendLabel: string;
  subLabel: string;
}

function KpiCard({ title, value, icon, trend, trendLabel, subLabel }: KpiCardProps) {
  const isUp = trend >= 0;

  return (
    <div className="flex-1 rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 min-w-0">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{title}</span>
        <span
          className={cn(
            "flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
            isUp ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600",
            // In dark, those shades need to be brighter:
            isUp ? "dark:text-emerald-400" : "dark:text-red-400",
          )}
        >
          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {isUp ? "+" : ""}
          {trend}%
        </span>
      </div>

      {/* Value */}
      <div className="flex items-center gap-2.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-foreground text-2xl font-bold tracking-tight">{value}</span>
      </div>

      {/* Sub-label */}
      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Clock size={12} className="text-muted-foreground shrink-0" />
        <div>
          <p className="text-[11px] text-muted-foreground leading-none">{trendLabel}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{subLabel}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const value = payload?.[0]?.value;
  if (value == null) return null;

  return (
    <div className="px-3 py-2 rounded-xl border border-border bg-popover/90 backdrop-blur-md text-xs text-popover-foreground shadow-lg">
      {label && <p className="text-muted-foreground mb-1">{label}</p>}
      <p className="font-semibold">{value} tickets</p>
    </div>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────
export function MetricasView() {
  const [range, setRange] = useState<RangeKey>(90);
  const [dataTab, setDataTab] = useState<DataTab>("Tickets");

  const chartData = generateChartData(range);
  const { users, user } = useUser();
  const totalUsers = users.filter((u) => u.isActive).length;

  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground">Acceso denegado</h2>
          <p className="text-muted-foreground">
            No tienes permisos suficientes para ver las métricas.
          </p>
        </div>
      </div>
    );
  }

  // Theme-aware chart colors (fix: chart was white-on-white in light mode)
  const { resolvedTheme } = useTheme();
  const isDark = (resolvedTheme ?? "dark") === "dark";

  const strokeColor = isDark ? "#ffffff" : "#111827";
  const tickColor = isDark ? "#a1a1aa" : "#4b5563";
  const cursorColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
  const gridStroke = isDark ? "#18181b" : "#e5e7eb";

  const RANGE_LABELS: Record<RangeKey, string> = {
    90: "Últimos 90 días",
    30: "Últimos 30 días",
    7: "Últimos 7 días",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center px-8 py-4 border-b border-border">
        <h1 className="text-foreground text-xl font-semibold">Métricas</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-6 flex flex-col gap-5 overflow-auto">
        {/* ── KPI cards row ── */}
        <div className="flex gap-4">
          <KpiCard
            title="Total de Tickets"
            value={`${totalTickets} Tickets`}
            icon={<Ticket size={22} />}
            trend={3.2}
            trendLabel="Dentro del promedio"
            subLabel="5 más que el mes pasado"
          />
          <KpiCard
            title="Tickets pendientes"
            value={`${pendingTickets} Tickets`}
            icon={<Ticket size={22} />}
            trend={-5}
            trendLabel="Mas bajo del mes"
            subLabel="10 menos que el mes pasado"
          />
          <KpiCard
            title="Total de Usuarios"
            value={`${totalUsers} Usuarios`}
            icon={<Users size={22} />}
            trend={15}
            trendLabel="Mas alto del mes"
            subLabel="20 usuarios nuevos"
          />
        </div>

        {/* ── Chart card ── */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
          {/* Chart header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-foreground font-semibold text-base">
                Total de Tickets Pendientes
              </h2>
              <p className="text-muted-foreground text-xs mt-0.5">
                Total de los últimos{" "}
                {range === 90 ? "3 meses" : range === 30 ? "30 días" : "7 días"}
              </p>
            </div>

            {/* Range toggle */}
            <div className="flex items-center gap-1 bg-muted border border-border rounded-xl p-0.5">
              {([90, 30, 7] as RangeKey[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                    range === r
                      ? "bg-background text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* AreaChart */}
          <div className="h-[280px] w-full -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={strokeColor}
                      stopOpacity={isDark ? 0.18 : 0.12}
                    />
                    <stop
                      offset="55%"
                      stopColor={strokeColor}
                      stopOpacity={isDark ? 0.07 : 0.06}
                    />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="label"
                  tick={{ fill: tickColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis hide />

                <Tooltip content={<ChartTooltip />} cursor={{ stroke: cursorColor, strokeWidth: 1 }} />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={strokeColor}
                  strokeWidth={1.5}
                  fill="url(#ticketGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: strokeColor,
                    stroke: gridStroke,
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Bottom data tabs ── */}
        <div className="flex gap-1 bg-muted border border-border rounded-lg p-0.5 self-start">
          {(["Tickets", "Usuarios"] as DataTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setDataTab(t)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                dataTab === t
                  ? "bg-background text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}