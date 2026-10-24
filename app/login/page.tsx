import Link from "next/link";
import { Notice } from "@/components/ui";
import { Wordmark } from "@/components/wordmark";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  "no-profile": "Your account has no profile. Contact the agency administrator.",
  callback: "That sign-in link is invalid or has expired. Request a new one.",
};

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams.error ? (ERRORS[searchParams.error] ?? "Sign-in failed.") : null;
  return (
    <main className="flex min-h-screen items-center justify-center bg-raised px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <Wordmark size="lg" />
          <p className="mt-3 text-sm text-muted">
            Prompt payment, holdback and WSIB tracking for Ontario trade subcontractors.
          </p>
        </div>
        <div className="card p-7">
          <h1 className="h-display text-display">Sign in</h1>
          <p className="mt-1 text-sm text-muted">We will email you a one-time sign-in link.</p>
          {error ? (
            <div className="mt-4">
              <Notice tone="danger">{error}</Notice>
            </div>
          ) : null}
          <LoginForm />
        </div>
        <p className="mt-6 text-xs text-faint">
          <Link href="/privacy" className="hover:text-muted">Privacy</Link>
        </p>
      </div>
    </main>
  );
}
