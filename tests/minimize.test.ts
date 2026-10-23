import { describe, expect, it } from "vitest";
import { ensureDisclaimer, LEGAL_DISCLAIMER, MAX_EXTRACTION_CHARS, minimizeForExtraction, parseModelJSON } from "@/lib/ai/minimize";
import { EMPTY_EXTRACTION, invoiceExtractionSchema, overallConfidence } from "@/lib/ai/schemas";
import { buildTemplateDraft } from "@/lib/drafts/templates";

describe("ensureDisclaimer", () => {
  it("appends the disclaimer exactly once, at the end", () => {
    const once = ensureDisclaimer("Hello");
    expect(once.endsWith(LEGAL_DISCLAIMER)).toBe(true);
    expect(ensureDisclaimer(once)).toBe(once);
    const moved = ensureDisclaimer(`${LEGAL_DISCLAIMER}\n\nBody text`);
    expect(moved.split(LEGAL_DISCLAIMER).length - 1).toBe(1);
    expect(moved.endsWith(LEGAL_DISCLAIMER)).toBe(true);
  });

  it("is applied to every template type", () => {
    const ctx = { sender_company: "Kestrel", sender_contact: "Dana", recipient_name: "Meridian", project_name: "Tower", project_address: null, invoice_number: "KE-1", amount: 1000, due_date: "2026-10-01", days_overdue: 21, certificate_number: "CC-1" };
    for (const t of ["payment_reminder", "holdback_release_request", "wsib_renewal"] as const) {
      expect(ensureDisclaimer(buildTemplateDraft(t, ctx).body).endsWith(LEGAL_DISCLAIMER)).toBe(true);
    }
  });
});

describe("minimizeForExtraction", () => {
  it("redacts banking, SIN and card numbers but keeps invoice facts", () => {
    const out = minimizeForExtraction(
      "Invoice KE-2051\nTotal $48,250.00\nTransit: 12345 Institution: 004 Account: 1234567\nSIN 123 456 789\nCard 4111 1111 1111 1111\nDue 2026-11-05",
    );
    expect(out).toContain("KE-2051");
    expect(out).toContain("$48,250.00");
    expect(out).toContain("2026-11-05");
    expect(out).not.toContain("1234567");
    expect(out).not.toContain("123 456 789");
    expect(out).not.toContain("4111 1111 1111 1111");
  });

  it("caps length while keeping the head and tail", () => {
    const long = `HEAD ${"x ".repeat(20_000)} TAIL`;
    const out = minimizeForExtraction(long);
    expect(out.length).toBeLessThanOrEqual(MAX_EXTRACTION_CHARS + 10);
    expect(out.startsWith("HEAD")).toBe(true);
    expect(out.endsWith("TAIL")).toBe(true);
  });
});

describe("model JSON handling", () => {
  it("parses fenced JSON and rejects junk", () => {
    expect(parseModelJSON('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(() => parseModelJSON("not json")).toThrow();
  });

  it("validates extraction output with zod", () => {
    expect(invoiceExtractionSchema.safeParse(EMPTY_EXTRACTION).success).toBe(true);
    const bad = { ...EMPTY_EXTRACTION, amount: { value: "12", confidence: 2 } };
    expect(invoiceExtractionSchema.safeParse(bad).success).toBe(false);
  });

  it("computes overall confidence over required fields", () => {
    expect(overallConfidence(EMPTY_EXTRACTION)).toBe(0);
    const x = { ...EMPTY_EXTRACTION, invoice_number: { value: "1", confidence: 1 }, amount: { value: 10, confidence: 0.5 } };
    expect(overallConfidence(x)).toBe(0.3);
  });
});
