/**
 * Deadline engine. Pure functions only: no I/O, no clock reads. Callers pass
 * "today" (an America/Toronto ISO date) so results are deterministic and testable.
 */
import {
  addBusinessDays,
  addCalendarDays,
  addYears,
  compareDates,
  diffDays,
  rollForwardToBusinessDay,
  type ISODate,
} from "@/lib/rules/calendar";
import {
  ANNUAL_HOLDBACK_REGIME_START,
  DRAFT_LOOKAHEAD_DAYS,
  getRule,
  type PayerType,
  type RuleId,
} from "@/lib/rules/ontario-construction-act";

export type Severity = "overdue" | "critical" | "warning" | "info";

export type DeadlineType =
  | "invoice_payment"
  | "invoice_dispute_window"
  | "proper_invoice_objection"
  | "adjudication"
  | "holdback_annual_notice"
  | "holdback_release"
  | "holdback_lien_expiry"
  | "holdback_notice_window"
  | "wsib_expiry";

export type EntityType = "invoice" | "holdback" | "project" | "wsib_clearance";

export type InvoiceStatus = "draft" | "submitted" | "disputed" | "paid" | "partial" | "overdue";

export interface EngineProject {
  id: string;
  client_id: string;
  name: string;
  payer_type: PayerType;
  holdback_percent: number;
  contract_start_date: ISODate | null;
  substantial_completion_date: ISODate | null;
}

export interface EngineInvoice {
  id: string;
  project_id: string;
  client_id: string;
  number: string;
  amount: number;
  tax: number;
  amount_paid: number;
  status: InvoiceStatus;
  submitted_date: ISODate | null;
  due_date: ISODate | null;
  disputed_date: ISODate | null;
}

export interface EngineHoldback {
  id: string;
  project_id: string;
  client_id: string;
  period_end: ISODate;
  amount_retained: number;
  release_due_date: ISODate | null;
  released: boolean;
}

export interface EngineWsib {
  id: string;
  client_id: string;
  gc_name: string;
  certificate_number: string;
  expiry_date: ISODate;
}

export interface DeadlineCandidate {
  dedupe_key: string;
  rule_id: RuleId;
  type: DeadlineType;
  entity_type: EntityType;
  entity_id: string;
  client_id: string;
  project_id: string | null;
  due_date: ISODate;
  severity: Severity;
  title: string;
  amount: number | null;
}

