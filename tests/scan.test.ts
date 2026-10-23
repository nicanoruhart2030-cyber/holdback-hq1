import { describe, expect, it } from "vitest";
import { buildScanReport, type ScanInvoice } from "@/lib/scan/report";

function inv(overrides: Partial<ScanInvoice>): ScanInvoice {
  return {
    file_name: "a.pdf",
    invoice_number: "1001",
    gc_name: "Northline GC",
    amount: 10000,
    tax: 1300,
    issue_date: "2026-08-01",
    due_date: null,
    amount_paid: null,
    paid: null,
    holdback_amount: null,
    wsib_certificate_number: null,
    wsib_expiry_date: null,
    ...overrides,
  };
}

describe("buildScanReport", () => {
  const report = buildScanReport(
    [
      inv({}),
      inv({ invoice_number: "1002", issue_date: "2026-10-15" }),
      inv({ invoice_number: "1003", gc_name: "Beacon Builders", paid: true, wsib_certificate_number: "W-1", wsib_expiry_date: "2026-09-01" }),
      inv({ invoice_number: "1004", gc_name: "Beacon Builders", amount: 5000, tax: 650, holdback_amount: 0, due_date: "2026-09-30" }),
      inv({ file_name: "blurry.jpg", amount: null }),
    ],
    "2026-10-22",
  );

  it("totals invoiced and outstanding amounts net of holdback", () => {
    expect(report.invoice_count).toBe(4);
    expect(report.unreadable_count).toBe(1);
    expect(report.total_invoiced).toBe(39550);
    expect(report.total_outstanding).toBe(10300 + 10300 + 5650);
  });

  it("estimates holdback at 10% unless stated", () => {
    expect(report.holdback_estimate).toBe(3000);
  });

  it("groups overdue amounts by GC", () => {
    expect(report.overdue_by_gc).toEqual([
      { gc_name: "Northline GC", invoices: 1, amount: 10300, oldest_days: 44 },
      { gc_name: "Beacon Builders", invoices: 1, amount: 5650, oldest_days: 22 },
    ]);
    expect(report.total_overdue).toBe(15950);
  });

  it("lists lapsed notice-of-non-payment windows", () => {
    expect(report.missed_windows.map((m) => m.invoice_number)).toEqual(["1001", "1004"]);
  });

  it("flags missing and expired WSIB clearances", () => {
    expect(report.wsib_gaps).toEqual([
      { gc_name: "Beacon Builders", reason: "Most recent clearance expired 2026-09-01" },
      { gc_name: "Northline GC", reason: "No WSIB clearance certificate found in documents" },
    ]);
  });
});
