/* The seven stations of the flow page (Fig. 1), each with the blog chapter that tells it. */
import type { Locale } from "./i18n";

const CH = "https://blog.krizaka.com";
const chapter = (locale: Locale, slug: string) => `${CH}${locale === "fr" ? "/fr" : ""}/story/${slug}/`;

export function stations(locale: Locale) {
  const rules = chapter(locale, "working-with-agents-rules-that-refuse");
  const start = chapter(locale, "every-agent-starts-in-the-same-world");
  const train = chapter(locale, "tchou-tchou-how-our-pull-requests-catch-the-train");
  const talk = chapter(locale, "how-our-agent-teams-talk");
  const names =
    locale === "fr"
      ? ["Ticket", "Session construite et vérifiée", "Refus avant le push", "Pull request", "Train et fusion", "Recette", "Alertes"]
      : ["Ticket", "Session built and checked", "Refusals before the push", "Pull request", "Train and merge", "Acceptance check", "Alerts"];
  const links = [rules, start, rules, rules, train, start, talk];
  return names.map((name, i) => ({ n: i + 1, name, href: links[i] }));
}
