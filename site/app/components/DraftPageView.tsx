import Link from "next/link";
import { Badge } from "@krizaka/ui/badge";
import { ChapterFoot } from "@krizaka/ui/chapter";
import { getMessages, localizedPath, type Locale } from "@/lib/i18n";
import { NAV_LABELS, PAGES } from "@/lib/pages";
import { DRAFT_PAGES, draftPiecesOf, readDraftPage, type DraftPageSlug } from "@/lib/release-pages";
import { SHARE_SIZE, SITE_URL, shareImagePath } from "@/lib/site";
import MarginNav from "./MarginNav";
import MigrationAliases from "./MigrationAliases";
import ReleaseMeasures from "./ReleaseMeasures";
import ReleaseViewFigure from "./ReleaseViewFigure";
import WriteToUs from "./WriteToUs";

/** Builds Next.js metadata with `noindex, nofollow` so draft pages are never indexed. */
export function draftMetadataOf(locale: Locale, slug: DraftPageSlug) {
  const page = readDraftPage(locale, slug);
  const alt = (l: Locale) => localizedPath(l, `/${page.slug}`);
  const path = alt(locale);
  return {
    title: page.title,
    description: page.description,
    robots: { index: false, follow: false },
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

function DraftStretch({ locale, html }: Readonly<{ locale: Locale; html: string }>) {
  let after = "start";
  return draftPiecesOf(html).map((piece) => {
    if ("releaseView" in piece) {
      after = piece.releaseView;
      return <ReleaseViewFigure key={piece.releaseView} locale={locale} id={piece.releaseView} />;
    }
    if ("kind" in piece && piece.kind === "release-measures") {
      after = "release-measures";
      return <ReleaseMeasures key="release-measures" locale={locale} />;
    }
    if ("kind" in piece && piece.kind === "migration-aliases") {
      after = "migration-aliases";
      return <MigrationAliases key="migration-aliases" locale={locale} />;
    }
    return <div key={`prose-after-${after}`} className="kz-prose" dangerouslySetInnerHTML={{ __html: piece.html }} />;
  });
}

function DraftFoot({ locale, slug }: Readonly<{ locale: Locale; slug: DraftPageSlug }>) {
  const t = getMessages(locale);
  const previous =
    slug === "v1"
      ? { title: NAV_LABELS[locale].proofs, href: localizedPath(locale, "/proofs") }
      : { title: t.release.navLabels.v1, href: localizedPath(locale, "/v1") };
  const next = slug === "v1" ? { title: t.release.navLabels.migration, href: localizedPath(locale, "/migration") } : undefined;

  return (
    <ChapterFoot
      label={t.chapterFoot.label}
      labels={{ previous: t.chapterFoot.previous, next: t.chapterFoot.next }}
      previous={previous}
      next={next}
      linkAs={Link}
    />
  );
}

/** Shared layout shell for unpublished 1.0 release and migration draft pages. */
export default function DraftPageView({ locale, slug }: Readonly<{ locale: Locale; slug: DraftPageSlug }>) {
  const t = getMessages(locale);
  const page = readDraftPage(locale, slug);
  const other: Locale = locale === "en" ? "fr" : "en";

  const navPages = [
    ...PAGES.map((p) => ({ href: localizedPath(locale, `/${p.slug}`), label: NAV_LABELS[locale][p.slug], current: false })),
    ...DRAFT_PAGES.map((d) => ({
      href: localizedPath(locale, `/${d.slug}`),
      label: t.release.navLabels[d.slug],
      current: d.slug === page.slug,
    })),
  ];

  return (
    <div className="kz-doc">
      <MarginNav label={t.bar.pages} contents={t.bar.contents} pages={navPages} sections={page.sections} />
      <article className="kz-article">
        <div className="kz-draft-bar">
          <Badge tone="warning" size="md">
            {t.release.draftBadge}
          </Badge>
          <Link href={localizedPath(other, `/${page.slug}`)} lang={other} hrefLang={other}>
            {t.release.switchLanguage[page.slug]}
          </Link>
        </div>
        <h1>{page.title}</h1>
        <DraftStretch locale={locale} html={page.html} />
        <WriteToUs locale={locale} invite />
        <DraftFoot locale={locale} slug={page.slug} />
      </article>
    </div>
  );
}
