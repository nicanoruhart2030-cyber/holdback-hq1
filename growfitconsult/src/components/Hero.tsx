"use client";

import type React from "react";
import { useI18n } from "@/lib/i18n/context";
import { bookingHref, bookingIsExternal, site } from "@/lib/site";
import { ArrowDown, ArrowRight } from "./Icons";

/**
 * One entrance, choreographed: the headline leads, the subline and actions
 * follow, the country line arrives last as quiet proof. It runs in CSS
 * (see .hero-in in globals.css) so it starts at first paint, without
 * waiting for JavaScript; that keeps the headline fast as the LCP element.
 */
export function Hero() {
  const { t } = useI18n();
  const countries = site.countries.map((c) => t.experience.countries[c]);
  // Accent only on the final full stop of the headline
  const title = t.hero.title.replace(/\.$/, "");

  return (
    <section id="top" aria-labelledby="hero-title" className="relative flex flex-col pt-[72px] sm:min-h-[100svh]">
      <div className="container-page flex flex-1 flex-col justify-center pb-20 pt-16 sm:py-24">
        <h1 id="hero-title" className="hero-in display h-hero max-w-[14ch]" style={{ "--d": "0ms", "--y": "28px" } as React.CSSProperties}>
          {title}
          <span className="text-accent">.</span>
        </h1>

        <p className="hero-in lead mt-8 max-w-[40rem] text-lg text-muted sm:text-xl" style={{ "--d": "120ms", "--y": "14px" } as React.CSSProperties}>
          {t.hero.subtitle}
        </p>

        <div className="hero-in mt-10 flex flex-wrap gap-3" style={{ "--d": "200ms", "--y": "10px" } as React.CSSProperties}>
          <a
            href={bookingHref}
            {...(bookingIsExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="btn btn-primary group"
          >
            {t.hero.primary}
            <ArrowRight className="transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </a>
          <a href="#experience" className="btn btn-ghost group">
            {t.hero.secondary}
            <ArrowDown className="transition-transform duration-200 ease-out group-hover:translate-y-0.5" />
          </a>
        </div>
      </div>

      <div className="hero-in border-t border-line" style={{ "--d": "340ms", "--y": "0px" } as React.CSSProperties}>
        <div className="container-page flex flex-col gap-3 py-6 sm:flex-row sm:items-baseline sm:gap-8">
          <p className="num shrink-0 text-xs uppercase tracking-[0.14em] text-muted">{t.hero.countriesLabel}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-fg">
            {countries.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
