import Link from "next/link";
import { notFound } from "next/navigation";
import { addHoldbackAction, releaseHoldbackAction, updateInvoiceStatusAction, updateProjectDatesAction } from "../../actions";
import { Disclosure } from "@/components/disclosure";
import { SubmitButton } from "@/components/submit-button";
import { LOW_CONFIDENCE } from "@/lib/ai/confidence";
import { HoldbackTrack } from "@/components/holdback-track";
import { Badge, Card, DateText, Empty, Field, Money, Num, PageHeader, StatusBadge } from "@/components/ui";
import { getProfile } from "@/lib/auth";
import { annualCycleCovering, disputeWindowCloses, invoiceBalance, lienSchedule } from "@/lib/deadlines/engine";
import { todayInToronto } from "@/lib/format";
import { moneyMetrics } from "@/lib/metrics";
import { compareDates, diffDays } from "@/lib/rules/calendar";
import { createClient } from "@/lib/supabase/server";
import { num, type Client, type Holdback, type Invoice, type Project, type WsibClearance } from "@/lib/types";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data } = await createClient().from("projects").select("name").eq("id", params.id).maybeSingle<{ name: string }>();
  return { title: data?.name ?? "Not found" };
}

export default async function ProjectPage({ params, searchParams }: { params: { id: string }; searchParams: { edit?: string } }) {
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
  const editing = isAdmin ? invs.find((i) => i.id === searchParams.edit) : undefined;

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
  const billed = invs.filter((i) => i.status !== "draft").reduce((s, i) => s + num(i.amount) + num(i.tax), 0);
  const collected = invs.reduce((s, i) => s + num(i.amount_paid), 0);
  const pctOf = (v: number) => `${Math.round((v / Math.max(1, billed)) * 100)}%`;

  return (
    <>
      <PageHeader
        eyebrow={<><Link href="/clients" className="hover:text-fg">Clients</Link> / <Link href={`/clients/${project.client_id}`} className="hover:text-fg">{client.data?.name}</Link></>}
        title={project.name}
        description={<>{project.gc_name} ({project.payer_type === "owner" ? "owner, direct contract" : "general contractor"}) · {project.address ?? "No address"} · holdback <Num>{pct}%</Num></>}
      />

      <section aria-label="Project totals" className="rounded-card border border-line">
        <dl className="grid grid-cols-2 divide-line sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
          {[
            ["Contract", num(project.contract_value)],
            ["Billed to date", billed],
            ["Collected", collected],
            ["Payable now", m.outstandingTotal],
            ["Holdback retained", m.holdbackOwed],
          ].map(([label, value]) => (
            <div key={label as string} className="px-5 py-4">
              <dt className="text-[13px] text-muted">{label}</dt>
              <dd className="mt-1 text-xl font-semibold tracking-[-0.015em] text-fg">
                <Money value={value as number} whole />
              </dd>
            </div>
          ))}
        </dl>
        {billed > 0 ? (
          <div className="px-5 pb-4">
            <div aria-hidden="true" className="flex h-1.5 gap-0.5">
              <div className="rounded-sm bg-body" style={{ flex: `${collected} 1 0` }} />
              <div className="rounded-sm bg-aging-d60" style={{ flex: `${m.outstandingTotal} 1 0` }} />
              <div className="rounded-sm bg-line-strong" style={{ flex: `${m.holdbackOwed} 1 0` }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-5 text-[13px] text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-body" />Collected <Num className="text-fg">{pctOf(collected)}</Num></span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-aging-d60" />Payable now <Num className="text-fg">{pctOf(m.outstandingTotal)}</Num></span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-line-strong" />Holdback <Num className="text-fg">{pctOf(m.holdbackOwed)}</Num></span>
              {m.overdueTotal > 0 ? <Badge tone="danger"><Money value={m.overdueTotal} whole /> overdue</Badge> : null}
            </div>
          </div>
        ) : null}
      </section>

      <div id="invoices" />
      <Card title="Invoices" flush className="mt-6">
        {editing ? <InvoiceEditor invoice={editing} projectId={project.id} today={today} /> : null}
        {invs.length === 0 ? (
          <Empty>No invoices. Upload them from the client page.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th><th>Submitted</th><th>Due</th><th className="text-right">Total</th><th className="text-right">Paid</th>
                  <th className="text-right">Payable now</th><th>Status</th>{isAdmin ? <th className="w-24" /> : null}
                </tr>
              </thead>
              <tbody>
                {invs.map((inv) => {
                  const total = num(inv.amount) + num(inv.tax);
                  const balance = invoiceBalance({ amount: num(inv.amount), tax: num(inv.tax), amount_paid: num(inv.amount_paid), status: inv.status }, pct);
                  const lapsed = inv.submitted_date && !inv.disputed_date && compareDates(disputeWindowCloses(inv.submitted_date, project.payer_type), today) < 0;
                  return (
                    <tr key={inv.id} id={`invoice-${inv.id}`} className={editing?.id === inv.id ? "bg-raised" : undefined}>
                      <td>
                        <span className="id text-fg">{inv.number}</span>
                        {inv.source_file_path ? (
                          <a href={`/api/documents?path=${encodeURIComponent(inv.source_file_path)}`} target="_blank" rel="noreferrer" className="ml-2 text-[13px] text-muted underline underline-offset-4 hover:text-fg">PDF</a>
                        ) : null}
                        {inv.extraction_confidence !== null && num(inv.extraction_confidence) < LOW_CONFIDENCE ? <div className="text-xs text-warn">Check extracted fields</div> : null}
                      </td>
                      <td><DateText value={inv.submitted_date} /></td>
                      <td>
                        <DateText value={inv.due_date} className={inv.status === "overdue" ? "text-danger" : ""} />
                        {inv.status === "overdue" && inv.due_date ? <div className="num text-xs text-danger">{diffDays(inv.due_date, today)}d late</div> : null}
                      </td>
                      <td className="text-right"><Money value={total} /></td>
                      <td className="text-right"><Money value={num(inv.amount_paid)} className="text-muted" /></td>
                      <td className="text-right">
                        <Money value={balance} />
                        {lapsed && balance > 0 ? <div className="text-xs text-muted">dispute window lapsed</div> : null}
                      </td>
                      <td><StatusBadge status={inv.status} /></td>
                      {isAdmin ? (
                        <td className="text-right">
                          {inv.status !== "paid" ? (
                            <Link href={`/projects/${project.id}?edit=${inv.id}#invoices`} scroll={false} className="btn-secondary btn-sm">
                              Update
                            </Link>
                          ) : null}
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
            <HoldbackTrack milestones={milestones} today={today} />
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
                      <td>{h.released ? <><StatusBadge status="released" /> <DateText value={h.released_date} className="ml-1 text-xs text-muted" /></> : <StatusBadge status="held" />}</td>
                      {isAdmin ? (
                        <td>
                          {!h.released ? (
                            <form action={releaseHoldbackAction}>
                              <input type="hidden" name="id" value={h.id} />
                              <input type="hidden" name="released_date" value={today} />
                              <SubmitButton className="btn-secondary btn-sm" pending="…" confirm="Record this holdback as released today?">Mark released</SubmitButton>
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

        <div className="space-y-3">
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
              <Disclosure title="Project dates" hint="Drive holdback timing">
                <form action={updateProjectDatesAction} className="space-y-3">
                  <input type="hidden" name="id" value={project.id} />
                  <Field label="Contract start"><input type="date" name="contract_start_date" defaultValue={project.contract_start_date ?? ""} className="input num" /></Field>
                  <Field label="Substantial completion"><input type="date" name="substantial_completion_date" defaultValue={project.substantial_completion_date ?? ""} className="input num" /></Field>
                  <Field label="Payer AP email"><input type="email" name="gc_contact_email" defaultValue={project.gc_contact_email ?? ""} className="input" /></Field>
                  <SubmitButton className="btn-secondary" pending="Saving">Save</SubmitButton>
                </form>
              </Disclosure>
              <Disclosure title="Record holdback period">
                <form action={addHoldbackAction} className="space-y-3">
                  <input type="hidden" name="project_id" value={project.id} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="From"><input type="date" name="period_start" required className="input num" /></Field>
                    <Field label="To"><input type="date" name="period_end" required className="input num" /></Field>
                  </div>
                  <Field label="Amount retained (CAD)"><input type="number" step="0.01" min="0" name="amount_retained" required className="input num" /></Field>
                  <SubmitButton className="btn-secondary" pending="Saving">Add holdback</SubmitButton>
                </form>
              </Disclosure>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

function InvoiceEditor({ invoice, projectId, today }: { invoice: Invoice; projectId: string; today: string }) {
  const total = num(invoice.amount) + num(invoice.tax);
  return (
    <form key={invoice.id} action={updateInvoiceStatusAction} className="border-b border-line bg-raised/40 px-5 py-4">
      <input type="hidden" name="id" value={invoice.id} />
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="text-sm font-semibold">
          Update invoice <span className="num">{invoice.number}</span>
          <span className="ml-2 font-normal text-muted">total <Money value={total} /></span>
        </div>
        <Link href={`/projects/${projectId}#invoices`} scroll={false} className="text-xs text-muted hover:text-fg">Cancel</Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Field label="Status">
          <select name="status" defaultValue={invoice.status === "draft" ? "submitted" : invoice.status} className="input">
            <option value="submitted">Submitted, awaiting payment</option>
            <option value="partial">Partly paid</option>
            <option value="paid">Paid in full</option>
            <option value="disputed">Disputed by payer</option>
            <option value="overdue">Overdue</option>
          </select>
        </Field>
        <Field label="Total paid to date (CAD)" hint="Leave blank to keep the current amount">
          <input name="amount_paid" type="number" step="0.01" min="0" placeholder={String(num(invoice.amount_paid))} className="input num" />
        </Field>
        <Field label="Dispute notice received" hint="Only used when disputed">
          <input name="disputed_date" type="date" defaultValue={invoice.disputed_date ?? today} className="input num" />
        </Field>
        <div className="flex items-end">
          <SubmitButton pending="Saving">Save</SubmitButton>
        </div>
      </div>
    </form>
  );
}