export interface EngineInput {
  today: ISODate;
  projects: EngineProject[];
  invoices: EngineInvoice[];
  holdbacks: EngineHoldback[];
  wsib: EngineWsib[];
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Computes the date a rule lands on, given its trigger date. */
export function applyRule(ruleId: RuleId, trigger: ISODate): ISODate {
  const rule = getRule(ruleId);
  if (rule.dayType === "business") return addBusinessDays(trigger, rule.offsetDays);
  const raw = addCalendarDays(trigger, rule.offsetDays);
  return rule.rollForward ? rollForwardToBusinessDay(raw) : raw;
}

export function paymentRuleFor(payer: PayerType): RuleId {
  return payer === "owner" ? "owner_payment_window" : "contractor_payment_window";
}

export function disputeRuleFor(payer: PayerType): RuleId {
  return payer === "owner" ? "owner_notice_of_non_payment" : "contractor_notice_of_non_payment";
}

/** Statutory payment due date for an invoice submitted on `submitted`. */
export function invoiceDueDate(submitted: ISODate, payer: PayerType): ISODate {
  return applyRule(paymentRuleFor(payer), submitted);
}

/** Last day the payer can deliver a notice of non-payment. */
export function disputeWindowCloses(submitted: ISODate, payer: PayerType): ISODate {
  return applyRule(disputeRuleFor(payer), submitted);
}

/**
 * Amount currently payable on an invoice: total less the holdback the payer is
 * entitled to retain (on the pre-tax amount) less what has been paid.
 */
export function invoiceBalance(
  inv: Pick<EngineInvoice, "amount" | "tax" | "amount_paid" | "status">,
  holdbackPercent: number,
): number {
  if (inv.status === "paid" || inv.status === "draft") return 0;
  const retained = (inv.amount * holdbackPercent) / 100;
  return Math.max(0, round2(inv.amount + inv.tax - retained - inv.amount_paid));
}

export function severityFor(due: ISODate, today: ISODate): Severity {
  const days = diffDays(today, due);
  if (days < 0) return "overdue";
  if (days <= 3) return "critical";
  if (days <= DRAFT_LOOKAHEAD_DAYS) return "warning";
  return "info";
}

/** Invoices whose status should flip to "overdue" today. */
export function findOverdueInvoices(
  invoices: EngineInvoice[],
  projects: EngineProject[],
  today: ISODate,
): string[] {
  const byId = new Map(projects.map((p) => [p.id, p]));
  return invoices
    .filter((inv) => {
      if (inv.status !== "submitted" && inv.status !== "partial") return false;
      const project = byId.get(inv.project_id);
      if (!project || !inv.submitted_date) return false;
      const due = inv.due_date ?? invoiceDueDate(inv.submitted_date, project.payer_type);
      return compareDates(due, today) < 0 && invoiceBalance(inv, project.holdback_percent) > 0;
    })
    .map((inv) => inv.id);
}

export interface AnnualHoldbackCycle {
  anniversary: ISODate;
  noticeDue: ISODate;
  ownerPaymentDue: ISODate;
  subcontractReleaseDue: ISODate;
}

/**
 * Base date anniversaries are counted from. Contracts entered before the 2026
 * regime start count from the regime start (first release falls in 2027).
 */
export function annualHoldbackBase(contractStart: ISODate): ISODate {
  return compareDates(contractStart, ANNUAL_HOLDBACK_REGIME_START) < 0
    ? ANNUAL_HOLDBACK_REGIME_START
    : contractStart;
}

export function annualHoldbackCycle(contractStart: ISODate, year: number): AnnualHoldbackCycle {
  const anniversary = addYears(annualHoldbackBase(contractStart), year);
  const noticeDue = applyRule("annual_holdback_notice", anniversary);
  const ownerPaymentDue = applyRule("annual_holdback_owner_payment", noticeDue);
  const subcontractReleaseDue = applyRule("annual_holdback_subcontract_release", ownerPaymentDue);
  return { anniversary, noticeDue, ownerPaymentDue, subcontractReleaseDue };
}

function cycleReleaseDate(cycle: AnnualHoldbackCycle, payer: PayerType): ISODate {
  return payer === "owner" ? cycle.ownerPaymentDue : cycle.subcontractReleaseDue;
}

/** The first annual cycle whose anniversary is on or after `onOrAfter`. */
export function annualCycleCovering(contractStart: ISODate, onOrAfter: ISODate): AnnualHoldbackCycle {
  for (let year = 1; year < 200; year += 1) {
    const cycle = annualHoldbackCycle(contractStart, year);
    if (compareDates(cycle.anniversary, onOrAfter) >= 0) return cycle;
  }
  throw new Error("Annual holdback cycle out of range");
}

export interface LienSchedule {
  noticeWindowCloses: ISODate;
  lienExpiry: ISODate;
  releaseDue: ISODate;
}

export function lienSchedule(substantialCompletion: ISODate): LienSchedule {
  const lienExpiry = applyRule("lien_period", substantialCompletion);
  return {
    noticeWindowCloses: applyRule("holdback_notice_of_non_payment", substantialCompletion),
    lienExpiry,
    releaseDue: applyRule("holdback_release_after_lien", lienExpiry),
  };
}

/**
 * When a holdback retained for a period becomes payable to the subcontractor:
 * after the lien period if substantial completion is known, otherwise in the
 * annual release cycle that follows the end of the period. Whichever is
 * earlier wins.
 */
export function holdbackReleaseDue(
  project: Pick<EngineProject, "payer_type" | "contract_start_date" | "substantial_completion_date">,
  periodEnd: ISODate,
): ISODate | null {
  const options: ISODate[] = [];
  if (project.substantial_completion_date) {
    options.push(lienSchedule(project.substantial_completion_date).releaseDue);
  }
  if (project.contract_start_date) {
    options.push(cycleReleaseDate(annualCycleCovering(project.contract_start_date, periodEnd), project.payer_type));
  }
  if (options.length === 0) return null;
  return options.sort(compareDates)[0] ?? null;
}

export interface WsibStatus {
  ruleId: RuleId | null;
  severity: Severity | null;
  daysToExpiry: number;
}

export function wsibStatus(expiry: ISODate, today: ISODate): WsibStatus {
  const daysToExpiry = diffDays(today, expiry);
  if (daysToExpiry < 0) return { ruleId: "wsib_expired", severity: "overdue", daysToExpiry };
  const thresholds: Array<[RuleId, Severity]> = [
    ["wsib_expiry_3", "critical"],
    ["wsib_expiry_14", "warning"],
    ["wsib_expiry_30", "info"],
  ];
  for (const [ruleId, severity] of thresholds) {
    if (compareDates(today, applyRule(ruleId, expiry)) >= 0) return { ruleId, severity, daysToExpiry };
  }
  return { ruleId: null, severity: null, daysToExpiry };
}

const OPEN_STATUSES: InvoiceStatus[] = ["submitted", "partial", "overdue", "disputed"];

export function computeDeadlines(input: EngineInput): DeadlineCandidate[] {
  const { today } = input;
  const projects = new Map(input.projects.map((p) => [p.id, p]));
  const out: DeadlineCandidate[] = [];

  for (const inv of input.invoices) {
    const project = projects.get(inv.project_id);
    if (!project || !inv.submitted_date || !OPEN_STATUSES.includes(inv.status)) continue;
    const balance = invoiceBalance(inv, project.holdback_percent);

    if (balance > 0 && inv.status !== "disputed") {
      const ruleId = paymentRuleFor(project.payer_type);
      const due = inv.due_date ?? applyRule(ruleId, inv.submitted_date);
      out.push({
        dedupe_key: `${ruleId}:invoice:${inv.id}`,
        rule_id: ruleId,
        type: "invoice_payment",
        entity_type: "invoice",
        entity_id: inv.id,
        client_id: inv.client_id,
        project_id: project.id,
        due_date: due,
        severity: severityFor(due, today),
        title: `Invoice ${inv.number} payment due`,
        amount: balance,
      });
    }

    if (!inv.disputed_date) {
      const ruleId = disputeRuleFor(project.payer_type);
      const closes = applyRule(ruleId, inv.submitted_date);
      if (compareDates(closes, today) >= 0) {
        out.push({
          dedupe_key: `${ruleId}:invoice:${inv.id}`,
          rule_id: ruleId,
          type: "invoice_dispute_window",
          entity_type: "invoice",
          entity_id: inv.id,
          client_id: inv.client_id,
          project_id: project.id,
          due_date: closes,
          severity: "info",
          title: `Notice of non-payment window closes for ${inv.number}`,
          amount: null,
        });
      }
      const objection = applyRule("proper_invoice_objection", inv.submitted_date);
      if (compareDates(objection, today) >= 0) {
        out.push({
          dedupe_key: `proper_invoice_objection:invoice:${inv.id}`,
          rule_id: "proper_invoice_objection",
          type: "proper_invoice_objection",
          entity_type: "invoice",
          entity_id: inv.id,
          client_id: inv.client_id,
          project_id: project.id,
          due_date: objection,
          severity: "info",
          title: `Invoice ${inv.number} deemed proper unless objected to`,
          amount: null,
        });
      }
    }

    if (inv.status === "disputed" && inv.disputed_date) {
      const due = applyRule("adjudication_referral", inv.disputed_date);
      out.push({
        dedupe_key: `adjudication_referral:invoice:${inv.id}`,
        rule_id: "adjudication_referral",
        type: "adjudication",
        entity_type: "invoice",
        entity_id: inv.id,
        client_id: inv.client_id,
        project_id: project.id,
        due_date: due,
        severity: severityFor(due, today),
        title: `Adjudication referral window for ${inv.number}`,
        amount: round2(inv.amount + inv.tax - inv.amount_paid),
      });
    }
  }

  for (const hb of input.holdbacks) {
    const project = projects.get(hb.project_id);
    if (!project || hb.released || hb.amount_retained <= 0) continue;
    const due = hb.release_due_date ?? holdbackReleaseDue(project, hb.period_end);
    if (!due) continue;
    out.push({
      dedupe_key: `holdback_release:holdback:${hb.id}`,
      rule_id: project.substantial_completion_date
        ? "holdback_release_after_lien"
        : project.payer_type === "owner"
          ? "annual_holdback_owner_payment"
          : "annual_holdback_subcontract_release",
      type: "holdback_release",
      entity_type: "holdback",
      entity_id: hb.id,
      client_id: hb.client_id,
      project_id: project.id,
      due_date: due,
      severity: severityFor(due, today),
      title: `Holdback release due on ${project.name}`,
      amount: hb.amount_retained,
    });
  }

  for (const project of input.projects) {
    if (project.substantial_completion_date) {
      const s = lienSchedule(project.substantial_completion_date);
      if (compareDates(s.noticeWindowCloses, today) >= 0) {
        out.push({
          dedupe_key: `holdback_notice_of_non_payment:project:${project.id}`,
          rule_id: "holdback_notice_of_non_payment",
          type: "holdback_notice_window",
          entity_type: "project",
          entity_id: project.id,
          client_id: project.client_id,
          project_id: project.id,
          due_date: s.noticeWindowCloses,
          severity: "info",
          title: `Notice of non-payment of holdback window closes on ${project.name}`,
          amount: null,
        });
      }
      if (compareDates(s.lienExpiry, today) >= 0) {
        out.push({
          dedupe_key: `lien_period:project:${project.id}`,
          rule_id: "lien_period",
          type: "holdback_lien_expiry",
          entity_type: "project",
          entity_id: project.id,
          client_id: project.client_id,
          project_id: project.id,
          due_date: s.lienExpiry,
          severity: severityFor(s.lienExpiry, today),
          title: `Lien period expires on ${project.name}`,
          amount: null,
        });
      }
    } else if (project.contract_start_date) {
      const cycle = annualCycleCovering(project.contract_start_date, addCalendarDays(today, -14));
      if (compareDates(cycle.noticeDue, today) >= 0) {
        out.push({
          dedupe_key: `annual_holdback_notice:project:${project.id}:${cycle.anniversary}`,
          rule_id: "annual_holdback_notice",
          type: "holdback_annual_notice",
          entity_type: "project",
          entity_id: project.id,
          client_id: project.client_id,
          project_id: project.id,
          due_date: cycle.noticeDue,
          severity: "info",
          title: `Owner's notice of annual holdback release due on ${project.name}`,
          amount: null,
        });
      }
    }
  }

  for (const cert of input.wsib) {
    const status = wsibStatus(cert.expiry_date, today);
    if (!status.ruleId || !status.severity) continue;
    out.push({
      dedupe_key: `wsib:wsib_clearance:${cert.id}:${cert.expiry_date}`,
      rule_id: status.ruleId,
      type: "wsib_expiry",
      entity_type: "wsib_clearance",
      entity_id: cert.id,
      client_id: cert.client_id,
      project_id: null,
      due_date: cert.expiry_date,
      severity: status.severity,
      title:
        status.daysToExpiry < 0
          ? `WSIB clearance for ${cert.gc_name} expired`
          : `WSIB clearance for ${cert.gc_name} expires in ${status.daysToExpiry} days`,
      amount: null,
    });
  }

  return out.sort((a, b) => compareDates(a.due_date, b.due_date) || a.dedupe_key.localeCompare(b.dedupe_key));
}

export type DraftType = "payment_reminder" | "holdback_release_request" | "wsib_renewal";

/** Which draft (if any) a deadline should produce in the daily sweep. */
export function draftTypeFor(d: DeadlineCandidate, today: ISODate): DraftType | null {
  if (diffDays(today, d.due_date) > DRAFT_LOOKAHEAD_DAYS) return null;
  switch (d.type) {
    case "invoice_payment":
      return "payment_reminder";
    case "holdback_release":
      return "holdback_release_request";
    case "wsib_expiry":
      return "wsib_renewal";
    default:
      return null;
  }
}
