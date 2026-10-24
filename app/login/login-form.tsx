"use client";

import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/submit-button";
import { Notice } from "@/components/ui";
import { type LoginState, sendMagicLinkAction } from "./actions";

const initial: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, formAction] = useFormState(sendMagicLinkAction, initial);

  if (state.status === "sent") {
    return (
      <div className="mt-5">
        <Notice tone="ok">
          Check <span className="num">{state.email}</span> for your sign-in link. Open it in this browser.
        </Notice>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-5 space-y-3">
      <label className="block">
        <span className="label mb-1.5 block">Work email</span>
        <input type="email" name="email" required autoComplete="email" className="input" placeholder="you@agency.ca" />
      </label>
      {state.status === "error" ? <Notice tone="danger">{state.message}</Notice> : null}
      <SubmitButton className="btn-primary w-full" pending="Sending link">
        Email me a link
      </SubmitButton>
    </form>
  );
}
