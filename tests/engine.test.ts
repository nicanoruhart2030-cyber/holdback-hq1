import { describe, expect, it } from "vitest";
import {
  annualHoldbackBase,
  annualHoldbackCycle,
  computeDeadlines,
  draftTypeFor,
  findOverdueInvoices,
  holdbackReleaseDue,
  invoiceBalance,
  invoiceDueDate,
  lienSchedule,
  severityFor,
  wsibStatus,
  type EngineInvoice,
  type EngineProject,
} from "@/lib/deadlines/engine";

const TODAY = "2026-10-22";

const project: EngineProject = {
  id: "p1",
  client_id: "c1",
  name: "Harbour Tower",
  payer_type: "contractor",
  holdback_percent: 10,
  contract_start_date: "2026-03-15",
  substantial_completion_date: null,
};

function invoice(overrides: Partial<EngineInvoice>): EngineInvoice {
  return {
    id: "i1",
    project_id: "p1",
    client_id: "c1",
    number: "INV-1",
    amount: 10000,
    tax: 1300,
    amount_paid: 0,
    status: "submitted",
    submitted_date: "2026-09-01",
    due_date: null,
    disputed_date: null,
    ...overrides,
  };
}

describe("invoice timing", () => {
  it("uses the contractor window for subcontract invoices", () => {
    expect(invoiceDueDate("2026-10-01", "contractor")).toBe("2026-11-05");
  });

  it("uses the owner window when invoicing an owner directly", () => {
    expect(invoiceDueDate("2026-10-01", "owner")).toBe("2026-10-29");
  });

  it("computes the payable balance net of holdback", () => {
    expect(invoiceBalance(invoice({}), 10)).toBe(10300);
    expect(invoiceBalance(invoice({ amount_paid: 5000 }), 10)).toBe(5300);
    expect(invoiceBalance(invoice({ status: "paid" }), 10)).toBe(0);
    expect(invoiceBalance(invoice({ amount_paid: 20000 }), 10)).toBe(0);
  });

  it("assigns severity by days remaining", () => {
    expect(severityFor("2026-10-21", TODAY)).toBe("overdue");
    expect(severityFor("2026-10-22", TODAY)).toBe("critical");
    expect(severityFor("2026-10-25", TODAY)).toBe("critical");
    expect(severityFor("2026-10-29", TODAY)).toBe("warning");
    expect(severityFor("2026-10-30", TODAY)).toBe("info");
  });

  it("flags overdue submitted and partial invoices only", () => {
    const invoices = [
      invoice({ id: "a", submitted_date: "2026-09-01" }),
      invoice({ id: "b", submitted_date: "2026-10-10" }),
      invoice({ id: "c", status: "paid", submitted_date: "2026-08-01" }),
      invoice({ id: "d", status: "partial", amount_paid: 3000, submitted_date: "2026-08-01" }),
      invoice({ id: "e", status: "disputed", submitted_date: "2026-08-01" }),
      invoice({ id: "f", due_date: "2026-12-01", submitted_date: "2026-08-01" }),
    ];
    expect(findOverdueInvoices(invoices, [project], TODAY)).toEqual(["a", "d"]);
  });
});

describe("holdback timing", () => {
  it("measures pre-2026 contracts from the regime start", () => {
    expect(annualHoldbackBase("2025-05-01")).toBe("2026-01-01");
    expect(annualHoldbackBase("2026-03-15")).toBe("2026-03-15");
    expect(annualHoldbackCycle("2025-05-01", 1)).toEqual({
      anniversary: "2027-01-01",
      noticeDue: "2027-01-15",
      ownerPaymentDue: "2027-03-30",
      subcontractReleaseDue: "2027-04-13",
    });
  });

  it("chains the annual release cycle for a 2026 contract", () => {
    expect(annualHoldbackCycle("2026-03-15", 1)).toEqual({
      anniversary: "2027-03-15",
      noticeDue: "2027-03-29",
      ownerPaymentDue: "2027-06-11",
      subcontractReleaseDue: "2027-06-25",
    });
  });

  it("builds the lien schedule from substantial completion", () => {
    expect(lienSchedule("2026-07-01")).toEqual({
      noticeWindowCloses: "2026-08-10",
      lienExpiry: "2026-08-31",
      releaseDue: "2026-09-14",
    });
  });

  it("picks the earlier of lien release and annual release", () => {
    expect(holdbackReleaseDue({ ...project, substantial_completion_date: "2026-07-01" }, "2026-06-30")).toBe(
      "2026-09-14",
    );
    expect(holdbackReleaseDue(project, "2026-06-30")).toBe("2027-06-25");
    expect(
      holdbackReleaseDue({ payer_type: "owner", contract_start_date: "2026-03-15", substantial_completion_date: null }, "2026-06-30"),
    ).toBe("2027-06-11");
    expect(holdbackReleaseDue({ ...project, contract_start_date: null }, "2026-06-30")).toBeNull();
  });
});

