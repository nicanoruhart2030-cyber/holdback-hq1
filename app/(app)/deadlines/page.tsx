import Link from "next/link";
import { Badge, Card, DateText, Empty, Money, Num, PageHeader } from "@/components/ui";
import type { Severity } from "@/lib/deadlines/engine";
import { formatCADShort, todayInToronto } from "@/lib/format";
import { ruleLabel } from "@/lib/rules/ontario-construction-act";
import { addCalendarDays, dayOfWeek, diffDays, isOntarioHoliday, makeDate } from "@/lib/rules/calendar";
import { createClient } from "@/lib/supabase/server";
import type { Client, Deadline } from "@/lib/types";

export const metadata = { title: "Deadlines" };

const SEVERITIES: Severity[] = ["overdue", "critical", "warning", "info"];
/** Short names for calendar cells, where the full title would truncate. */
const TYPE_SHORT: Record<string, string> = {
  invoice_payment: "Payment",
  invoice_dispute_window: "Dispute window",
  proper_invoice_objection: "Objection",
  adjudication: "Adjudication",
  holdback_annual_notice: "Holdback notice",
  holdback_release: "Holdback",
  holdback_lien_expiry: "Lien expiry",
  holdback_notice_window: "Holdback notice",
  wsib_expiry: "WSIB",
};
const HISTORY_LIMIT = 200;

const CHIP: Record<Severity, string> = { overdue: "bg-danger-bg text-danger", critical: "bg-warn-bg text-warn", warning: "bg-warn-bg text-warn", info: "bg-emphasis text-body" };

interface Search {
  view?: string;
  client?: string;
  severity?: string;
  month?: string;
}

