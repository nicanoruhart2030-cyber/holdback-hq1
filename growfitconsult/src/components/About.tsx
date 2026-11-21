"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n/context";
import { site } from "@/lib/site";
import { ArrowUpRight, LinkedInIcon } from "./Icons";
import { Reveal } from "./Reveal";

export function About() {
  const { t } = useI18n();
  return (
    <section id="about" aria-labelledby="about-title" className="border-t border-line py-24 sm:py-32">
      <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <Reveal className="lg:pt-2">
          <div className="card relative aspect-[4/5] w-full max-w-md overflow-hidden">
            {site.headshot ? (
              <Image
                src={site.headshot}
                alt={t.about.headshotAlt}
                fill
                sizes="(min-width: 1024px) 420px, (min-width: 640px) 448px, 100vw"
                className="object-cover"
              />
            ) : (
              // TODO: headshot photo — set `headshot` in src/lib/site.ts
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 border border-dashed border-line-strong text-center">
                <span aria-hidden="true" className="font-display text-6xl font-extrabold tracking-[-0.04em] text-faint">
                  FU
                </span>
                <span className="num text-xs uppercase tracking-[0.14em] text-muted">{t.about.headshotTodo}</span>
              </div>
            )}
          </div>
        </Reveal>

        <div>
          <Reveal y={24}>
            <h2 id="about-title" className="h-section">
              {t.about.title}
            </h2>
          </Reveal>
          <div className="mt-8 max-w-[40rem] space-y-5 text-[1.0625rem] leading-relaxed text-muted">
            {t.about.paragraphs.map((p, i) => (
              <Reveal key={i} delay={0.06 + i * 0.05}>
                <p className={i === 0 ? "text-fg" : undefined}>{p}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <dl className="mt-10 grid max-w-[40rem] grid-cols-1 border-y border-line sm:grid-cols-[10rem_minmax(0,1fr)]">
              <dt className="num pt-4 text-xs uppercase tracking-[0.14em] text-muted sm:py-4">{t.about.languagesLabel}</dt>
              <dd className="pb-4 text-fg sm:py-4">{t.about.languages}</dd>
            </dl>
            <a href={site.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-ghost group mt-8">
              <LinkedInIcon className="text-lg" />
              {t.about.linkedin}
              <ArrowUpRight className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
