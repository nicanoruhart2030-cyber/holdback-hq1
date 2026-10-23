import "server-only";
import { groqJSON } from "@/lib/ai/groq";
import { minimizeForExtraction } from "@/lib/ai/minimize";
import { invoiceExtractionSchema, type InvoiceExtraction } from "@/lib/ai/schemas";

const SYSTEM = `You extract structured data from Ontario construction subcontractor invoices.
Return ONLY a JSON object with exactly these keys:
invoice_number, amount, tax, issue_date, submitted_date, due_date, gc_name,
amount_paid, paid, holdback_amount, wsib_certificate_number, wsib_expiry_date.
Each key maps to {"value": ..., "confidence": number between 0 and 1}.
Rules:
- amount is the PRE-TAX subtotal in CAD as a number (no symbols). tax is HST/GST total as a number.
- Dates are ISO "YYYY-MM-DD". submitted_date is only set if the document states when it was submitted/received.
- gc_name is the party being billed (general contractor or owner), not the issuer.
- holdback_amount is the holdback/retention amount if shown.
- paid is true only if the document shows it was paid in full; amount_paid if a payment is shown.
- wsib_* only if a WSIB clearance certificate number/expiry appears.
- Use null with confidence 0 for anything not present. Never guess; lower confidence when unsure.`;

export async function extractInvoiceFields(
  text: string,
): Promise<{ fields: InvoiceExtraction; model: string; charsSent: number }> {
  const minimized = minimizeForExtraction(text);
  const { data, model } = await groqJSON(invoiceExtractionSchema, [
    { role: "system", content: SYSTEM },
    { role: "user", content: `Invoice text:\n"""\n${minimized}\n"""` },
  ]);
  return { fields: data, model, charsSent: minimized.length };
}
