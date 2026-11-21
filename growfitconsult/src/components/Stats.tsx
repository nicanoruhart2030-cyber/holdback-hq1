"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type Stat = { value: number; prefix?: string; suffix?: string; label: string };

/** Counts from 0 to `value` once, when first seen. Reduced motion shows the final number at once. */
function CountUp({ value, locale }: { value: number; locale: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value); // server render and no-JS show the real number

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let started = false;
    setShown(0);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started) return;
        started = true;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1400;
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 4); // fast start, gentle landing
          setShown(Math.round(value * eased));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return <span ref={ref}>{shown.toLocaleString(locale === "es" ? "es-AR" : "en-US")}</span>;
}

export function Stats() {
  const { t, locale } = useI18n();
  const stats: Stat[] = [
    { value: 30, label: t.stats.years },
    { value: 8, suffix: "+", label: t.stats.countries },
    { value: 2400, label: t.stats.people },
    { value: 200, prefix: t.stats.budgetPrefix, suffix: t.stats.budgetSuffix, label: t.stats.budget },
  ];

  return (
    <section aria-label={t.stats.label} className="border-b border-line">
      <dl className="container-page grid grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`cq flex flex-col-reverse justify-end gap-3 py-10 sm:py-12 ${i % 2 === 1 ? "border-l border-line pl-6 sm:pl-8" : "pr-6"} ${
              i >= 2 ? "border-t border-line lg:border-t-0" : ""
            } ${i === 2 ? "lg:border-l lg:pl-8" : ""}`}
          >
            <dt className="max-w-[16ch] text-sm leading-snug text-muted">{s.label}</dt>
            <dd className="num h-stat whitespace-nowrap leading-none tracking-[-0.03em] text-fg">
              {s.prefix && <span className="text-muted">{s.prefix}</span>}
              <CountUp value={s.value} locale={locale} />
              {s.suffix && <span className="text-accent">{s.suffix}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
