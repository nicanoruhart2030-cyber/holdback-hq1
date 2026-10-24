import Link from "next/link";
import type { Severity } from "@/lib/deadlines/engine";
import { formatCAD, formatDate, formatTimestamp } from "@/lib/format";

export function Money({ value, whole, className = "" }: { value: number | null | undefined; whole?: boolean; className?: string }) {
  return <span className={`num whitespace-nowrap ${className}`}>{formatCAD(value, { whole })}</span>;
}

export function DateText({ value, className = "" }: { value: string | null | undefined; className?: string }) {
  return <span className={`num whitespace-nowrap ${className}`}>{formatDate(value)}</span>;
}

export function Timestamp({ value, className = "" }: { value: string | null | undefined; className?: string }) {
  return <span className={`num whitespace-nowrap ${className}`}>{formatTimestamp(value)}</span>;
}

export function Num({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`num ${className}`}>{children}</span>;
}

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: string;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-1 text-[13px] text-muted">{eyebrow}</div> : null}
        <h1 className="h-display text-display">{title}</h1>
        {description ? <p className="mt-0.5 max-w-3xl text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionTitle({ children, aside, id }: { children: React.ReactNode; aside?: React.ReactNode; id?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <h2 id={id} className="text-base font-semibold tracking-[-0.011em] text-fg">
        {children}
      </h2>
      {aside ? <div className="text-[13px] text-muted">{aside}</div> : null}
    </div>
  );
}

export function Card({ title, actions, children, className = "", flush }: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-base font-semibold tracking-[-0.011em] text-fg">{title}</h2>
          {actions}
        </div>
      ) : null}
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

/** One cell of a bordered metrics strip (Mercury/Cal-style: no separate cards). */
export function Stat({ label, value, hint, href }: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <div className="h-full px-5 py-4">
      <div className="text-[13px] text-muted">{label}</div>
      <div className="num mt-1.5 text-stat text-fg">{value}</div>
      {hint ? <div className="mt-2 text-[13px] text-muted">{hint}</div> : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-colors hover:bg-raised">
      {body}
    </Link>
  ) : (
    body
  );
}

export function StatStrip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <section
      aria-label={label}
      className="grid grid-cols-1 divide-y divide-line rounded-card border border-line sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x [&>*]:border-line sm:[&>*:nth-child(odd)]:border-r xl:[&>*]:border-r-0"
    >
      {children}
    </section>
  );
}

export type BadgeTone = "ok" | "warn" | "danger" | "info" | "neutral";

const TONE_CLASS: Record<BadgeTone, string> = {
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  neutral: "bg-emphasis text-body",
};

const CIRCLE = "M10.5 6a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z";
/** Each tone has its own icon shape, so status never relies on colour alone. */
const TONE_ICON: Record<BadgeTone, string> = {
  ok: `${CIRCLE}M4 6l1.5 1.5L8 4.8`,
  warn: `${CIRCLE}M6 3.5V6l1.6 1`,
  danger: "M6 1.8 10.8 10H1.2ZM6 5v2.2M6 8.7v.1",
  info: "M3.5 5.5h5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1ZM4 5.5V4a2 2 0 0 1 4 0v1.5",
  neutral: CIRCLE,
};

export function Badge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={`badge ${TONE_CLASS[tone]}`}>
      <svg
        aria-hidden="true"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={tone === "neutral" ? "2 2" : undefined}
      >
        <path d={TONE_ICON[tone]} />
      </svg>
      {children}
    </span>
  );
}

const SEVERITY_TONE: Record<Severity, BadgeTone> = {
  overdue: "danger",
  critical: "warn",
  warning: "warn",
  info: "neutral",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  overdue: "Overdue",
  critical: "Due within 3 days",
  warning: "Due within 7 days",
  info: "Upcoming",
};

export function SeverityBadge({ severity, label }: { severity: Severity; label?: string }) {
  return <Badge tone={SEVERITY_TONE[severity]}>{label ?? SEVERITY_LABEL[severity]}</Badge>;
}

const STATUS_TONE: Record<string, BadgeTone> = {
  paid: "ok",
  sent: "ok",
  valid: "ok",
  ready: "ok",
  active: "ok",
  released: "ok",
  overdue: "danger",
  expired: "danger",
  rejected: "danger",
  failed: "danger",
  disputed: "warn",
  expiring: "warn",
  partial: "warn",
  pending: "info",
  held: "info",
  submitted: "neutral",
  draft: "neutral",
  onboarding: "neutral",
  paused: "neutral",
  churned: "neutral",
  processing: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  partial: "Partly paid",
  pending: "Waiting",
};

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{label}</Badge>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-10 text-center text-muted">{children}</div>;
}

export function Field({ label, children, hint, className = "" }: { label: string; children: React.ReactNode; hint?: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-medium text-fg">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[13px] text-muted">{hint}</span> : null}
    </label>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "danger" | "mint" | "ok"; children: React.ReactNode }) {
  const style = {
    info: "border-line bg-raised text-body",
    warn: "border-warn/20 bg-warn-bg text-warn",
    danger: "border-danger/20 bg-danger-bg text-danger",
    mint: "border-ok/20 bg-ok-bg text-ok",
    ok: "border-ok/20 bg-ok-bg text-ok",
  }[tone];
  return <div className={`rounded-card border px-4 py-3 text-sm ${style}`}>{children}</div>;
}

/** Labelled aging bar: gray → amber → orange → red, every segment named in the legend. */
export function AgingBar({ buckets, compact }: { buckets: Array<{ label: string; amount: number; color: string }>; compact?: boolean }) {
  const total = buckets.reduce((s, b) => s + b.amount, 0);
  return (
    <div>
      <div aria-hidden="true" className={`flex gap-0.5 ${compact ? "h-1.5" : "h-2"}`}>
        {total === 0 ? (
          <div className="flex-1 rounded-sm bg-emphasis" />
        ) : (
          buckets
            .filter((b) => b.amount > 0)
            .map((b) => <div key={b.label} className="min-w-[3px] rounded-sm" style={{ flex: `${b.amount} 1 0`, background: b.color }} />)
        )}
      </div>
      {compact ? null : (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {buckets.map((b) => (
            <li key={b.label}>
              <div className="flex items-center gap-1.5 text-[13px] text-muted">
                <span aria-hidden="true" className="h-2 w-2 rounded-sm" style={{ background: b.color }} />
                {b.label}
              </div>
              <Money value={b.amount} whole className="mt-0.5 block font-medium text-fg" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
