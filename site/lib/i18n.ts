/* English at the root, French under /fr/. Every user-facing string of the chrome is in messages/<locale>.json. */
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

export type Locale = "en" | "fr";
export const LOCALES: readonly Locale[] = ["en", "fr"];
export type Messages = typeof en;
const dictionaries: Record<Locale, Messages> = { en, fr };
export const getMessages = (locale: Locale): Messages => dictionaries[locale];

/** The URL path of a page in a language; `path` starts with "/" and the root is "/". */
export function localizedPath(locale: Locale, path: string): string {
  const clean = path === "/" ? "" : path.replace(/\/$/, "");
  return `${locale === "en" ? "" : "/fr"}${clean}/`;
}