export default async function DeadlinesPage({ searchParams }: { searchParams: Search }) {
  const supabase = createClient();
  const today = todayInToronto();
  const view = searchParams.view === "history" ? "history" : "calendar";
  const severity = SEVERITIES.includes(searchParams.severity as Severity) ? (searchParams.severity as Severity) : null;
  const month = /^\d{4}-\d{2}$/.test(searchParams.month ?? "") ? (searchParams.month as string) : today.slice(0, 7);

  const base = supabase.from("deadlines").select("*");
  let query =
    view === "history"
      ? base.eq("resolved", true).order("resolved_at", { ascending: false }).limit(HISTORY_LIMIT)
      : base.eq("resolved", false).order("due_date");
  if (searchParams.client) query = query.eq("client_id", searchParams.client);
  if (severity && view === "calendar") query = query.eq("severity", severity);
  const [{ data: deadlines }, { data: clients }] = await Promise.all([
    query.returns<Deadline[]>(),
    supabase.from("clients").select("id, name").order("name").returns<Client[]>(),
  ]);
  const list = deadlines ?? [];
  const clientName = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const agendaEnd = addCalendarDays(today, 14);
  const agenda = list.filter((d) => d.due_date >= today && d.due_date <= agendaEnd);

  const href = (patch: Partial<Search>) => {
    const p = new URLSearchParams();
    const merged = { view, client: searchParams.client, severity: severity ?? undefined, month, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/deadlines?${p.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Deadlines"
        description={
          view === "history"
            ? "Deadlines that are closed: dismissed by an admin, or cleared by the sweep once the invoice was paid, the holdback released or the certificate renewed."
            : "Generated each morning from the rules table. Act on them from Today."
        }
        actions={
          <div className="flex rounded-button border border-line-strong p-0.5">
            {(["calendar", "history"] as const).map((v) => (
              <Link key={v} href={href({ view: v })} className={`rounded-[6px] px-3 py-1 text-sm capitalize ${view === v ? "bg-raised text-fg" : "text-muted hover:text-fg"}`}>{v}</Link>
            ))}
          </div>
        }
      />

      <form key={`${view}-${searchParams.client ?? ""}-${severity ?? ""}`} className="mb-5 flex flex-wrap items-end gap-3" action="/deadlines">
        <input type="hidden" name="view" value={view} />
        <input type="hidden" name="month" value={month} />
        <label className="block w-56">
          <span className="label mb-1.5 block">Client</span>
          <select name="client" defaultValue={searchParams.client ?? ""} className="input">
            <option value="">All clients</option>
            {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        {view === "calendar" ? (
          <label className="block w-44">
            <span className="label mb-1.5 block">Severity</span>
            <select name="severity" defaultValue={severity ?? ""} className="input">
              <option value="">All</option>
              {SEVERITIES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </label>
        ) : null}
        <button className="btn-secondary">Apply</button>
        {searchParams.client || severity ? <Link href={`/deadlines?view=${view}`} className="pb-2 text-sm text-muted hover:text-fg">Clear</Link> : null}
        <span className="ml-auto pb-2 text-xs text-muted">
          {view === "history" ? (
            <>
              <Num>{list.length}</Num> closed{list.length === HISTORY_LIMIT ? `, latest ${HISTORY_LIMIT} shown` : ""}
            </>
          ) : (
            <>
              <Num>{list.length}</Num> open
            </>
          )}
        </span>
      </form>

      {view === "history" ? (
        <Card flush>
          {list.length === 0 ? (
            <Empty>No closed deadlines yet. Dismissed and cleared items appear here.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Closed</th><th>Deadline</th><th>Client</th><th>Type</th><th className="text-right">Amount</th><th>Was due</th><th>Outcome</th></tr></thead>
                <tbody>
                  {list.map((d) => (
                    <tr key={d.id}>
                      <td className="whitespace-nowrap"><DateText value={(d.dismissed_at ?? d.resolved_at)?.slice(0, 10)} /></td>
                      <td>{d.project_id ? <Link href={`/projects/${d.project_id}`} className="hover:underline hover:underline-offset-4">{d.title}</Link> : <Link href={`/clients/${d.client_id}`} className="hover:underline hover:underline-offset-4">{d.title}</Link>}</td>
                      <td className="max-w-[180px] truncate text-muted" title={clientName.get(d.client_id)}>{clientName.get(d.client_id)}</td>
                      <td className="whitespace-nowrap text-xs text-muted">{ruleLabel(d.rule_id)}</td>
                      <td className="text-right">{d.amount ? <Money value={Number(d.amount)} /> : <span className="text-faint">—</span>}</td>
                      <td className="whitespace-nowrap"><DateText value={d.due_date} /></td>
                      <td>{d.dismissed ? <Badge tone="neutral">Dismissed</Badge> : <Badge tone="ok">Cleared</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
          <div className="min-w-0 flex-1">
            <CalendarView month={month} today={today} deadlines={list} href={href} />
          </div>
          <section aria-labelledby="agenda" className="xl:w-80">
            <h2 id="agenda" className="mb-2 text-base font-semibold tracking-[-0.011em] text-fg">Next 14 days</h2>
            {agenda.length === 0 ? (
              <p className="rounded-md border border-line px-4 py-6 text-center text-muted">Nothing due in the next 14 days.</p>
            ) : (
              <ol className="divide-y divide-line rounded-md border border-line">
                {agenda.map((d) => {
                  const days = diffDays(today, d.due_date);
                  return (
                    <li key={d.id} className="grid grid-cols-[96px_minmax(0,1fr)_auto] items-start gap-3 px-3 py-2.5">
                      <div>
                        <DateText value={d.due_date} className="block font-medium text-fg" />
                        <span className="text-xs text-muted">{days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}</span>
                      </div>
                      <div className="min-w-0">
                        <Link href={d.project_id ? `/projects/${d.project_id}` : `/clients/${d.client_id}`} className="block truncate text-fg hover:underline hover:underline-offset-4">
                          {d.title}
                        </Link>
                        <div className="truncate text-[13px] text-muted">{clientName.get(d.client_id)} · {ruleLabel(d.rule_id)}</div>
                      </div>
                      {d.amount ? <Money value={Number(d.amount)} whole className="text-fg" /> : <span />}
                    </li>
                  );
                })}
              </ol>
            )}
            <p className="mt-2 text-[13px] text-muted">Dismissed items stay dismissed and are listed in History.</p>
          </section>
        </div>
      )}
    </>
  );
}

function CalendarView({ month, today, deadlines, href }: { month: string; today: string; deadlines: Deadline[]; href: (p: Partial<Search>) => string }) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const first = makeDate(y, m, 1);
  const start = addCalendarDays(first, -((dayOfWeek(first) + 6) % 7)); // weeks start Monday
  const days = Array.from({ length: 42 }, (_, i) => addCalendarDays(start, i));
  const prev = makeDate(y, m - 1, 1).slice(0, 7);
  const next = makeDate(y, m + 1, 1).slice(0, 7);
  const byDay = new Map<string, Deadline[]>();
  for (const d of deadlines) byDay.set(d.due_date, [...(byDay.get(d.due_date) ?? []), d]);
  const label = new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${first}T00:00:00Z`));
  const overdue = deadlines.filter((d) => d.due_date < start);

  return (
    <Card
      title={<span className="num">{label}</span>}
      flush
      actions={
        <div className="flex gap-1">
          <Link href={href({ month: prev })} className="btn-secondary btn-sm">Prev</Link>
          <Link href={href({ month: today.slice(0, 7) })} className="btn-secondary btn-sm">Today</Link>
          <Link href={href({ month: next })} className="btn-secondary btn-sm">Next</Link>
        </div>
      }
    >
      {overdue.length > 0 ? (
        <div className="border-b border-line bg-danger-bg px-4 py-2 text-[13px] text-danger"><Num>{overdue.length}</Num> past-due {overdue.length === 1 ? "item falls" : "items fall"} before this view. <Link href="/dashboard" className="underline underline-offset-4">See them on Today</Link>.</div>
      ) : null}
      <div className="grid grid-cols-7 border-b border-line">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="label bg-raised px-2 py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const items = byDay.get(day) ?? [];
          const inMonth = day.slice(0, 7) === month;
          const holiday = isOntarioHoliday(day);
          return (
            <div key={day} className={`min-h-[96px] border-line p-1.5 ${i % 7 !== 6 ? "border-r" : ""} ${i < 35 ? "border-b" : ""} ${dayOfWeek(day) % 6 === 0 || holiday ? "bg-raised" : ""}`}>
              <div className="flex items-center justify-between px-0.5">
                <span className={`num inline-flex h-[22px] min-w-[22px] items-center justify-center text-[13px] font-medium ${day === today ? "rounded-full bg-accent text-accent-fg" : inMonth ? "text-fg" : "text-[#9CA3B0]"}`}>{Number(day.slice(8))}</span>
                {holiday ? <span className="text-xs text-muted">Holiday</span> : null}
              </div>
              <ul className="mt-1 space-y-0.5">
                {items.slice(0, 3).map((d) => (
                  <li key={d.id}>
                    <Link href={d.project_id ? `/projects/${d.project_id}` : `/clients/${d.client_id}`} className={`flex flex-wrap justify-between gap-x-1 rounded-badge px-1.5 py-0.5 text-xs font-medium hover:underline ${CHIP[d.severity]}`} title={d.title}>
                      <span className="min-w-0 truncate">{TYPE_SHORT[d.type] ?? d.title}</span>
                      {d.amount ? <span className="num shrink-0">{formatCADShort(Number(d.amount))}</span> : null}
                    </Link>
                  </li>
                ))}
                {items.length > 3 ? <li className="num px-1 text-xs text-muted">+{items.length - 3} more</li> : null}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
