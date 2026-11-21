"use client";

import { AnimatePresence, m } from "framer-motion";
import { useRef, useState, type FormEvent } from "react";
import { validate, type ContactPayload, type FieldErrors } from "@/lib/contact";
import { useI18n } from "@/lib/i18n/context";
import { site } from "@/lib/site";
import { ArrowRight, ArrowUpRight, CheckIcon, LinkedInIcon, MailIcon, PhoneIcon } from "./Icons";
import { Reveal } from "./Reveal";

type Status = "idle" | "sending" | "sent" | "error" | "not_configured";

const empty = { name: "", company: "", email: "", service: "" as ContactPayload["service"], message: "", website: "" };

function Label({ htmlFor, children, optional }: { htmlFor: string; children: string; optional?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm text-fg">
      {children}
      {optional && <span className="ml-1.5 text-muted">({optional})</span>}
    </label>
  );
}

function FieldError({ id, show, children }: { id: string; show?: boolean; children: string }) {
  if (!show) return null;
  return (
    <p id={id} className="mt-2 text-sm text-[#ff8a8a]">
      {children}
    </p>
  );
}

export function Contact() {
  const { t, locale } = useI18n();
  const c = t.contact;
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [tried, setTried] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => {
    const next = { ...form, [k]: e.target.value };
    setForm(next);
    if (tried) setErrors(validate(next));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    const found = validate(form);
    setErrors(found);
    const first = (["name", "email", "message"] as const).find((k) => found[k]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      if (res.ok) {
        setStatus("sent");
        setForm(empty);
        setTried(false);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string; fields?: FieldErrors };
      if (data.fields) setErrors(data.fields);
      setStatus(data.error === "not_configured" ? "not_configured" : "error");
    } catch {
      setStatus("error");
    }
  }

  const describedBy = (k: "name" | "email" | "message") => (errors[k] ? `err-${k}` : undefined);

  return (
    <section id="contact" aria-labelledby="contact-title" className="border-t border-line py-24 sm:py-32">
      <div className="container-page grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <div>
          <Reveal y={24}>
            <h2 id="contact-title" className="h-section max-w-[14ch]">
              {c.title}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="lead mt-6">{c.intro}</p>
          </Reveal>

          <Reveal delay={0.14}>
            <h3 className="num mt-12 text-xs uppercase tracking-[0.14em] text-muted">{c.direct}</h3>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              <li className="flex items-center gap-4 py-4">
                <MailIcon className="shrink-0 text-lg text-muted" />
                <span className="sr-only">{c.emailLabel}: </span>
                {site.email ? (
                  <a href={`mailto:${site.email}`} className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-accent">
                    {site.email}
                  </a>
                ) : (
                  <span className="num text-sm text-accent">{t.todo.email}</span>
                )}
              </li>
              {site.phone !== null && (
                <li className="flex items-center gap-4 py-4">
                  <PhoneIcon className="shrink-0 text-lg text-muted" />
                  <span className="sr-only">{c.phoneLabel}: </span>
                  {site.phone ? (
                    <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-accent">
                      {site.phone}
                    </a>
                  ) : (
                    <span className="num text-sm text-accent">{t.todo.phone}</span>
                  )}
                </li>
              )}
              <li className="flex items-center gap-4 py-4">
                <LinkedInIcon className="shrink-0 text-lg text-muted" />
                <a href={site.linkedin} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 text-fg underline decoration-line-strong underline-offset-4 hover:decoration-accent">
                  {c.linkedinLabel}: Fernando Uhart
                  <ArrowUpRight className="text-sm text-muted" />
                </a>
              </li>
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="card p-6 sm:p-10">
            <AnimatePresence mode="wait" initial={false}>
              {status === "sent" ? (
                <m.div
                  key="sent"
                  role="status"
                  className="flex min-h-[26rem] flex-col items-start justify-center"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.4 }}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-accent text-2xl text-accent">
                    <CheckIcon />
                  </span>
                  <p className="mt-6 max-w-[28ch] font-display text-2xl font-extrabold tracking-[-0.025em] text-fg">{c.success}</p>
                </m.div>
              ) : (
                <m.form
                  key="form"
                  ref={formRef}
                  noValidate
                  onSubmit={onSubmit}
                  initial={false}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  className="grid gap-6 sm:grid-cols-2"
                >
                  <div>
                    <Label htmlFor="f-name">{c.name}</Label>
                    <input id="f-name" name="name" autoComplete="name" required value={form.name} onChange={set("name")} aria-invalid={errors.name ? "true" : undefined} aria-describedby={describedBy("name")} className="field" />
                    <FieldError id="err-name" show={errors.name}>{c.errors.name}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="f-company" optional={c.optional}>{c.company}</Label>
                    <input id="f-company" name="company" autoComplete="organization" value={form.company} onChange={set("company")} className="field" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="f-email">{c.email}</Label>
                    <input id="f-email" name="email" type="email" inputMode="email" autoComplete="email" required value={form.email} onChange={set("email")} aria-invalid={errors.email ? "true" : undefined} aria-describedby={describedBy("email")} className="field" />
                    <FieldError id="err-email" show={errors.email}>{c.errors.email}</FieldError>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="f-service" optional={c.optional}>{c.service}</Label>
                    <div className="relative">
                      <select id="f-service" name="service" value={form.service} onChange={set("service")} className="field appearance-none pr-10">
                        <option value="">{c.servicePlaceholder}</option>
                        {t.services.items.map((s) => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                        <option value="other">{c.serviceOther}</option>
                      </select>
                      <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 h-2 w-2 -translate-y-[70%] rotate-45 border-b border-r border-muted" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="f-message">{c.message}</Label>
                    <textarea id="f-message" name="message" required rows={5} value={form.message} onChange={set("message")} placeholder={c.messagePlaceholder} aria-invalid={errors.message ? "true" : undefined} aria-describedby={describedBy("message")} className="field resize-y" />
                    <FieldError id="err-message" show={errors.message}>{c.errors.message}</FieldError>
                  </div>

                  {/* Honeypot: hidden from people and assistive tech */}
                  <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                    <label htmlFor="f-website">Website</label>
                    <input id="f-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
                  </div>

                  <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                    <p role="status" aria-live="polite" className="text-sm text-muted">
                      {tried && Object.keys(errors).length > 0 ? c.errors.summary : status === "error" ? c.error : status === "not_configured" ? c.notConfigured : ""}
                    </p>
                    <button type="submit" disabled={status === "sending"} className="btn btn-primary group shrink-0 disabled:cursor-wait disabled:opacity-60">
                      {status === "sending" ? `${c.sending}…` : c.submit}
                      {status !== "sending" && <ArrowRight className="transition-transform duration-200 ease-out group-hover:translate-x-0.5" />}
                    </button>
                  </div>
                </m.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
