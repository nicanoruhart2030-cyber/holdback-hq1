import { invoiceBalance, round2 } from "@/lib/deadlines/engine";
import { addCalendarDays, compareDates, diffDays } from "@/lib/rules/calendar";
import { UPCOMING_WINDOW_DAYS } from "@/lib/rules/ontario-construction-act";
import { num, type Holdback, type Invoice, type Project } from "@/lib/types";

export interface MoneyMetrics {
  moneyAtRisk: number;
  overdueTotal: number;
  overdueCount: number;
  disputedTotal: number;
  outstandingTotal: number;
  holdbackOwed: number;
  holdbackDueSoon: number;
}

/**
 * Money at risk = overdue balances + disputed balances + unreleased holdback
 * that is past due or due within the upcoming window.
 */
export function moneyMetrics(
  invoices: Invoice[],
  projects: Pick<Project, "id" | "holdback_percent">[],
  holdbacks: Holdback[],
  today: string,
): MoneyMetrics {
  const pct = new Map(projects.map((p) => [p.id, num(p.holdback_percent)]));
  let overdueTotal = 0;
  let overdueCount = 0;
  let disputedTotal = 0;
  let outstandingTotal = 0;

  for (const inv of invoices) {
    const balance = invoiceBalance(
      { amount: num(inv.amount), tax: num(inv.tax), amount_paid: num(inv.amount_paid), status: inv.status },
      pct.get(inv.project_id) ?? 10,
    );
    outstandingTotal += balance;
    if (inv.status === "overdue") {
      overdueTotal += balance;
      overdueCount += 1;
    }
    if (inv.status === "disputed") disputedTotal += balance;
  }

  const horizon = addCalendarDays(today, UPCOMING_WINDOW_DAYS);
  let holdbackOwed = 0;
  let holdbackDueSoon = 0;
  for (const h of holdbacks) {
    if (h.released) continue;
    const amt = num(h.amount_retained);
    holdbackOwed += amt;
    if (h.release_due_date && compareDates(h.release_due_date, horizon) <= 0) holdbackDueSoon += amt;
  }

  return {
    moneyAtRisk: round2(overdueTotal + disputedTotal + holdbackDueSoon),
    overdueTotal: round2(overdueTotal),
    overdueCount,
    disputedTotal: round2(disputedTotal),
    outstandingTotal: round2(outstandingTotal),
    holdbackOwed: round2(holdbackOwed),
    holdbackDueSoon: round2(holdbackDueSoon),
  };
}

export interface AgingBucket {
  key: "current" | "d30" | "d60" | "d90" | "d90p";
  label: string;
  amount: number;
  color: string;
}

/** Colour ramp for receivables by age: neutral, then amber, orange, red. */
export const AGING_COLORS: Record<AgingBucket["key"], string> = {
  current: "#D1D5DB",
  d30: "#FED6A9",
  d60: "#FB923C",
  d90: "#C2410C",
  d90p: "#811D1D",
};

/**
 * Payable balances grouped by days past their due date. Invoices not yet due
 * (or without a due date) are "Current".
 */
export function agingBuckets(
  invoices: Invoice[],
  projects: Pick<Project, "id" | "holdback_percent">[],
  today: string,
): AgingBucket[] {
  const pct = new Map(projects.map((p) => [p.id, num(p.holdback_percent)]));
  const buckets: AgingBucket[] = [
    { key: "current", label: "Current", amount: 0, color: AGING_COLORS.current },
    { key: "d30", label: "1–30 days", amount: 0, color: AGING_COLORS.d30 },
    { key: "d60", label: "31–60 days", amount: 0, color: AGING_COLORS.d60 },
    { key: "d90", label: "61–90 days", amount: 0, color: AGING_COLORS.d90 },
    { key: "d90p", label: "90+ days", amount: 0, color: AGING_COLORS.d90p },
  ];
  for (const inv of invoices) {
    const balance = invoiceBalance(
      { amount: num(inv.amount), tax: num(inv.tax), amount_paid: num(inv.amount_paid), status: inv.status },
      pct.get(inv.project_id) ?? 10,
    );
    if (balance <= 0) continue;
    const late = inv.due_date ? diffDays(inv.due_date, today) : 0;
    const idx = late <= 0 ? 0 : late <= 30 ? 1 : late <= 60 ? 2 : late <= 90 ? 3 : 4;
    const bucket = buckets[idx];
    if (bucket) bucket.amount = round2(bucket.amount + balance);
  }
  return buckets;
}

export interface PayerStat {
  name: string;
  openBalance: number;
  openInvoices: number;
  overdueInvoices: number;
  /** Average days since submission across open invoices. */
  avgDaysOutstanding: number;
}

/** Per-payer (GC or owner) view of what is owed and how long it has been waiting. */
export function payerStats(
  invoices: Invoice[],
  projects: Pick<Project, "id" | "gc_name" | "holdback_percent">[],
  today: string,
): PayerStat[] {
  const byProject = new Map(projects.map((p) => [p.id, p]));
  const acc = new Map<string, { open: number; count: number; overdue: number; days: number }>();
  for (const inv of invoices) {
    const project = byProject.get(inv.project_id);
    if (!project || !inv.submitted_date) continue;
    const balance = invoiceBalance(
      { amount: num(inv.amount), tax: num(inv.tax), amount_paid: num(inv.amount_paid), status: inv.status },
      num(project.holdback_percent),
    );
    if (balance <= 0) continue;
    const row = acc.get(project.gc_name) ?? { open: 0, count: 0, overdue: 0, days: 0 };
    row.open += balance;
    row.count += 1;
    row.days += Math.max(0, diffDays(inv.submitted_date, today));
    if (inv.status === "overdue") row.overdue += 1;
    acc.set(project.gc_name, row);
  }
  return [...acc.entries()]
    .map(([name, r]) => ({
      name,
      openBalance: round2(r.open),
      openInvoices: r.count,
      overdueInvoices: r.overdue,
      avgDaysOutstanding: Math.round(r.days / r.count),
    }))
    .sort((a, b) => b.avgDaysOutstanding - a.avgDaysOutstanding);
}
