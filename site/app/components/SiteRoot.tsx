import type { ReactNode } from "react";
import Link from "next/link";
import { KrizakaLogo } from "@krizaka/ui";
import { ThemeProvider, ThemeScript } from "@krizaka/ui/theme";
import { SkipLink } from "@krizaka/ui/skip-link";
import { cn } from "@krizaka/ui/cn";
import { getMessages, localizedPath, type Locale } from "@/lib/i18n";
import { KRIZAKA_URL, BLOG_URL, contactUrl } from "@/lib/site";
import { NAV_LABELS, PAGES } from "@/lib/pages";
import { displayFace, monoFace, textFace } from "../fonts";
import ThemeToggle from "./ThemeToggle";
import FamilyFooterBlock from "./FamilyFooterBlock";
import "../globals.css";

/* The root of one language (the two root layouts, app/(en) and app/fr, are this): the document, the Krizaka faces, the theme
   (dark by default, persisted as `kz-theme`, no flash), the bar with the way back to krizaka.com's products and the blog
   chapters, « Write to us » and the family footer. No form here, no offer: the one door is krizaka.com's contact form. */
export default function SiteRoot({ locale, children }: Readonly<{ locale: Locale; children: ReactNode }>) {
  const t = getMessages(locale);
  const other: Locale = locale === "en" ? "fr" : "en";
  const labels = NAV_LABELS[locale];
  const company = `${KRIZAKA_URL}/${locale}`;
  return (
    <html
      lang={locale}
      className={cn(textFace.variable, displayFace.variable, monoFace.variable, "h-full dark")}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript defaultMode="dark" />
        <meta name="theme-color" content="#0d0d0f" />
      </head>
      <body>
        <ThemeProvider defaultMode="dark">
          <SkipLink href="#content">{t.bar.skip}</SkipLink>
          <header className="kz-bar">
            <div className="kz-bar-row">
              <Link href={localizedPath(locale, "/")} className="kz-brand">
                <KrizakaLogo size={24} />
                <span>{t.site.name}</span>
              </Link>
              <div className="kz-bar-links">
                <a href={`${company}#products`}>{t.bar.products}</a>
                <a className="kz-bar-write" href={contactUrl(locale)}>
                  {t.contact.label}
                </a>
                <a href={`${BLOG_URL}/${locale === "fr" ? "fr/" : ""}`}>{t.bar.blog}</a>
                <Link href={localizedPath(other, "/")} lang={other} hrefLang={other}>
                  {t.bar.language}
                </Link>
                <ThemeToggle toLight={t.bar.themeToLight} toDark={t.bar.themeToDark} />
              </div>
            </div>
            <nav aria-label={t.bar.aria} className="kz-pages">
              {PAGES.map((p) => (
                <Link key={p.file} href={localizedPath(locale, `/${p.slug}`)}>
                  {labels[p.slug]}
                </Link>
              ))}
            </nav>
          </header>
          <main id="content">{children}</main>
          <FamilyFooterBlock locale={locale} />
        </ThemeProvider>
      </body>
    </html>
  );
}
