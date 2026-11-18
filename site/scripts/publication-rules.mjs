/* What a published page must never hold (krizaka-internal#3122). The site is public: a page that carries a secret, the
   founder's name, an internal path, the private repository of the harness, or an offer is a build failure, not a review remark.
   The founder's name is never written in a file: its words are compared by their SHA-256. */
import { createHash } from "node:crypto";

const NAME_HASHES = new Set(["86e08046be6344c1487dfaefe42a67f0fff79414916b0dfcdbb18cab0201a014", "a954e93925dca619a33955a410991a9ba133bd5ea18075caf0d6849455c6537e"]);

/** The sentence that says there is nothing to buy: the one place the word « buy » (« acheter ») may stand. */
const DENIAL = /(nothing to buy or to request here|rien à acheter ni à demander ici)/gi;

export const RULES = [
  {
    id: "secret",
    test: (text) =>
      /(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|xox[abpr]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(api[_-]?key|secret|token|passw(or)?d)["']?\s*[:=]\s*["']?[A-Za-z0-9_\-/+]{16,})/i.test(
        text,
      ),
  },
  {
    id: "founder-name",
    test: (text) => (text.toLowerCase().match(/[a-zà-ÿ]+/g) ?? []).some((w) => NAME_HASHES.has(createHash("sha256").update(w).digest("hex"))),
  },
  { id: "internal-path", test: (text) => /krizaka-hq|workspace\/|\/Users\//.test(text) },
  { id: "private-repository", test: (text) => /github\.com\/krizaka\/krizaka-agents(?![-\w])/i.test(text) },
  {
    id: "offer",
    test: (text) =>
      /\b(buy|buying|purchase|install|installing|installation|pricing|price|prices|prix|tarifs?|acheter|achat|installer|licen[cs]e fee|per month|par mois|free trial|essai gratuit)\b|[$€£]\s?\d|\d\s?[$€£]|\d\s?(USD|EUR|CAD)\b/i.test(
        text.replace(/\s+/g, " ").replace(DENIAL, ""),
      ),
  },
];

/** The ids of the rules a text breaks. */
export const problems = (text) => RULES.filter((r) => r.test(text)).map((r) => r.id);
