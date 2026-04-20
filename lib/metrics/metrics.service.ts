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

// ========== NEW FUNCTIONS FOR REFACTORED METRICS ==========

/** Fetch month-over-month comparison for total tickets */
export async function fetchMonthComparison(
  supabase: SupabaseClient,
  isAdmin: boolean,
  teamId?: number
) {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month tickets
    const { data: currentData, error: currentError } = await applyAreaFilter(
      supabase
        .from("tickets")
        .select("id, arrival_time")
        .gte("arrival_time", currentMonthStart.toISOString()),
      isAdmin,
      teamId
    );

    if (currentError) {
      console.error("Error fetching current month tickets:", currentError.message);
      return { currentMonth: 0, previousMonth: 0, percentChange: 0 };
    }

    // Previous month tickets
    const { data: previousData, error: previousError } = await applyAreaFilter(
      supabase
        .from("tickets")
        .select("id, arrival_time")
        .gte("arrival_time", previousMonthStart.toISOString())
        .lte("arrival_time", previousMonthEnd.toISOString()),
      isAdmin,
      teamId
    );

    if (previousError) {
      console.error("Error fetching previous month tickets:", previousError.message);
      return { currentMonth: 0, previousMonth: 0, percentChange: 0 };
    }

    const currentCount = currentData?.length || 0;
    const previousCount = previousData?.length || 0;

    let percentChange = 0;
    if (previousCount > 0) {
      percentChange = ((currentCount - previousCount) / previousCount) * 100;
    } else if (currentCount > 0) {
      // If previous month had 0 tickets but current has some, show 100% growth
      percentChange = 100;
    }

    return { currentMonth: currentCount, previousMonth: previousCount, percentChange };
  } catch (err) {
    console.error("Exception in fetchMonthComparison:", err);
    return { currentMonth: 0, previousMonth: 0, percentChange: 0 };
  }
}

/** Fetch the top issue type (most reported) */
export async function fetchTopIssueType(
  supabase: SupabaseClient,
  isAdmin: boolean,
  teamId?: number
) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data, error } = await applyAreaFilter(
      supabase
        .from("tickets")
        .select("type")
        .gte("arrival_time", monthStart.toISOString()),
      isAdmin,
      teamId
    );

    if (error) {
      console.error("Error fetching issue types:", error.message);
      return { type: "N/A", count: 0 };
    }

    // Group by type and count
    const typeCounts: Record<string, number> = {};
    (data ?? []).forEach((ticket: { type: string }) => {
      if (ticket.type) {
        typeCounts[ticket.type] = (typeCounts[ticket.type] || 0) + 1;
      }
    });

    // Find the type with highest count
    let topType = "N/A";
    let maxCount = 0;
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topType = type;
      }
    });

    return { type: topType, count: maxCount };
  } catch (err) {
    console.error("Exception in fetchTopIssueType:", err);
    return { type: "N/A", count: 0 };
  }
}

/** Fetch new users registered this month */
export async function fetchNewUsersThisMonth(
  supabase: SupabaseClient,
  isAdmin: boolean,
  teamId?: number
) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data, error } = await applyAreaFilter(
      supabase
        .from("users")
        .select("id, created_at")
        .gte("created_at", monthStart.toISOString()),
      isAdmin,
      teamId
    );

    if (error) {
      console.error("Error fetching new users:", error.message);
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    console.error("Exception in fetchNewUsersThisMonth:", err);
    return 0;
  }
}

