export type RangeKey = 90 | 30 | 7;
export type DataTab = "Tickets" | "Usuarios";

export type ChartPoint = { label: string; value: number };

export type TicketsSeriesPoint = {
  label: string;
  total: number;
  pending: number;
  done: number;
};

export type UsersSeriesPoint = {
  label: string;
  active: number;
  inactive: number;
};

export type MonthComparison = {
  currentMonth: number;
  previousMonth: number;
  percentChange: number;
};

export type ActiveUsersComparison = {
  currentMonth: number;
  previousMonth: number;
  percentChange: number;
  userDifference: number;
};

export type IssueTypeData = {
  type: string;
  count: number;
};