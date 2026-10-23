/**
 * VALUES MUST BE VERIFIED BY AN ONTARIO CONSTRUCTION LAWYER BEFORE CLIENT USE.
 *
 * Every legal timing rule used by Holdback HQ lives in this file. The
 * deadline engine (lib/deadlines/engine.ts) reads offsets from here and
 * nowhere else, so a lawyer can review a single table.
 *
 * Defaults reflect the Construction Act, R.S.O. 1990, c. C.30 prompt payment
 * and holdback regime as amended by Bill 216 (2024) and Bill 60 (2025), in
 * force January 1, 2026. Section references are indicative only. Every rule
 * ships with verified: false; flip it only after written legal sign-off.
 *
 * Perspective: our clients are trade subcontractors. "Payer" is whoever the
 * subcontractor invoices (usually the general contractor, sometimes the owner).
 */

export type DayCountType = "calendar" | "business";

export type TriggerEvent =
  | "invoice_submitted"
  | "notice_of_non_payment_received"
  | "contract_anniversary"
  | "annual_holdback_notice_due"
  | "annual_holdback_payment_due"
  | "substantial_completion"
  | "lien_period_expiry"
  | "wsib_expiry";

export type PayerType = "owner" | "contractor";

export type RuleId =
  | "proper_invoice_objection"
  | "owner_payment_window"
  | "owner_notice_of_non_payment"
  | "contractor_payment_window"
  | "contractor_notice_of_non_payment"
  | "adjudication_referral"
  | "annual_holdback_notice"
  | "annual_holdback_owner_payment"
  | "annual_holdback_subcontract_release"
  | "lien_period"
  | "holdback_notice_of_non_payment"
  | "holdback_release_after_lien"
  | "wsib_expiry_30"
  | "wsib_expiry_14"
  | "wsib_expiry_3"
  | "wsib_expired";

export interface ConstructionActRule {
  id: RuleId;
  /** Short plain-language name shown in the UI. */
  label: string;
  description: string;
  trigger: TriggerEvent;
  /** Days from the trigger. Negative values count backward (warnings before an event). */
  offsetDays: number;
  dayType: DayCountType;
  /**
   * When a calendar-day deadline lands on a weekend or Ontario holiday, move it
   * to the next business day (Legislation Act, 2006, s. 89). Never applied to
   * advance warnings.
   */
  rollForward: boolean;
  /** Which payer relationship the rule applies to; omitted means both. */
  appliesTo?: PayerType;
  sourceNote: string;
  verified: boolean;
}

