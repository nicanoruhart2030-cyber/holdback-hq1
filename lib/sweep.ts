import "server-only";
import { generateDraft } from "@/lib/ai/drafts";
import { logActivity } from "@/lib/activity";
import {
  computeDeadlines,
  draftTypeFor,
  findOverdueInvoices,
  holdbackReleaseDue,
  wsibStatus,
  type DeadlineCandidate,
  type EngineHoldback,
  type EngineInvoice,
  type EngineProject,
  type EngineWsib,
} from "@/lib/deadlines/engine";
import { diffDays } from "@/lib/rules/calendar";
import type { AdminClient } from "@/lib/supabase/admin";
import { removeDocuments } from "@/lib/storage";
import { num, type Client, type Holdback, type Invoice, type Project, type WsibClearance } from "@/lib/types";

/** Upper bound on drafts generated per run, to cap AI spend. */
const MAX_DRAFTS_PER_RUN = 40;

export interface SweepResult {
  today: string;
  invoicesFlaggedOverdue: number;
  holdbackDatesUpdated: number;
  wsibStatusUpdated: number;
  deadlinesOpen: number;
  deadlinesResolved: number;
  draftsCreated: number;
  scansDeleted: number;
}

function check<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return (res.data ?? []) as T;
}

export async function runDailySweep(db: AdminClient, today: string, actorId: string | null = null): Promise<SweepResult> {
  const [clients, projects, invoices, holdbacks, wsib] = await Promise.all([
    db.from("clients").select("*").then((r) => check<Client[]>(r, "clients")),
    db.from("projects").select("*").then((r) => check<Project[]>(r, "projects")),
    db.from("invoices").select("*").then((r) => check<Invoice[]>(r, "invoices")),
    db.from("holdbacks").select("*").then((r) => check<Holdback[]>(r, "holdbacks")),
    db.from("wsib_clearances").select("*").then((r) => check<WsibClearance[]>(r, "wsib")),
  ]);

  const eProjects: EngineProject[] = projects.map((p) => ({
    id: p.id,
    client_id: p.client_id,
    name: p.name,
    payer_type: p.payer_type,
    holdback_percent: num(p.holdback_percent),
    contract_start_date: p.contract_start_date,
    substantial_completion_date: p.substantial_completion_date,
  }));
  const eInvoices: EngineInvoice[] = invoices.map((i) => ({
    id: i.id,
    project_id: i.project_id,
    client_id: i.client_id,
    number: i.number,
    amount: num(i.amount),
    tax: num(i.tax),
    amount_paid: num(i.amount_paid),
    status: i.status,
    submitted_date: i.submitted_date,
    due_date: i.due_date,
    disputed_date: i.disputed_date,
  }));
  const projectById = new Map(eProjects.map((p) => [p.id, p]));

  // 1. Flag overdue invoices.
  const overdueIds = findOverdueInvoices(eInvoices, eProjects, today);
  if (overdueIds.length > 0) {
    check(await db.from("invoices").update({ status: "overdue" }).in("id", overdueIds).select("id"), "flag overdue");
    for (const inv of eInvoices) if (overdueIds.includes(inv.id)) inv.status = "overdue";
  }

  // 2. Recompute holdback release dates.
  let holdbackDatesUpdated = 0;
  const eHoldbacks: EngineHoldback[] = [];
  for (const h of holdbacks) {
    const project = projectById.get(h.project_id);
    const due = project && !h.released ? holdbackReleaseDue(project, h.period_end) : h.release_due_date;
    if (due !== h.release_due_date) {
      check(await db.from("holdbacks").update({ release_due_date: due }).eq("id", h.id).select("id"), "holdback date");
      holdbackDatesUpdated += 1;
    }
    eHoldbacks.push({
      id: h.id,
      project_id: h.project_id,
      client_id: h.client_id,
      period_end: h.period_end,
      amount_retained: num(h.amount_retained),
      release_due_date: due,
      released: h.released,
    });
  }

  // 3. WSIB status column.
  let wsibStatusUpdated = 0;
  const eWsib: EngineWsib[] = [];
  for (const w of wsib) {
    const s = wsibStatus(w.expiry_date, today);
    const status = s.daysToExpiry < 0 ? "expired" : s.ruleId ? "expiring" : "valid";
    if (status !== w.status) {
      check(await db.from("wsib_clearances").update({ status }).eq("id", w.id).select("id"), "wsib status");
      wsibStatusUpdated += 1;
    }
    eWsib.push({ id: w.id, client_id: w.client_id, gc_name: w.gc_name, certificate_number: w.certificate_number, expiry_date: w.expiry_date });
  }

  // 4. Upsert deadlines; resolve the ones no longer produced.
  const candidates = computeDeadlines({ today, projects: eProjects, invoices: eInvoices, holdbacks: eHoldbacks, wsib: eWsib });
  const rows = candidates.map((c) => ({ ...c, resolved: false, resolved_at: null }));
  for (let i = 0; i < rows.length; i += 500) {
    check(
      await db.from("deadlines").upsert(rows.slice(i, i + 500), { onConflict: "dedupe_key" }).select("id"),
      "upsert deadlines",
    );
  }
  const openRows = check<Array<{ id: string; dedupe_key: string }>>(
    await db.from("deadlines").select("id, dedupe_key").eq("resolved", false),
    "open deadlines",
  );
  const live = new Set(candidates.map((c) => c.dedupe_key));
  const stale = openRows.filter((r) => !live.has(r.dedupe_key)).map((r) => r.id);
  if (stale.length > 0) {
    check(
      await db.from("deadlines").update({ resolved: true, resolved_at: new Date().toISOString() }).in("id", stale).select("id"),
      "resolve deadlines",
    );
    // Drafts for resolved deadlines are no longer relevant.
    check(
      await db
        .from("drafts")
        .update({ status: "rejected", error: "Deadline resolved before approval" })
        .in("deadline_id", stale)
        .eq("status", "pending")
        .select("id"),
      "retire drafts",
    );
  }

  // 5. Draft reminders for anything due within 7 days or overdue.
  const deadlineIds = new Map(
    check<Array<{ id: string; dedupe_key: string }>>(
      await db.from("deadlines").select("id, dedupe_key").eq("resolved", false),
      "deadline ids",
    ).map((r) => [r.dedupe_key, r.id]),
  );
  const existingDrafts = check<Array<{ dedupe_key: string; status: string; created_at: string }>>(
    await db.from("drafts").select("dedupe_key, status, created_at"),
    "existing drafts",
  );
  const draftedRecently = new Set(
    existingDrafts
      .filter((d) => d.status === "pending" || diffDays(d.created_at.slice(0, 10), today) < 7)
      .map((d) => d.dedupe_key),
  );

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const projectRowById = new Map(projects.map((p) => [p.id, p]));
  const invoiceById = new Map(invoices.map((i) => [i.id, i]));
  const wsibById = new Map(wsib.map((w) => [w.id, w]));

  let draftsCreated = 0;
  for (const c of candidates) {
    if (draftsCreated >= MAX_DRAFTS_PER_RUN) break;
    const type = draftTypeFor(c, today);
    if (!type || draftedRecently.has(c.dedupe_key)) continue;
    const client = clientById.get(c.client_id);
    if (!client || client.status === "churned") continue;

    const draft = await buildDraftRow(c, type, today, {
      client,
      project: c.project_id ? projectRowById.get(c.project_id) : undefined,
      invoice: c.entity_type === "invoice" ? invoiceById.get(c.entity_id) : undefined,
      cert: c.entity_type === "wsib_clearance" ? wsibById.get(c.entity_id) : undefined,
    });
    const { error } = await db.from("drafts").insert({ ...draft, deadline_id: deadlineIds.get(c.dedupe_key) ?? null });
    if (error) {
      console.error("draft insert failed", error.message);
      continue;
    }
    draftsCreated += 1;
    await logActivity(db, {
      actorType: draft.generated_by === "template" ? "system" : "ai",
      action: "draft.generated",
      entityType: c.entity_type,
      entityId: c.entity_id,
      clientId: c.client_id,
      details: { type, dedupe_key: c.dedupe_key, generated_by: draft.generated_by },
    });
  }

  // 6. Delete prospect scans past retention.
  const scansDeleted = await purgeExpiredScans(db);

  const result: SweepResult = {
    today,
    invoicesFlaggedOverdue: overdueIds.length,
    holdbackDatesUpdated,
    wsibStatusUpdated,
    deadlinesOpen: candidates.length,
    deadlinesResolved: stale.length,
    draftsCreated,
    scansDeleted,
  };
  await logActivity(db, {
    actorId,
    actorType: actorId ? "user" : "system",
    action: "sweep.completed",
    entityType: "system",
    details: { ...result, overdue_invoice_ids: overdueIds },
  });
  return result;
}

