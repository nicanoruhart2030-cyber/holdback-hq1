import Link from "next/link";
import { runSweepNowAction } from "../actions";
import { Card, DateText, Empty, Money, Num, PageHeader, SeverityBadge, Stat } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { getProfile } from "@/lib/auth";
import { diffDays, addCalendarDays } from "@/lib/rules/calendar";
import { todayInToronto } from "@/lib/format";
import { moneyMetrics } from "@/lib/metrics";
import { UPCOMING_WINDOW_DAYS } from "@/lib/rules/ontario-construction-act";
import { createClient } from "@/lib/supabase/server";
import type { Client, Deadline, Holdback, Invoice, Project } from "@/lib/types";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = createClient();
  const today = todayInToronto();
  const horizon = addCalendarDays(today, UPCOMING_WINDOW_DAYS);
  const { profile } = await getProfile();

  const [invoices, projects, holdbacks, deadlines, clients, drafts, lastSweep] = await Promise.all([
    supabase.from("invoices").select("*").returns<Invoice[]>(),
    supabase.from("projects").select("id, name, client_id, holdback_percent").returns<Project[]>(),
    supabase.from("holdbacks").select("*").returns<Holdback[]>(),
    supabase.from("deadlines").select("*").eq("resolved", false).lte("due_date", horizon).order("due_date").returns<Deadline[]>(),
    supabase.from("clients").select("id, name").returns<Client[]>(),
    supabase.from("drafts").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("activity_log").select("created_at").eq("action", "sweep.completed").order("created_at", { ascending: false }).limit(1).maybeSingle<{ created_at: string }>(),
  ]);

  const m = moneyMetrics(invoices.data ?? [], projects.data ?? [], holdbacks.data ?? [], today);
  const clientName = new Map((clients.data ?? []).map((c) => [c.id, c.name]));
  const projectName = new Map((projects.data ?? []).map((p) => [p.id, p.name]));
  const upcoming = deadlines.data ?? [];
  const overdue = upcoming.filter((d) => d.severity === "overdue");
  const next14 = upcoming.filter((d) => d.severity !== "overdue");

  const perClient = new Map<string, number>();
  for (const d of upcoming) if (d.amount) perClient.set(d.client_id, (perClient.get(d.client_id) ?? 0) + Number(d.amount));

  return (
    <>
      <PageHeader
        eyebrow={<DateText value={today} />}
        title="Dashboard"
        description="Money at risk across every subcontractor client, from today's deadline sweep."
        actions={
          profile?.role === "admin" ? (
            <form action={runSweepNowAction} className="flex items-center gap-3">
              <span className="text-xs text-muted">
                Last sweep {lastSweep.data ? <DateText value={lastSweep.data.created_at.slice(0, 10)} /> : "never"}
              </span>
              <SubmitButton className="btn-secondary" pending="Sweeping">Run sweep now</SubmitButton>
            </form>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Money at risk" tone="mint" value={<Money value={m.moneyAtRisk} whole />} hint="Overdue + disputed + holdback due in 14 days" />
        <Stat label="Overdue" tone={m.overdueTotal > 0 ? "danger" : "default"} value={<Money value={m.overdueTotal} whole />} hint={<><Num>{m.overdueCount}</Num> invoices past the payment window</>} href="/deadlines?severity=overdue" />
        <Stat label="Holdback owed" value={<Money value={m.holdbackOwed} whole />} hint={<><Money value={m.holdbackDueSoon} whole /> due within 14 days</>} />
        <Stat label="Next 14 days" value={<Num>{next14.length}</Num>} hint={<><Num>{overdue.length}</Num> already overdue</>} href="/deadlines" />
        <Stat label="Approval queue" tone={(drafts.count ?? 0) > 0 ? "warn" : "default"} value={<Num>{drafts.count ?? 0}</Num>} hint="Drafts waiting for your approval" href="/drafts" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Deadlines in the next 14 days" className="xl:col-span-2" flush actions={<Link href="/deadlines" className="text-xs text-muted hover:text-fg">All deadlines</Link>}>
          {upcoming.length === 0 ? (
            <Empty>No open deadlines. {profile?.role === "admin" ? "Run the sweep to generate them." : null}</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>Due</th><th>Item</th><th>Client</th><th className="text-right">Amount</th><th>Severity</th></tr>
                </thead>
                <tbody>
                  {upcoming.slice(0, 18).map((d) => {
                    const days = diffDays(today, d.due_date);
                    return (
                      <tr key={d.id}>
                        <td className="whitespace-nowrap">
                          <DateText value={d.due_date} />
                          <div className="num text-2xs text-faint">{days < 0 ? `${-days}d ago` : days === 0 ? "today" : `in ${days}d`}</div>
                        </td>
                        <td>
                          {d.project_id ? <Link href={`/projects/${d.project_id}`} className="hover:text-mint">{d.title}</Link> : d.title}
                          {d.project_id ? <div className="text-xs text-muted">{projectName.get(d.project_id)}</div> : null}
                        </td>
                        <td className="text-muted"><Link href={`/clients/${d.client_id}`} className="hover:text-fg">{clientName.get(d.client_id)}</Link></td>
                        <td className="text-right">{d.amount ? <Money value={Number(d.amount)} /> : <span className="text-faint">—</span>}</td>
                        <td><SeverityBadge severity={d.severity} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Exposure by client" flush>
          {perClient.size === 0 ? (
            <Empty>No money on upcoming deadlines.</Empty>
          ) : (
            <ul>
              {[...perClient.entries()].sort((a, b) => b[1] - a[1]).map(([id, amt]) => {
                const max = Math.max(...perClient.values());
                return (
                  <li key={id} className="border-b border-line px-5 py-3.5 last:border-b-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <Link href={`/clients/${id}`} className="truncate text-sm hover:text-mint">{clientName.get(id)}</Link>
                      <Money value={amt} whole className="text-sm" />
                    </div>
                    <div className="mt-2 h-1 bg-line">
                      <div className="h-1 bg-mint" style={{ width: `${Math.max(4, (amt / max) * 100)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
