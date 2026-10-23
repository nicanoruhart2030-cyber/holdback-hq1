import "server-only";
import { optionalEnv } from "@/lib/env";

export type TextMethod = "pdf-text" | "vision" | "none";

export interface ExtractedText {
  text: string;
  method: TextMethod;
  note: string | null;
}

/** Below this many characters a PDF is treated as scanned and sent to OCR. */
const MIN_PDF_TEXT = 60;

async function pdfText(buffer: Buffer): Promise<string> {
  // Import the implementation directly; the package index runs a debug harness.
  const mod = (await import("pdf-parse/lib/pdf-parse.js")) as unknown as {
    default: (b: Buffer) => Promise<{ text: string }>;
  };
  const result = await mod.default(buffer);
  return result.text ?? "";
}

async function visionOCR(buffer: Buffer, mime: string): Promise<string> {
  const key = optionalEnv("GOOGLE_VISION_API_KEY");
  if (!key) throw new Error("vision-not-configured");
  const content = buffer.toString("base64");
  const isPdf = mime === "application/pdf";
  const endpoint = isPdf ? "files:annotate" : "images:annotate";
  const request = isPdf
    ? { inputConfig: { content, mimeType: "application/pdf" }, features: [{ type: "DOCUMENT_TEXT_DETECTION" }], pages: [1, 2, 3, 4, 5] }
    : { image: { content }, features: [{ type: "DOCUMENT_TEXT_DETECTION" }] };

  const res = await fetch(`https://vision.googleapis.com/v1/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
    body: JSON.stringify({ requests: [request] }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Vision OCR failed (${res.status})`);
  const data = (await res.json()) as {
    responses?: Array<{
      fullTextAnnotation?: { text?: string };
      responses?: Array<{ fullTextAnnotation?: { text?: string } }>;
    }>;
  };
  const first = data.responses?.[0];
  if (!first) return "";
  if (isPdf) return (first.responses ?? []).map((r) => r.fullTextAnnotation?.text ?? "").join("\n");
  return first.fullTextAnnotation?.text ?? "";
}

/**
 * Text from a PDF or image. Digital PDFs use pdf-parse locally; scanned PDFs
 * and images fall back to Google Cloud Vision when configured.
 */
export async function extractText(buffer: Buffer, mime: string): Promise<ExtractedText> {
  if (mime === "application/pdf") {
    let text = "";
    try {
      text = await pdfText(buffer);
    } catch (err) {
      console.error("pdf-parse failed", err);
    }
    if (text.trim().length >= MIN_PDF_TEXT) return { text, method: "pdf-text", note: null };
  }
  try {
    const text = await visionOCR(buffer, mime);
    return { text, method: "vision", note: text.trim() ? null : "OCR found no text" };
  } catch (err) {
    const notConfigured = err instanceof Error && err.message === "vision-not-configured";
    return {
      text: "",
      method: "none",
      note: notConfigured
        ? "Scanned document: OCR is not configured (GOOGLE_VISION_API_KEY). Enter fields manually."
        : "OCR failed. Enter fields manually.",
    };
  }
}
