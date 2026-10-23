import "server-only";
import { requireEnv } from "@/lib/env";

export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
  replyTo?: string | null;
}

/**
 * Sends one email through Resend. Only ever called from the approval queue
 * after an agency admin explicitly approves a draft.
 */
export async function sendEmail(email: OutboundEmail): Promise<{ id: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${requireEnv("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: requireEnv("RESEND_FROM_EMAIL"),
      to: [email.to],
      subject: email.subject,
      text: email.text,
      ...(email.replyTo ? { reply_to: email.replyTo } : {}),
    }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok || !data.id) throw new Error(`Resend failed (${res.status}): ${data.message ?? "unknown error"}`);
  return { id: data.id };
}
