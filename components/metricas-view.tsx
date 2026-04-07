"use client";

import { useState, useEffect } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/user-context";

// ─── Fetch data from database ────────────────────────────────────────────────────
// CORREGIDO: Usa 'arrival_time' en lugar de 'created_at' para tickets
async function fetchTicketsMetrics(supabase: any, teamId: number) {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select("id, status")
      .eq("team_id", teamId);

    if (error) {
      console.error("Error fetching tickets:", error.message);
      return { total: 0, pending: 0 };
    }

    const total = data?.length || 0;
    // Contar tickets con status = "Pendiente"
    const pending = data?.filter((t: any) => t.status === "Pendiente").length || 0;

    console.log(`📊 Tickets - Total: ${total}, Pending: ${pending}`);
    return { total, pending };
  } catch (err) {
    console.error("Exception fetching tickets:", err);
    return { total: 0, pending: 0 };
  }
}

// Obtiene métricas de usuarios
async function fetchUsersMetrics(supabase: any, teamId: number) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, is_active")
      .eq("team_id", teamId);

    if (error) {
      console.error("Error fetching users:", error.message);
      return 0;
    }

    const count = data?.filter((u: any) => u.is_active === true).length || 0;
    console.log(`👥 Users - Total active: ${count}`);
    return count;
  } catch (err) {
    console.error("Exception fetching users:", err);
    return 0;
  }
}

// ─── Generate chart data from database ─────────────────────────────────────────
// CORREGIDO: Usa 'arrival_time' para tickets y 'created_at' para usuarios
async function generateChartDataFromDB(
  supabase: any, 
  teamId: number, 
  days: number, 
  dataTab: "Tickets" | "Usuarios"
) {
  const data: { label: string; value: number }[] = [];
  const now = new Date();

  // Crear array de fechas para los últimos N días
  const dateArray = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dateArray.push(d);
  }

  try {
    if (dataTab === "Tickets") {
      // CORREGIDO: Obtener tickets usando 'arrival_time' en lugar de 'created_at'
      const { data: tickets, error } = await supabase
        .from("tickets")
        .select("id, status, arrival_time") // CAMBIO: arrival_time en lugar de created_at
        .eq("team_id", teamId);

      if (error) {
        console.error("Error fetching tickets for chart:", error.message);
        // Retornar datos vacíos con estructura correcta
        return dateArray.map((date, index) => ({
          label: index % (days === 7 ? 1 : days === 30 ? 7 : 14) === 0 || index === days - 1 
            ? `${date.toLocaleDateString("es-MX")}` 
            : "",
          value: 0,
        }));
      }

      // Contar tickets pendientes acumulados por cada día
      dateArray.forEach((date, index) => {
        const count = tickets?.filter((t: any) => {
          // CORREGIDO: Validar arrival_time en lugar de created_at
          if (!t.arrival_time) return false;
          const ticketDate = new Date(t.arrival_time);
          ticketDate.setHours(0, 0, 0, 0);
          return t.status === "Pendiente" && ticketDate <= date;
        }).length || 0;

        const day = date.getDate();
        const month = date.toLocaleString("es-MX", { month: "short" });
        const labelInterval = days === 7 ? 1 : days === 30 ? 7 : 14;
        const showLabel = index % labelInterval === 0 || index === days - 1;

        data.push({
          label: showLabel ? `${month} ${day}` : "",
          value: count,
        });
      });

      console.log(`📈 Chart data (Tickets):`, data.slice(0, 3), "...");
    } else {
      // MANTIENE: Obtener usuarios del equipo con 'created_at'
      const { data: users, error } = await supabase
        .from("users")
        .select("id, is_active, created_at")
        .eq("team_id", teamId);

      if (error) {
        console.error("Error fetching users for chart:", error.message);
        return dateArray.map((date, index) => ({
          label: index % (days === 7 ? 1 : days === 30 ? 7 : 14) === 0 || index === days - 1 
            ? `${date.toLocaleDateString("es-MX")}` 
            : "",
          value: 0,
        }));
      }

      // Contar usuarios activos acumulados por cada día
      dateArray.forEach((date, index) => {
        const count = users?.filter((u: any) => {
          if (!u.created_at) return false;
          const userDate = new Date(u.created_at);
          userDate.setHours(0, 0, 0, 0);
          return u.is_active && userDate <= date;
        }).length || 0;

        const day = date.getDate();
        const month = date.toLocaleString("es-MX", { month: "short" });
        const labelInterval = days === 7 ? 1 : days === 30 ? 7 : 14;
        const showLabel = index % labelInterval === 0 || index === days - 1;

        data.push({
          label: showLabel ? `${month} ${day}` : "",
          value: count,
        });
      });

      console.log(`📈 Chart data (Users):`, data.slice(0, 3), "...");
    }
  } catch (err) {
    console.error("Exception in generateChartDataFromDB:", err);
  }

  return data;
}

