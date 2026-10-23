import type { InvoiceStatus, Severity } from "@/lib/deadlines/engine";
import type { PayerType } from "@/lib/rules/ontario-construction-act";

export type PlanTier = "solo" | "crew" | "pro";
export type ClientStatus = "onboarding" | "active" | "paused" | "churned";
export type DraftStatus = "pending" | "approved" | "sent" | "rejected";
export type WsibRowStatus = "valid" | "expiring" | "expired";

export interface Client {
  id: string;
  name: string;
  trade: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  plan_tier: PlanTier;
  monthly_fee: number;
  status: ClientStatus;
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  gc_name: string;
  gc_contact_email: string | null;
  payer_type: PayerType;
  address: string | null;
  contract_value: number;
  holdback_percent: number;
  contract_start_date: string | null;
  substantial_completion_date: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  project_id: string;
  client_id: string;
  number: string;
  amount: number;
  tax: number;
  issue_date: string | null;
  submitted_date: string | null;
  due_date: string | null;
  disputed_date: string | null;
  status: InvoiceStatus;
  amount_paid: number;
  source_file_path: string | null;
  extraction_confidence: number | null;
  notes: string | null;
  created_at: string;
}

export interface Holdback {
  id: string;
  project_id: string;
  client_id: string;
  period_start: string;
  period_end: string;
  amount_retained: number;
  release_due_date: string | null;
  released: boolean;
  released_date: string | null;
}

export interface WsibClearance {
  id: string;
  client_id: string;
  gc_name: string;
  certificate_number: string;
  issue_date: string;
  expiry_date: string;
  status: WsibRowStatus;
}

export interface Deadline {
  id: string;
  dedupe_key: string;
  rule_id: string;
  type: string;
  entity_type: string;
  entity_id: string;
  client_id: string;
  project_id: string | null;
  due_date: string;
  severity: Severity;
  title: string;
  amount: number | null;
  resolved: boolean;
}

export interface Draft {
  id: string;
  type: "payment_reminder" | "holdback_release_request" | "wsib_renewal";
  client_id: string;
  deadline_id: string | null;
  dedupe_key: string;
  to_email: string | null;
  reply_to: string | null;
  subject: string;
  body: string;
  status: DraftStatus;
  related_entity_type: string;
  related_entity_id: string;
  generated_by: string;
  sent_at: string | null;
  error: string | null;
  created_at: string;
}

export interface Scan {
  id: string;
  prospect_name: string;
  prospect_company: string | null;
  prospect_email: string | null;
  status: "processing" | "ready" | "failed";
  report: import("@/lib/scan/report").ScanReport | null;
  expires_at: string | null;
  converted_client_id: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  role: "admin" | "client";
  client_id: string | null;
}

/** Supabase returns numeric columns as strings; normalize to numbers. */
export function num(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}
