import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  "no-profile": "Your account has no profile. Contact the agency administrator.",
  callback: "That sign-in link is invalid or has expired. Request a new one.",
};

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams.error ? (ERRORS[searchParams.error] ?? "Sign-in failed.") : null;
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <div className="flex items-center gap-2">
            <span className="h-display text-2xl text-fg">Holdback</span>
            <span className="h-display text-2xl text-mint">HQ</span>
          </div>
          <p className="mt-3 text-sm text-muted">
            Prompt payment, holdback and WSIB tracking for Ontario trade subcontractors.
          </p>
        </div>
        <div className="card p-6">
          <h1 className="text-base font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted">We will email you a one-time sign-in link.</p>
          {error ? <p className="mt-4 border-l-2 border-danger pl-3 text-sm text-danger">{error}</p> : null}
          <LoginForm />
        </div>
        <p className="mt-6 text-xs text-faint">
          <Link href="/privacy" className="hover:text-muted">Privacy</Link>
        </p>
      </div>
    </main>
  );
}
