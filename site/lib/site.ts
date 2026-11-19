import { org } from "@krizaka/org";

/* Where the site is, and where it points. Structure only — the words are in lib/pages.ts, messages/ and content/pages. */
export const SITE_URL = "https://agents.krizaka.com";
export const KRIZAKA_URL = "https://www.krizaka.com";
export const BLOG_URL = "https://blog.krizaka.com";

/** The share card (Open Graph): one 1200×630 image per language, drawn at build time by app/(en)/og.png and app/fr/og.png. */
export const SHARE_SIZE = { width: 1200, height: 630 } as const;
export const shareImagePath = (locale: "en" | "fr"): string => `${locale === "fr" ? "/fr" : ""}/og.png`;

/** The company's contact form, from the org data (`@krizaka/org`), never typed: the topic and the source say what the message is about. */
export const CONTACT_QUERY = "topic=other&product=agents&source=agents";
export const contactUrl = (locale: "en" | "fr"): string => `${org.contact.page[locale]}?${CONTACT_QUERY}`;
