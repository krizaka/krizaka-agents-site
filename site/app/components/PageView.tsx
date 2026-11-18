import { notFound } from "next/navigation";
import { getMessages, type Locale } from "@/lib/i18n";
import { PAGES, readPage, type PageSlug } from "@/lib/pages";
import { SITE_URL } from "@/lib/site";
import { stations } from "@/lib/flow";

export const staticSlugs = () => PAGES.filter((p) => p.slug !== "").map((p) => ({ slug: p.slug }));

function entry(slug: string | undefined): PageSlug {
  const found = PAGES.find((p) => p.slug === (slug ?? ""));
  if (!found) notFound();
  return found.slug;
}

export function metadataOf(locale: Locale, slug: string | undefined) {
  const page = readPage(locale, entry(slug));
  const path = `${locale === "en" ? "" : "/fr"}${page.slug ? `/${page.slug}` : ""}/`;
  const alt = (l: Locale) => `${l === "en" ? "" : "/fr"}${page.slug ? `/${page.slug}` : ""}/`;
  return {
    title: page.title,
    description: page.description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: path, languages: { en: alt("en"), fr: alt("fr") } },
    openGraph: { title: page.title, description: page.description, url: path, type: "website" as const, siteName: "Krizaka Agents" },
  };
}

function Flow({ locale, caption }: Readonly<{ locale: Locale; caption: string }>) {
  const t = getMessages(locale);
  return (
    <figure className="kz-figure">
      <ol aria-label={t.figure.flow} className="kz-flow">
        {stations(locale).map((s) => (
          <li key={s.n}>
            <span className="kz-fig-n" aria-hidden>
              {s.n}
            </span>
            <a href={s.href}>{s.name}</a>
          </li>
        ))}
      </ol>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export default function PageView({ locale, slug }: Readonly<{ locale: Locale; slug: string | undefined }>) {
  const page = readPage(locale, entry(slug));
  const [before, after] = page.figure ? page.html.split("<!--figure-->") : [page.html, ""];
  return (
    <article className="kz-article">
      <h1>{page.title}</h1>
      <div className="kz-prose" dangerouslySetInnerHTML={{ __html: before }} />
      {page.figure && <Flow locale={locale} caption={page.figure} />}
      {page.figure && <div className="kz-prose" dangerouslySetInnerHTML={{ __html: after }} />}
    </article>
  );
}
