export type RangeKey = 90 | 30 | 7;
export type DataTab = "Tickets" | "Usuarios";

export type ChartPoint = { label: string; value: number };

export type TicketsSeriesPoint = {
  label: string;
  total: number;
  pending: number;
  done: number;
};