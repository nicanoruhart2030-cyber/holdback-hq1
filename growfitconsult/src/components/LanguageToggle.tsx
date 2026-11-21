"use client";

import { useI18n } from "@/lib/i18n/context";
import { locales } from "@/lib/i18n/dictionary";

/** A two-option segmented control: EN / ES. */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div role="group" aria-label={t.nav.language} className={`inline-flex rounded-btn border border-line-strong p-0.5 ${className}`}>
      {locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={active}
            lang={l}
            className={`num h-8 min-w-[2.5rem] rounded-[6px] px-2 text-xs uppercase tracking-[0.08em] transition-colors duration-200 ${
              active ? "bg-fg text-bg" : "text-muted hover:text-fg"
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
