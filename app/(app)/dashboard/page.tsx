import Link from "next/link";
import { dismissDeadlineAction, runSweepNowAction } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { DateText, Money, Num, PageHeader, Stat } from "@/components/ui";
import { getProfile } from "@/lib/auth";
import type { Severity } from "@/lib/deadlines/engine";
import { formatCAD, todayInToronto } from "@/lib/format";
import { moneyMetrics } from "@/lib/metrics";
import { addCalendarDays, diffDays } from "@/lib/rules/calendar";
import { UPCOMING_WINDOW_DAYS, ruleLabel } from "@/lib/rules/ontario-construction-act";
import { createClient } from "@/lib/supabase/server";
import type { Client, Deadline, Holdback, Invoice, Project } from "@/lib/types";

export const metadata = { title: "Today" };

const DOT: Record<Severity, string> = {
  overdue: "bg-danger",
  critical: "bg-warn",
  warning: "bg-warn/60",
  info: "bg-faint",
};

export default async function DashboardPage() {
  const supabase = createClient();
  const today = todayInToronto();
  const horizon = addCalendarDays(today, UPCOMING_WINDOW_DAYS);
  const { profile } = await getProfile();
  const isAdmin = profile?.role === "admin";

  const [invoices, projects, holdbacks, deadlines, clients, drafts, lastSweep] = await Promise.all([
    supabase.from("invoices").select("*").returns<Invoice[]>(),
    supabase.from("projects").select("id, name, client_id, holdback_percent").returns<Project[]>(),
    supabase.from("holdbacks").select("*").returns<Holdback[]>(),
    supabase.from("deadlines").select("*").eq("resolved", false).lte("due_date", horizon).order("due_date").returns<Deadline[]>(),
    supabase.from("clients").select("id, name").returns<Client[]>(),
    supabase.from("drafts").select("id, deadline_id").eq("status", "pending").returns<Array<{ id: string; deadline_id: string | null }>>(),
    supabase
      .from("activity_log")
      .select("created_at")
      .eq("action", "sweep.completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ created_at: string }>(),
  ]);

  const m = moneyMetrics(invoices.data ?? [], projects.data ?? [], holdbacks.data ?? [], today);
  const clientName = new Map((clients.data ?? []).map((c) => [c.id, c.name]));
  const projectName = new Map((projects.data ?? []).map((p) => [p.id, p.name]));
  const draftFor = new Map((drafts.data ?? []).filter((d) => d.deadline_id).map((d) => [d.deadline_id as string, d.id]));
  const all = deadlines.data ?? [];
  const overdue = all.filter((d) => d.due_date < today);
  const upcoming = all.filter((d) => d.due_date >= today);
  const pendingDrafts = drafts.data?.length ?? 0;

  return (
    <>
      <PageHeader
        eyebrow={<DateText value={today} />}
        title="Today"
        description={
          all.length === 0 ? (
            "Nothing needs action in the next 14 days."
          ) : (
            <>
              <Money value={m.moneyAtRisk} whole className="text-fg" /> at risk. <Num className="text-fg">{overdue.length}</Num> overdue and{" "}
              <Num className="text-fg">{upcoming.length}</Num> due in the next 14 days
              {pendingDrafts > 0 ? (
                <>
                  ; <Num className="text-fg">{pendingDrafts}</Num> emails drafted for your approval
                </>
              ) : null}
              .
            </>
          )
        }
        actions={
          isAdmin ? (
            <form action={runSweepNowAction} className="flex items-center gap-3">
              <span className="text-xs text-muted">
                Last sweep {lastSweep.data ? <DateText value={lastSweep.data.created_at.slice(0, 10)} /> : "never"}
              </span>
              <SubmitButton className="btn-secondary" pending="Sweeping">
                Run sweep now
              </SubmitButton>
            </form>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Money at risk" tone="mint" value={<Money value={m.moneyAtRisk} whole />} hint="Overdue + disputed + holdback due within 14 days" />
        <Stat
          label="Overdue invoices"
          tone={m.overdueTotal > 0 ? "danger" : "default"}
          value={<Money value={m.overdueTotal} whole />}
          hint={<><Num>{m.overdueCount}</Num> past the payment window</>}
        />
        <Stat label="Holdback owed" value={<Money value={m.holdbackOwed} whole />} hint={<><Money value={m.holdbackDueSoon} whole /> due within 14 days</>} />
        <Stat
          label="Awaiting approval"
          tone={pendingDrafts > 0 ? "warn" : "default"}
          value={<Num>{pendingDrafts}</Num>}
          hint="Drafted emails, none sent"
          href="/drafts"
        />
      </div>

      <div className="mt-8 space-y-8">
        <Inbox title="Overdue" items={overdue} today={today} empty="Nothing is overdue." {...{ clientName, projectName, draftFor, isAdmin }} />
        <Inbox title="Due in the next 14 days" items={upcoming} today={today} empty="Nothing due in the next 14 days." {...{ clientName, projectName, draftFor, isAdmin }} />
      </div>
    </>
  );
}

function Inbox({
  title,
  items,
  today,
  empty,
  clientName,
  projectName,
  draftFor,
  isAdmin,
}: {
  title: string;
  items: Deadline[];
  today: string;
  empty: string;
  clientName: Map<string, string>;
  projectName: Map<string, string>;
  draftFor: Map<string, string>;
  isAdmin: boolean;
}) {
  const total = items.reduce((s, d) => s + (d.amount ? Number(d.amount) : 0), 0);
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold">
          {title} <Num className="ml-1 text-muted">{items.length}</Num>
        </h2>
        {total > 0 ? <span className="num text-xs text-muted">{formatCAD(total, { whole: true })} involved</span> : null}
      </div>
      {items.length === 0 ? (
        <div className="card px-5 py-6 text-sm text-muted">{empty}</div>
      ) : (
        <ul className="card divide-y divide-line">
          {items.map((d) => {
            const days = diffDays(today, d.due_date);
            const draftId = draftFor.get(d.id);
            const target = d.project_id ? `/projects/${d.project_id}` : `/clients/${d.client_id}`;
            return (
              <li key={d.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${DOT[d.severity]}`} aria-hidden />
                  <div className="min-w-0">
                    <Link href={target} className="block truncate text-sm text-fg hover:text-mint">
                      {d.title}
                    </Link>
                    <div className="mt-0.5 truncate text-xs text-muted">
                      {clientName.get(d.client_id)}
                      {d.project_id ? ` · ${projectName.get(d.project_id) ?? ""}` : ""} · {ruleLabel(d.rule_id)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pl-[18px] lg:flex-nowrap lg:pl-0">
                  <div className="w-24 lg:text-right">{d.amount ? <Money value={Number(d.amount)} className="text-sm" /> : <span className="text-faint">—</span>}</div>
                  <div className="w-28 lg:text-right">
                    <DateText value={d.due_date} className={`text-sm ${days < 0 ? "text-danger" : ""}`} />
                    <div className="num text-2xs text-muted">{days < 0 ? `${-days} days late` : days === 0 ? "today" : `in ${days} days`}</div>
                  </div>
                  <div className="flex items-center gap-1 lg:w-52 lg:justify-end">
                    {draftId ? (
                      <Link href={`/drafts?id=${draftId}`} className="btn-primary btn-sm">
                        Review email
                      </Link>
                    ) : d.entity_type === "invoice" && d.project_id ? (
                      <Link href={`/projects/${d.project_id}?edit=${d.entity_id}`} className="btn-secondary btn-sm">
                        Update invoice
                      </Link>
                    ) : (
                      <Link href={target} className="btn-secondary btn-sm">
                        Open
                      </Link>
                    )}
                    {isAdmin ? (
                      <form action={dismissDeadlineAction}>
                        <input type="hidden" name="id" value={d.id} />
                        <SubmitButton
                          className="btn btn-sm border-transparent text-muted hover:text-fg"
                          pending="…"
                          confirm="Dismiss this item? It will not come back in future sweeps."
                        >
                          Dismiss
                        </SubmitButton>
                      </form>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
