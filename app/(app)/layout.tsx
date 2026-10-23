import Link from "next/link";
import { Nav } from "@/components/nav";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser();
  const supabase = createClient();
  const { count } = await supabase.from("drafts").select("id", { count: "exact", head: true }).eq("status", "pending");

  return (
    <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col md:flex-row">
      <aside className="no-print border-b border-line px-4 py-4 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r md:px-4 md:py-6">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
          <span className="h-display text-lg text-fg">Holdback</span>
          <span className="h-display text-lg text-mint">HQ</span>
        </Link>
        <Nav pendingDrafts={count ?? 0} />
        <div className="mt-6 hidden border-t border-line px-2 pt-4 md:block">
          <div className="truncate text-xs text-muted">{profile.email}</div>
          <div className="label mt-1">{profile.role === "admin" ? "Agency admin" : "Client"}</div>
          <form action="/auth/signout" method="post" className="mt-3">
            <button className="text-xs text-muted hover:text-fg">Sign out</button>
          </form>
          <Link href="/privacy" className="mt-2 block text-xs text-faint hover:text-muted">Privacy</Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 md:px-10">
        {profile.role !== "admin" && !profile.client_id ? (
          <div className="card p-6 text-sm text-muted">
            Your account is not linked to a client yet. Ask your agency contact to grant access.
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
