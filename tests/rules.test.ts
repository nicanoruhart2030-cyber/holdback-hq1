import { describe, expect, it } from "vitest";
import { RULES, type RuleId } from "@/lib/rules/ontario-construction-act";
import { applyRule } from "@/lib/deadlines/engine";

/** [trigger date, expected deadline, what the case exercises] */
const CASES: Record<RuleId, Array<[string, string, string]>> = {
  proper_invoice_objection: [
    ["2026-03-02", "2026-03-09", "weekday to weekday"],
    ["2026-03-07", "2026-03-16", "lands on Saturday, rolls to Monday"],
  ],
  owner_payment_window: [
    ["2026-03-02", "2026-03-30", "28 calendar days"],
    ["2026-03-06", "2026-04-06", "lands on Good Friday 2026"],
  ],
  owner_notice_of_non_payment: [
    ["2026-06-03", "2026-06-17", "14 calendar days"],
    ["2026-06-17", "2026-07-02", "lands on Canada Day 2026"],
  ],
  contractor_payment_window: [
    ["2026-10-01", "2026-11-05", "35 calendar days"],
    ["2026-11-20", "2026-12-29", "lands on Christmas 2026, skips observed Boxing Day"],
  ],
  contractor_notice_of_non_payment: [
    ["2027-02-01", "2027-03-08", "35 calendar days, lands on Monday"],
    ["2027-11-20", "2027-12-29", "lands on Christmas 2027 Saturday, skips both substitutes"],
  ],
  adjudication_referral: [
    ["2027-09-15", "2027-10-06", "21 calendar days"],
    ["2027-09-20", "2027-10-12", "lands on Thanksgiving 2027"],
  ],
  annual_holdback_notice: [
    ["2027-01-01", "2027-01-15", "14 days after anniversary"],
    ["2026-02-02", "2026-02-17", "lands on Family Day 2026"],
  ],
  annual_holdback_owner_payment: [
    ["2027-01-15", "2027-03-30", "74 days after notice"],
    ["2026-07-21", "2026-10-05", "lands on Saturday, rolls to Monday"],
  ],
  annual_holdback_subcontract_release: [
    ["2027-03-30", "2027-04-13", "14 days after owner payment"],
    ["2027-03-12", "2027-03-29", "lands on Good Friday 2027"],
  ],
  lien_period: [
    ["2026-07-01", "2026-08-31", "lands on Sunday, rolls to Monday"],
    ["2027-03-03", "2027-05-03", "60 days, Sunday to Monday"],
  ],
  holdback_notice_of_non_payment: [
    ["2026-07-01", "2026-08-10", "40 days"],
    ["2027-08-14", "2027-09-23", "40 days across Labour Day"],
  ],
  holdback_release_after_lien: [
    ["2026-08-31", "2026-09-14", "14 days after lien expiry"],
    ["2027-08-23", "2027-09-07", "lands on Labour Day 2027"],
  ],
  wsib_expiry_30: [
    ["2026-12-31", "2026-12-01", "30 days before expiry"],
    ["2027-01-30", "2026-12-31", "crosses year end"],
  ],
  wsib_expiry_14: [
    ["2026-11-30", "2026-11-16", "14 days before expiry"],
    ["2026-05-30", "2026-05-16", "warning stays on a Saturday (no roll forward)"],
  ],
  wsib_expiry_3: [
    ["2027-01-03", "2026-12-31", "3 days before expiry"],
    ["2026-12-28", "2026-12-25", "warning stays on Christmas (no roll forward)"],
  ],
  wsib_expired: [
    ["2026-05-30", "2026-05-30", "expiry day itself, even on a weekend"],
    ["2027-07-01", "2027-07-01", "expiry day itself, even on a holiday"],
  ],
};

describe("Ontario Construction Act rules table", () => {
  it("has a test case for every rule", () => {
    expect(Object.keys(CASES).sort()).toEqual(RULES.map((r) => r.id).sort());
  });

  it("ships every rule unverified", () => {
    for (const rule of RULES) expect(rule.verified).toBe(false);
  });

  it("has unique ids and a source note on every rule", () => {
    expect(new Set(RULES.map((r) => r.id)).size).toBe(RULES.length);
    for (const rule of RULES) expect(rule.sourceNote.length).toBeGreaterThan(10);
  });

  for (const rule of RULES) {
    describe(rule.id, () => {
      for (const [trigger, expected, label] of CASES[rule.id]) {
        it(`${label}: ${trigger} -> ${expected}`, () => {
          expect(applyRule(rule.id, trigger)).toBe(expected);
        });
      }
    });
  }
});
