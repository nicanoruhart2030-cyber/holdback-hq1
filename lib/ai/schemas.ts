import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable();

const field = <T extends z.ZodTypeAny>(value: T) =>
  z.object({ value, confidence: z.number().min(0).max(1) });

export const invoiceExtractionSchema = z.object({
  invoice_number: field(z.string().nullable()),
  amount: field(z.number().nonnegative().nullable()),
  tax: field(z.number().nonnegative().nullable()),
  issue_date: field(isoDate),
  submitted_date: field(isoDate),
  due_date: field(isoDate),
  gc_name: field(z.string().nullable()),
  amount_paid: field(z.number().nonnegative().nullable()),
  paid: field(z.boolean().nullable()),
  holdback_amount: field(z.number().nonnegative().nullable()),
  wsib_certificate_number: field(z.string().nullable()),
  wsib_expiry_date: field(isoDate),
});

export type InvoiceExtraction = z.infer<typeof invoiceExtractionSchema>;
export type ExtractionField = keyof InvoiceExtraction;

export const EMPTY_EXTRACTION: InvoiceExtraction = {
  invoice_number: { value: null, confidence: 0 },
  amount: { value: null, confidence: 0 },
  tax: { value: null, confidence: 0 },
  issue_date: { value: null, confidence: 0 },
  submitted_date: { value: null, confidence: 0 },
  due_date: { value: null, confidence: 0 },
  gc_name: { value: null, confidence: 0 },
  amount_paid: { value: null, confidence: 0 },
  paid: { value: null, confidence: 0 },
  holdback_amount: { value: null, confidence: 0 },
  wsib_certificate_number: { value: null, confidence: 0 },
  wsib_expiry_date: { value: null, confidence: 0 },
};

export { LOW_CONFIDENCE } from "@/lib/ai/confidence";

/** Overall confidence: mean over the fields required to save an invoice. */
export function overallConfidence(x: InvoiceExtraction): number {
  const keys: ExtractionField[] = ["invoice_number", "amount", "tax", "issue_date", "gc_name"];
  const total = keys.reduce((sum, k) => sum + (x[k].value === null ? 0 : x[k].confidence), 0);
  return Math.round((total / keys.length) * 1000) / 1000;
}

export const draftSchema = z.object({
  subject: z.string().min(5).max(200),
  body: z.string().min(40).max(4000),
});
