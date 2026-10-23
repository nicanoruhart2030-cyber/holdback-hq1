"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card max-w-xl p-6">
      <h2 className="h-display text-2xl">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted">{error.message || "Unexpected error."}</p>
      {error.digest ? <p className="num mt-1 text-xs text-faint">Ref {error.digest}</p> : null}
      <button onClick={reset} className="btn-secondary mt-4">Try again</button>
    </div>
  );
}
