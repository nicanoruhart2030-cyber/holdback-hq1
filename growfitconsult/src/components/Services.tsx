"use client";

import { useI18n } from "@/lib/i18n/context";
import { CheckIcon } from "./Icons";
import { Reveal, stagger } from "./Reveal";

export function Services() {
  const { t } = useI18n();
  return (
    <section id="services" aria-labelledby="services-title" className="py-24 sm:py-32">
      <div className="container-page">
        <Reveal y={24}>
          <h2 id="services-title" className="h-section max-w-[16ch]">
            {t.services.title}
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="lead mt-6">{t.services.intro}</p>
        </Reveal>

        <ul className="mt-16 grid gap-4 md:grid-cols-2">
          {t.services.items.map((s, i) => (
            <Reveal as="li" key={s.id} delay={stagger(i)} className="card cq group flex flex-col p-7 transition-colors duration-300 hover:border-line-strong sm:p-9">
              <h3 className="display h-card leading-[1.05] tracking-[-0.025em] text-fg">{s.title}</h3>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">{s.description}</p>
              <div className="mt-auto pt-8">
                <p className="num text-xs uppercase tracking-[0.14em] text-muted">{t.services.getsLabel}</p>
                <ul className="mt-4 space-y-2.5 border-t border-line pt-4">
                  {s.gets.map((g) => (
                    <li key={g} className="flex items-start gap-3 text-[0.9375rem] text-fg">
                      <CheckIcon className="mt-[0.3rem] shrink-0 text-accent" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
