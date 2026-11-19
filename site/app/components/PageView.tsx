import { notFound } from "next/navigation";
import { getMessages, localizedPath, type Locale } from "@/lib/i18n";
import { PAGES, readPage, type PageSlug } from "@/lib/pages";
import { SITE_URL, SHARE_SIZE, shareImagePath } from "@/lib/site";
import { stations } from "@/lib/flow";
import { NAV_LABELS } from "@/lib/pages";
import WriteToUs from "./WriteToUs";
import MarginNav from "./MarginNav";

const WRITE_MARK = "<!--write-->";

export const staticSlugs = () => PAGES.filter((p) => p.slug !== "").map((p) => ({ slug: p.slug }));

function entry(slug: string | undefined): PageSlug {
  const found = PAGES.find((p) => p.slug === (slug ?? ""));
  if (!found) notFound();
  return found.slug;
}

export function metadataOf(locale: Locale, slug: string | undefined) {
  const page = readPage(locale, entry(slug));
  const alt = (l: Locale) => localizedPath(l, "/" + page.slug);
  const path = alt(locale);
  return {
    title: page.title,
    description: page.description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: path, languages: { en: alt("en"), fr: alt("fr") } },
    openGraph: {
      title: page.title,
      description: page.description,
      url: path,
      type: "website" as const,
      siteName: "Krizaka Agents",
      images: [{ url: shareImagePath(locale), width: SHARE_SIZE.width, height: SHARE_SIZE.height, alt: getMessages(locale).share.alt }],
    },
    twitter: { card: "summary_large_image" as const, title: page.title, description: page.description, images: [shareImagePath(locale)] },
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

/** A stretch of the page; the home marks with `<!--write-->` where its button goes, above the § 1 heading. */
function Prose({ locale, html }: Readonly<{ locale: Locale; html: string }>) {
  const [head, ...rest] = html.split(WRITE_MARK);
  if (rest.length === 0) return <div className="kz-prose" dangerouslySetInnerHTML={{ __html: html }} />;
  return (
    <>
      <div className="kz-prose" dangerouslySetInnerHTML={{ __html: head }} />
      <WriteToUs locale={locale} />
      <div className="kz-prose" dangerouslySetInnerHTML={{ __html: rest.join(WRITE_MARK) }} />
    </>
  );
}

export default function PageView({ locale, slug }: Readonly<{ locale: Locale; slug: string | undefined }>) {
  const t = getMessages(locale);
  const page = readPage(locale, entry(slug));
  const [before, after] = page.figure ? page.html.split("<!--figure-->") : [page.html, ""];
  return (
    <div className="kz-doc">
    <MarginNav
      label={t.bar.pages}
      contents={t.bar.contents}
      pages={PAGES.map((p) => ({ href: localizedPath(locale, `/${p.slug}`), label: NAV_LABELS[locale][p.slug], current: p.slug === page.slug }))}
      sections={page.sections}
    />
    <article className="kz-article">
      <h1>{page.title}</h1>
      <Prose locale={locale} html={before} />
      {page.figure && <Flow locale={locale} caption={page.figure} />}
      {page.figure && <Prose locale={locale} html={after} />}
      <WriteToUs locale={locale} invite />
    </article>
    </div>
  );
}
