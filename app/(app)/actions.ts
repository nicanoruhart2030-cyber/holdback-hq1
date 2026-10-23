"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { ensureDisclaimer } from "@/lib/ai/minimize";
import { requireAdmin } from "@/lib/auth";
import { invoiceDueDate } from "@/lib/deadlines/engine";
import { sendEmail } from "@/lib/email/resend";
import { todayInToronto } from "@/lib/format";
import { DEFAULT_HOLDBACK_PERCENT } from "@/lib/rules/ontario-construction-act";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { runDailySweep } from "@/lib/sweep";
import type { Draft, Project } from "@/lib/types";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const optionalDate = z.preprocess((v) => (v === "" || v === null ? null : v), isoDate.nullable());
const optionalText = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().trim().nullable());
const money = z.coerce.number().nonnegative().max(1_000_000_000);

function form(fd: FormData): Record<string, FormDataEntryValue | null> {
  return Object.fromEntries([...fd.keys()].map((k) => [k, fd.get(k)]));
}

function fail(error: { message: string } | null, what: string): void {
  if (error) throw new Error(`${what}: ${error.message}`);
}

// Clients --------------------------------------------------------------------

const clientSchema = z.object({
  name: z.string().trim().min(1),
  trade: z.string().trim().min(1),
  contact_name: optionalText,
  email: z.preprocess((v) => (v === "" ? null : v), z.string().email().nullable()),
  phone: optionalText,
  plan_tier: z.enum(["solo", "crew", "pro"]),
  monthly_fee: money,
  status: z.enum(["onboarding", "active", "paused", "churned"]).default("onboarding"),
});

export async function createClientAction(fd: FormData) {
  const admin = await requireAdmin();
  const input = clientSchema.parse(form(fd));
  const supabase = createClient();
  const { data, error } = await supabase.from("clients").insert(input).select("id").single<{ id: string }>();
  fail(error, "Create client");
  await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "client.created", entityType: "client", entityId: data!.id, clientId: data!.id, details: input });
  revalidatePath("/clients");
  redirect(`/clients/${data!.id}`);
}

export async function updateClientAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(fd.get("id"));
  const input = clientSchema.parse(form(fd));
  const supabase = createClient();
  const { error } = await supabase.from("clients").update(input).eq("id", id);
  fail(error, "Update client");
  await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "client.updated", entityType: "client", entityId: id, clientId: id, details: input });
  revalidatePath(`/clients/${id}`);
}

/** PIPEDA deletion on request: removes the client, all their rows and their documents. */
export async function deleteClientAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(fd.get("id"));
  const confirm = z.string().parse(fd.get("confirm"));
  const supabase = createClient();
  const { data: client } = await supabase.from("clients").select("name").eq("id", id).single<{ name: string }>();
  if (!client || confirm.trim() !== client.name) throw new Error("Type the client name exactly to confirm deletion.");

  const db = createAdminClient();
  const { data: files } = await db.storage.from("documents").list(`invoices/${id}`, { limit: 1000 });
  if (files && files.length > 0) {
    const { error } = await db.storage.from("documents").remove(files.map((f) => `invoices/${id}/${f.name}`));
    fail(error, "Delete documents");
  }
  const { error } = await db.from("clients").delete().eq("id", id);
  fail(error, "Delete client");
  await logActivity(supabase, {
    actorId: admin.id,
    actorType: "user",
    action: "client.deleted",
    entityType: "client",
    entityId: id,
    details: { documents_removed: files?.length ?? 0 },
  });
  revalidatePath("/clients");
  redirect("/clients");
}

// Projects -------------------------------------------------------------------

const projectSchema = z.object({
  client_id: z.string().uuid(),
  name: z.string().trim().min(1),
  gc_name: z.string().trim().min(1),
  gc_contact_email: z.preprocess((v) => (v === "" ? null : v), z.string().email().nullable()),
  payer_type: z.enum(["owner", "contractor"]),
  address: optionalText,
  contract_value: money,
  holdback_percent: z.coerce.number().min(0).max(100).default(DEFAULT_HOLDBACK_PERCENT),
  contract_start_date: optionalDate,
  substantial_completion_date: optionalDate,
});

