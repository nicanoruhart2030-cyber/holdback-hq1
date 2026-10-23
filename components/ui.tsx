import Link from "next/link";
import type { Severity } from "@/lib/deadlines/engine";
import { formatCAD, formatDate, formatTimestamp } from "@/lib/format";

export function Money({ value, whole, className = "" }: { value: number | null | undefined; whole?: boolean; className?: string }) {
  return <span className={`num ${className}`}>{formatCAD(value, { whole })}</span>;
}

export function DateText({ value, className = "" }: { value: string | null | undefined; className?: string }) {
  return <span className={`num ${className}`}>{formatDate(value)}</span>;
}

export function Timestamp({ value, className = "" }: { value: string | null | undefined; className?: string }) {
  return <span className={`num ${className}`}>{formatTimestamp(value)}</span>;
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
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div className="min-w-0">
        {eyebrow ? <div className="label mb-2">{eyebrow}</div> : null}
        <h1 className="h-display text-display text-fg">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
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
    <section className={`card ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          {actions}
        </div>
      ) : null}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, tone = "default", href }: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "mint" | "danger" | "warn";
  href?: string;
}) {
  const color = { default: "text-fg", mint: "text-mint", danger: "text-danger", warn: "text-warn" }[tone];
  const body = (
    <div className="card h-full p-5 transition-colors hover:border-line-strong">
      <div className="label">{label}</div>
      <div className={`num mt-3 text-stat font-medium ${color}`}>{value}</div>
      {hint ? <div className="mt-3 text-xs text-muted">{hint}</div> : null}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

const SEVERITY_STYLE: Record<Severity, string> = {
  overdue: "border-danger/40 text-danger",
  critical: "border-warn/50 text-warn",
  warning: "border-warn/30 text-warn/90",
  info: "border-line-strong text-muted",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-2xs font-medium uppercase tracking-[0.06em] ${SEVERITY_STYLE[severity]}`}>
      {severity}
    </span>
  );
}

const STATUS_STYLE: Record<string, string> = {
  paid: "border-mint/40 text-mint",
  sent: "border-mint/40 text-mint",
  valid: "border-mint/40 text-mint",
  ready: "border-mint/40 text-mint",
  active: "border-mint/40 text-mint",
  released: "border-mint/40 text-mint",
  overdue: "border-danger/40 text-danger",
  expired: "border-danger/40 text-danger",
  rejected: "border-danger/40 text-danger",
  failed: "border-danger/40 text-danger",
  disputed: "border-warn/50 text-warn",
  expiring: "border-warn/50 text-warn",
  partial: "border-warn/30 text-warn/90",
  pending: "border-warn/30 text-warn/90",
  processing: "border-line-strong text-muted",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-2xs font-medium uppercase tracking-[0.06em] ${STATUS_STYLE[status] ?? "border-line-strong text-muted"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-10 text-center text-sm text-muted">{children}</div>;
}

export function Field({ label, children, hint, className = "" }: { label: string; children: React.ReactNode; hint?: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label mb-1.5 block">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "danger" | "mint"; children: React.ReactNode }) {
  const style = {
    info: "border-line-strong text-muted",
    warn: "border-warn/40 text-warn",
    danger: "border-danger/40 text-danger",
    mint: "border-mint/40 text-mint",
  }[tone];
  return <div className={`rounded-card border px-4 py-3 text-sm ${style}`}>{children}</div>;
}
