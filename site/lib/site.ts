import { org } from "@krizaka/org";

/* Where the site is, and where it points. Structure only — the words are in lib/pages.ts, messages/ and content/pages. */
export const SITE_URL = "https://agents.krizaka.com";
export const KRIZAKA_URL = "https://www.krizaka.com";
export const BLOG_URL = "https://blog.krizaka.com";

/** The company's contact form, from the org data (`@krizaka/org`), never typed: the topic and the source say what the message is about. */
export const CONTACT_QUERY = "topic=other&product=agents&source=agents";
export const contactUrl = (locale: "en" | "fr"): string => `${org.contact.page[locale]}?${CONTACT_QUERY}`;
