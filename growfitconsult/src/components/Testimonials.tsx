"use client";

import { useI18n } from "@/lib/i18n/context";
import { site } from "@/lib/site";
import { Reveal, stagger } from "./Reveal";

/**
 * Built, but hidden by `site.showTestimonials` until real, approved quotes exist.
 * TODO: testimonials — replace the entries below, then set showTestimonials: true.
 */
const quotes: { quote: string; name: string; role: string }[] = [
  { quote: "", name: "", role: "" },
  { quote: "", name: "", role: "" },
];

export function Testimonials() {
  const { t } = useI18n();
  if (!site.showTestimonials) return null;

  return (
    <section id="testimonials" aria-labelledby="testimonials-title" className="border-t border-line py-24 sm:py-32">
      <div className="container-page">
        <Reveal y={24}>
          <h2 id="testimonials-title" className="h-section">
            {t.testimonials.title}
          </h2>
        </Reveal>
        <ul className="mt-16 grid gap-4 md:grid-cols-2">
          {quotes.map((q, i) => (
            <Reveal as="li" key={i} delay={stagger(i)} className="card p-8 sm:p-10">
              <figure>
                <blockquote className="font-display text-xl font-extrabold leading-snug tracking-[-0.02em] text-fg sm:text-2xl">
                  {q.quote || <span className="num text-sm font-normal tracking-normal text-muted">{t.testimonials.todo}</span>}
                </blockquote>
                <figcaption className="mt-8 border-t border-line pt-5 text-sm">
                  <span className="block text-fg">{q.name || "TODO: name"}</span>
                  <span className="block text-muted">{q.role || "TODO: role, company"}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
