import "server-only";
import { AIUnavailableError, groqJSON } from "@/lib/ai/groq";
import { ensureDisclaimer } from "@/lib/ai/minimize";
import { draftSchema } from "@/lib/ai/schemas";
import type { DraftType } from "@/lib/deadlines/engine";
import { buildTemplateDraft, type DraftContext } from "@/lib/drafts/templates";

const SYSTEM = `You write short, firm, professional emails for Ontario construction trade subcontractors.
Write from the subcontractor's perspective (first person plural, "we"), addressed to the payer.
Tone: courteous, direct, no threats, no exclamation marks, no emoji, Canadian English.
Reference the invoice/project facts given. You may refer to the Construction Act prompt payment
or holdback timelines in general terms, but do not cite section numbers or give legal conclusions.
Keep the body under 180 words, plain text, with a greeting and a sign-off using the sender name.
Return ONLY JSON: {"subject": string, "body": string}.`;

/**
 * Drafts an email with Groq. Falls back to a deterministic template when AI is
 * unavailable or fails. Either way the disclaimer is appended.
 */
export async function generateDraft(
  type: DraftType,
  ctx: DraftContext,
): Promise<{ subject: string; body: string; generatedBy: string }> {
  try {
    const { data, model } = await groqJSON(
      draftSchema,
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Email type: ${type}\nFacts (JSON): ${JSON.stringify(ctx)}` },
      ],
      { temperature: 0.3 },
    );
    return { subject: data.subject, body: ensureDisclaimer(data.body), generatedBy: `groq:${model}` };
  } catch (err) {
    if (!(err instanceof AIUnavailableError)) console.error("Draft generation fell back to template", err);
    const t = buildTemplateDraft(type, ctx);
    return { subject: t.subject, body: ensureDisclaimer(t.body), generatedBy: "template" };
  }
}
