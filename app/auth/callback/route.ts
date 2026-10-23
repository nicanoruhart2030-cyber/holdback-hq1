import { NextResponse, type NextRequest } from "next/server";
import { logActivity } from "@/lib/activity";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/login?error=callback`);

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/login?error=callback`);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle<{ role: string }>();
  if (profile?.role === "admin") {
    await logActivity(supabase, { actorId: data.user.id, actorType: "user", action: "auth.sign_in", entityType: "user", entityId: data.user.id });
  }
  return NextResponse.redirect(`${origin}/dashboard`);
}
