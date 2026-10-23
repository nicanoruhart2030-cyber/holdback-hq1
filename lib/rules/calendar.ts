/**
 * Date arithmetic for deadline rules. All dates are ISO calendar dates
 * ("YYYY-MM-DD") representing a day in America/Toronto. Working on date-only
 * strings keeps every function pure and immune to server timezone drift.
 */

export type ISODate = string;

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function assertISODate(value: string): ISODate {
  if (!ISO_RE.test(value)) throw new Error(`Invalid ISO date: ${value}`);
  const d = toUTC(value);
  if (Number.isNaN(d.getTime()) || fromUTC(d) !== value) {
    throw new Error(`Invalid calendar date: ${value}`);
  }
  return value;
}

function toUTC(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTC(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function makeDate(year: number, month: number, day: number): ISODate {
  return fromUTC(new Date(Date.UTC(year, month - 1, day)));
}

export function addCalendarDays(iso: ISODate, days: number): ISODate {
  const d = toUTC(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUTC(d);
}

export function addYears(iso: ISODate, years: number): ISODate {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  // Feb 29 anniversaries fall on Feb 28 in non-leap years.
  const target = new Date(Date.UTC(y + years, m - 1, 1));
  const lastDay = new Date(Date.UTC(y + years, m, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return fromUTC(target);
}

/** 0 = Sunday ... 6 = Saturday */
export function dayOfWeek(iso: ISODate): number {
  return toUTC(iso).getUTCDay();
}

export function isWeekend(iso: ISODate): boolean {
  const dow = dayOfWeek(iso);
  return dow === 0 || dow === 6;
}

/** Whole days from `a` to `b` (positive when b is later). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b).getTime() - toUTC(a).getTime()) / 86_400_000);
}

export function compareDates(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Gregorian Easter Sunday (anonymous Gregorian algorithm). */
export function easterSunday(year: number): ISODate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return makeDate(year, month, day);
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): ISODate {
  const first = makeDate(year, month, 1);
  const offset = (weekday - dayOfWeek(first) + 7) % 7;
  return addCalendarDays(first, offset + (n - 1) * 7);
}

/** Victoria Day: the Monday before May 25. */
function victoriaDay(year: number): ISODate {
  const may24 = makeDate(year, 5, 24);
  const back = (dayOfWeek(may24) - 1 + 7) % 7;
  return addCalendarDays(may24, -back);
}

export interface Holiday {
  date: ISODate;
  name: string;
  /** True when this is a substitute day because the holiday fell on a weekend. */
  observed: boolean;
}

/**
 * Ontario public holidays under the Employment Standards Act, 2000 (the nine
 * statutory holidays), with weekend substitutes moved to the next working day.
 * Civic Holiday, Easter Monday and Remembrance Day are not ESA statutory
 * holidays and are excluded by default; the Legislation Act, 2006 definition
 * of "holiday" is broader, which is why the rules table carries verified: false.
 */
export function ontarioStatutoryHolidays(year: number): Holiday[] {
  const fixed: Holiday[] = [
    { date: makeDate(year, 1, 1), name: "New Year's Day", observed: false },
    { date: nthWeekdayOfMonth(year, 2, 1, 3), name: "Family Day", observed: false },
    { date: addCalendarDays(easterSunday(year), -2), name: "Good Friday", observed: false },
    { date: victoriaDay(year), name: "Victoria Day", observed: false },
    { date: makeDate(year, 7, 1), name: "Canada Day", observed: false },
    { date: nthWeekdayOfMonth(year, 9, 1, 1), name: "Labour Day", observed: false },
    { date: nthWeekdayOfMonth(year, 10, 1, 2), name: "Thanksgiving", observed: false },
    { date: makeDate(year, 12, 25), name: "Christmas Day", observed: false },
    { date: makeDate(year, 12, 26), name: "Boxing Day", observed: false },
  ];

  const taken = new Set(fixed.map((h) => h.date));
  const result = [...fixed];
  for (const h of fixed) {
    if (!isWeekend(h.date)) continue;
    let sub = addCalendarDays(h.date, 1);
    while (isWeekend(sub) || taken.has(sub)) sub = addCalendarDays(sub, 1);
    taken.add(sub);
    result.push({ date: sub, name: `${h.name} (observed)`, observed: true });
  }
  return result.sort((a, b) => compareDates(a.date, b.date));
}

const holidayCache = new Map<number, Set<ISODate>>();

export function isOntarioHoliday(iso: ISODate): boolean {
  const year = Number(iso.slice(0, 4));
  let set = holidayCache.get(year);
  if (!set) {
    set = new Set(ontarioStatutoryHolidays(year).map((h) => h.date));
    holidayCache.set(year, set);
  }
  return set.has(iso);
}

export function isBusinessDay(iso: ISODate): boolean {
  return !isWeekend(iso) && !isOntarioHoliday(iso);
}

/** Moves a date forward until it lands on a business day (identity if it already is one). */
export function rollForwardToBusinessDay(iso: ISODate): ISODate {
  let d = iso;
  while (!isBusinessDay(d)) d = addCalendarDays(d, 1);
  return d;
}

/**
 * Adds business days. Positive counts move forward, negative backward; the
 * start date itself is never counted.
 */
export function addBusinessDays(iso: ISODate, days: number): ISODate {
  if (days === 0) return iso;
  const step = days > 0 ? 1 : -1;
  let remaining = Math.abs(days);
  let d = iso;
  while (remaining > 0) {
    d = addCalendarDays(d, step);
    if (isBusinessDay(d)) remaining -= 1;
  }
  return d;
}
