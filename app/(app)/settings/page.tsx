import { Card, Notice, Num, PageHeader, StatusBadge } from "@/components/ui";
import { groqUnavailableReason } from "@/lib/ai/groq";
import { optionalEnv } from "@/lib/env";
import { ontarioStatutoryHolidays } from "@/lib/rules/calendar";
import { RULES } from "@/lib/rules/ontario-construction-act";
import { todayInToronto } from "@/lib/format";
import { DateText } from "@/components/ui";

export const metadata = { title: "Rules" };

export default function SettingsPage() {
  const unverified = RULES.filter((r) => !r.verified).length;
  const year = Number(todayInToronto().slice(0, 4));
  const groq = groqUnavailableReason();
  const integrations: Array<[string, boolean, string]> = [
    ["Groq extraction and drafting", groq === null, groq ?? `Model ${optionalEnv("GROQ_MODEL") ?? "llama-3.3-70b-versatile"}`],
    ["Google Cloud Vision OCR", Boolean(optionalEnv("GOOGLE_VISION_API_KEY")), optionalEnv("GOOGLE_VISION_API_KEY") ? "Scanned PDFs and images are OCR'd" : "Not configured; scanned documents need manual entry"],
    ["Resend email", Boolean(optionalEnv("RESEND_API_KEY") && optionalEnv("RESEND_FROM_EMAIL")), optionalEnv("RESEND_FROM_EMAIL") ?? "Not configured"],
    ["Daily cron secret", Boolean(optionalEnv("CRON_SECRET")), optionalEnv("CRON_SECRET") ? "Set" : "Not set; cron endpoint rejects all calls"],
  ];

  return (
    <>
      <PageHeader
        title="Rules"
        description="Read-only view of /lib/rules/ontario-construction-act.ts. Change values in code, with legal sign-off, and redeploy."
      />
      {unverified > 0 ? (
        <div className="mb-6">
          <Notice tone="warn">
            <Num>{unverified}</Num> of <Num>{RULES.length}</Num> rules are unverified. Values must be verified by an Ontario construction lawyer before client use.
          </Notice>
        </div>
      ) : null}

      <Card title="Timing rules" flush>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Rule</th><th>Trigger</th><th className="text-right">Offset</th><th>Counting</th><th>Applies to</th><th>Source</th><th>Verified</th></tr></thead>
            <tbody>
              {RULES.map((r) => (
                <tr key={r.id}>
                  <td className="max-w-sm"><div className="text-sm font-medium">{r.label}</div><div className="mt-0.5 text-sm text-muted">{r.description}</div><div className="num mt-1 text-xs text-faint">{r.id}</div></td>
                  <td><span className="num text-xs text-muted">{r.trigger}</span></td>
                  <td className="text-right"><Num>{r.offsetDays > 0 ? `+${r.offsetDays}` : r.offsetDays}d</Num></td>
                  <td className="text-xs text-muted">{r.dayType}{r.rollForward ? ", rolls to business day" : ""}</td>
                  <td className="text-xs text-muted">{"appliesTo" in r ? r.appliesTo : "all"}</td>
                  <td className="max-w-xs text-xs text-muted">{r.sourceNote}</td>
                  <td>{r.verified ? <StatusBadge status="valid" /> : <StatusBadge status="pending" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title={<>Ontario statutory holidays <Num>{year}</Num> / <Num>{year + 1}</Num></>} flush>
          <table className="table">
            <tbody>
              {[...ontarioStatutoryHolidays(year), ...ontarioStatutoryHolidays(year + 1)].map((h) => (
                <tr key={h.date}><td><DateText value={h.date} /></td><td className={h.observed ? "text-muted" : ""}>{h.name}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Integrations" flush>
          <ul>
            {integrations.map(([name, ok, detail]) => (
              <li key={name} className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5 last:border-b-0">
                <div><div className="text-sm">{name}</div><div className="text-xs text-muted">{detail}</div></div>
                <StatusBadge status={ok ? "active" : "pending"} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