type RangeKey = 90 | 30 | 7;
type DataTab = "Tickets" | "Usuarios";

// ─── KPI Card ──────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: number;
  trendLabel: string;
  subLabel: string;
}

function KpiCard({ title, value, icon, trend, trendLabel, subLabel }: KpiCardProps) {
  const isUp = trend >= 0;

  return (
    <div className="flex-1 rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground font-medium">{title}</span>
        <span
          className={cn(
            "flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
            isUp ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600",
            isUp ? "dark:text-emerald-400" : "dark:text-red-400",
          )}
        >
          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {isUp ? "+" : ""}
          {trend}%
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-foreground text-2xl font-bold tracking-tight">{value}</span>
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Clock size={12} className="text-muted-foreground shrink-0" />
        <div>
          <p className="text-[11px] text-foreground/70 leading-none">{trendLabel}</p>
          <p className="text-[11px] text-foreground/70 mt-0.5">{subLabel}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, dataTab }: any) {
  if (!active || !payload?.length) return null;

  const value = payload?.[0]?.value;
  if (value == null) return null;

  const unit = dataTab === "Tickets" ? "tickets" : "usuarios";

  return (
    <div className="px-3 py-2 rounded-xl border border-border bg-popover/90 backdrop-blur-md text-xs text-popover-foreground shadow-lg">
      {label && <p className="text-foreground/70 mb-1">{label}</p>}
      <p className="font-semibold text-foreground">{value} {unit}</p>
    </div>
  );
}

// ─── Main view ─────────────────────────────────────────────────────────
export function MetricasView() {
  const supabase = createClient();
  const { user } = useUser();
  const { resolvedTheme } = useTheme();

  const [range, setRange] = useState<RangeKey>(90);
  const [dataTab, setDataTab] = useState<DataTab>("Tickets");
  const [totalTickets, setTotalTickets] = useState(0);
  const [pendingTickets, setPendingTickets] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener el equipo del usuario logueado
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

        const currentTeamId = Number(userData.team_id);
        console.log(`🏢 Loading metrics for team: ${currentTeamId}`);

        // Cargar métricas de tickets
        const ticketsMetrics = await fetchTicketsMetrics(supabase, currentTeamId);
        setTotalTickets(ticketsMetrics.total);
        setPendingTickets(ticketsMetrics.pending);

        // Cargar métricas de usuarios
        const usersCount = await fetchUsersMetrics(supabase, currentTeamId);
        setTotalUsers(usersCount);

        // Cargar datos del gráfico
        const chartDataResult = await generateChartDataFromDB(supabase, currentTeamId, range, dataTab);
        setChartData(chartDataResult);
      } catch (err) {
        console.error("Error loading metrics:", err);
        setError("Error al cargar las métricas. Revisa la consola.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      loadData();
    }
  }, [user?.email, range, dataTab]);

  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground">Acceso denegado</h2>
          <p className="text-foreground/70">
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
  const gridStroke = isDark ? "#18181b" : "#e5e7eb";

  const RANGE_LABELS: Record<RangeKey, string> = {
    90: "Últimos 90 días",
    30: "Últimos 30 días",
    7: "Últimos 7 días",
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-8 py-4 border-b border-border">
        <h1 className="text-foreground text-xl font-semibold">Métricas</h1>
      </div>

      <div className="flex-1 px-8 py-6 flex flex-col gap-5 overflow-auto">
        {/* Error message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600">
            {error}
          </div>
        )}

        {/* KPI cards row */}
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

        {/* Chart card */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-foreground font-semibold text-base">
                {dataTab === "Tickets" 
                  ? "Total de Tickets Pendientes" 
                  : "Total de Usuarios Registrados"}
              </h2>
              <p className="text-foreground/70 text-xs mt-0.5">
                Total de los últimos{" "}
                {range === 90 ? "3 meses" : range === 30 ? "30 días" : "7 días"}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-muted border border-border rounded-xl p-0.5">
              {([90, 30, 7] as RangeKey[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                    range === r
                      ? "bg-background text-foreground border border-border"
                      : "text-foreground/70 hover:text-foreground",
                  )}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-[280px] flex items-center justify-center">
              <span className="text-foreground/70">Cargando gráfico...</span>
            </div>
          ) : (
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

                  <Tooltip 
                    content={<ChartTooltip dataTab={dataTab} />} 
                    cursor={{ stroke: cursorColor, strokeWidth: 1 }} 
                  />

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
          )}
        </div>

        {/* Data tabs */}
        <div className="flex gap-1 bg-muted border border-border rounded-lg p-0.5 self-start">
          {(["Tickets", "Usuarios"] as DataTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setDataTab(t)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
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