import type { DraftType } from "@/lib/deadlines/engine";
import { formatCAD, formatDate } from "@/lib/format";

/** Facts handed to the drafter. Only what the email needs; no document content. */
export interface DraftContext {
  sender_company: string;
  sender_contact: string | null;
  recipient_name: string;
  project_name: string;
  project_address: string | null;
  invoice_number?: string;
  amount?: number | null;
  due_date: string;
  days_overdue: number;
  certificate_number?: string;
}

function signOff(ctx: DraftContext): string {
  return ctx.sender_contact ? `Regards,\n${ctx.sender_contact}\n${ctx.sender_company}` : `Regards,\n${ctx.sender_company}`;
}

export function buildTemplateDraft(type: DraftType, ctx: DraftContext): { subject: string; body: string } {
  const amount = formatCAD(ctx.amount ?? null);
  const due = formatDate(ctx.due_date);
  const when =
    ctx.days_overdue > 0 ? `was due on ${due} and is now ${ctx.days_overdue} days past due` : `is due on ${due}`;

  switch (type) {
    case "payment_reminder":
      return {
        subject: `Payment ${ctx.days_overdue > 0 ? "overdue" : "reminder"}: invoice ${ctx.invoice_number ?? ""} – ${ctx.project_name}`.replace(/\s+/g, " "),
        body: [
          `Hello ${ctx.recipient_name} team,`,
          `Our invoice ${ctx.invoice_number ?? ""} for ${ctx.project_name} (${amount} currently payable, net of holdback) ${when}.`,
          `We have not received a notice of non-payment for this invoice. Please confirm the payment date, or let us know of any issue with the invoice so we can resolve it promptly.`,
          signOff(ctx),
        ].join("\n\n"),
      };
    case "holdback_release_request":
      return {
        subject: `Holdback release request – ${ctx.project_name}`,
        body: [
          `Hello ${ctx.recipient_name} team,`,
          `Holdback of ${amount} retained on our work at ${ctx.project_name}${ctx.project_address ? ` (${ctx.project_address})` : ""} ${when} for release under the applicable holdback timelines.`,
          `Please confirm the release date and amount, and advise whether any notice of non-payment of holdback has been published for this project.`,
          signOff(ctx),
        ].join("\n\n"),
      };
    case "wsib_renewal":
      return {
        subject: `WSIB clearance renewal needed – ${ctx.recipient_name}`,
        body: [
          `Hello ${ctx.sender_contact ?? ctx.sender_company},`,
          `The WSIB clearance certificate ${ctx.certificate_number ?? ""} on file for work with ${ctx.recipient_name} ${
            ctx.days_overdue > 0 ? `expired on ${due}` : `expires on ${due}`
          }. Payers may hold payment while a clearance is not current.`,
          `Please request a renewed clearance through WSIB online services and send us the new certificate so we can forward it to ${ctx.recipient_name}.`,
          `Regards,\nHoldback HQ`,
        ].join("\n\n"),
      };
  }
}
