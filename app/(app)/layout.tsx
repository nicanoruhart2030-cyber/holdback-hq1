import Link from "next/link";
import { FlashToast } from "@/components/flash-toast";
import { Nav } from "@/components/nav";
import { Wordmark } from "@/components/wordmark";
import { readFlash } from "@/lib/flash";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser();
  const supabase = createClient();
  const { count } = await supabase.from("drafts").select("id", { count: "exact", head: true }).eq("status", "pending");
  const initials = profile.email.slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-button focus:border focus:border-line-strong focus:bg-ink focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <aside className="no-print flex flex-col gap-4 border-b border-line bg-raised px-3 py-3 md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0 md:gap-5 md:border-b-0 md:border-r md:border-r-subtle md:py-4">
        <Link href="/dashboard" className="px-2 py-1">
          <Wordmark />
        </Link>
        <Nav pendingDrafts={count ?? 0} />
        <div className="mt-auto hidden md:block">
          <div className="flex items-center gap-2 px-2 py-2">
            <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-emphasis text-[11px] font-semibold text-body">
              {initials}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-fg">{profile.email}</div>
              <div className="text-xs text-muted">{profile.role === "admin" ? "Agency admin" : "Client"}</div>
            </div>
          </div>
          <div className="flex gap-3 px-2 pt-1 text-xs text-muted">
            <form action="/auth/signout" method="post">
              <button className="hover:text-fg">Sign out</button>
            </form>
            <Link href="/privacy" className="hover:text-fg">
              Privacy
            </Link>
          </div>
        </div>
      </aside>
      <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 focus:outline-none md:px-6">
        <div className="mx-auto max-w-[1140px]">
          {profile.role !== "admin" && !profile.client_id ? (
            <div className="card p-6 text-muted">Your account is not linked to a client yet. Ask your agency contact to grant access.</div>
          ) : (
            children
          )}
        </div>
      </main>
      <FlashToast flash={readFlash()} />
    </div>
  );
}
