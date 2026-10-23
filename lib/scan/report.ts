/**
 * Cash Leak Scan report builder. Pure: takes extracted invoice data from a
 * prospect's documents and "today", returns the one-page report model.
 */
import { compareDates, diffDays, type ISODate } from "@/lib/rules/calendar";
import { DEFAULT_HOLDBACK_PERCENT } from "@/lib/rules/ontario-construction-act";
import { disputeWindowCloses, invoiceDueDate, round2 } from "@/lib/deadlines/engine";

export interface ScanInvoice {
  file_name: string;
  invoice_number: string | null;
  gc_name: string | null;
  amount: number | null;
  tax: number | null;
  issue_date: ISODate | null;
  due_date: ISODate | null;
  amount_paid: number | null;
  paid: boolean | null;
  holdback_amount: number | null;
  wsib_certificate_number: string | null;
  wsib_expiry_date: ISODate | null;
}

export interface ScanReport {
  generated_on: ISODate;
  invoice_count: number;
  unreadable_count: number;
  total_invoiced: number;
  total_outstanding: number;
  total_overdue: number;
  holdback_estimate: number;
  overdue_by_gc: Array<{ gc_name: string; invoices: number; amount: number; oldest_days: number }>;
  missed_windows: Array<{
    invoice_number: string;
    gc_name: string;
    window_closed: ISODate;
    days_since: number;
    amount: number;
  }>;
  wsib_gaps: Array<{ gc_name: string; reason: string }>;
  assumptions: string[];
}

const UNKNOWN_GC = "Unknown payer";

function outstanding(inv: ScanInvoice): number {
  if (inv.paid === true || inv.amount === null) return 0;
  const total = inv.amount + (inv.tax ?? 0);
  const holdback = inv.holdback_amount ?? (inv.amount * DEFAULT_HOLDBACK_PERCENT) / 100;
  return Math.max(0, round2(total - holdback - (inv.amount_paid ?? 0)));
}

export function buildScanReport(invoices: ScanInvoice[], today: ISODate): ScanReport {
  const readable = invoices.filter((i) => i.amount !== null);
  const overdue = new Map<string, { invoices: number; amount: number; oldest_days: number }>();
  const missed: ScanReport["missed_windows"] = [];
  const gcSeen = new Set<string>();
  const wsibByGc = new Map<string, ISODate | null>();

  let totalInvoiced = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;
  let holdbackEstimate = 0;

  for (const inv of readable) {
    const amount = inv.amount ?? 0;
    const gc = inv.gc_name?.trim() || UNKNOWN_GC;
    gcSeen.add(gc);
    totalInvoiced += amount + (inv.tax ?? 0);
    holdbackEstimate += inv.holdback_amount ?? (amount * DEFAULT_HOLDBACK_PERCENT) / 100;

    if (inv.wsib_certificate_number) {
      const prev = wsibByGc.get(gc);
      const next = inv.wsib_expiry_date ?? null;
      if (prev === undefined || (next && (!prev || compareDates(next, prev) > 0))) wsibByGc.set(gc, next);
    }

    const owed = outstanding(inv);
    if (owed <= 0) continue;
    totalOutstanding += owed;

    const due = inv.due_date ?? (inv.issue_date ? invoiceDueDate(inv.issue_date, "contractor") : null);
    if (due && compareDates(due, today) < 0) {
      totalOverdue += owed;
      const days = diffDays(due, today);
      const row = overdue.get(gc) ?? { invoices: 0, amount: 0, oldest_days: 0 };
      row.invoices += 1;
      row.amount = round2(row.amount + owed);
      row.oldest_days = Math.max(row.oldest_days, days);
      overdue.set(gc, row);
    }

    if (inv.issue_date) {
      const closes = disputeWindowCloses(inv.issue_date, "contractor");
      if (compareDates(closes, today) < 0) {
        missed.push({
          invoice_number: inv.invoice_number ?? inv.file_name,
          gc_name: gc,
          window_closed: closes,
          days_since: diffDays(closes, today),
          amount: owed,
        });
      }
    }
  }

  const wsibGaps: ScanReport["wsib_gaps"] = [];
  for (const gc of [...gcSeen].sort()) {
    if (gc === UNKNOWN_GC) continue;
    if (!wsibByGc.has(gc)) {
      wsibGaps.push({ gc_name: gc, reason: "No WSIB clearance certificate found in documents" });
      continue;
    }
    const expiry = wsibByGc.get(gc);
    if (expiry && compareDates(expiry, today) < 0) {
      wsibGaps.push({ gc_name: gc, reason: `Most recent clearance expired ${expiry}` });
    }
  }

  return {
    generated_on: today,
    invoice_count: readable.length,
    unreadable_count: invoices.length - readable.length,
    total_invoiced: round2(totalInvoiced),
    total_outstanding: round2(totalOutstanding),
    total_overdue: round2(totalOverdue),
    holdback_estimate: round2(holdbackEstimate),
    overdue_by_gc: [...overdue.entries()]
      .map(([gc_name, v]) => ({ gc_name, ...v }))
      .sort((a, b) => b.amount - a.amount),
    missed_windows: missed.sort((a, b) => b.days_since - a.days_since),
    wsib_gaps: wsibGaps,
    assumptions: [
      `Holdback estimated at ${DEFAULT_HOLDBACK_PERCENT}% of pre-tax amount where not stated on the invoice.`,
      "Payment due dates follow the contractor-to-subcontractor window from the issue date when no due date is printed.",
      "Invoices are treated as unpaid unless the document shows payment.",
      "Statutory windows are unverified defaults pending legal review.",
    ],
  };
}
