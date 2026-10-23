import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { logActivity } from "@/lib/activity";
import { overallConfidence } from "@/lib/ai/schemas";
import { AuthError, requireAdmin } from "@/lib/auth";
import { extractDocument, suggestProject, validateUpload } from "@/lib/intake";
import { safeFileName, signedUrl, uploadDocument } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");
    const clientId = String(formData.get("clientId") ?? "");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
    const invalid = validateUpload(file);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    const supabase = createClient();
    const { data: projects } = await supabase.from("projects").select("id, name, gc_name").eq("client_id", clientId);
    const { data: client } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle();
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const arrayBuffer = await file.arrayBuffer();
    const path = `invoices/${clientId}/${randomUUID()}-${safeFileName(file.name)}`;
    await uploadDocument(supabase, path, arrayBuffer, file.type);
    await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "document.uploaded", entityType: "document", entityId: path, clientId, details: { file_name: file.name, size: file.size, mime: file.type } });

    const result = await extractDocument(Buffer.from(arrayBuffer), file.type);
    if (result.model) {
      await logActivity(supabase, {
        actorId: admin.id,
        actorType: "ai",
        action: "invoice.extracted",
        entityType: "document",
        entityId: path,
        clientId,
        details: { model: result.model, text_method: result.textMethod, chars_sent: result.charsSent, confidence: overallConfidence(result.fields) },
      });
    }

    return NextResponse.json({
      path,
      previewUrl: await signedUrl(supabase, path),
      mime: file.type,
      fileName: file.name,
      fields: result.fields,
      confidence: overallConfidence(result.fields),
      textMethod: result.textMethod,
      notes: result.notes,
      suggestedProjectId: suggestProject(result.fields.gc_name.value, (projects ?? []) as Array<{ id: string; name: string; gc_name: string }>),
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("intake failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Intake failed" }, { status: 500 });
  }
}
