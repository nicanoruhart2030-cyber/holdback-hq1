"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/deadlines", label: "Deadlines" },
  { href: "/drafts", label: "Approval queue" },
  { href: "/scan", label: "Cash Leak Scan" },
  { href: "/settings", label: "Rules" },
];

export function Nav({ pendingDrafts }: { pendingDrafts: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`) ||
          (item.href === "/clients" && pathname.startsWith("/projects"));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between whitespace-nowrap rounded-button border px-3 py-2 text-sm transition-colors ${
              active ? "border-line-strong bg-raised text-fg" : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {item.label}
            {item.href === "/drafts" && pendingDrafts > 0 ? (
              <span className="num ml-3 rounded-[4px] bg-mint px-1.5 text-2xs font-medium text-mint-ink">{pendingDrafts}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
