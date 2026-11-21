"use client";

import { useI18n } from "@/lib/i18n/context";
import { site } from "@/lib/site";
import { LanguageToggle } from "./LanguageToggle";
import { Wordmark } from "./Wordmark";

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const links = [
    { href: "#services", label: t.nav.services },
    { href: "#experience", label: t.nav.experience },
    { href: "#approach", label: t.nav.approach },
    { href: "#about", label: t.nav.about },
    { href: "#contact", label: t.nav.contact },
  ];

  return (
    <footer className="border-t border-line pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-14">
      <div className="container-page">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <Wordmark className="text-xl" />
            <p className="mt-3 max-w-[30ch] text-sm text-muted">{t.hero.title}</p>
          </div>
          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm sm:grid-cols-3">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-muted transition-colors duration-200 hover:text-fg">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href={site.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted transition-colors duration-200 hover:text-fg">
                  LinkedIn
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="mt-14 flex flex-col gap-5 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            © {year} {site.name}. {t.footer.rights}
          </p>
          <div className="flex items-center gap-5">
            <a href="#top" className="text-sm text-muted transition-colors duration-200 hover:text-fg">
              {t.footer.backToTop}
            </a>
            <LanguageToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
