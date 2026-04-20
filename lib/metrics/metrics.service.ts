import type { SupabaseClient } from "@supabase/supabase-js";
import type { DataTab, ChartPoint, TicketsSeriesPoint } from "./metrics.types";

function applyAreaFilter(query: any, isAdmin: boolean, teamId?: number) {
  return isAdmin || teamId == null ? query : query.eq("team_id", teamId);
}

export async function fetchTicketsMetrics(
  supabase: SupabaseClient,
  isAdmin: boolean,
  teamId?: number
) {
  try {
    const query = applyAreaFilter(
      supabase.from("tickets").select("id, status"),
      isAdmin,
      teamId
    );

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching tickets:", error.message);
      return { total: 0, pending: 0 };
    }

    const total = data?.length || 0;
    const pending =
      data?.filter((t: { status: string }) => t.status === "Pendiente").length || 0;

    return { total, pending };
  } catch (err) {
    console.error("Exception fetching tickets:", err);
    return { total: 0, pending: 0 };
  }
}

export async function fetchUsersMetrics(
  supabase: SupabaseClient,
  isAdmin: boolean,
  teamId?: number
) {
  try {
    const query = applyAreaFilter(
      supabase.from("users").select("id, is_active"),
      isAdmin,
      teamId
    );

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching users:", error.message);
      return 0;
    }

    const count =
      data?.filter((u: { is_active: boolean }) => u.is_active === true).length || 0;
    return count;
  } catch (err) {
    console.error("Exception fetching users:", err);
    return 0;
  }
}

// ---------- helpers ----------
function toDayKeyUTCFromISO(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toDayKeyUTCFromDate(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function generateChartDataFromDB(
  supabase: SupabaseClient,
  isAdmin: boolean,
  teamId: number | undefined,
  days: number,
  dataTab: DataTab
): Promise<ChartPoint[] | TicketsSeriesPoint[]> {
  const now = new Date();

  // Normalizado en UTC (para que coincida con timestamptz)
  const dateArray: Date[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setUTCHours(0, 0, 0, 0);
    dateArray.push(d);
  }

  try {
    if (dataTab === "Tickets") {
      // ✅ SOLO columnas que existen en tickets
      const { data: tickets, error } = await applyAreaFilter(
        supabase.from("tickets").select("id, status, arrival_time"),
        isAdmin,
        teamId
      );

      if (error) {
        console.error("Error fetching tickets for chart:", error.message);
        return dateArray.map((date, index) => ({
          label:
            index % (days === 7 ? 1 : days === 30 ? 7 : 14) === 0 || index === days - 1
              ? `${date.toLocaleDateString("es-MX")}`
              : "",
          pending: 0,
          done: 0,
          total: 0,
        }));
      }

      console.log("tickets fetched:", tickets?.length);
      console.log("tickets sample:", (tickets ?? []).slice(0, 5));

      const countsByDay: Record<string, { pending: number; done: number; total: number }> = {};

      for (const t of tickets ?? []) {
        if (!t.arrival_time) continue;

        const key = toDayKeyUTCFromISO(t.arrival_time);
        if (!key) continue;

        if (!countsByDay[key]) countsByDay[key] = { pending: 0, done: 0, total: 0 };

        countsByDay[key].total += 1;
        if (t.status === "Pendiente") countsByDay[key].pending += 1;
        if (t.status === "Terminada") countsByDay[key].done += 1;
      }

      const series: TicketsSeriesPoint[] = dateArray.map((date, index) => {
        const key = toDayKeyUTCFromDate(date);
        const dayCount = countsByDay[key] ?? { pending: 0, done: 0, total: 0 };

        const labelInterval = days === 7 ? 1 : days === 30 ? 7 : 14;
        const showLabel = index % labelInterval === 0 || index === days - 1;

        const monthLabel = date.toLocaleString("es-MX", { month: "short", timeZone: "UTC" });
        const dayLabel = date.getUTCDate();

        return {
          label: showLabel ? `${monthLabel} ${dayLabel}` : "",
          pending: dayCount.pending,
          done: dayCount.done,
          total: dayCount.total,
        };
      });

      console.log("tickets series sample:", series.slice(0, 7));
      return series;
    }

    // Usuarios (sin cambios)
    const { data: users, error } = await applyAreaFilter(
      supabase.from("users").select("id, is_active, created_at"),
      isAdmin,
      teamId
    );

    if (error) {
      console.error("Error fetching users for chart:", error.message);
      return dateArray.map((date, index) => ({
        label:
          index % (days === 7 ? 1 : days === 30 ? 7 : 14) === 0 || index === days - 1
            ? `${date.toLocaleDateString("es-MX")}`
            : "",
        value: 0,
      }));
    }

    const data: ChartPoint[] = [];

    dateArray.forEach((date, index) => {
      const count =
        users?.filter((u: { is_active: boolean; created_at?: string }) => {
          if (!u.created_at) return false;
          const userDate = new Date(u.created_at);
          userDate.setHours(0, 0, 0, 0);
          return u.is_active && userDate <= date;
        }).length || 0;

      const day = date.getUTCDate();
      const month = date.toLocaleString("es-MX", { month: "short", timeZone: "UTC" });
      const labelInterval = days === 7 ? 1 : days === 30 ? 7 : 14;
      const showLabel = index % labelInterval === 0 || index === days - 1;

      data.push({
        label: showLabel ? `${month} ${day}` : "",
        value: count,
      });
    });

    return data;
  } catch (err) {
    console.error("Exception in generateChartDataFromDB:", err);

    if (dataTab === "Tickets") {
      return dateArray.map((date, index) => ({
        label:
          index % (days === 7 ? 1 : days === 30 ? 7 : 14) === 0 || index === days - 1
            ? `${date.toLocaleDateString("es-MX")}`
            : "",
        pending: 0,
        done: 0,
        total: 0,
      }));
    }

    return dateArray.map((date, index) => ({
      label:
        index % (days === 7 ? 1 : days === 30 ? 7 : 14) === 0 || index === days - 1
          ? `${date.toLocaleDateString("es-MX")}`
          : "",
      value: 0,
    }));
  }
}