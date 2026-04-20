"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Ticket, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/user-context";

import type { RangeKey, DataTab } from "@/lib/metrics/metrics.types";
import {
  fetchTicketsMetrics,
  fetchUsersMetrics,
  generateChartDataFromDB,
} from "@/lib/metrics/metrics.service";

import { KpiCard } from "@/components/metrics/kpi-card";
import { ChartTooltip } from "@/components/metrics/chart-tooltip";

export function MetricasView() {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useUser();
  const { resolvedTheme } = useTheme();

  const [range, setRange] = useState<RangeKey>(90);
  const [dataTab, setDataTab] = useState<DataTab>("Tickets");
  const [totalTickets, setTotalTickets] = useState(0);
  const [pendingTickets, setPendingTickets] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  // ✅ permite ambos shapes (Tickets series o Usuarios value)
  const [chartData, setChartData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("team_id")
          .eq("email", user.email)
          .single();

        if (userError) {
          console.error("Error fetching user team:", userError.message);
          setError("No se pudo cargar el equipo del usuario");
          return;
        }

        if (!userData) {
          setError("Usuario no encontrado");
          return;
        }

        const isAdmin = user.role === "admin";
        const currentTeamId = isAdmin ? undefined : Number(userData.team_id);

        const ticketsMetrics = await fetchTicketsMetrics(supabase, isAdmin, currentTeamId);
        setTotalTickets(ticketsMetrics.total);
        setPendingTickets(ticketsMetrics.pending);

        const usersCount = await fetchUsersMetrics(supabase, isAdmin, currentTeamId);
        setTotalUsers(usersCount);

        const chartDataResult = await generateChartDataFromDB(
          supabase,
          isAdmin,
          currentTeamId,
          range,
          dataTab
        );

        // Debug (temporal)
        console.log("dataTab:", dataTab, "range:", range);
        console.log("chartDataResult length:", (chartDataResult as any[])?.length);
        console.log("chartDataResult[0]:", (chartDataResult as any[])?.[0]);

        setChartData(chartDataResult as any[]);
        console.log("dataTab:", dataTab, "range:", range);
console.log("chartDataResult length:", (chartDataResult as any[])?.length);
console.log("chartDataResult[0]:", (chartDataResult as any[])?.[0]);
console.log("chartDataResult last:", (chartDataResult as any[])?.[(chartDataResult as any[])?.length - 1]);
      } catch (err) {
        console.error("Error loading metrics:", err);
        setError("Error al cargar las métricas. Revisa la consola.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) loadData();
  }, [user?.email, range, dataTab]);

  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen px-4">
        <div className="rounded-lg border border-border bg-card p-6 sm:p-8 text-center max-w-md">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Acceso denegado</h2>
          <p className="text-foreground/70 text-sm mt-2">
            No tienes permisos suficientes para ver las métricas.
          </p>
        </div>
      </div>
    );
  }

  const isDark = (resolvedTheme ?? "dark") === "dark";
  const strokeColor = isDark ? "#ffffff" : "#111827";
  const tickColor = isDark ? "#a1a1aa" : "#4b5563";
  const cursorColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";

  const RANGE_LABELS: Record<RangeKey, string> = { 90: "90 días", 30: "30 días", 7: "7 días" };
  const RANGE_LABELS_FULL: Record<RangeKey, string> = {
    90: "Últimos 90 días",
    30: "Últimos 30 días",
    7: "Últimos 7 días",
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-16 flex items-center justify-center sm:justify-start px-3 sm:px-4 md:px-8 border-b border-border/50 shrink-0">
        <h1 className="text-foreground text-base sm:text-lg md:text-xl font-semibold text-center sm:text-left">
          Métricas
        </h1>
      </div>

      <div className="flex-1 px-3 sm:px-4 md:px-8 py-4 sm:py-6 flex flex-col gap-3 sm:gap-5 overflow-auto">
        {error && (
          <div className="p-3 sm:p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs sm:text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          <KpiCard
            title="Total de Tickets"
            value={`${totalTickets}`}
            icon={<Ticket size={22} />}
            trend={3.2}
            trendLabel="Dentro del promedio"
            subLabel="5 más que el mes pasado"
          />
          <KpiCard
            title="Tickets pendientes"
            value={`${pendingTickets}`}
            icon={<Ticket size={22} />}
            trend={-5}
            trendLabel="Mas bajo del mes"
            subLabel="10 menos que el mes pasado"
          />
          <KpiCard
            title="Total de Usuarios"
            value={`${totalUsers}`}
            icon={<Users size={22} />}
            trend={15}
            trendLabel="Mas alto del mes"
            subLabel="20 usuarios nuevos"
          />
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-6 flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-foreground font-semibold text-sm sm:text-base wrap-break-word">
                {dataTab === "Tickets"
                  ? "Tickets (Pendientes, Terminados y Totales)"
                  : "Total de Usuarios Registrados"}
              </h2>
              <p className="text-foreground/70 text-xs sm:text-sm mt-1">
                Total de los últimos{" "}
                {range === 90 ? "3 meses" : range === 30 ? "30 días" : "7 días"}
              </p>
            </div>

            <div className="flex items-center gap-0.5 bg-muted border border-border rounded-lg sm:rounded-xl p-0.5 shrink-0 w-full sm:w-auto">
              {([90, 30, 7] as RangeKey[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap flex-1 sm:flex-auto",
                    range === r
                      ? "bg-background text-foreground border border-border"
                      : "text-foreground/70 hover:text-foreground",
                  )}
                  title={RANGE_LABELS_FULL[r]}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-[320px] sm:h-[380px] flex items-center justify-center">
              <span className="text-foreground/70 text-sm">Cargando gráfico...</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[320px] sm:h-[380px] flex items-center justify-center">
              <span className="text-foreground/70 text-sm">Sin datos disponibles</span>
            </div>
          ) : (
            <div className="w-full h-[320px] sm:h-[380px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="label" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />

                  <Tooltip
                    content={dataTab === "Usuarios" ? <ChartTooltip dataTab={dataTab} /> : undefined}
                    cursor={{ stroke: cursorColor, strokeWidth: 1 }}
                  />

                  {dataTab === "Tickets" ? (
                    <>
                      <Area type="monotone" dataKey="total" stroke={strokeColor} strokeWidth={2} fillOpacity={0} dot={false} />
                      <Area type="monotone" dataKey="pending" stroke="#facc15" strokeWidth={2} fillOpacity={0} dot={false} />
                      <Area type="monotone" dataKey="done" stroke="#ef4444" strokeWidth={2} fillOpacity={0} dot={false} />
                    </>
                  ) : (
                    <Area type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2} fillOpacity={0} dot={false} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="flex gap-1 bg-muted border border-border rounded-lg p-0.5 w-full sm:w-auto">
          {(["Tickets", "Usuarios"] as DataTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setDataTab(t)}
              className={cn(
                "px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-auto",
                dataTab === t
                  ? "bg-background text-foreground border border-border"
                  : "text-foreground/70 hover:text-foreground",
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