export async function createProjectAction(fd: FormData) {
  const admin = await requireAdmin();
  const input = projectSchema.parse(form(fd));
  const supabase = createClient();
  const { data, error } = await supabase.from("projects").insert(input).select("id").single<{ id: string }>();
  fail(error, "Create project");
  await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "project.created", entityType: "project", entityId: data!.id, clientId: input.client_id, details: input });
  revalidatePath(`/clients/${input.client_id}`);
  redirect(`/projects/${data!.id}`);
}

export async function updateProjectDatesAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(fd.get("id"));
  const input = z
    .object({ substantial_completion_date: optionalDate, contract_start_date: optionalDate, gc_contact_email: projectSchema.shape.gc_contact_email })
    .parse(form(fd));
  const supabase = createClient();
  const { data, error } = await supabase.from("projects").update(input).eq("id", id).select("client_id").single<{ client_id: string }>();
  fail(error, "Update project");
  await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "project.updated", entityType: "project", entityId: id, clientId: data?.client_id, details: input });
  revalidatePath(`/projects/${id}`);
}

// Invoices -------------------------------------------------------------------

const invoiceSchema = z.object({
  project_id: z.string().uuid(),
  number: z.string().trim().min(1),
  amount: money,
  tax: money.default(0),
  issue_date: optionalDate,
  submitted_date: optionalDate,
  due_date: optionalDate,
  status: z.enum(["draft", "submitted", "disputed", "paid", "partial", "overdue"]),
  amount_paid: money.default(0),
  source_file_path: optionalText,
  extraction_confidence: z.preprocess((v) => (v === "" || v === null ? null : v), z.coerce.number().min(0).max(1).nullable()),
  notes: optionalText,
});

export async function saveInvoiceAction(fd: FormData): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const admin = await requireAdmin();
    const parsed = invoiceSchema.safeParse(form(fd));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
    }
    const input = parsed.data;
    const supabase = createClient();
    const { data: project } = await supabase.from("projects").select("id, client_id, payer_type").eq("id", input.project_id).single<Pick<Project, "id" | "client_id" | "payer_type">>();
    if (!project) return { ok: false, error: "Project not found" };
    if (input.source_file_path && !input.source_file_path.startsWith(`invoices/${project.client_id}/`)) {
      return { ok: false, error: "Document does not belong to this client" };
    }
    const due_date = input.due_date ?? (input.submitted_date ? invoiceDueDate(input.submitted_date, project.payer_type) : null);
    const status = input.status === "draft" && input.submitted_date ? "submitted" : input.status;

    const { data, error } = await supabase
      .from("invoices")
      .insert({ ...input, due_date, status, client_id: project.client_id })
      .select("id")
      .single<{ id: string }>();
    if (error) return { ok: false, error: error.code === "23505" ? "An invoice with this number already exists on the project" : error.message };
    await logActivity(supabase, {
      actorId: admin.id,
      actorType: "user",
      action: "invoice.created",
      entityType: "invoice",
      entityId: data!.id,
      clientId: project.client_id,
      details: { ...input, due_date, status, confirmed_after_extraction: input.extraction_confidence !== null },
    });
    revalidatePath(`/projects/${input.project_id}`);
    revalidatePath(`/clients/${project.client_id}`);
    return { ok: true, id: data!.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed" };
  }
}

export async function updateInvoiceStatusAction(fd: FormData) {
  const admin = await requireAdmin();
  const input = z
    .object({
      id: z.string().uuid(),
      status: z.enum(["submitted", "disputed", "paid", "partial", "overdue"]),
      amount_paid: z.preprocess((v) => (v === "" || v === null ? undefined : v), money.optional()),
      disputed_date: optionalDate.optional(),
    })
    .parse(form(fd));
  const supabase = createClient();
  const { data: inv } = await supabase.from("invoices").select("project_id, client_id, amount, tax, status").eq("id", input.id).single<{ project_id: string; client_id: string; amount: number; tax: number; status: string }>();
  if (!inv) throw new Error("Invoice not found");
  const patch: Record<string, unknown> = { status: input.status };
  if (input.amount_paid !== undefined) patch.amount_paid = input.amount_paid;
  if (input.status === "disputed") patch.disputed_date = input.disputed_date ?? todayInToronto();
  const { error } = await supabase.from("invoices").update(patch).eq("id", input.id);
  fail(error, "Update invoice");
  await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "invoice.status_changed", entityType: "invoice", entityId: input.id, clientId: inv.client_id, details: { from: inv.status, ...patch } });
  revalidatePath(`/projects/${inv.project_id}`);
}

