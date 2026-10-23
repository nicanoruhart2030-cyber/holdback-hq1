import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="num text-sm text-muted">404</div>
      <h1 className="h-display mt-2 text-3xl">Not found</h1>
      <Link href="/dashboard" className="btn-secondary mt-6">Back to dashboard</Link>
    </main>
  );
}
