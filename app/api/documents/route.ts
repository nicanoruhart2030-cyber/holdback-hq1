import { NextResponse, type NextRequest } from "next/server";
import { signedUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

/**
 * Redirects to a 5-minute signed URL. Uses the caller's session, so storage
 * RLS decides whether they may read the object.
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path || path.includes("..")) return NextResponse.json({ error: "Bad path" }, { status: 400 });
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const url = await signedUrl(supabase, path);
  if (!url) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.redirect(url);
}
