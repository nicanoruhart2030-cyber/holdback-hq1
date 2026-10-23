export const TIMEZONE = "America/Toronto";

const cad = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });
const cadCompact = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

export function formatCAD(value: number | null | undefined, opts: { whole?: boolean } = {}): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return (opts.whole ? cadCompact : cad).format(value);
}

/** Today's calendar date in Toronto as YYYY-MM-DD. */
export function todayInToronto(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
});

/**
 * Formats a date-only value. Date-only values are already Toronto calendar
 * dates, so they are formatted in UTC to avoid shifting by the offset.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

const tsFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "—" : tsFmt.format(d);
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString("en-CA", { maximumFractionDigits: 2 })}%`;
}
