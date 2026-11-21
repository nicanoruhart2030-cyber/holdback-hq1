"use client";

import { useI18n } from "@/lib/i18n/context";
import { Reveal, stagger } from "./Reveal";

export function Process() {
  const { t } = useI18n();
  return (
    <section id="approach" aria-labelledby="approach-title" className="border-t border-line py-24 sm:py-32">
      <div className="container-page">
        <Reveal y={24}>
          <h2 id="approach-title" className="h-section max-w-[16ch]">
            {t.process.title}
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="lead mt-6">{t.process.intro}</p>
        </Reveal>

        {/* The sequence is the point here, so the steps carry numbers */}
        <ol className="mt-16 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
          {t.process.steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={stagger(i)} className="cq flex flex-col bg-bg p-7 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="num text-sm text-accent">{String(i + 1).padStart(2, "0")}</span>
                <span aria-hidden="true" className="h-px flex-1 bg-line-strong" />
              </div>
              <h3 className="display h-step mt-10 tracking-[-0.025em] text-fg">{s.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
