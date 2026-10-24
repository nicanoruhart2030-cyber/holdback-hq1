import Link from "next/link";
import { approveAndSendDraftAction, rejectDraftAction, saveDraftAction } from "../actions";
import { Disclosure } from "@/components/disclosure";
import { SubmitButton } from "@/components/submit-button";
import { Card, DateText, Empty, Field, Money, Notice, Num, PageHeader, StatusBadge, Timestamp } from "@/components/ui";
import { getProfile } from "@/lib/auth";
import { optionalEnv } from "@/lib/env";
import { todayInToronto } from "@/lib/format";
import { diffDays } from "@/lib/rules/calendar";
import { ruleLabel } from "@/lib/rules/ontario-construction-act";
import { createClient } from "@/lib/supabase/server";
import type { Client, Deadline, Draft } from "@/lib/types";

export const metadata = { title: "Approval queue" };

const TYPE_LABEL: Record<Draft["type"], string> = {
  payment_reminder: "Payment reminder",
  holdback_release_request: "Holdback release request",
  wsib_renewal: "WSIB renewal",
};

export default async function DraftsPage({ searchParams }: { searchParams: { id?: string } }) {
  const supabase = createClient();
  const today = todayInToronto();
  const { profile } = await getProfile();
  const isAdmin = profile?.role === "admin";
  const [pending, history, clients] = await Promise.all([
    supabase.from("drafts").select("*").eq("status", "pending").order("created_at").returns<Draft[]>(),
    supabase.from("drafts").select("*").neq("status", "pending").order("updated_at", { ascending: false }).limit(25).returns<Draft[]>(),
    supabase.from("clients").select("id, name").returns<Client[]>(),
  ]);
  const queue = pending.data ?? [];
  const deadlineIds = queue.map((d) => d.deadline_id).filter((x): x is string => Boolean(x));
  const { data: deadlines } = deadlineIds.length
    ? await supabase.from("deadlines").select("*").in("id", deadlineIds).returns<Deadline[]>()
    : { data: [] as Deadline[] };
  const deadlineById = new Map((deadlines ?? []).map((d) => [d.id, d]));
  const clientName = new Map((clients.data ?? []).map((c) => [c.id, c.name]));
  const selected = queue.find((d) => d.id === searchParams.id) ?? queue[0];
  const resendConfigured = Boolean(optionalEnv("RESEND_API_KEY") && optionalEnv("RESEND_FROM_EMAIL"));

  return (
    <>
      <PageHeader
        title="Approval queue"
        description="Nothing is sent automatically. Read each drafted email, edit it if needed, then send or reject it."
        actions={<span className="text-sm text-muted"><Num className="text-fg">{queue.length}</Num> waiting</span>}
      />
      {!resendConfigured ? (
        <div className="mb-5">
          <Notice tone="warn">Email sending is not set up (RESEND_API_KEY, RESEND_FROM_EMAIL). Sending will fail and keep the draft in the queue.</Notice>
        </div>
      ) : null}

      {!selected ? (
        <Card>
          <Empty>The queue is clear. Each morning the sweep drafts reminders for anything due within 7 days or overdue.</Empty>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
          <nav aria-label="Drafts" className="card max-h-[calc(100vh-220px)] self-start overflow-y-auto lg:sticky lg:top-8">
            <ul className="divide-y divide-line">
              {queue.map((d) => {
                const dl = d.deadline_id ? deadlineById.get(d.deadline_id) : undefined;
                const days = dl ? diffDays(dl.due_date, today) : 0;
                const active = d.id === selected.id;
                return (
                  <li key={d.id}>
                    <Link
                      href={`/drafts?id=${d.id}`}
                      aria-current={active ? "true" : undefined}
                      className={`block border-l-2 px-4 py-3 transition-colors ${active ? "border-accent bg-raised" : "border-transparent hover:bg-raised/50"}`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm text-fg">{clientName.get(d.client_id)}</span>
                        {dl?.amount ? <Money value={Number(dl.amount)} whole className="shrink-0 text-xs text-muted" /> : null}
                      </div>
                      <div className="mt-0.5 flex items-baseline justify-between gap-3 text-xs">
                        <span className="truncate text-muted">{TYPE_LABEL[d.type]}</span>
                        {dl ? (
                          <span className={`num shrink-0 ${days > 0 ? "text-danger" : "text-muted"}`}>{days > 0 ? `${days}d late` : days === 0 ? "today" : `in ${-days}d`}</span>
                        ) : null}
                      </div>
                      {d.error ? <div className="mt-1 text-xs text-danger">Last send failed</div> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <DraftEditor
            draft={selected}
            deadline={selected.deadline_id ? deadlineById.get(selected.deadline_id) : undefined}
            clientName={clientName.get(selected.client_id) ?? ""}
            isAdmin={isAdmin}
            today={today}
          />
        </div>
      )}

      <div className="mt-8">
        <Disclosure title="Recent decisions" hint={`${(history.data ?? []).length} sent or rejected`}>
          {(history.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">No sent or rejected drafts yet.</p>
          ) : (
            <div className="-m-5 overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>When</th><th>Type</th><th>Client</th><th>Subject</th><th>To</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {(history.data ?? []).map((d) => (
                    <tr key={d.id}>
                      <td><Timestamp value={d.sent_at ?? d.created_at} /></td>
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
        </Disclosure>
      </div>
    </>
  );
}

function DraftEditor({
  draft,
  deadline,
  clientName,
  isAdmin,
  today,
}: {
  draft: Draft;
  deadline: Deadline | undefined;
  clientName: string;
  isAdmin: boolean;
  today: string;
}) {
  const days = deadline ? diffDays(deadline.due_date, today) : null;
  return (
    <section className="card min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <div className="label">{TYPE_LABEL[draft.type]}</div>
          <h2 className="mt-1 truncate text-base font-semibold">{deadline?.title ?? draft.subject}</h2>
          <div className="mt-1 text-xs text-muted">
            For {clientName}
            {deadline ? <> · {ruleLabel(deadline.rule_id)}</> : null} · drafted by {draft.generated_by === "template" ? "template" : draft.generated_by.replace("groq:", "Groq ")}{" "}
            <Timestamp value={draft.created_at} />
          </div>
        </div>
        {deadline ? (
          <dl className="flex gap-6 text-right">
            {deadline.amount ? (
              <div>
                <dt className="label">Amount</dt>
                <dd className="mt-1"><Money value={Number(deadline.amount)} /></dd>
              </div>
            ) : null}
            <div>
              <dt className="label">Due</dt>
              <dd className="mt-1">
                <DateText value={deadline.due_date} className={days !== null && days > 0 ? "text-danger" : ""} />
                {days !== null && days > 0 ? <div className="num text-xs text-danger">{days} days late</div> : null}
              </dd>
            </div>
          </dl>
        ) : null}
      </div>

      {/* Keyed so the uncontrolled fields reset when another draft is selected. */}
      <form key={draft.id} className="space-y-4 p-5">
        {draft.error ? <Notice tone="danger">Last send attempt failed: {draft.error}</Notice> : null}
        <input type="hidden" name="id" value={draft.id} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="To"
            hint={!draft.to_email ? "No address on file. Add the payer's accounts-payable email." : draft.reply_to ? <>Replies go to <span className="num">{draft.reply_to}</span></> : undefined}
          >
            <input name="to_email" type="email" required defaultValue={draft.to_email ?? ""} className={`input ${draft.to_email ? "" : "input-low"}`} readOnly={!isAdmin} />
          </Field>
          <Field label="Subject">
            <input name="subject" required defaultValue={draft.subject} className="input" readOnly={!isAdmin} />
          </Field>
        </div>
        <Field label="Message" hint="The closing line saying this is not legal advice is always kept.">
          <textarea name="body" required rows={14} defaultValue={draft.body} className="input leading-relaxed" readOnly={!isAdmin} />
        </Field>
        {isAdmin ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <div className="flex gap-2">
              <SubmitButton formAction={approveAndSendDraftAction} pending="Sending" confirm={`Send this email to ${draft.to_email ?? "the recipient"} now?`}>
                Approve and send
              </SubmitButton>
              <SubmitButton formAction={saveDraftAction} className="btn-secondary" pending="Saving">
                Save edits
              </SubmitButton>
            </div>
            <SubmitButton formAction={rejectDraftAction} className="btn-danger" pending="Rejecting" noValidate>
              Reject
            </SubmitButton>
          </div>
        ) : null}
      </form>
    </section>
  );
}
