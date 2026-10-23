import Link from "next/link";
import { dismissDeadlineAction } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { Card, DateText, Empty, Money, Num, PageHeader, SeverityBadge } from "@/components/ui";
import { getProfile } from "@/lib/auth";
import type { Severity } from "@/lib/deadlines/engine";
import { todayInToronto } from "@/lib/format";
import { ruleLabel } from "@/lib/rules/ontario-construction-act";
import { addCalendarDays, dayOfWeek, diffDays, isOntarioHoliday, makeDate } from "@/lib/rules/calendar";
import { createClient } from "@/lib/supabase/server";
import type { Client, Deadline } from "@/lib/types";

export const metadata = { title: "Deadlines" };

const SEVERITIES: Severity[] = ["overdue", "critical", "warning", "info"];
const DOT: Record<Severity, string> = { overdue: "bg-danger", critical: "bg-warn", warning: "bg-warn/60", info: "bg-faint" };

interface Search {
  view?: string;
  client?: string;
  severity?: string;
  month?: string;
}

export default async function DeadlinesPage({ searchParams }: { searchParams: Search }) {
  const supabase = createClient();
  const today = todayInToronto();
  const { profile } = await getProfile();
  const view = searchParams.view === "calendar" ? "calendar" : "list";
  const severity = SEVERITIES.includes(searchParams.severity as Severity) ? (searchParams.severity as Severity) : null;
  const month = /^\d{4}-\d{2}$/.test(searchParams.month ?? "") ? (searchParams.month as string) : today.slice(0, 7);

  let query = supabase.from("deadlines").select("*").eq("resolved", false).order("due_date");
  if (searchParams.client) query = query.eq("client_id", searchParams.client);
  if (severity) query = query.eq("severity", severity);
  const [{ data: deadlines }, { data: clients }] = await Promise.all([
    query.returns<Deadline[]>(),
    supabase.from("clients").select("id, name").order("name").returns<Client[]>(),
  ]);
  const list = deadlines ?? [];
  const clientName = new Map((clients ?? []).map((c) => [c.id, c.name]));

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
        description="Generated each morning from the rules table. Dismiss an item you have handled outside the app; it will not come back."
        actions={
          <div className="flex rounded-button border border-line-strong p-0.5">
            {(["list", "calendar"] as const).map((v) => (
              <Link key={v} href={href({ view: v })} className={`rounded-[6px] px-3 py-1 text-sm capitalize ${view === v ? "bg-raised text-fg" : "text-muted hover:text-fg"}`}>{v}</Link>
            ))}
          </div>
        }
      />

      <form key={`${searchParams.client ?? ""}-${severity ?? ""}`} className="mb-5 flex flex-wrap items-end gap-3" action="/deadlines">
        <input type="hidden" name="view" value={view} />
        <input type="hidden" name="month" value={month} />
        <label className="block w-56">
          <span className="label mb-1.5 block">Client</span>
          <select name="client" defaultValue={searchParams.client ?? ""} className="input">
            <option value="">All clients</option>
            {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block w-44">
          <span className="label mb-1.5 block">Severity</span>
          <select name="severity" defaultValue={severity ?? ""} className="input">
            <option value="">All</option>
            {SEVERITIES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </label>
        <button className="btn-secondary">Apply</button>
        {searchParams.client || severity ? <Link href={`/deadlines?view=${view}`} className="pb-2 text-sm text-muted hover:text-fg">Clear</Link> : null}
        <span className="ml-auto pb-2 text-xs text-muted"><Num>{list.length}</Num> open</span>
      </form>

      {view === "list" ? (
        <Card flush>
          {list.length === 0 ? (
            <Empty>No open deadlines match these filters.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Due</th><th>Deadline</th><th>Client</th><th>Type</th><th className="text-right">Amount</th><th>Severity</th>{profile?.role === "admin" ? <th /> : null}</tr></thead>
                <tbody>
                  {list.map((d) => {
                    const days = diffDays(today, d.due_date);
                    return (
                      <tr key={d.id}>
                        <td className="whitespace-nowrap"><DateText value={d.due_date} /><div className="num text-2xs text-faint">{days < 0 ? `${-days}d ago` : days === 0 ? "today" : `in ${days}d`}</div></td>
                        <td>{d.project_id ? <Link href={`/projects/${d.project_id}`} className="hover:text-mint">{d.title}</Link> : <Link href={`/clients/${d.client_id}`} className="hover:text-mint">{d.title}</Link>}</td>
                        <td className="max-w-[180px] truncate text-muted" title={clientName.get(d.client_id)}>{clientName.get(d.client_id)}</td>
                        <td className="whitespace-nowrap text-xs text-muted">{ruleLabel(d.rule_id)}</td>
                        <td className="text-right">{d.amount ? <Money value={Number(d.amount)} /> : <span className="text-faint">—</span>}</td>
                        <td><SeverityBadge severity={d.severity} /></td>
                        {profile?.role === "admin" ? (
                          <td>
                            <form action={dismissDeadlineAction}>
                              <input type="hidden" name="id" value={d.id} />
                              <SubmitButton className="btn-secondary btn-sm" pending="…" confirm="Dismiss this deadline? It will not be regenerated by future sweeps.">Dismiss</SubmitButton>
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
      ) : (
        <CalendarView month={month} today={today} deadlines={list} href={href} />
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
        <div className="border-b border-line px-5 py-2.5 text-xs text-danger"><Num>{overdue.length}</Num> overdue items fall before this view. Switch to list to see them.</div>
      ) : null}
      <div className="grid grid-cols-7 border-b border-line">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="label px-2 py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const items = byDay.get(day) ?? [];
          const inMonth = day.slice(0, 7) === month;
          const holiday = isOntarioHoliday(day);
          return (
            <div key={day} className={`min-h-[104px] border-line p-1.5 ${i % 7 !== 6 ? "border-r" : ""} ${i < 35 ? "border-b" : ""} ${inMonth ? "" : "bg-ink/60"} ${dayOfWeek(day) % 6 === 0 || holiday ? "bg-raised/30" : ""}`}>
              <div className="flex items-center justify-between px-0.5">
                <span className={`num text-xs ${day === today ? "rounded-[4px] bg-mint px-1 text-mint-ink" : inMonth ? "text-muted" : "text-faint"}`}>{Number(day.slice(8))}</span>
                {holiday ? <span className="text-2xs text-faint">holiday</span> : null}
              </div>
              <ul className="mt-1 space-y-0.5">
                {items.slice(0, 3).map((d) => (
                  <li key={d.id}>
                    <Link href={d.project_id ? `/projects/${d.project_id}` : `/clients/${d.client_id}`} className="flex items-center gap-1.5 truncate rounded-[4px] px-1 py-0.5 text-2xs text-fg hover:bg-raised" title={d.title}>
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[d.severity]}`} />
                      <span className="truncate">{d.title}</span>
                    </Link>
                  </li>
                ))}
                {items.length > 3 ? <li className="num px-1 text-2xs text-muted">+{items.length - 3} more</li> : null}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
