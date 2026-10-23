import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { optionalEnv } from "@/lib/env";
import { todayInToronto } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { runDailySweep } from "@/lib/sweep";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: NextRequest): boolean {
  const secret = optionalEnv("CRON_SECRET");
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Vercel Cron calls this daily with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await runDailySweep(createAdminClient(), todayInToronto());
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("daily sweep failed", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Sweep failed" }, { status: 500 });
  }
}