export const RULES = [
  {
    id: "proper_invoice_objection",
    label: "Invoice objection window",
    description:
      "Payer must object in writing that an invoice is not a proper invoice; otherwise it is deemed proper.",
    trigger: "invoice_submitted",
    offsetDays: 7,
    dayType: "calendar",
    rollForward: true,
    sourceNote: "Construction Act s. 6.1 / 6.3 as amended by Bill 60 (in force 2026-01-01).",
    verified: false,
  },
  {
    id: "owner_payment_window",
    label: "Owner payment due",
    description: "Owner must pay a proper invoice no later than 28 days after receiving it.",
    trigger: "invoice_submitted",
    offsetDays: 28,
    dayType: "calendar",
    rollForward: true,
    appliesTo: "owner",
    sourceNote: "Construction Act s. 6.4(1).",
    verified: false,
  },
  {
    id: "owner_notice_of_non_payment",
    label: "Owner dispute window",
    description:
      "Owner disputing a proper invoice must give a notice of non-payment (Form 1) within 14 days of receiving it.",
    trigger: "invoice_submitted",
    offsetDays: 14,
    dayType: "calendar",
    rollForward: true,
    appliesTo: "owner",
    sourceNote: "Construction Act s. 6.4(2)-(3); O. Reg. 304/18 Form 1.",
    verified: false,
  },
  {
    id: "contractor_payment_window",
    label: "GC payment due",
    description:
      "Contractor must pay a subcontractor within 7 days of being paid by the owner; outer bound modelled as 35 days after the subcontractor's proper invoice (28 + 7).",
    trigger: "invoice_submitted",
    offsetDays: 35,
    dayType: "calendar",
    rollForward: true,
    appliesTo: "contractor",
    sourceNote:
      "Construction Act s. 6.5(1)-(2). Assumes the contractor bundles the sub's invoice into its own proper invoice promptly.",
    verified: false,
  },
  {
    id: "contractor_notice_of_non_payment",
    label: "GC dispute window",
    description:
      "Contractor withholding payment from a subcontractor must give a notice of non-payment (Forms 2/3/5) within the payment window; outer bound modelled as 35 days after the subcontractor's proper invoice.",
    trigger: "invoice_submitted",
    offsetDays: 35,
    dayType: "calendar",
    rollForward: true,
    appliesTo: "contractor",
    sourceNote: "Construction Act s. 6.5(4)-(7); O. Reg. 304/18 Forms 2, 3 and 5.",
    verified: false,
  },
  {
    id: "adjudication_referral",
    label: "Adjudication window",
    description:
      "A payer that gives notice of non-payment undertakes to refer the dispute to adjudication within 21 days; if it does not, the subcontractor should consider referring it.",
    trigger: "notice_of_non_payment_received",
    offsetDays: 21,
    dayType: "calendar",
    rollForward: true,
    sourceNote:
      "Construction Act s. 6.4(3), 6.5(6), Part II.1. Bill 60 permits adjudication after contract completion.",
    verified: false,
  },
  {
    id: "annual_holdback_notice",
    label: "Annual holdback notice",
    description:
      "Owner must publish a notice of annual release of holdback within 14 days after each contract anniversary.",
    trigger: "contract_anniversary",
    offsetDays: 14,
    dayType: "calendar",
    rollForward: true,
    sourceNote:
      "Construction Act s. 26.2 as amended by Bill 60 (in force 2026-01-01). Contracts entered before 2026 measure anniversaries from 2026-01-01 (first release in 2027).",
    verified: false,
  },
  {
    id: "annual_holdback_owner_payment",
    label: "Annual holdback paid by owner",
    description:
      "Owner pays annual holdback between 60 and 74 days after publishing the notice of annual release; latest date modelled.",
    trigger: "annual_holdback_notice_due",
    offsetDays: 74,
    dayType: "calendar",
    rollForward: true,
    sourceNote: "Construction Act s. 26.2 as amended by Bill 60; O. Reg. 264/25-267/25.",
    verified: false,
  },
  {
    id: "annual_holdback_subcontract_release",
    label: "Annual holdback paid to you",
    description:
      "Each contractor and subcontractor tier must release accrued holdback within 14 days of receiving its annual holdback payment.",
    trigger: "annual_holdback_payment_due",
    offsetDays: 14,
    dayType: "calendar",
    rollForward: true,
    appliesTo: "contractor",
    sourceNote: "Construction Act s. 26.2 as amended by Bill 60.",
    verified: false,
  },
  {
    id: "lien_period",
    label: "Lien period ends",
    description:
      "Lien rights expire 60 days after publication of the certificate of substantial performance (modelled from the substantial completion date).",
    trigger: "substantial_completion",
    offsetDays: 60,
    dayType: "calendar",
    rollForward: true,
    sourceNote: "Construction Act s. 31(2)-(3), 32.",
    verified: false,
  },
  {
    id: "holdback_notice_of_non_payment",
    label: "Holdback dispute window",
    description:
      "Owner refusing to release holdback must publish a notice of non-payment of holdback within 40 days after the certificate of substantial performance.",
    trigger: "substantial_completion",
    offsetDays: 40,
    dayType: "calendar",
    rollForward: true,
    sourceNote: "Construction Act s. 27.1; O. Reg. 304/18 Form 7.",
    verified: false,
  },
  {
    id: "holdback_release_after_lien",
    label: "Holdback release due",
    description: "Basic holdback becomes payable 14 days after the lien period expires.",
    trigger: "lien_period_expiry",
    offsetDays: 14,
    dayType: "calendar",
    rollForward: true,
    sourceNote: "Construction Act s. 26.1, 27.",
    verified: false,
  },
  {
    id: "wsib_expiry_30",
    label: "WSIB expires in 30 days",
    description: "WSIB clearance certificate expires in 30 days.",
    trigger: "wsib_expiry",
    offsetDays: -30,
    dayType: "calendar",
    rollForward: false,
    sourceNote: "Workplace Safety and Insurance Act, 1997 s. 141; certificates are valid for a fixed term.",
    verified: false,
  },
  {
    id: "wsib_expiry_14",
    label: "WSIB expires in 14 days",
    description: "WSIB clearance certificate expires in 14 days.",
    trigger: "wsib_expiry",
    offsetDays: -14,
    dayType: "calendar",
    rollForward: false,
    sourceNote: "Workplace Safety and Insurance Act, 1997 s. 141.",
    verified: false,
  },
  {
    id: "wsib_expiry_3",
    label: "WSIB expires in 3 days",
    description: "WSIB clearance certificate expires in 3 days.",
    trigger: "wsib_expiry",
    offsetDays: -3,
    dayType: "calendar",
    rollForward: false,
    sourceNote: "Workplace Safety and Insurance Act, 1997 s. 141.",
    verified: false,
  },
  {
    id: "wsib_expired",
    label: "WSIB expired",
    description: "WSIB clearance certificate has expired; the payer may withhold payment until renewed.",
    trigger: "wsib_expiry",
    offsetDays: 0,
    dayType: "calendar",
    rollForward: false,
    sourceNote: "Workplace Safety and Insurance Act, 1997 s. 141(1)-(3).",
    verified: false,
  },
] as const satisfies readonly ConstructionActRule[];

export const RULES_BY_ID: Record<RuleId, ConstructionActRule> = Object.fromEntries(
  RULES.map((r) => [r.id, r]),
) as Record<RuleId, ConstructionActRule>;

export function getRule(id: RuleId): ConstructionActRule {
  return RULES_BY_ID[id];
}

/** Plain-language label for a stored rule id (falls back to the id). */
export function ruleLabel(id: string): string {
  return (RULES_BY_ID as Record<string, ConstructionActRule | undefined>)[id]?.label ?? id;
}

/** Default holdback percentage (Construction Act s. 22). */
export const DEFAULT_HOLDBACK_PERCENT = 10;

/** Annual holdback regime start date for contracts entered before it. */
export const ANNUAL_HOLDBACK_REGIME_START = "2026-01-01";

/** Days ahead (inclusive) that the daily sweep drafts reminders for. */
export const DRAFT_LOOKAHEAD_DAYS = 7;

/** Days ahead used for the dashboard and "upcoming" severity. */
export const UPCOMING_WINDOW_DAYS = 14;

/** Days a prospect's Cash Leak Scan data is kept before automatic deletion. */
export const SCAN_RETENTION_DAYS = 30;
