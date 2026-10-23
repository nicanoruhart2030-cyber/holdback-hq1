import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { logActivity } from "@/lib/activity";
import { overallConfidence } from "@/lib/ai/schemas";
import { AuthError, requireAdmin } from "@/lib/auth";
import { todayInToronto } from "@/lib/format";
import { extractDocument, validateUpload } from "@/lib/intake";
import { buildScanReport, type ScanInvoice } from "@/lib/scan/report";
import { safeFileName, uploadDocument } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILES = 40;

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const fd = await request.formData();
    const prospectName = String(fd.get("prospect_name") ?? "").trim();
    if (!prospectName) return NextResponse.json({ error: "Prospect name is required" }, { status: 400 });
    const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) return NextResponse.json({ error: "Add at least one invoice" }, { status: 400 });
    if (files.length > MAX_FILES) return NextResponse.json({ error: `Up to ${MAX_FILES} files per scan` }, { status: 400 });
    for (const f of files) {
      const invalid = validateUpload(f);
      if (invalid) return NextResponse.json({ error: `${f.name}: ${invalid}` }, { status: 400 });
    }

    const supabase = createClient();
    const email = String(fd.get("prospect_email") ?? "").trim() || null;
    const company = String(fd.get("prospect_company") ?? "").trim() || null;
    const { data: scan, error } = await supabase
      .from("scans")
      .insert({ prospect_name: prospectName, prospect_company: company, prospect_email: email, created_by: admin.id })
      .select("id")
      .single<{ id: string }>();
    if (error || !scan) throw new Error(error?.message ?? "Could not create scan");
    await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "scan.created", entityType: "scan", entityId: scan.id, details: { files: files.length } });

    const rows: ScanInvoice[] = [];
    let aiCalls = 0;
    for (const file of files) {
      const buf = await file.arrayBuffer();
      const path = `scans/${scan.id}/${randomUUID()}-${safeFileName(file.name)}`;
      await uploadDocument(supabase, path, buf, file.type);
      const result = await extractDocument(Buffer.from(buf), file.type);
      if (result.model) aiCalls += 1;
      const f = result.fields;
      rows.push({
        file_name: file.name,
        invoice_number: f.invoice_number.value,
        gc_name: f.gc_name.value,
        amount: f.amount.value,
        tax: f.tax.value,
        issue_date: f.issue_date.value ?? f.submitted_date.value,
        due_date: f.due_date.value,
        amount_paid: f.amount_paid.value,
        paid: f.paid.value,
        holdback_amount: f.holdback_amount.value,
        wsib_certificate_number: f.wsib_certificate_number.value,
        wsib_expiry_date: f.wsib_expiry_date.value,
      });
      await supabase.from("scan_files").insert({
        scan_id: scan.id,
        file_name: file.name,
        storage_path: path,
        extracted: f,
        confidence: overallConfidence(f),
        error: result.notes.join(" ") || null,
      });
    }

    const report = buildScanReport(rows, todayInToronto());
    await supabase.from("scans").update({ status: "ready", report }).eq("id", scan.id);
    await logActivity(supabase, { actorId: admin.id, actorType: aiCalls ? "ai" : "system", action: "scan.analyzed", entityType: "scan", entityId: scan.id, details: { files: files.length, ai_extractions: aiCalls, total_outstanding: report.total_outstanding } });
    return NextResponse.json({ id: scan.id });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("scan failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Scan failed" }, { status: 500 });
  }
}
