import Link from "next/link";
import { notFound } from "next/navigation";
import { addHoldbackAction, releaseHoldbackAction, updateInvoiceStatusAction, updateProjectDatesAction } from "../../actions";
import { SubmitButton } from "@/components/submit-button";
import { LOW_CONFIDENCE } from "@/lib/ai/confidence";
import { Card, DateText, Empty, Field, Money, Num, PageHeader, Stat, StatusBadge } from "@/components/ui";
import { getProfile } from "@/lib/auth";
import { annualCycleCovering, disputeWindowCloses, invoiceBalance, lienSchedule } from "@/lib/deadlines/engine";
import { todayInToronto } from "@/lib/format";
import { moneyMetrics } from "@/lib/metrics";
import { compareDates, diffDays } from "@/lib/rules/calendar";
import { createClient } from "@/lib/supabase/server";
import { num, type Client, type Holdback, type Invoice, type Project, type WsibClearance } from "@/lib/types";

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const today = todayInToronto();
  const { profile } = await getProfile();
  const isAdmin = profile?.role === "admin";
  const { data: project } = await supabase.from("projects").select("*").eq("id", params.id).maybeSingle<Project>();
  if (!project) notFound();

  const [client, invoices, holdbacks, wsib] = await Promise.all([
    supabase.from("clients").select("id, name").eq("id", project.client_id).single<Pick<Client, "id" | "name">>(),
    supabase.from("invoices").select("*").eq("project_id", project.id).order("submitted_date", { ascending: false, nullsFirst: true }).returns<Invoice[]>(),
    supabase.from("holdbacks").select("*").eq("project_id", project.id).order("period_start").returns<Holdback[]>(),
    supabase.from("wsib_clearances").select("*").eq("client_id", project.client_id).eq("gc_name", project.gc_name).order("expiry_date", { ascending: false }).returns<WsibClearance[]>(),
  ]);
  const invs = invoices.data ?? [];
  const hbs = holdbacks.data ?? [];
  const pct = num(project.holdback_percent);
  const m = moneyMetrics(invs, [project], hbs, today);
  const cert = (wsib.data ?? [])[0];

  const milestones: Array<{ date: string; label: string }> = [];
  if (project.contract_start_date) milestones.push({ date: project.contract_start_date, label: "Contract start" });
  if (project.substantial_completion_date) {
    const s = lienSchedule(project.substantial_completion_date);
    milestones.push(
      { date: project.substantial_completion_date, label: "Substantial completion" },
      { date: s.noticeWindowCloses, label: "Holdback non-payment notice window closes" },
      { date: s.lienExpiry, label: "Lien period expires" },
      { date: s.releaseDue, label: "Basic holdback payable" },
    );
  } else if (project.contract_start_date) {
    const c = annualCycleCovering(project.contract_start_date, today);
    milestones.push(
      { date: c.anniversary, label: "Contract anniversary (annual release)" },
      { date: c.noticeDue, label: "Owner's annual release notice due" },
      { date: c.ownerPaymentDue, label: "Owner pays annual holdback (latest)" },
    );
    if (project.payer_type === "contractor") milestones.push({ date: c.subcontractReleaseDue, label: "GC releases holdback to you (latest)" });
  }
  for (const h of hbs) if (h.release_due_date && !h.released) milestones.push({ date: h.release_due_date, label: `Release of ${new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(num(h.amount_retained))} holdback` });
  milestones.sort((a, b) => compareDates(a.date, b.date));

  return (
    <>
      <PageHeader
        eyebrow={<><Link href="/clients" className="hover:text-fg">Clients</Link> / <Link href={`/clients/${project.client_id}`} className="hover:text-fg">{client.data?.name}</Link></>}
        title={project.name}
        description={<>{project.gc_name} ({project.payer_type === "owner" ? "owner, direct contract" : "general contractor"}) · {project.address ?? "No address"} · holdback <Num>{pct}%</Num></>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Contract value" value={<Money value={num(project.contract_value)} whole />} />
        <Stat label="Outstanding" value={<Money value={m.outstandingTotal} whole />} />
        <Stat label="Overdue" tone={m.overdueTotal > 0 ? "danger" : "default"} value={<Money value={m.overdueTotal} whole />} />
        <Stat label="Holdback owed" value={<Money value={m.holdbackOwed} whole />} hint={<><Money value={m.holdbackDueSoon} whole /> due within 14 days</>} />
      </div>

      <Card title="Invoices" flush className="mt-6">
        {invs.length === 0 ? (
          <Empty>No invoices. Upload them from the client page.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th><th>Submitted</th><th>Due</th><th className="text-right">Total</th><th className="text-right">Paid</th>
                  <th className="text-right">Payable now</th><th>Status</th>{isAdmin ? <th>Update</th> : null}
                </tr>
              </thead>
              <tbody>
                {invs.map((inv) => {
                  const total = num(inv.amount) + num(inv.tax);
                  const balance = invoiceBalance({ amount: num(inv.amount), tax: num(inv.tax), amount_paid: num(inv.amount_paid), status: inv.status }, pct);
                  const lapsed = inv.submitted_date && !inv.disputed_date && compareDates(disputeWindowCloses(inv.submitted_date, project.payer_type), today) < 0;
                  return (
                    <tr key={inv.id}>
                      <td>
                        <span className="num">{inv.number}</span>
                        {inv.source_file_path ? (
                          <a href={`/api/documents?path=${encodeURIComponent(inv.source_file_path)}`} target="_blank" rel="noreferrer" className="ml-2 text-xs text-muted hover:text-mint">PDF</a>
                        ) : null}
                        {inv.extraction_confidence !== null && num(inv.extraction_confidence) < LOW_CONFIDENCE ? <div className="text-2xs text-warn">Low extraction confidence</div> : null}
                      </td>
                      <td><DateText value={inv.submitted_date} /></td>
                      <td>
                        <DateText value={inv.due_date} className={inv.status === "overdue" ? "text-danger" : ""} />
                        {inv.status === "overdue" && inv.due_date ? <div className="num text-2xs text-danger">{diffDays(inv.due_date, today)}d late</div> : null}
                      </td>
                      <td className="text-right"><Money value={total} /></td>
                      <td className="text-right"><Money value={num(inv.amount_paid)} className="text-muted" /></td>
                      <td className="text-right">
                        <Money value={balance} />
                        {lapsed && balance > 0 ? <div className="text-2xs text-muted">dispute window lapsed</div> : null}
                      </td>
                      <td><StatusBadge status={inv.status} /></td>
                      {isAdmin ? (
                        <td>
                          <form action={updateInvoiceStatusAction} className="flex items-center gap-1.5">
                            <input type="hidden" name="id" value={inv.id} />
                            <select name="status" defaultValue={inv.status === "draft" ? "submitted" : inv.status} className="input w-28 py-1 text-xs">
                              <option value="submitted">Submitted</option><option value="partial">Partial</option><option value="paid">Paid</option>
                              <option value="disputed">Disputed</option><option value="overdue">Overdue</option>
                            </select>
                            <input name="amount_paid" type="number" step="0.01" min="0" placeholder="Paid" className="input num w-24 py-1 text-xs" />
                            <SubmitButton className="btn-secondary btn-sm" pending="…">Save</SubmitButton>
                          </form>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Holdback timeline" className="xl:col-span-2">
          {milestones.length === 0 ? (
            <p className="text-sm text-muted">Add a contract start or substantial completion date to compute holdback timing.</p>
          ) : (
            <ol className="relative ml-1 border-l border-line">
              {milestones.map((ms, i) => {
                const past = compareDates(ms.date, today) < 0;
                const isToday = ms.date === today;
                return (
                  <li key={`${ms.date}-${i}`} className="relative pb-5 pl-6 last:pb-0">
                    <span className={`absolute -left-[5px] top-1.5 h-[9px] w-[9px] rounded-full border ${isToday ? "border-mint bg-mint" : past ? "border-line-strong bg-line-strong" : "border-mint bg-ink"}`} />
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <DateText value={ms.date} className={past ? "text-muted" : "text-fg"} />
                      <span className={`text-sm ${past ? "text-muted" : "text-fg"}`}>{ms.label}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          <div className="mt-6 overflow-x-auto border-t border-line pt-4">
            <table className="table">
              <thead><tr><th>Period</th><th className="text-right">Retained</th><th>Release due</th><th>Status</th>{isAdmin ? <th /> : null}</tr></thead>
              <tbody>
                {hbs.length === 0 ? (
                  <tr><td colSpan={5} className="text-muted">No holdback periods recorded.</td></tr>
                ) : (
                  hbs.map((h) => (
                    <tr key={h.id}>
                      <td><DateText value={h.period_start} /> <span className="text-faint">to</span> <DateText value={h.period_end} /></td>
                      <td className="text-right"><Money value={num(h.amount_retained)} /></td>
                      <td><DateText value={h.release_due_date} className={!h.released && h.release_due_date && h.release_due_date < today ? "text-danger" : ""} /></td>
                      <td>{h.released ? <><StatusBadge status="released" /> <DateText value={h.released_date} className="ml-1 text-xs text-muted" /></> : <StatusBadge status="pending" />}</td>
                      {isAdmin ? (
                        <td>
                          {!h.released ? (
                            <form action={releaseHoldbackAction} className="flex items-center gap-1.5">
                              <input type="hidden" name="id" value={h.id} />
                              <input type="date" name="released_date" defaultValue={today} className="input num w-36 py-1 text-xs" />
                              <SubmitButton className="btn-secondary btn-sm" pending="…">Mark released</SubmitButton>
                            </form>
                          ) : null}
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="WSIB clearance">
            {cert ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted">Status</span><StatusBadge status={cert.status} /></div>
                <div className="flex items-center justify-between"><span className="text-muted">Certificate</span><Num>{cert.certificate_number}</Num></div>
                <div className="flex items-center justify-between"><span className="text-muted">Expires</span><DateText value={cert.expiry_date} /></div>
              </div>
            ) : (
              <p className="text-sm text-warn">No clearance on file for {project.gc_name}. Payment may be held until one is provided.</p>
            )}
          </Card>

          {isAdmin ? (
            <>
              <Card title="Project dates">
                <form action={updateProjectDatesAction} className="space-y-3">
                  <input type="hidden" name="id" value={project.id} />
                  <Field label="Contract start"><input type="date" name="contract_start_date" defaultValue={project.contract_start_date ?? ""} className="input num" /></Field>
                  <Field label="Substantial completion"><input type="date" name="substantial_completion_date" defaultValue={project.substantial_completion_date ?? ""} className="input num" /></Field>
                  <Field label="Payer AP email"><input type="email" name="gc_contact_email" defaultValue={project.gc_contact_email ?? ""} className="input" /></Field>
                  <SubmitButton className="btn-secondary" pending="Saving">Save</SubmitButton>
                </form>
              </Card>
              <Card title="Record holdback period">
                <form action={addHoldbackAction} className="space-y-3">
                  <input type="hidden" name="project_id" value={project.id} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="From"><input type="date" name="period_start" required className="input num" /></Field>
                    <Field label="To"><input type="date" name="period_end" required className="input num" /></Field>
                  </div>
                  <Field label="Amount retained (CAD)"><input type="number" step="0.01" min="0" name="amount_retained" required className="input num" /></Field>
                  <SubmitButton className="btn-secondary" pending="Saving">Add holdback</SubmitButton>
                </form>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
