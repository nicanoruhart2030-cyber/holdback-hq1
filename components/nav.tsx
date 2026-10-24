"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS: Record<string, React.ReactNode> = {
  today: <path d="M2.5 7 8 2.5 13.5 7v6.5h-11z" />,
  queue: <path d="M2 9h3.5l1 2h3l1-2H14M2 9l2-6h8l2 6v4H2z" />,
  deadlines: (
    <>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </>
  ),
  clients: (
    <>
      <circle cx="6" cy="5.5" r="2.5" />
      <path d="M1.5 13.5c.5-2.5 2.3-3.5 4.5-3.5s4 1 4.5 3.5M10.5 3.2a2.5 2.5 0 0 1 0 4.6M12 10.3c1.3.5 2.2 1.5 2.5 3.2" />
    </>
  ),
  scan: (
    <>
      <path d="M9.5 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4M9.5 2 13 5.5V8M9.5 2v3.5H13" />
      <circle cx="11" cy="11" r="2" />
      <path d="m12.5 12.5 1.5 1.5" />
    </>
  ),
  rules: <path d="M3 3.5h4A1.5 1.5 0 0 1 8.5 5v8.5A1.5 1.5 0 0 0 7 12H3zM13 3.5H9.5A1.5 1.5 0 0 0 8 5v8.5A1.5 1.5 0 0 1 9.5 12H13z" />,
};

const ITEMS = [
  { href: "/dashboard", label: "Today", icon: "today" },
  { href: "/drafts", label: "Approval queue", icon: "queue" },
  { href: "/deadlines", label: "Deadlines", icon: "deadlines" },
  { href: "/clients", label: "Clients", icon: "clients" },
  { href: "/scan", label: "Cash Leak Scan", icon: "scan" },
  { href: "/settings", label: "Rules", icon: "rules" },
];

export function Nav({ pendingDrafts }: { pendingDrafts: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="no-scrollbar -mx-1 flex gap-0.5 overflow-x-auto px-1 md:mx-0 md:flex-col md:px-0">
      {ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`) || (item.href === "/clients" && pathname.startsWith("/projects"));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-8 items-center gap-2 whitespace-nowrap rounded-md px-2 text-sm font-medium transition-colors ${
              active ? "bg-emphasis text-fg" : "text-body hover:bg-subtle hover:text-fg"
            }`}
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {ICONS[item.icon]}
            </svg>
            <span className="flex-1">{item.label}</span>
            {item.href === "/drafts" && pendingDrafts > 0 ? <span className="num text-xs text-muted">{pendingDrafts}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
