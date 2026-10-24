"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "error"; message?: string } | { status: "sent"; email: string };

/** Base URL for the magic-link redirect. Supabase also checks it against its allow list. */
function appOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Sends the magic link from the server, so the login page ships no Supabase
 * client. The PKCE code verifier is written to a cookie by the server client
 * and read back by /auth/callback when the link is opened in the same browser.
 */
export async function sendMagicLinkAction(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const parsed = z.string().trim().toLowerCase().email().safeParse(fd.get("email"));
  if (!parsed.success) return { status: "error", message: "Enter a valid email address." };
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${appOrigin()}/auth/callback`, shouldCreateUser: true },
  });
  if (error) return { status: "error", message: error.message };
  return { status: "sent", email: parsed.data };
}
