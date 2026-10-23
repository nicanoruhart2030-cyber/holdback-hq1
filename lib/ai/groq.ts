import "server-only";
import type { z } from "zod";
import { optionalEnv } from "@/lib/env";
import { parseModelJSON } from "@/lib/ai/minimize";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

/** Tiers whose terms exclude training on and retention of API inputs. */
const ALLOWED_TIERS = new Set(["developer", "enterprise"]);

export class AIUnavailableError extends Error {}

export interface GroqConfig {
  apiKey: string;
  model: string;
}

/**
 * Returns Groq config only when a key is present AND the account is declared
 * as a paid tier. Client documents never go to free-tier models.
 */
export function groqConfig(): GroqConfig | null {
  const apiKey = optionalEnv("GROQ_API_KEY");
  const tier = (optionalEnv("GROQ_ACCOUNT_TIER") ?? "").toLowerCase();
  if (!apiKey || !ALLOWED_TIERS.has(tier)) return null;
  return { apiKey, model: optionalEnv("GROQ_MODEL") ?? DEFAULT_GROQ_MODEL };
}

export function groqUnavailableReason(): string | null {
  if (!optionalEnv("GROQ_API_KEY")) return "GROQ_API_KEY is not set";
  const tier = (optionalEnv("GROQ_ACCOUNT_TIER") ?? "").toLowerCase();
  if (!ALLOWED_TIERS.has(tier)) return "GROQ_ACCOUNT_TIER must be 'developer' or 'enterprise' to process client data";
  return null;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callGroq(cfg: GroqConfig, messages: ChatMessage[], temperature: number): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature,
      response_format: { type: "json_object" },
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq request failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned an empty response");
  return content;
}

/**
 * Calls Groq in JSON mode and validates with zod. On invalid JSON or schema
 * mismatch, retries once with the validation error fed back to the model.
 */
export async function groqJSON<S extends z.ZodTypeAny>(
  schema: S,
  messages: ChatMessage[],
  opts: { temperature?: number } = {},
): Promise<{ data: z.infer<S>; model: string }> {
  const cfg = groqConfig();
  if (!cfg) throw new AIUnavailableError(groqUnavailableReason() ?? "Groq unavailable");
  const temperature = opts.temperature ?? 0;

  let lastError = "";
  let convo = messages;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const raw = await callGroq(cfg, convo, temperature);
    try {
      const parsed = schema.safeParse(parseModelJSON(raw));
      if (parsed.success) return { data: parsed.data, model: cfg.model };
      lastError = parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Invalid JSON";
    }
    convo = [
      ...messages,
      { role: "assistant", content: raw },
      {
        role: "user",
        content: `Your previous reply was rejected: ${lastError}. Reply again with ONLY a valid JSON object matching the requested shape.`,
      },
    ];
  }
  throw new Error(`Groq output failed validation after retry: ${lastError}`);
}
