"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback`, shouldCreateUser: true },
    });
    if (error) {
      setState("error");
      setMessage(error.message);
    } else {
      setState("sent");
    }
  }

  if (state === "sent") {
    return (
      <p className="mt-5 border-l-2 border-mint pl-3 text-sm text-fg">
        Check <span className="num">{email}</span> for your sign-in link.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-3">
      <label className="block">
        <span className="label mb-1.5 block">Work email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="you@agency.ca"
        />
      </label>
      {state === "error" ? <p className="text-sm text-danger">{message}</p> : null}
      <button type="submit" className="btn-primary w-full" disabled={state === "sending"}>
        {state === "sending" ? "Sending link" : "Email me a link"}
      </button>
    </form>
  );
}