// Holdbacks & WSIB -------------------------------------------------------------

export async function addHoldbackAction(fd: FormData) {
  const admin = await requireAdmin();
  const input = z
    .object({ project_id: z.string().uuid(), period_start: isoDate, period_end: isoDate, amount_retained: money })
    .parse(form(fd));
  const supabase = createClient();
  const { data, error } = await supabase.from("holdbacks").insert(input).select("id, client_id").single<{ id: string; client_id: string }>();
  fail(error, "Add holdback");
  await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "holdback.created", entityType: "holdback", entityId: data!.id, clientId: data!.client_id, details: input });
  revalidatePath(`/projects/${input.project_id}`);
}

export async function releaseHoldbackAction(fd: FormData) {
  const admin = await requireAdmin();
  const input = z.object({ id: z.string().uuid(), released_date: isoDate }).parse(form(fd));
  const supabase = createClient();
  const { data, error } = await supabase
    .from("holdbacks")
    .update({ released: true, released_date: input.released_date })
    .eq("id", input.id)
    .select("project_id, client_id")
    .single<{ project_id: string; client_id: string }>();
  fail(error, "Release holdback");
  await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "holdback.released", entityType: "holdback", entityId: input.id, clientId: data?.client_id, details: input });
  revalidatePath(`/projects/${data?.project_id}`);
}

export async function addWsibAction(fd: FormData) {
  const admin = await requireAdmin();
  const input = z
    .object({
      client_id: z.string().uuid(),
      gc_name: z.string().trim().min(1),
      certificate_number: z.string().trim().min(1),
      issue_date: isoDate,
      expiry_date: isoDate,
    })
    .refine((v) => v.expiry_date >= v.issue_date, "Expiry must be after issue date")
    .parse(form(fd));
  const supabase = createClient();
  const status = input.expiry_date < todayInToronto() ? "expired" : "valid";
  const { data, error } = await supabase.from("wsib_clearances").insert({ ...input, status }).select("id").single<{ id: string }>();
  fail(error, "Add WSIB clearance");
  await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "wsib.created", entityType: "wsib_clearance", entityId: data!.id, clientId: input.client_id, details: input });
  revalidatePath(`/clients/${input.client_id}`);
}

// Deadlines --------------------------------------------------------------------

export async function resolveDeadlineAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(fd.get("id"));
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deadlines")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", id)
    .select("client_id, dedupe_key")
    .single<{ client_id: string; dedupe_key: string }>();
  fail(error, "Resolve deadline");
  await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "deadline.resolved", entityType: "deadline", entityId: id, clientId: data?.client_id, details: { dedupe_key: data?.dedupe_key } });
  revalidatePath("/deadlines");
  revalidatePath("/dashboard");
}

export async function runSweepNowAction() {
  const admin = await requireAdmin();
  await runDailySweep(createAdminClient(), todayInToronto(), admin.id);
  revalidatePath("/", "layout");
}

// Drafts -----------------------------------------------------------------------

const draftEditSchema = z.object({
  id: z.string().uuid(),
  to_email: z.string().trim().email(),
  subject: z.string().trim().min(3).max(200),
  body: z.string().trim().min(20).max(6000),
});

async function loadPendingDraft(id: string) {
  const supabase = createClient();
  const { data } = await supabase.from("drafts").select("*").eq("id", id).single<Draft>();
  if (!data) throw new Error("Draft not found");
  if (data.status !== "pending") throw new Error(`Draft is already ${data.status}`);
  return { supabase, draft: data };
}

export async function saveDraftAction(fd: FormData) {
  const admin = await requireAdmin();
  const input = draftEditSchema.parse(form(fd));
  const { supabase, draft } = await loadPendingDraft(input.id);
  const body = ensureDisclaimer(input.body);
  const { error } = await supabase.from("drafts").update({ to_email: input.to_email, subject: input.subject, body }).eq("id", input.id);
  fail(error, "Save draft");
  await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "draft.edited", entityType: "draft", entityId: input.id, clientId: draft.client_id, details: { subject: input.subject, to: input.to_email } });
  revalidatePath("/drafts");
}

