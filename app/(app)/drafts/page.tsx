import Link from "next/link";
import { approveAndSendDraftAction, rejectDraftAction, saveDraftAction } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { Card, Empty, Field, Notice, Num, PageHeader, StatusBadge, Timestamp } from "@/components/ui";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Client, Draft } from "@/lib/types";

export const metadata = { title: "Approval queue" };

const TYPE_LABEL: Record<Draft["type"], string> = {
  payment_reminder: "Payment reminder",
  holdback_release_request: "Holdback release request",
  wsib_renewal: "WSIB renewal nudge",
};

export default async function DraftsPage() {
  const supabase = createClient();
  const { profile } = await getProfile();
  const isAdmin = profile?.role === "admin";
  const [pending, history, clients] = await Promise.all([
    supabase.from("drafts").select("*").eq("status", "pending").order("created_at").returns<Draft[]>(),
    supabase.from("drafts").select("*").neq("status", "pending").order("updated_at", { ascending: false }).limit(25).returns<Draft[]>(),
    supabase.from("clients").select("id, name").returns<Client[]>(),
  ]);
  const clientName = new Map((clients.data ?? []).map((c) => [c.id, c.name]));
  const queue = pending.data ?? [];
  const resendConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);

  return (
    <>
      <PageHeader
        title="Approval queue"
        description="Nothing is ever sent automatically. Every email below waits for you to edit, approve and send, or reject."
        actions={<span className="text-sm text-muted"><Num>{queue.length}</Num> pending</span>}
      />
      {!resendConfigured ? <div className="mb-5"><Notice tone="warn">Resend is not configured (RESEND_API_KEY, RESEND_FROM_EMAIL). Approving will fail and return the draft to the queue.</Notice></div> : null}

      {queue.length === 0 ? (
        <Card><Empty>The queue is clear. The daily sweep drafts reminders for anything due within 7 days or overdue.</Empty></Card>
      ) : (
        <div className="space-y-5">
          {queue.map((d) => (
            <Card
              key={d.id}
              title={<>{TYPE_LABEL[d.type]} <span className="ml-2 font-normal text-muted">· <Link href={`/clients/${d.client_id}`} className="hover:text-fg">{clientName.get(d.client_id)}</Link></span></>}
              actions={<span className="text-xs text-muted">{d.generated_by === "template" ? "Template" : d.generated_by.replace("groq:", "Groq · ")} · <Timestamp value={d.created_at} /></span>}
            >
              {d.error ? <div className="mb-4"><Notice tone="danger">Last send attempt failed: {d.error}</Notice></div> : null}
              <form className="space-y-4">
                <input type="hidden" name="id" value={d.id} />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="To" hint={!d.to_email ? "No recipient on file. Add the payer's AP email." : d.reply_to ? <>Replies go to <span className="num">{d.reply_to}</span></> : undefined}>
                    <input name="to_email" type="email" required defaultValue={d.to_email ?? ""} className={`input ${d.to_email ? "" : "input-low"}`} readOnly={!isAdmin} />
                  </Field>
                  <Field label="Subject"><input name="subject" required defaultValue={d.subject} className="input" readOnly={!isAdmin} /></Field>
                </div>
                <Field label="Body" hint="The legal disclaimer is re-appended on save if removed.">
                  <textarea name="body" required rows={10} defaultValue={d.body} className="input font-sans leading-relaxed" readOnly={!isAdmin} />
                </Field>
                {isAdmin ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <SubmitButton formAction={approveAndSendDraftAction} pending="Sending" confirm="Send this email now?">Approve and send</SubmitButton>
                    <SubmitButton formAction={saveDraftAction} className="btn-secondary" pending="Saving">Save edits</SubmitButton>
                    <SubmitButton formAction={rejectDraftAction} className="btn-danger" pending="Rejecting">Reject</SubmitButton>
                  </div>
                ) : null}
              </form>
            </Card>
          ))}
        </div>
      )}

      <Card title="Recent decisions" flush className="mt-8">
        {(history.data ?? []).length === 0 ? (
          <Empty>No sent or rejected drafts yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>When</th><th>Type</th><th>Client</th><th>Subject</th><th>To</th><th>Status</th></tr></thead>
              <tbody>
                {(history.data ?? []).map((d) => (
                  <tr key={d.id}>
                    <td className="whitespace-nowrap"><Timestamp value={d.sent_at ?? d.created_at} /></td>
                    <td className="text-muted">{TYPE_LABEL[d.type]}</td>
                    <td className="text-muted">{clientName.get(d.client_id)}</td>
                    <td className="max-w-xs truncate">{d.subject}</td>
                    <td className="text-muted">{d.to_email}</td>
                    <td><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