async function buildDraftRow(
  c: DeadlineCandidate,
  type: NonNullable<ReturnType<typeof draftTypeFor>>,
  today: string,
  refs: { client: Client; project?: Project; invoice?: Invoice; cert?: WsibClearance },
) {
  const { client, project, invoice, cert } = refs;
  const isWsib = type === "wsib_renewal";
  const recipient = isWsib ? (cert?.gc_name ?? "your contractor") : (project?.gc_name ?? "Accounts Payable");
  const generated = await generateDraft(type, {
    sender_company: client.name,
    sender_contact: client.contact_name,
    recipient_name: recipient,
    project_name: project?.name ?? "",
    project_address: project?.address ?? null,
    invoice_number: invoice?.number,
    amount: c.amount,
    due_date: c.due_date,
    days_overdue: Math.max(0, diffDays(c.due_date, today)),
    certificate_number: cert?.certificate_number,
  });
  return {
    type,
    client_id: c.client_id,
    dedupe_key: c.dedupe_key,
    to_email: isWsib ? client.email : (project?.gc_contact_email ?? null),
    reply_to: isWsib ? null : client.email,
    subject: generated.subject,
    body: generated.body,
    status: "pending" as const,
    related_entity_type: c.entity_type,
    related_entity_id: c.entity_id,
    generated_by: generated.generatedBy,
  };
}

export async function purgeExpiredScans(db: AdminClient): Promise<number> {
  const expired = check<Array<{ id: string }>>(
    await db.from("scans").select("id").is("converted_client_id", null).lt("expires_at", new Date().toISOString()),
    "expired scans",
  );
  if (expired.length === 0) return 0;
  const ids = expired.map((s) => s.id);
  const files = check<Array<{ storage_path: string }>>(
    await db.from("scan_files").select("storage_path").in("scan_id", ids),
    "scan files",
  );
  await removeDocuments(db, files.map((f) => f.storage_path));
  check(await db.from("scans").delete().in("id", ids).select("id"), "delete scans");
  await logActivity(db, {
    actorType: "system",
    action: "scan.purged",
    entityType: "scan",
    details: { count: ids.length, scan_ids: ids },
  });
  return ids.length;
}
