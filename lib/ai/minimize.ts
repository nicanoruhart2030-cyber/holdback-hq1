/**
 * Data minimization before any text leaves our infrastructure for an LLM.
 * Only invoice-relevant text is sent; identifiers that are never needed for
 * extraction (banking details, SINs, card numbers) are redacted.
 */

export const MAX_EXTRACTION_CHARS = 12_000;

const REDACTIONS: Array<[RegExp, string]> = [
  // Card numbers: 13-19 digits with optional spaces/dashes.
  [/\b(?:\d[ -]?){12,18}\d\b/g, "[REDACTED-NUMBER]"],
  // Social Insurance Number: 3-3-3.
  [/\b\d{3}[ -]\d{3}[ -]\d{3}\b/g, "[REDACTED-SIN]"],
  // Canadian banking: transit-institution / account labels.
  [/\b(transit|institution|account|acct|routing|iban|swift|bic)(\s*(no\.?|number|#))?\s*[:#]?\s*[A-Z0-9][A-Z0-9 -]{3,}/gi, "$1 [REDACTED]"],
  [/\b\d{5}[- ]\d{3}\b/g, "[REDACTED-BANK]"],
];

export function minimizeForExtraction(text: string): string {
  let out = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  for (const [pattern, replacement] of REDACTIONS) out = out.replace(pattern, replacement);
  if (out.length > MAX_EXTRACTION_CHARS) {
    // Totals and payment terms usually sit at the end of an invoice; keep both ends.
    const head = out.slice(0, MAX_EXTRACTION_CHARS - 3_000);
    const tail = out.slice(-3_000);
    out = `${head}\n[...]\n${tail}`;
  }
  return out;
}

export const LEGAL_DISCLAIMER = "This is an administrative reminder, not legal advice.";

/** Guarantees every outbound draft ends with the disclaimer exactly once. */
export function ensureDisclaimer(body: string): string {
  const trimmed = body.replaceAll(LEGAL_DISCLAIMER, "").trimEnd();
  return `${trimmed}\n\n${LEGAL_DISCLAIMER}`;
}

/** Parses JSON from a model response, tolerating code fences. */
export function parseModelJSON(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}
