import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getProfile(): Promise<{ profile: Profile | null; userId: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { profile: null, userId: null };
  const { data } = await supabase
    .from("profiles")
    .select("id, email, role, client_id")
    .eq("id", user.id)
    .maybeSingle<Profile>();
  return { profile: data ?? null, userId: user.id };
}

/** For pages: redirects to /login when signed out. */
export async function requireUser(): Promise<Profile> {
  const { profile, userId } = await getProfile();
  if (!userId) redirect("/login");
  if (!profile) redirect("/login?error=no-profile");
  return profile;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403,
  ) {
    super(message);
  }
}

/** For mutations and API routes: throws unless the caller is an agency admin. */
export async function requireAdmin(): Promise<Profile> {
  const { profile, userId } = await getProfile();
  if (!userId) throw new AuthError("Not signed in", 401);
  if (!profile || profile.role !== "admin") throw new AuthError("Agency admin access required", 403);
  return profile;
}
