/** A card that stays closed until needed, so forms don't crowd the content. */
export function Disclosure({
  title,
  hint,
  children,
  tone = "default",
  defaultOpen,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
  defaultOpen?: boolean;
}) {
  return (
    <details className="group card" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-card px-5 py-3.5 hover:bg-raised/50 [&::-webkit-details-marker]:hidden">
        <span>
          <span className={`text-sm font-semibold ${tone === "danger" ? "text-danger" : "text-fg"}`}>{title}</span>
          {hint ? <span className="ml-3 text-xs text-muted">{hint}</span> : null}
        </span>
        <span aria-hidden className="text-muted transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="border-t border-line p-5">{children}</div>
    </details>
  );
}
