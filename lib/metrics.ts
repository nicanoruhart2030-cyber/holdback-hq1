import { invoiceBalance, round2 } from "@/lib/deadlines/engine";
import { addCalendarDays, compareDates } from "@/lib/rules/calendar";
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