describe("WSIB status", () => {
  it("escalates through 30/14/3 day warnings", () => {
    expect(wsibStatus("2026-12-31", TODAY)).toMatchObject({ ruleId: null, severity: null });
    expect(wsibStatus("2026-11-15", TODAY)).toMatchObject({ ruleId: "wsib_expiry_30", severity: "info" });
    expect(wsibStatus("2026-11-01", TODAY)).toMatchObject({ ruleId: "wsib_expiry_14", severity: "warning" });
    expect(wsibStatus("2026-10-24", TODAY)).toMatchObject({ ruleId: "wsib_expiry_3", severity: "critical" });
    expect(wsibStatus("2026-10-20", TODAY)).toMatchObject({ ruleId: "wsib_expired", severity: "overdue", daysToExpiry: -2 });
  });
});

describe("computeDeadlines", () => {
  const result = computeDeadlines({
    today: TODAY,
    projects: [project, { ...project, id: "p2", name: "Lakeshore Clinic", substantial_completion_date: "2026-10-01" }],
    invoices: [
      invoice({ id: "overdue", submitted_date: "2026-09-01" }),
      invoice({ id: "fresh", number: "INV-2", submitted_date: "2026-10-20" }),
      invoice({ id: "disputed", number: "INV-3", status: "disputed", disputed_date: "2026-10-10" }),
      invoice({ id: "paid", status: "paid" }),
    ],
    holdbacks: [
      { id: "h1", project_id: "p2", client_id: "c1", period_end: "2026-09-30", amount_retained: 4200, release_due_date: null, released: false },
      { id: "h2", project_id: "p1", client_id: "c1", period_end: "2026-09-30", amount_retained: 900, release_due_date: null, released: true },
    ],
    wsib: [{ id: "w1", client_id: "c1", gc_name: "Northline GC", certificate_number: "123", expiry_date: "2026-10-25" }],
  });
  const byKey = new Map(result.map((d) => [d.dedupe_key, d]));

  it("produces an overdue payment deadline", () => {
    const d = byKey.get("contractor_payment_window:invoice:overdue");
    expect(d).toMatchObject({ due_date: "2026-10-06", severity: "overdue", amount: 10300 });
  });

  it("produces upcoming dispute and proper-invoice windows for fresh invoices only", () => {
    expect(byKey.get("contractor_notice_of_non_payment:invoice:fresh")?.due_date).toBe("2026-11-24");
    expect(byKey.get("proper_invoice_objection:invoice:fresh")?.due_date).toBe("2026-10-27");
    expect(byKey.has("contractor_notice_of_non_payment:invoice:overdue")).toBe(false);
  });

  it("produces an adjudication window for disputed invoices and no payment reminder", () => {
    expect(byKey.get("adjudication_referral:invoice:disputed")).toMatchObject({ due_date: "2026-11-02", severity: "info" });
    expect(byKey.has("contractor_payment_window:invoice:disputed")).toBe(false);
  });

  it("ignores paid invoices and released holdbacks", () => {
    expect(result.some((d) => d.entity_id === "paid" || d.entity_id === "h2")).toBe(false);
  });

  it("produces holdback release and lien deadlines", () => {
    expect(byKey.get("holdback_release:holdback:h1")).toMatchObject({ due_date: "2026-12-14", amount: 4200 });
    expect(byKey.get("lien_period:project:p2")?.due_date).toBe("2026-11-30");
    expect(byKey.get("holdback_notice_of_non_payment:project:p2")?.due_date).toBe("2026-11-10");
  });

  it("produces the annual notice deadline for projects without completion", () => {
    expect(byKey.get("annual_holdback_notice:project:p1:2027-03-15")?.due_date).toBe("2027-03-29");
  });

  it("produces a WSIB deadline keyed to the certificate expiry", () => {
    expect(byKey.get("wsib:wsib_clearance:w1:2026-10-25")).toMatchObject({ severity: "critical", rule_id: "wsib_expiry_3" });
  });

  it("sorts by due date", () => {
    const dates = result.map((d) => d.due_date);
    expect([...dates].sort()).toEqual(dates);
  });

  it("drafts only payment, holdback and WSIB items within 7 days or overdue", () => {
    const drafts = result.map((d) => [d.dedupe_key, draftTypeFor(d, TODAY)]).filter(([, t]) => t !== null);
    expect(drafts).toEqual([
      ["contractor_payment_window:invoice:overdue", "payment_reminder"],
      ["wsib:wsib_clearance:w1:2026-10-25", "wsib_renewal"],
    ]);
  });
});
