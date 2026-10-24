import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatCAD, formatDate } from "@/lib/format";
import type { Scan } from "@/lib/types";

const INK = rgb(0.027, 0.039, 0.051);
const MUTED = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.898, 0.906, 0.922);
const MUTED_INK = rgb(0.24, 0.24, 0.27);
const RED = rgb(0.506, 0.114, 0.114);

/** Standard PDF fonts are WinAnsi; strip characters they cannot encode. */
function safe(text: string): string {
  return text.replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

/** One-page Cash Leak Scan report, letter size. */
export async function renderScanPdf(scan: Scan): Promise<Uint8Array> {
  const r = scan.report!;
  const doc = await PDFDocument.create();
  doc.setTitle(`Cash Leak Scan - ${scan.prospect_company ?? scan.prospect_name}`);
  doc.setProducer("Holdback HQ");
  const page = doc.addPage([612, 792]);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const M = 48;
  let y = 792 - M;

  const text = (p: PDFPage, s: string, x: number, yy: number, font: PDFFont, size: number, color = INK) =>
    p.drawText(safe(s), { x, y: yy, font, size, color });
  const right = (s: string, xRight: number, yy: number, font: PDFFont, size: number, color = INK) =>
    text(page, s, xRight - font.widthOfTextAtSize(safe(s), size), yy, font, size, color);
  const rule = (yy: number) => page.drawLine({ start: { x: M, y: yy }, end: { x: 612 - M, y: yy }, thickness: 0.5, color: LINE });

  text(page, "Holdback HQ  ·  Cash Leak Scan", M, y, bold, 9, MUTED_INK);
  right(formatDate(r.generated_on), 612 - M, y, mono, 8, MUTED);
  y -= 30;
  text(page, scan.prospect_company ?? scan.prospect_name, M, y, bold, 22);
  y -= 16;
  text(page, `${r.invoice_count} invoices analysed${r.unreadable_count ? `, ${r.unreadable_count} unreadable` : ""}. Total invoiced ${formatCAD(r.total_invoiced)}.`, M, y, sans, 9, MUTED);
  y -= 24;
  rule(y);
  y -= 34;

  const stats: Array<[string, number, boolean]> = [
    ["Outstanding", r.total_outstanding, false],
    ["Overdue", r.total_overdue, r.total_overdue > 0],
    ["Unreleased holdback (est.)", r.holdback_estimate, false],
  ];
  const colW = (612 - 2 * M) / 3;
  stats.forEach(([label, value, alert], i) => {
    const x = M + i * colW;
    text(page, label.toUpperCase(), x, y + 18, sans, 7, MUTED);
    text(page, formatCAD(value, { whole: true }), x, y - 4, mono, 18, alert ? RED : INK);
  });
  y -= 30;
  rule(y);
  y -= 22;

  const section = (title: string) => {
    text(page, title.toUpperCase(), M, y, bold, 8, MUTED);
    y -= 14;
  };
  const row = (left: string, mid: string, amount: string, color = INK) => {
    if (y < 120) return;
    text(page, left.slice(0, 48), M, y, sans, 9);
    text(page, mid.slice(0, 40), M + 250, y, sans, 9, MUTED);
    right(amount, 612 - M, y, mono, 9, color);
    y -= 13;
  };

  section("Overdue by payer");
  if (r.overdue_by_gc.length === 0) row("No overdue invoices found", "", "");
  for (const g of r.overdue_by_gc.slice(0, 8)) row(g.gc_name, `${g.invoices} invoice(s), oldest ${g.oldest_days} days late`, formatCAD(g.amount), RED);
  y -= 12;

  section("Lapsed notice-of-non-payment windows");
  if (r.missed_windows.length === 0) row("None found", "", "");
  for (const w of r.missed_windows.slice(0, 10)) row(`${w.invoice_number} - ${w.gc_name}`, `window closed ${formatDate(w.window_closed)}`, formatCAD(w.amount));
  if (r.missed_windows.length > 10) row(`+ ${r.missed_windows.length - 10} more`, "", "");
  y -= 12;

  section("WSIB clearance gaps");
  if (r.wsib_gaps.length === 0) row("No gaps found", "", "");
  for (const g of r.wsib_gaps.slice(0, 8)) row(g.gc_name, g.reason, "");
  y -= 12;

  // Footer
  let fy = 96;
  page.drawLine({ start: { x: M, y: fy + 12 }, end: { x: 612 - M, y: fy + 12 }, thickness: 0.5, color: LINE });
  for (const a of r.assumptions) {
    text(page, `- ${a}`, M, fy, sans, 7, MUTED);
    fy -= 10;
  }
  text(page, "This report is an administrative estimate, not legal advice. Prospect data is deleted 30 days after the scan unless converted.", M, fy - 4, sans, 7, MUTED);
  return doc.save();
}
