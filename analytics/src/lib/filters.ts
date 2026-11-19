export const RANGE_OPTIONS = [
  ["today", "Today"], ["7d", "Last 7 days"], ["30d", "Last 30 days"],
  ["60d", "Last 60 days"], ["90d", "Last 90 days"],
  ["all", "All time"], ["custom", "Custom dates"],
] as const;
export const DIMENSIONS = [
  ["all", "All traffic"], ["country", "Country"], ["device", "Device"],
  ["browser", "Browser"], ["source", "Traffic source"],
  ["page", "Page"], ["edition", "Event edition"],
] as const;
export type Range = (typeof RANGE_OPTIONS)[number][0];
export type Dimension = (typeof DIMENSIONS)[number][0];
export type Filters = { range: Range; from: string; to: string; dimension: Dimension; value: string };
const ranges = RANGE_OPTIONS.map(row => row[0]);
const dimensions = DIMENSIONS.map(row => row[0]);

function dateString(raw: string | null): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const d = new Date(raw + "T00:00:00Z");
  return Number.isNaN(d.valueOf()) || d.toISOString().slice(0, 10) !== raw ? "" : raw;
}
export function parseFilters(params: URLSearchParams): Filters {
  const r = params.get("range") || "30d";
  const d = params.get("dimension") || "all";
  const range = ranges.includes(r as Range) ? r as Range : "30d";
  const dimension = dimensions.includes(d as Dimension) ? d as Dimension : "all";
  const from = dateString(params.get("from"));
  const to = dateString(params.get("to"));
  const value = (params.get("value") || "").trim().slice(0, 120);
  const now = new Date().toISOString().slice(0, 10);
  if (range === "custom" && (!from || !to || from > to || to > now)) {
    return {range: "30d", from:"", to:"", dimension, value};
  }
  return {range, from, to, dimension, value: dimension === "all" ? "" : value};
}
export function bounds(filters: Filters, now = new Date()) {
  const end = new Date(now);
  let start: Date;
  if (filters.range === "all") start = new Date("2020-01-01T00:00:00Z");
  else if (filters.range === "today") start = new Date(now.toISOString().slice(0,10) + "T00:00:00Z");
  else if (filters.range === "custom") {
    start = new Date(filters.from + "T00:00:00Z");
    end.setTime(Math.min(now.getTime(), Date.parse(filters.to + "T00:00:00Z") + 86400000));
  } else {
    start = new Date(now.getTime() - parseInt(filters.range, 10) * 86400000);
  }
  return { start, end, days: Math.max(1, (end.getTime() - start.getTime()) / 86400000) };
}
export const FILTER_COLUMNS: Record<Exclude<Dimension,"all">,string> = {
  country: "country", device: "device", browser: "browser", source: "source",
  page: "page_path", edition: "event_edition",
};
export function where(filters: Filters, start: Date, end: Date) {
  const params: unknown[] = [start.toISOString(), end.toISOString()];
  let sql = "created_at >= $1::timestamptz AND created_at < $2::timestamptz";
  if (filters.dimension !== "all" && filters.value) {
    params.push(filters.value);
    sql += " AND " + FILTER_COLUMNS[filters.dimension] + " = $3";
  }
  return { sql, params };
}
export function labelFor(filters: Filters) {
  return filters.dimension === "all" || !filters.value ? "All traffic" :
    (DIMENSIONS.find(x => x[0] === filters.dimension)?.[1] || "Audience") + ": " + filters.value;
}
