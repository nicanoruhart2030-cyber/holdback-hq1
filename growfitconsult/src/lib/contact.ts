/** Shared by the form (client) and the API route (server). */

export const SERVICE_VALUES = ["mna", "ops", "core", "ai", "other"] as const;
export type ServiceValue = (typeof SERVICE_VALUES)[number];

export type ContactPayload = {
  name: string;
  company: string;
  email: string;
  service: ServiceValue | "";
  message: string;
  /** honeypot: real visitors never fill this */
  website: string;
  locale: "en" | "es";
};

export type FieldErrors = Partial<Record<"name" | "email" | "message", true>>;

export const LIMITS = { name: 120, company: 160, email: 200, message: 5000 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validate(p: Pick<ContactPayload, "name" | "email" | "message">): FieldErrors {
  const errors: FieldErrors = {};
  if (!p.name.trim() || p.name.length > LIMITS.name) errors.name = true;
  if (!EMAIL_RE.test(p.email.trim()) || p.email.length > LIMITS.email) errors.email = true;
  if (p.message.trim().length < 10 || p.message.length > LIMITS.message) errors.message = true;
  return errors;
}

export const SERVICE_LABELS_EN: Record<ServiceValue, string> = {
  mna: "M&A and post-merger integration",
  ops: "Operations transformation",
  core: "Core banking modernization",
  ai: "AI strategy and adoption",
  other: "Something else",
};