/** Fetch month-over-month comparison for active users */
export async function fetchActiveUsersComparison(
  supabase: SupabaseClient,
  isAdmin: boolean,
  teamId?: number
) {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month active users
    const { data: currentData, error: currentError } = await applyAreaFilter(
      supabase
        .from("users")
        .select("id, is_active")
        .gte("created_at", currentMonthStart.toISOString())
        .eq("is_active", true),
      isAdmin,
      teamId
    );

    if (currentError) {
      console.error("Error fetching current month active users:", currentError.message);
      return { currentMonth: 0, previousMonth: 0, percentChange: 0, userDifference: 0 };
    }

    // Previous month active users
    const { data: previousData, error: previousError } = await applyAreaFilter(
      supabase
        .from("users")
        .select("id, is_active")
        .gte("created_at", previousMonthStart.toISOString())
        .lte("created_at", previousMonthEnd.toISOString())
        .eq("is_active", true),
      isAdmin,
      teamId
    );

    if (previousError) {
      console.error("Error fetching previous month active users:", previousError.message);
      return { currentMonth: 0, previousMonth: 0, percentChange: 0, userDifference: 0 };
    }

    const currentCount = currentData?.length || 0;
    const previousCount = previousData?.length || 0;
    const userDifference = currentCount - previousCount;

    let percentChange = 0;
    if (previousCount > 0) {
      percentChange = ((userDifference) / previousCount) * 100;
    } else if (currentCount > 0) {
      // If previous month had 0 active users but current has some, show 100% growth
      percentChange = 100;
    }

    return { currentMonth: currentCount, previousMonth: previousCount, percentChange, userDifference };
  } catch (err) {
    console.error("Exception in fetchActiveUsersComparison:", err);
    return { currentMonth: 0, previousMonth: 0, percentChange: 0, userDifference: 0 };
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

      // Calculate cumulative total and real-time pending
      let cumulativeTotal = 0;
      const series: TicketsSeriesPoint[] = dateArray.map((date, index) => {
        const key = toDayKeyUTCFromDate(date);
        const dayCount = countsByDay[key] ?? { pending: 0, done: 0, total: 0 };

        // Cumulative total (tickets arrived)
        cumulativeTotal += dayCount.total;

        // Pending count: increases on arrival, decreases when status = "Terminada"
        let realTimePending = 0;
        for (let i = 0; i <= index; i++) {
          const prevKey = toDayKeyUTCFromDate(dateArray[i]);
          const prevCount = countsByDay[prevKey] ?? { pending: 0, done: 0, total: 0 };
          realTimePending += prevCount.total - prevCount.done;
        }

        const labelInterval = days === 7 ? 1 : days === 30 ? 7 : 14;
        const showLabel = index % labelInterval === 0 || index === days - 1;

        const monthLabel = date.toLocaleString("es-MX", { month: "short", timeZone: "UTC" });
        const dayLabel = date.getUTCDate();

        return {
          label: showLabel ? `${monthLabel} ${dayLabel}` : "",
          total: cumulativeTotal,
          pending: realTimePending,
          done: dayCount.done,
        };
      });

      console.log("tickets series sample:", series.slice(0, 7));
      return series;
    }

    // Usuarios - Dual line chart for active vs inactive
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
        active: 0,
        inactive: 0,
      }));
    }

    // Normalize user data: assign null created_at to the earliest date in dataset
    const normalizedUsers = (users || []).map((u: { is_active: boolean; created_at?: string; id?: number }) => {
      // If user has created_at, use it
      if (u.created_at && u.created_at.trim()) {
        return u;
      }
      
      // If no created_at, we'll assign to earliest date after we find it
      return { ...u, created_at: null };
    });

    console.log(`📊 Chart: Total users fetched: ${normalizedUsers.length}`);

    // Find the earliest created_at from users that have it
    let earliestDate: Date | null = null;
    for (const u of normalizedUsers) {
      if (u.created_at && u.created_at.trim()) {
        const userDate = new Date(u.created_at);
        if (!Number.isNaN(userDate.getTime())) {
          if (!earliestDate || userDate < earliestDate) {
            earliestDate = userDate;
          }
        }
      }
    }

    // If no valid dates found, use start of the date range
    if (!earliestDate && dateArray.length > 0) {
      earliestDate = new Date(dateArray[0]);
    }

    // Assign null created_at to the earliest date found
    const processedUsers = normalizedUsers.map((u: { is_active: boolean; created_at?: string | null; id?: number }) => {
      if (!u.created_at || !u.created_at.trim()) {
        return {
          ...u,
          created_at: earliestDate ? earliestDate.toISOString() : dateArray[0].toISOString(),
        };
      }
      return u;
    });

    console.log(`📊 Chart: Processed users: ${processedUsers.length}, Active: ${processedUsers.filter((u: any) => u.is_active).length}, Inactive: ${processedUsers.filter((u: any) => !u.is_active).length}`);

    const usersData: any[] = [];

    dateArray.forEach((date, index) => {
      // Count cumulative active users (all array elements that are active and created <= date)
      const activeCount = processedUsers.filter((u: { is_active: boolean; created_at: string }) => {
        if (!u.is_active) return false;
        const userDate = new Date(u.created_at);
        userDate.setHours(0, 0, 0, 0);
        return userDate <= date;
      }).length;

      // Count cumulative inactive users (all array elements that are inactive and created <= date)
      const inactiveCount = processedUsers.filter((u: { is_active: boolean; created_at: string }) => {
        if (u.is_active) return false;
        const userDate = new Date(u.created_at);
        userDate.setHours(0, 0, 0, 0);
        return userDate <= date;
      }).length;

      const day = date.getUTCDate();
      const month = date.toLocaleString("es-MX", { month: "short", timeZone: "UTC" });
      const labelInterval = days === 7 ? 1 : days === 30 ? 7 : 14;
      const showLabel = index % labelInterval === 0 || index === days - 1;

      usersData.push({
        label: showLabel ? `${month} ${day}` : "",
        active: activeCount,
        inactive: inactiveCount,
      });
    });

    // Log final values
    if (usersData.length > 0) {
      const lastPoint = usersData[usersData.length - 1];
      console.log(`📊 Chart Final Point - Active: ${lastPoint.active}, Inactive: ${lastPoint.inactive}, Total: ${lastPoint.active + lastPoint.inactive}`);
    }

    return usersData;
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
      active: 0,
      inactive: 0,
    }));
  }
}