/** The only code path that sends email. Requires an explicit admin click. */
export async function approveAndSendDraftAction(fd: FormData) {
  const admin = await requireAdmin();
  const input = draftEditSchema.parse(form(fd));
  const { supabase, draft } = await loadPendingDraft(input.id);
  const body = ensureDisclaimer(input.body);

  const approvedAt = new Date().toISOString();
  const { data: claimed, error } = await supabase
    .from("drafts")
    .update({ status: "approved", to_email: input.to_email, subject: input.subject, body, approved_by: admin.id, approved_at: approvedAt })
    .eq("id", input.id)
    .eq("status", "pending")
    .select("id");
  fail(error, "Approve draft");
  if (!claimed || claimed.length === 0) throw new Error("Draft was already handled");
  await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "draft.approved", entityType: "draft", entityId: input.id, clientId: draft.client_id, details: { to: input.to_email, subject: input.subject } });

  try {
    const { id: providerId } = await sendEmail({ to: input.to_email, subject: input.subject, text: body, replyTo: draft.reply_to });
    await supabase.from("drafts").update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: providerId, error: null }).eq("id", input.id);
    await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "draft.sent", entityType: "draft", entityId: input.id, clientId: draft.client_id, details: { provider: "resend", provider_message_id: providerId, to: input.to_email } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    // Return to the queue so it can be retried; nothing was delivered.
    await supabase.from("drafts").update({ status: "pending", error: message, approved_by: null, approved_at: null }).eq("id", input.id);
    await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "draft.send_failed", entityType: "draft", entityId: input.id, clientId: draft.client_id, details: { error: message } });
  }
  revalidatePath("/drafts");
  revalidatePath("/", "layout");
}

export async function rejectDraftAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(fd.get("id"));
  const { supabase, draft } = await loadPendingDraft(id);
  const { error } = await supabase.from("drafts").update({ status: "rejected" }).eq("id", id);
  fail(error, "Reject draft");
  await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "draft.rejected", entityType: "draft", entityId: id, clientId: draft.client_id });
  revalidatePath("/drafts");
  revalidatePath("/", "layout");
}

// Scans ------------------------------------------------------------------------

export async function convertScanAction(fd: FormData) {
  const admin = await requireAdmin();
  const input = z
    .object({ id: z.string().uuid(), trade: z.string().trim().min(1), plan_tier: z.enum(["solo", "crew", "pro"]), monthly_fee: money })
    .parse(form(fd));
  const supabase = createClient();
  const { data: scan } = await supabase.from("scans").select("*").eq("id", input.id).single<{ prospect_name: string; prospect_company: string | null; prospect_email: string | null; converted_client_id: string | null }>();
  if (!scan) throw new Error("Scan not found");
  if (scan.converted_client_id) redirect(`/clients/${scan.converted_client_id}`);
  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      name: scan.prospect_company ?? scan.prospect_name,
      trade: input.trade,
      contact_name: scan.prospect_name,
      email: scan.prospect_email,
      plan_tier: input.plan_tier,
      monthly_fee: input.monthly_fee,
      status: "onboarding",
    })
    .select("id")
    .single<{ id: string }>();
  fail(error, "Create client");
  const { error: e2 } = await supabase.from("scans").update({ converted_client_id: client!.id, expires_at: null }).eq("id", input.id);
  fail(e2, "Convert scan");
  await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "scan.converted", entityType: "scan", entityId: input.id, clientId: client!.id });
  redirect(`/clients/${client!.id}`);
}

export async function deleteScanAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(fd.get("id"));
  const supabase = createClient();
  const { data: files } = await supabase.from("scan_files").select("storage_path").eq("scan_id", id);
  const paths = (files ?? []).map((f: { storage_path: string }) => f.storage_path);
  if (paths.length > 0) {
    const { error } = await supabase.storage.from("documents").remove(paths);
    fail(error, "Delete scan documents");
  }
  const { error } = await supabase.from("scans").delete().eq("id", id);
  fail(error, "Delete scan");
  await logActivity(supabase, { actorId: admin.id, actorType: "user", action: "scan.deleted", entityType: "scan", entityId: id, details: { files: paths.length } });
  revalidatePath("/scan");
  redirect("/scan");
}
