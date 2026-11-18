import type { MetadataRoute } from "next";
import { LOCALES, localizedPath } from "@/lib/i18n";
import { PAGES } from "@/lib/pages";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((l) => PAGES.map((p) => ({ url: SITE_URL + localizedPath(l, "/" + p.slug) })));
}
