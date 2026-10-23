import Link from "next/link";
import { createClientAction } from "../actions";
import { Disclosure } from "@/components/disclosure";
import { Card, Empty, Field, Money, Num, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { getProfile } from "@/lib/auth";
import { todayInToronto } from "@/lib/format";
import { moneyMetrics } from "@/lib/metrics";
import { createClient } from "@/lib/supabase/server";
import type { Client, Holdback, Invoice, Project, WsibClearance } from "@/lib/types";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const supabase = createClient();
  const today = todayInToronto();
  const { profile } = await getProfile();
  const [clients, projects, invoices, holdbacks, wsib] = await Promise.all([
    supabase.from("clients").select("*").order("name").returns<Client[]>(),
    supabase.from("projects").select("*").returns<Project[]>(),
    supabase.from("invoices").select("*").returns<Invoice[]>(),
    supabase.from("holdbacks").select("*").returns<Holdback[]>(),
    supabase.from("wsib_clearances").select("*").returns<WsibClearance[]>(),
  ]);
  const list = clients.data ?? [];
  const mrr = list.filter((c) => c.status === "active").reduce((s, c) => s + Number(c.monthly_fee), 0);

  return (
    <>
      <PageHeader title="Clients" description={<>Subcontractor businesses under management. Active MRR <Money value={mrr} /></>} />
      <Card flush>
        {list.length === 0 ? (
          <Empty>No clients yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Client</th><th>Plan</th><th className="text-right">Projects</th><th className="text-right">Overdue</th><th className="text-right">Holdback owed</th><th>WSIB</th><th>Status</th></tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const ps = (projects.data ?? []).filter((p) => p.client_id === c.id);
                  const m = moneyMetrics(
                    (invoices.data ?? []).filter((i) => i.client_id === c.id),
                    ps,
                    (holdbacks.data ?? []).filter((h) => h.client_id === c.id),
                    today,
                  );
                  const certs = (wsib.data ?? []).filter((w) => w.client_id === c.id);
                  const worst = certs.some((w) => w.status === "expired") ? "expired" : certs.some((w) => w.status === "expiring") ? "expiring" : certs.length ? "valid" : "none";
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/clients/${c.id}`} className="font-medium hover:text-mint">{c.name}</Link>
                        <div className="text-xs text-muted">{c.trade}</div>
                      </td>
                      <td className="whitespace-nowrap text-muted"><span className="capitalize">{c.plan_tier}</span> · <Money value={Number(c.monthly_fee)} />/mo</td>
                      <td className="text-right"><Num>{ps.length}</Num></td>
                      <td className="text-right"><Money value={m.overdueTotal} className={m.overdueTotal > 0 ? "text-danger" : "text-muted"} /></td>
                      <td className="text-right"><Money value={m.holdbackOwed} /></td>
                      <td>{worst === "none" ? <span className="text-xs text-faint">None on file</span> : <StatusBadge status={worst} />}</td>
                      <td><StatusBadge status={c.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {profile?.role === "admin" ? (
        <div className="mt-6">
        <Disclosure title="Add client" defaultOpen={list.length === 0}>
          <form action={createClientAction} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="Business name"><input name="name" required className="input" /></Field>
            <Field label="Trade"><input name="trade" required className="input" placeholder="Electrical" /></Field>
            <Field label="Contact name"><input name="contact_name" className="input" /></Field>
            <Field label="Email"><input name="email" type="email" className="input" /></Field>
            <Field label="Phone"><input name="phone" className="input num" /></Field>
            <Field label="Plan">
              <select name="plan_tier" className="input" defaultValue="solo">
                <option value="solo">Solo</option><option value="crew">Crew</option><option value="pro">Pro</option>
              </select>
            </Field>
            <Field label="Monthly fee (CAD)"><input name="monthly_fee" type="number" step="0.01" min="0" defaultValue="249" className="input num" /></Field>
            <Field label="Status">
              <select name="status" className="input" defaultValue="onboarding">
                <option value="onboarding">Onboarding</option><option value="active">Active</option><option value="paused">Paused</option>
              </select>
            </Field>
            <div className="md:col-span-4"><SubmitButton pending="Creating">Create client</SubmitButton></div>
          </form>
        </Disclosure>
        </div>
      ) : null}
    </>
  );
}
