import Link from "next/link";
import { notFound } from "next/navigation";
import { addWsibAction, createProjectAction, deleteClientAction } from "../../actions";
import { Disclosure } from "@/components/disclosure";
import { IntakeDropzone } from "@/components/intake-dropzone";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Card, DateText, Empty, Field, Money, Num, PageHeader, Stat, StatStrip, StatusBadge } from "@/components/ui";
import { getProfile } from "@/lib/auth";
import { todayInToronto } from "@/lib/format";
import { moneyMetrics } from "@/lib/metrics";
import { diffDays } from "@/lib/rules/calendar";
import { createClient } from "@/lib/supabase/server";
import type { Client, Holdback, Invoice, Project, WsibClearance } from "@/lib/types";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data } = await createClient().from("clients").select("name").eq("id", params.id).maybeSingle<{ name: string }>();
  return { title: data?.name ?? "Not found" };
}

export default async function ClientPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const today = todayInToronto();
  const { profile } = await getProfile();
  const isAdmin = profile?.role === "admin";
  const { data: client } = await supabase.from("clients").select("*").eq("id", params.id).maybeSingle<Client>();
  if (!client) notFound();

  const [projects, invoices, holdbacks, wsib] = await Promise.all([
    supabase.from("projects").select("*").eq("client_id", client.id).order("name").returns<Project[]>(),
    supabase.from("invoices").select("*").eq("client_id", client.id).returns<Invoice[]>(),
    supabase.from("holdbacks").select("*").eq("client_id", client.id).returns<Holdback[]>(),
    supabase.from("wsib_clearances").select("*").eq("client_id", client.id).order("expiry_date").returns<WsibClearance[]>(),
  ]);
  const ps = projects.data ?? [];
  const m = moneyMetrics(invoices.data ?? [], ps, holdbacks.data ?? [], today);

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/clients" className="hover:text-fg">Clients</Link>}
        title={client.name}
        description={
          <>
            {client.trade} · {client.contact_name ?? "No contact"} · {client.email ?? "no email"}{" "}
            {client.phone ? <> · <span className="num">{client.phone}</span></> : null}
          </>
        }
        actions={<StatusBadge status={client.status} />}
      />

      <StatStrip label="Client totals">
        <Stat label="Outstanding" value={<Money value={m.outstandingTotal} whole />} />
        <Stat label="Overdue" value={<Money value={m.overdueTotal} whole />} hint={m.overdueTotal > 0 ? <Badge tone="danger">Past the payment window</Badge> : "None"} />
        <Stat label="Disputed" value={<Money value={m.disputedTotal} whole />} hint={m.disputedTotal > 0 ? <Badge tone="warn">In adjudication windows</Badge> : "None"} />
        <Stat label="Holdback owed" value={<Money value={m.holdbackOwed} whole />} />
      </StatStrip>

      {isAdmin ? (
        <div className="mt-6">
          <IntakeDropzone clientId={client.id} projects={ps.map((p) => ({ id: p.id, name: p.name, gc_name: p.gc_name }))} />
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Projects" flush className="xl:col-span-2">
          {ps.length === 0 ? (
            <Empty>No projects yet.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Project</th><th>Payer</th><th className="text-right">Contract</th><th className="text-right">Invoices</th><th>Completion</th></tr></thead>
                <tbody>
                  {ps.map((p) => (
                    <tr key={p.id}>
                      <td><Link href={`/projects/${p.id}`} className="font-medium hover:text-accent">{p.name}</Link><div className="text-xs text-muted">{p.address}</div></td>
                              <td className="max-w-[200px] text-muted"><div className="truncate">{p.gc_name}</div><div className="text-xs uppercase tracking-wider text-faint">{p.payer_type}</div></td>
                      <td className="text-right"><Money value={Number(p.contract_value)} whole /></td>
                      <td className="text-right"><Num>{(invoices.data ?? []).filter((i) => i.project_id === p.id).length}</Num></td>
                      <td>{p.substantial_completion_date ? <DateText value={p.substantial_completion_date} /> : <span className="text-xs text-faint">In progress</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="WSIB clearances" flush>
          {(wsib.data ?? []).length === 0 ? (
            <Empty>No clearance certificates on file.</Empty>
          ) : (
            <ul>
              {(wsib.data ?? []).map((w) => {
                const days = diffDays(today, w.expiry_date);
                return (
                  <li key={w.id} className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5 last:border-b-0">
                    <div className="min-w-0">
                      <div className="truncate text-sm">{w.gc_name}</div>
                      <div className="num text-xs text-muted">{w.certificate_number}</div>
                      <div className="mt-1 text-xs text-muted">
                        Expires <DateText value={w.expiry_date} /> <span className="num text-faint">({days < 0 ? `${-days}d ago` : `${days}d`})</span>
                      </div>
                    </div>
                    <StatusBadge status={w.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {isAdmin ? (
        <div className="mt-6 space-y-3">
          <Disclosure title="Add project" defaultOpen={ps.length === 0}>
            <form action={createProjectAction} className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <input type="hidden" name="client_id" value={client.id} />
              <Field label="Project name"><input name="name" required className="input" /></Field>
              <Field label="Payer (GC or owner)"><input name="gc_name" required className="input" /></Field>
              <Field label="Payer AP email"><input name="gc_contact_email" type="email" className="input" /></Field>
              <Field label="Payer type">
                <select name="payer_type" className="input" defaultValue="contractor">
                  <option value="contractor">General contractor</option>
                  <option value="owner">Owner (direct contract)</option>
                </select>
              </Field>
              <Field label="Address" className="md:col-span-2"><input name="address" className="input" /></Field>
              <Field label="Contract value (CAD)"><input name="contract_value" type="number" step="0.01" min="0" required className="input num" /></Field>
              <Field label="Holdback %"><input name="holdback_percent" type="number" step="0.01" min="0" max="100" defaultValue="10" className="input num" /></Field>
              <Field label="Contract start"><input name="contract_start_date" type="date" className="input num" /></Field>
              <Field label="Substantial completion" hint="Leave blank until certified"><input name="substantial_completion_date" type="date" className="input num" /></Field>
              <div className="md:col-span-3"><SubmitButton pending="Creating">Create project</SubmitButton></div>
            </form>
          </Disclosure>
          <Disclosure title="Add WSIB clearance">
            <form action={addWsibAction} className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <input type="hidden" name="client_id" value={client.id} />
              <Field label="Issued for (GC / principal)"><input name="gc_name" required className="input" list="gc-names" /></Field>
              <datalist id="gc-names">{[...new Set(ps.map((p) => p.gc_name))].map((g) => <option key={g} value={g} />)}</datalist>
              <Field label="Certificate number"><input name="certificate_number" required className="input num" /></Field>
              <Field label="Issued"><input name="issue_date" type="date" required className="input num" /></Field>
              <Field label="Expires"><input name="expiry_date" type="date" required className="input num" /></Field>
              <div className="md:col-span-4"><SubmitButton pending="Saving">Add clearance</SubmitButton></div>
            </form>
          </Disclosure>
          <Disclosure title="Delete client data" hint="Permanent; for deletion requests" tone="danger">
          <form action={deleteClientAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={client.id} />
            <Field label={`Type "${client.name}" to permanently delete this client, its projects, invoices, documents and drafts`} className="min-w-[280px] flex-1">
              <input name="confirm" className="input" autoComplete="off" />
            </Field>
            <SubmitButton className="btn-danger" pending="Deleting" confirm="This permanently deletes all of this client's data. Continue?">Delete permanently</SubmitButton>
          </form>
          </Disclosure>
        </div>
      ) : null}
    </>
  );
}
