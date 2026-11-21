"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { CountryCode } from "@/lib/i18n/dictionary";
import { site } from "@/lib/site";
import { Reveal } from "./Reveal";

/*
 * Route map: real capital-city coordinates on a simple equirectangular grid
 * (lon -125..-50, lat 60..-40). No coastlines: the dots and the order carry it.
 */
const W = 300;
const H = 400;
const project = (lat: number, lon: number) => ({ x: ((lon + 125) / 75) * W, y: ((60 - lat) / 100) * H });

const POINTS: Record<CountryCode, { lat: number; lon: number; anchor: "start" | "end"; dx: number; dy: number }> = {
  AR: { lat: -34.6, lon: -58.4, anchor: "end", dx: -10, dy: 4 },
  CA: { lat: 45.4, lon: -75.7, anchor: "start", dx: 10, dy: -2 },
  PE: { lat: -12.0, lon: -77.0, anchor: "end", dx: -10, dy: 4 },
  UY: { lat: -34.9, lon: -56.2, anchor: "start", dx: 10, dy: 12 },
  MX: { lat: 19.4, lon: -99.1, anchor: "end", dx: -10, dy: 4 },
  CO: { lat: 4.7, lon: -74.1, anchor: "start", dx: 10, dy: 8 },
  US: { lat: 38.9, lon: -77.0, anchor: "end", dx: -10, dy: 8 },
  PR: { lat: 18.5, lon: -66.1, anchor: "start", dx: 10, dy: 4 },
};

function RouteMap({ active, label, names }: { active: number; label: string; names: Record<CountryCode, string> }) {
  const order = site.countries;
  const pts = order.map((c) => ({ c, ...project(POINTS[c].lat, POINTS[c].lon) }));
  const equatorY = project(0, 0).y;
  // Each leg is a gentle arc (control point pushed off the straight line), like a flight route
  const leg = (a: (typeof pts)[number], b: (typeof pts)[number]) => {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const k = 0.18;
    return `Q${(mx - dy * k).toFixed(1)} ${(my + dx * k).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  };
  const route = (n: number) => {
    const first = pts[0];
    if (!first) return "";
    let d = `M${first.x.toFixed(1)} ${first.y.toFixed(1)}`;
    for (let i = 1; i <= n && i < pts.length; i++) d += ` ${leg(pts[i - 1]!, pts[i]!)}`;
    return d;
  };

  return (
    <svg viewBox={`-30 -14 ${W + 100} ${H + 36}`} role="img" aria-label={label} className="h-auto w-full">
      <title>{label}</title>
      {/* equator, for orientation */}
      <line x1={-30} x2={W + 70} y1={equatorY} y2={equatorY} stroke="var(--line)" strokeDasharray="2 6" />
      <text x={W + 68} y={equatorY - 6} textAnchor="end" className="fill-[var(--faint)] font-mono text-[9px]">
        0°
      </text>
      {/* full route, faint */}
      <path d={route(pts.length - 1)} fill="none" stroke="var(--line-strong)" strokeWidth={1} strokeDasharray="3 4" />
      {/* route travelled so far */}
      <path
        d={route(active)}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1.5}
        className="transition-[d] duration-500"
      />
      {pts.map((p, i) => {
        const isActive = i === active;
        const done = i <= active;
        const meta = POINTS[p.c];
        return (
          <g key={p.c}>
            {isActive && <circle cx={p.x} cy={p.y} r={9} fill="none" stroke="var(--accent)" strokeOpacity={0.5} />}
            <circle cx={p.x} cy={p.y} r={isActive ? 4.5 : 3.5} fill={done ? "var(--accent)" : "var(--bg)"} stroke={done ? "var(--accent)" : "var(--line-strong)"} strokeWidth={1.5} />
            <text
              x={p.x + meta.dx}
              y={p.y + meta.dy}
              textAnchor={meta.anchor}
              className={`font-mono text-[10px] ${isActive ? "fill-[var(--fg)]" : "fill-[var(--muted)]"}`}
              // a halo in the card colour keeps labels legible where a route passes under them
              style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 4, strokeLinejoin: "round" }}
            >
              {names[p.c]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Experience() {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const order = site.countries;

  // The country group in the middle of the viewport drives the map
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const idx = Number((e.target as HTMLElement).dataset.index);
          if (!Number.isNaN(idx)) setActive(idx);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    document.querySelectorAll<HTMLElement>("[data-country-group]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const jump = (c: CountryCode, i: number) => {
    setActive(i);
    document.getElementById(`exp-${c}`)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
  };

  return (
    <section id="experience" aria-labelledby="experience-title" className="border-t border-line py-24 sm:py-32">
      <div className="container-page">
        <Reveal y={24}>
          <h2 id="experience-title" className="h-section max-w-[14ch]">
            {t.experience.title}
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="lead mt-6">{t.experience.intro}</p>
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          {/* Map and country list: sticky beside the timeline on large screens */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="card hidden p-6 sm:block">
              <RouteMap active={active} label={t.experience.mapLabel} names={t.experience.countries} />
            </div>
            <h3 className="num mt-8 text-xs uppercase tracking-[0.14em] text-muted">{t.experience.countriesHeading}</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {order.map((c, i) => (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => jump(c, i)}
                    aria-current={i === active ? "true" : undefined}
                    className={`h-9 rounded-btn border px-3 text-sm transition-colors duration-200 ${
                      i === active ? "border-accent text-fg" : "border-line-strong text-muted hover:border-fg hover:text-fg"
                    }`}
                  >
                    {t.experience.countries[c]}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Timeline */}
          <ol className="relative border-l border-line">
            {order.map((c, i) => (
              <li
                key={c}
                id={`exp-${c}`}
                data-country-group
                data-index={i}
                className="relative scroll-mt-32 pb-14 pl-8 last:pb-10 sm:pl-10"
              >
                <span
                  aria-hidden="true"
                  className={`absolute -left-[5px] top-[0.55rem] h-[9px] w-[9px] rounded-full border transition-colors duration-300 ${
                    i <= active ? "border-accent bg-accent" : "border-line-strong bg-bg"
                  }`}
                />
                <h3 className={`font-display text-2xl font-extrabold tracking-[-0.025em] transition-colors duration-300 ${i === active ? "text-fg" : "text-muted"}`}>
                  {t.experience.countries[c]}
                </h3>
                <ul className="mt-5 space-y-5">
                  {t.experience.roles[c].map((r) => (
                    <li key={r.years} className="grid gap-1 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-6">
                      <span className="num pt-0.5 text-sm text-muted">{r.years}</span>
                      <div>
                        <p className="text-base font-medium leading-snug text-fg">{r.title}</p>
                        {r.org && <p className="mt-1 text-sm text-muted">{r.org}</p>}
                        {r.detail && <p className="num mt-1.5 text-sm text-accent">{r.detail}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}

            {/* Now */}
            <li className="relative pl-8 sm:pl-10">
              <span aria-hidden="true" className="absolute -left-[7px] top-[0.4rem] h-[13px] w-[13px] rounded-full border-2 border-accent bg-bg" />
              <div className="grid gap-1 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-6">
                <span className="num pt-1 text-sm text-accent">{t.experience.now}</span>
                <div>
                  <p className="font-display text-2xl font-extrabold tracking-[-0.025em] text-fg">{t.experience.nowTitle}</p>
                  <p className="mt-1 text-sm text-muted">{site.name}</p>
                </div>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
