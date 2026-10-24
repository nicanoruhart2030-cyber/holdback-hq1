import { DateText } from "@/components/ui";
import { compareDates, diffDays } from "@/lib/rules/calendar";

export interface Milestone {
  date: string;
  label: string;
}

/** Horizontal holdback timeline: a neutral track, a "today" marker, and labelled steps below. */
export function HoldbackTrack({ milestones, today }: { milestones: Milestone[]; today: string }) {
  if (milestones.length === 0) return null;
  const dates = [...milestones.map((m) => m.date), today].sort(compareDates);
  const start = dates[0] as string;
  const end = dates[dates.length - 1] as string;
  const span = Math.max(1, diffDays(start, end));
  const at = (d: string) => (diffDays(start, d) / span) * 100;
  const todayPct = at(today);

  return (
    <div>
      <div aria-hidden="true" className="relative mx-1.5 mt-5 h-7">
        <div className="absolute inset-x-0 top-[13px] h-0.5 rounded bg-emphasis" />
        <div className="absolute left-0 top-[13px] h-0.5 rounded bg-body" style={{ width: `${todayPct}%` }} />
        {milestones.map((m, i) => {
          const past = compareDates(m.date, today) < 0;
          return (
            <span
              key={`${m.date}-${i}`}
              className={`absolute top-2 h-3 w-3 -translate-x-1/2 rounded-full border-2 ${past ? "border-body bg-body" : "border-[#9CA3B0] bg-ink"}`}
              style={{ left: `${at(m.date)}%` }}
            />
          );
        })}
        <span className="absolute top-1 h-5 w-0.5 -translate-x-1/2 bg-fg" style={{ left: `${todayPct}%` }} />
        <span className="absolute -top-4 -translate-x-1/2 text-xs font-medium text-fg" style={{ left: `${todayPct}%` }}>
          Today
        </span>
      </div>
      <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {milestones.map((m, i) => {
          const past = compareDates(m.date, today) < 0;
          return (
            <li key={`${m.date}-${i}`} className={`border-t-2 pt-2.5 ${past ? "border-body" : "border-line"}`}>
              <DateText value={m.date} className="font-medium text-fg" />
              <div className="mt-0.5 text-[13px] text-muted">{m.label}</div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
