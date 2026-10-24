"use client";

import { useEffect, useState } from "react";

interface Flash {
  id: number;
  message: string;
  tone: "success" | "error";
}

export function FlashToast({ flash }: { flash: Flash | null }) {
  const [visible, setVisible] = useState<Flash | null>(flash);

  useEffect(() => {
    if (!flash) return;
    setVisible(flash);
    document.cookie = "hq_flash=; Max-Age=0; path=/";
    const t = window.setTimeout(() => setVisible(null), 4500);
    return () => window.clearTimeout(t);
  }, [flash]);

  if (!visible) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`no-print fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-card border bg-raised px-4 py-3 text-sm ${
        visible.tone === "error" ? "border-danger/50 text-danger" : "border-accent/40 text-fg"
      }`}
    >
      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${visible.tone === "error" ? "bg-danger" : "bg-accent"}`} />
      <span className="flex-1">{visible.message}</span>
      <button onClick={() => setVisible(null)} className="text-xs text-muted hover:text-fg" aria-label="Dismiss notification">
        Close
      </button>
    </div>
  );
}
