import Link from "next/link";
import { dismissDeadlineAction, recordAdjudicationReferralAction, runSweepNowAction } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { AgingBar, Badge, type BadgeTone, DateText, Money, Num, PageHeader, SectionTitle, Stat, StatStrip } from "@/components/ui";
import { getProfile } from "@/lib/auth";
import type { Severity } from "@/lib/deadlines/engine";
import { formatCAD, todayInToronto } from "@/lib/format";
import { agingBuckets, moneyMetrics, payerStats } from "@/lib/metrics";
import { addCalendarDays, diffDays } from "@/lib/rules/calendar";
import { UPCOMING_WINDOW_DAYS, ruleLabel } from "@/lib/rules/ontario-construction-act";
import { createClient } from "@/lib/supabase/server";
import type { Client, Deadline, Holdback, Invoice, Project, WsibClearance } from "@/lib/types";

export const metadata = { title: "Today" };

const TONE: Record<Severity, BadgeTone> = { overdue: "danger", critical: "warn", warning: "warn", info: "neutral" };

function whenLabel(days: number): string {
  if (days < 0) return `${-days} ${days === -1 ? "day" : "days"} late`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const today = todayInToronto();
  const horizon = addCalendarDays(today, UPCOMING_WINDOW_DAYS);
  const { profile } = await getProfile();
  const isAdmin = profile?.role === "admin";

  const [invoices, projects, holdbacks, deadlines, clients, drafts, wsib, lastSweep] = await Promise.all([
    supabase.from("invoices").select("*").returns<Invoice[]>(),
    supabase.from("projects").select("id, name, client_id, gc_name, holdback_percent").returns<Project[]>(),
    supabase.from("holdbacks").select("*").returns<Holdback[]>(),
    supabase.from("deadlines").select("*").eq("resolved", false).lte("due_date", horizon).order("due_date").returns<Deadline[]>(),
    supabase.from("clients").select("id, name").returns<Client[]>(),
    supabase.from("drafts").select("id, deadline_id").eq("status", "pending").returns<Array<{ id: string; deadline_id: string | null }>>(),
    supabase.from("wsib_clearances").select("*").neq("status", "valid").order("expiry_date").limit(5).returns<WsibClearance[]>(),
    supabase
      .from("activity_log")
      .select("created_at")
      .eq("action", "sweep.completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ created_at: string }>(),
  ]);

  const inv = invoices.data ?? [];
  const proj = projects.data ?? [];
  const m = moneyMetrics(inv, proj, holdbacks.data ?? [], today);
  const aging = agingBuckets(inv, proj, today);
  const payers = payerStats(inv, proj, today).slice(0, 5);
  const clientName = new Map((clients.data ?? []).map((c) => [c.id, c.name]));
  const projectName = new Map(proj.map((p) => [p.id, p.name]));
  const draftFor = new Map((drafts.data ?? []).filter((d) => d.deadline_id).map((d) => [d.deadline_id as string, d.id]));
  const items = deadlines.data ?? [];
  const pastDue = items.filter((d) => d.due_date < today);
  const upcoming = items.filter((d) => d.due_date >= today);
  const pendingDrafts = drafts.data?.length ?? 0;
  const outstanding = aging.reduce((s, b) => s + b.amount, 0);

  return (
    <>
      <PageHeader
        title="Today"
        description={
          <>
            <DateText value={today} />
            {lastSweep.data ? (
              <>
                {" "}
                · swept <DateText value={lastSweep.data.created_at.slice(0, 10)} />
              </>
            ) : (
              " · not swept yet"
            )}
          </>
        }
        actions={
          isAdmin ? (
            <form action={runSweepNowAction}>
              <SubmitButton className="btn-secondary" pending="Sweeping">
                Run sweep
              </SubmitButton>
            </form>
          ) : null
        }
      />

      <StatStrip label="Money at risk">
        <Stat
          label={`At risk, ${clientName.size} clients`}
          value={<Money value={m.moneyAtRisk} whole />}
          hint="Overdue + disputed + holdback due in 14 days"
        />
        <Stat
          label="Overdue invoices"
          value={<Money value={m.overdueTotal} whole />}
          hint={
            m.overdueCount > 0 ? (
              <Badge tone="danger">
                {m.overdueCount} {m.overdueCount === 1 ? "invoice" : "invoices"} past the payment window
              </Badge>
            ) : (
              "None"
            )
          }
          href={pastDue.length > 0 ? "#past-due" : undefined}
        />
        <Stat
          label="Disputed"
          value={<Money value={m.disputedTotal} whole />}
          hint={m.disputedTotal > 0 ? <Badge tone="warn">In adjudication windows</Badge> : "None"}
        />
        <Stat
          label="Holdback due within 14 days"
          value={<Money value={m.holdbackDueSoon} whole />}
          hint={
            <Badge tone="info">
              <Money value={m.holdbackOwed} whole /> held in total
            </Badge>
          }
        />
      </StatStrip>

      <section aria-labelledby="aging" className="mt-6 rounded-card border border-line px-5 py-4">
        <SectionTitle
          id="aging"
          aside={
            <>
              <Money value={outstanding} whole className="font-medium text-fg" /> outstanding, net of holdback
            </>
          }
        >
          Receivables by age
        </SectionTitle>
        <div className="mt-3">
          <AgingBar buckets={aging} />
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="work" className="min-w-0">
          <SectionTitle
            id="work"
            aside={
              <>
                {pendingDrafts > 0 ? (
                  <Link href="/drafts" className="mr-3 hover:text-fg">
                    <Num>{pendingDrafts}</Num> emails to approve
                  </Link>
                ) : null}
                <Link href="/deadlines" className="hover:text-fg">
                  All deadlines
                </Link>
              </>
            }
          >
            Needs action
          </SectionTitle>
          {items.length === 0 ? (
            <div className="rounded-card border border-dashed border-line-strong px-6 py-10 text-center">
              <div className="text-base font-semibold text-fg">Nothing needs action</div>
              <p className="mx-auto mt-1 max-w-sm text-muted">Nothing is past due or due in the next 14 days.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {[
                { key: "past-due", title: "Past due", rows: pastDue },
                { key: "upcoming", title: `Due in the next ${UPCOMING_WINDOW_DAYS} days`, rows: upcoming },
              ]
                .filter((g) => g.rows.length > 0)
                .map((g) => (
                  <div key={g.key}>
                    <h3 id={g.key} className="label mb-1.5">
                      {g.title} · <Num>{g.rows.length}</Num>
                    </h3>
                    <ul aria-labelledby={g.key} className="divide-y divide-line rounded-md border border-line">
                      {g.rows.map((d) => (
                        <InboxRow
                          key={d.id}
                          d={d}
                          today={today}
                          isAdmin={isAdmin}
                          draftId={draftFor.get(d.id)}
                          context={`${clientName.get(d.client_id) ?? ""}${d.project_id ? ` · ${projectName.get(d.project_id) ?? ""}` : ""} · ${ruleLabel(d.rule_id)}`}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="payers">
            <SectionTitle id="payers">Slowest payers</SectionTitle>
            {payers.length === 0 ? (
              <p className="rounded-md border border-line px-4 py-6 text-center text-muted">No open invoices.</p>
            ) : (
              <div className="overflow-hidden rounded-md border border-line">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Payer</th>
                      <th scope="col" className="text-right">
                        Avg age
                      </th>
                      <th scope="col" className="text-right">
                        Open
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payers.map((p) => (
                      <tr key={p.name}>
                        <td className="max-w-[190px] truncate text-fg" title={p.name}>
                          {p.name}
                        </td>
                        <td className={`num text-right ${p.avgDaysOutstanding > 35 ? "font-medium text-danger" : ""}`}>{p.avgDaysOutstanding}d</td>
                        <td className="num text-right">{formatCAD(p.openBalance, { whole: true })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-2 text-[13px] text-muted">
              Average days since submission on open invoices. The window is <Num>35</Num> days from a GC, <Num>28</Num> from an owner.
            </p>
          </section>

          <section aria-labelledby="wsib">
            <SectionTitle id="wsib" aside={<Link href="/clients" className="hover:text-fg">All clients</Link>}>
              WSIB clearances
            </SectionTitle>
            {(wsib.data ?? []).length === 0 ? (
              <p className="rounded-md border border-line px-4 py-6 text-center text-muted">All clearances are current.</p>
            ) : (
              <ul className="divide-y divide-line rounded-md border border-line">
                {(wsib.data ?? []).map((w) => {
                  const days = diffDays(today, w.expiry_date);
                  return (
                    <li key={w.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-fg">{clientName.get(w.client_id)}</div>
                        <div className="truncate text-[13px] text-muted">for {w.gc_name}</div>
                      </div>
                      <Badge tone={days < 0 ? "danger" : "warn"}>{days < 0 ? "Expired" : `Expires in ${days}d`}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <p className="mt-8 text-xs text-muted">Deadlines use unverified Construction Act defaults pending legal review. An administrative tool, not legal advice.</p>
    </>
  );
}

function InboxRow({ d, today, isAdmin, draftId, context }: { d: Deadline; today: string; isAdmin: boolean; draftId?: string; context: string }) {
  const days = diffDays(today, d.due_date);
  const target = d.project_id ? `/projects/${d.project_id}` : `/clients/${d.client_id}`;
  const invoiceEditor = d.entity_type === "invoice" && d.project_id ? `/projects/${d.project_id}?edit=${d.entity_id}#invoices` : null;
  const isAdjudication = d.type === "adjudication";
  return (
    <li className="flex flex-col gap-2 px-4 py-3 lg:flex-row lg:items-center lg:gap-4">
      <div className="lg:w-36">
        <Badge tone={TONE[d.severity]}>{whenLabel(days)}</Badge>
      </div>
      <div className="min-w-0 flex-1">
        <Link href={target} className="block truncate font-medium text-fg hover:underline hover:underline-offset-4">
          {d.title}
        </Link>
        <div className="truncate text-[13px] text-muted">{context}</div>
      </div>
      <div className="lg:w-28 lg:text-right">
        {d.amount ? <Money value={Number(d.amount)} className="font-medium text-fg" /> : <span className="text-muted">—</span>}
        <div className="text-xs text-muted">
          due <DateText value={d.due_date} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1 lg:w-60 lg:justify-end">
        {draftId ? (
          <Link href={`/drafts?id=${draftId}`} className="btn-secondary btn-sm">
            Review email
          </Link>
        ) : isAdjudication && invoiceEditor ? (
          <Link href={invoiceEditor} className="btn-secondary btn-sm">
            Review dispute
          </Link>
        ) : invoiceEditor ? (
          <Link href={invoiceEditor} className="btn-secondary btn-sm">
            Update invoice
          </Link>
        ) : (
          <Link href={target} className="btn-secondary btn-sm">
            Open
          </Link>
        )}
        {isAdmin && isAdjudication ? (
          <form action={recordAdjudicationReferralAction}>
            <input type="hidden" name="id" value={d.id} />
            <SubmitButton
              className="btn-ghost btn-sm"
              pending="…"
              confirm="Record that the payer referred this dispute to adjudication? The referral window closes and a note is added to the invoice."
            >
              Payer referred it
            </SubmitButton>
          </form>
        ) : isAdmin ? (
          <form action={dismissDeadlineAction}>
            <input type="hidden" name="id" value={d.id} />
            <SubmitButton className="btn-ghost btn-sm" pending="…" confirm="Dismiss this item? It will not come back in future sweeps.">
              Dismiss
            </SubmitButton>
          </form>
        ) : null}
      </div>
    </li>
  );
}
