import { NextResponse } from "next/server";
import { LIMITS, SERVICE_LABELS_EN, SERVICE_VALUES, validate, type ContactPayload } from "@/lib/contact";

export const runtime = "nodejs";

/*
 * Best-effort rate limit: 5 messages per visitor per 10 minutes. It lives in
 * memory, so on serverless it resets between cold starts; it still stops
 * simple repeat submissions without adding a database.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const data: ContactPayload = {
    name: str(body.name, LIMITS.name).trim(),
    company: str(body.company, LIMITS.company).trim(),
    email: str(body.email, LIMITS.email).trim(),
    message: str(body.message, LIMITS.message).trim(),
    service: SERVICE_VALUES.includes(body.service as never) ? (body.service as ContactPayload["service"]) : "",
    website: str(body.website, 200),
    locale: body.locale === "es" ? "es" : "en",
  };

  // Spam trap: pretend success so bots learn nothing
  if (data.website) return NextResponse.json({ ok: true });

  const errors = validate(data);
  if (Object.keys(errors).length) return NextResponse.json({ error: "invalid", fields: errors }, { status: 422 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error("Contact form: RESEND_API_KEY or CONTACT_TO_EMAIL is not set");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const from = process.env.CONTACT_FROM_EMAIL || "GrowFitConsult <onboarding@resend.dev>";

  const service = data.service ? SERVICE_LABELS_EN[data.service] : "Not specified";
  const rows: [string, string][] = [
    ["Name", data.name],
    ["Company", data.company || "Not given"],
    ["Email", data.email],
    ["Service", service],
    ["Site language", data.locale === "es" ? "Spanish" : "English"],
  ];
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${data.message}`;
  const html = `<table cellpadding="6" style="font-family:system-ui,sans-serif;font-size:14px">${rows
    .map(([k, v]) => `<tr><td style="color:#666">${k}</td><td>${escapeHtml(v)}</td></tr>`)
    .join("")}</table><p style="font-family:system-ui,sans-serif;font-size:15px;white-space:pre-wrap">${escapeHtml(data.message)}</p>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: data.email,
        subject: `New enquiry from ${data.name}${data.company ? `, ${data.company}` : ""}`,
        text,
        html,
      }),
    });
    if (!res.ok) {
      console.error("Contact form: Resend responded", res.status, await res.text());
      return NextResponse.json({ error: "send_failed" }, { status: 502 });
    }
  } catch (err) {
    console.error("Contact form: request to Resend failed", err);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
