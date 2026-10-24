import { describe, expect, it } from "vitest";
import { agingBuckets, moneyMetrics, payerStats } from "@/lib/metrics";
import type { Holdback, Invoice, Project } from "@/lib/types";

const TODAY = "2026-10-23";
const project = { id: "p1", gc_name: "Meridian Build Group", holdback_percent: 10 } as Project;
const owner = { id: "p2", gc_name: "Elmvale Schools", holdback_percent: 10 } as Project;

function inv(overrides: Partial<Invoice>): Invoice {
  return {
    id: "i", project_id: "p1", client_id: "c1", number: "1", amount: 10000, tax: 1300, issue_date: null,
    submitted_date: "2026-09-01", due_date: "2026-10-06", disputed_date: null, status: "submitted", amount_paid: 0,
    source_file_path: null, extraction_confidence: null, notes: null, created_at: "", ...overrides,
  };
}

describe("agingBuckets", () => {
  it("buckets payable balances by days past due", () => {
    const buckets = agingBuckets(
      [
        inv({ due_date: "2026-11-01" }),
        inv({ due_date: "2026-10-01" }),
        inv({ due_date: "2026-09-01" }),
        inv({ due_date: "2026-08-01" }),
        inv({ due_date: "2026-06-01" }),
        inv({ due_date: "2026-06-01", status: "paid" }),
        inv({ due_date: null }),
      ],
      [project],
      TODAY,
    );
    expect(buckets.map((b) => [b.key, b.amount])).toEqual([
      ["current", 20600],
      ["d30", 10300],
      ["d60", 10300],
      ["d90", 10300],
      ["d90p", 10300],
    ]);
  });
});

describe("payerStats", () => {
  it("summarises open balances per payer, slowest first", () => {
    const stats = payerStats(
      [
        inv({ submitted_date: "2026-09-01", status: "overdue" }),
        inv({ submitted_date: "2026-10-13" }),
        inv({ project_id: "p2", submitted_date: "2026-10-03" }),
        inv({ project_id: "p2", status: "paid" }),
      ],
      [project, owner],
      TODAY,
    );
    expect(stats).toEqual([
      { name: "Meridian Build Group", openBalance: 20600, openInvoices: 2, overdueInvoices: 1, avgDaysOutstanding: 31 },
      { name: "Elmvale Schools", openBalance: 10300, openInvoices: 1, overdueInvoices: 0, avgDaysOutstanding: 20 },
    ]);
  });
});

describe("moneyMetrics", () => {
  it("adds overdue, disputed and holdback due within 14 days", () => {
    const holdbacks = [
      { id: "h1", project_id: "p1", client_id: "c1", period_start: "", period_end: "", amount_retained: 500, release_due_date: "2026-10-30", released: false, released_date: null },
      { id: "h2", project_id: "p1", client_id: "c1", period_start: "", period_end: "", amount_retained: 900, release_due_date: "2027-03-01", released: false, released_date: null },
    ] as Holdback[];
    const m = moneyMetrics([inv({ status: "overdue" }), inv({ status: "disputed" })], [project], holdbacks, TODAY);
    expect(m).toMatchObject({ overdueTotal: 10300, disputedTotal: 10300, holdbackOwed: 1400, holdbackDueSoon: 500, moneyAtRisk: 21100 });
  });
});
