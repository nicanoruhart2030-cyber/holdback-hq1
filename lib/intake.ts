import "server-only";
import { AIUnavailableError } from "@/lib/ai/groq";
import { extractInvoiceFields } from "@/lib/ai/extract-invoice";
import { EMPTY_EXTRACTION, type InvoiceExtraction } from "@/lib/ai/schemas";
import { extractText, type TextMethod } from "@/lib/extract/text";
import { ACCEPTED_MIME, MAX_UPLOAD_BYTES } from "@/lib/storage";

export interface DocumentExtraction {
  fields: InvoiceExtraction;
  textMethod: TextMethod;
  model: string | null;
  charsSent: number;
  notes: string[];
}

export function validateUpload(file: File): string | null {
  if (!(ACCEPTED_MIME as readonly string[]).includes(file.type)) return `Unsupported file type ${file.type || "unknown"}. Use PDF, PNG, JPEG or WebP.`;
  if (file.size > MAX_UPLOAD_BYTES) return "File is larger than 20 MB.";
  if (file.size === 0) return "File is empty.";
  return null;
}

/** Text extraction + AI field extraction. Never throws for AI/OCR unavailability. */
export async function extractDocument(buffer: Buffer, mime: string): Promise<DocumentExtraction> {
  const notes: string[] = [];
  const text = await extractText(buffer, mime);
  if (text.note) notes.push(text.note);
  if (!text.text.trim()) return { fields: EMPTY_EXTRACTION, textMethod: text.method, model: null, charsSent: 0, notes };
  try {
    const { fields, model, charsSent } = await extractInvoiceFields(text.text);
    return { fields, textMethod: text.method, model, charsSent, notes };
  } catch (err) {
    notes.push(
      err instanceof AIUnavailableError
        ? `AI extraction disabled: ${err.message}. Enter fields manually.`
        : "AI extraction failed. Enter fields manually.",
    );
    if (!(err instanceof AIUnavailableError)) console.error("extraction failed", err);
    return { fields: EMPTY_EXTRACTION, textMethod: text.method, model: null, charsSent: 0, notes };
  }
}

/** Best-effort match of an extracted payer name to a client's project. */
export function suggestProject(gcName: string | null, projects: Array<{ id: string; gc_name: string; name: string }>): string | null {
  if (projects.length === 1) return projects[0]?.id ?? null;
  if (!gcName) return null;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = norm(gcName);
  const hit = projects.find((p) => {
    const g = norm(p.gc_name);
    return g.length > 0 && (target.includes(g) || g.includes(target));
  });
  return hit?.id ?? null;
}
