"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { bookingHref, bookingIsExternal, site } from "@/lib/site";
import { CloseIcon, MenuIcon } from "./Icons";
import { LanguageToggle } from "./LanguageToggle";
import { Wordmark } from "./Wordmark";

type LinkId = "services" | "experience" | "approach" | "about" | "testimonials" | "contact";

export function Nav() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<LinkId | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const links: { id: LinkId; label: string }[] = [
    { id: "services", label: t.nav.services },
    { id: "experience", label: t.nav.experience },
    { id: "approach", label: t.nav.approach },
    { id: "about", label: t.nav.about },
    ...(site.showTestimonials ? [{ id: "testimonials" as const, label: t.nav.testimonials }] : []),
    { id: "contact", label: t.nav.contact },
  ];

  // Border and solid ground once the page has scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the section in the middle of the viewport
  useEffect(() => {
    const ids: LinkId[] = ["services", "experience", "approach", "about", "testimonials", "contact"];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id as LinkId);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    const hero = document.getElementById("top");
    const heroIO = new IntersectionObserver(([e]) => e?.isIntersecting && setActive(null), { rootMargin: "-45% 0px -50% 0px" });
    if (hero) heroIO.observe(hero);
    return () => {
      io.disconnect();
      heroIO.disconnect();
    };
  }, []);

  // Mobile menu: lock scroll, close on Escape, move focus in and back out
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const toggle = toggleRef.current;
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      toggle?.focus();
    };
  }, [open]);

  const bookProps = bookingIsExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <>
      <a
        href="#main"
        className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-btn bg-fg px-4 py-2 text-sm font-medium text-bg transition-transform duration-200 focus-visible:translate-y-0"
      >
        {t.nav.skip}
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
          scrolled || open ? "border-line bg-bg" : "border-transparent bg-transparent"
        }`}
      >
        <div className="container-page flex h-[72px] items-center gap-6">
          <a href="#top" aria-label={t.nav.home} className="shrink-0 rounded-[4px]" onClick={() => setOpen(false)}>
            <Wordmark />
          </a>

          <nav aria-label="Main" className="ml-auto hidden lg:block">
            <ul className="flex items-center gap-7">
              {links.map((l) => (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    aria-current={active === l.id ? "true" : undefined}
                    className={`relative py-2 text-sm transition-colors duration-200 hover:text-fg ${
                      active === l.id ? "text-fg" : "text-muted"
                    }`}
                  >
                    {l.label}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-accent transition-transform duration-300 ease-out ${
                        active === l.id ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-3 lg:ml-0">
            <LanguageToggle className="hidden sm:inline-flex" />
            <a href={bookingHref} {...bookProps} className="btn btn-primary hidden h-10 px-4 text-sm sm:inline-flex">
              {t.nav.book}
            </a>
            <button
              ref={toggleRef}
              type="button"
              className="btn btn-ghost h-10 w-10 px-0 text-xl lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t.nav.close : t.nav.menu}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <m.div
            id="mobile-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.menu}
            className="fixed inset-x-0 bottom-0 top-[72px] z-40 flex flex-col border-t border-line bg-bg lg:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}
            transition={{ duration: 0.24 }}
          >
            <nav aria-label="Mobile" className="container-page flex-1 overflow-y-auto pt-6">
              <ul className="divide-y divide-line border-b border-line">
                {links.map((l) => (
                  <li key={l.id}>
                    <a
                      href={`#${l.id}`}
                      onClick={() => setOpen(false)}
                      className="display flex items-center justify-between py-5 text-3xl text-fg"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="container-page flex items-center justify-between gap-4 border-t border-line py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <LanguageToggle />
              <a href={bookingHref} {...bookProps} onClick={() => setOpen(false)} className="btn btn-primary">
                {t.nav.book}
              </a>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
