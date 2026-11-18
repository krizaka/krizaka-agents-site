/* What a published page must never hold (the publication check of the site's plan, § 6). The site is public: a page that
   carries a secret, an internal path or a private repository's name, a person's data, an attribution to the founder or an
   offer is a build failure, not a review remark. The founder's name itself is checked by founder-name-guard.mjs, against a
   keyed secret: nothing derived from it is written here. */

/** The sentence that says there is nothing to buy: the one place the word « buy » (« acheter ») may stand. */
const DENIAL = /(nothing to buy or to request here|rien à acheter ni à demander ici)/gi;

/** Each pattern is simple on purpose (one idea, linear time): a rule fires when any of its patterns matches. */
const SECRET_PATTERNS = [
  /gh[pousr]_\w{20,}/,
  /github_pat_\w{20,}/,
  /sk-[\w-]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /xox[abpr]-[\w-]{10,}/,
  /-----BEGIN [A-Z ]{0,40}PRIVATE KEY-----/,
  /(?:api[_-]?key|secret|token|passw(?:or)?d)["']?\s{0,3}[:=]\s{0,3}["']?[\w/+-]{16,}/i,
];
/** Home and machine paths, the workspace and its tools, loopback addresses and ports, an inbox path. */
const INTERNAL_PATTERNS = [
  /krizaka-hq/,
  /workspace\//,
  /\/Users\//,
  /\/home\/\w/,
  /~\/\./,
  /\bkz-config\b/,
  /(?:^|[\s/(`"'])\.local\//,
  /\btools\/[\w./-]{1,80}\.py\b/,
  /\blocalhost:\d/,
  /\b127\.0\.0\.1\b/,
  /\b0\.0\.0\.0\b/,
  /\[::1\]/,
  /\binbox\//,
];
/** The private repositories: the harness (a link to it) and the private issue repositories (their name anywhere). */
const PRIVATE_REPOSITORY_PATTERNS = [/github\.com\/krizaka\/krizaka-agents(?![\w-])/i, /\bkrizaka-(?:internal|restricted)\b/i];
/** The only addresses a page may show. */
const PUBLIC_EMAILS = new Set(["contact@krizaka.com", "support@krizaka.com"]);
/** An e-mail address: a word with « @ » followed by a domain (split on separators first, so the pattern stays linear). */
const EMAIL = /^[\w.+-]+@[\w-]+\.[\w.-]+$/;
/** A phone number, a Canadian postal code, a SIN / NAS, a card number. */
const PERSONAL_PATTERNS = [
  /\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/,
  /\(\d{3}\) ?\d{3}[\s.-]\d{4}\b/,
  /\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d\b/,
  /\b\d{3}[ -]\d{3}[ -]\d{3}\b/,
  /\b\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{1,7}\b/,
  /\b\d{13,19}\b/,
];
/** « founder, 2026-… » / « fondateur, 2026-… »: the attribution the internal documents are full of. */
const FOUNDER_ATTRIBUTION = /\b(?:founder|fondateur)\s{0,3}[,(—–-]\s{0,3}20\d\d-\d\d/i;
const OFFER_WORDS = new RegExp(
  `\\b(?:${[
    "buy", "buying", "purchase", "install", "installing", "installation", "pricing", "price", "prices",
    "prix", "tarif", "tarifs", "acheter", "achat", "installer", "per month", "par mois", "free trial", "essai gratuit",
  ].join("|")})\\b`,
  "i",
);
const OFFER_AMOUNTS = [/[$€£]\s?\d/, /\d\s?[$€£]/, /\d\s?(?:USD|EUR|CAD)\b/];
/** Rule 7 of the plan, a warning and not a refusal: the words that make a page read like a template. */
const AI_LOOK_WORDS = new RegExp(
  String.raw`\b(?:${[
    "révolutionnaire", "révolutionnaires", "magique", "magiques", "seamless", "seamlessly", "supercharge", "supercharged",
    "game-changer", "game-changing", "unleash", "unleashes", "autonomous", "autonome", "autonomes", "cutting-edge",
  ].join("|")})\b`,
  "giu",
);

const anyOf = (patterns, text) => patterns.some((re) => re.test(text));
const flat = (text) => text.replaceAll(/\s+/g, " ");
const emails = (text) =>
  text
    .split(/[\s<>"'`(),;:[\]{}|]+/)
    .map((w) => (w.endsWith(".") ? w.slice(0, -1) : w).toLowerCase())
    .filter((w) => w.includes("@") && EMAIL.test(w));
const privateEmail = (text) => emails(text).some((e) => !PUBLIC_EMAILS.has(e));

export const RULES = [
  { id: "secret", test: (text) => anyOf(SECRET_PATTERNS, text) },
  { id: "founder-attribution", test: (text) => FOUNDER_ATTRIBUTION.test(flat(text)) },
  { id: "internal-path", test: (text) => anyOf(INTERNAL_PATTERNS, text) },
  { id: "private-repository", test: (text) => anyOf(PRIVATE_REPOSITORY_PATTERNS, text) },
  { id: "personal-data", test: (text) => privateEmail(text) || anyOf(PERSONAL_PATTERNS, text) },
  {
    id: "offer",
    test: (text) => {
      const plain = flat(text).replace(DENIAL, "");
      return OFFER_WORDS.test(plain) || anyOf(OFFER_AMOUNTS, plain);
    },
  },
];

/** The ids of the rules a text breaks. */
export const problems = (text) => RULES.filter((r) => r.test(text)).map((r) => r.id);

/** The template words a text uses (lower-cased, once each): reported as a warning. */
export const aiLook = (text) => [...new Set((text.match(AI_LOOK_WORDS) ?? []).map((w) => w.toLowerCase()))];

/** Rule 1 of the plan, the part a public repository can check alone: what a source file of the pages may be. */
export const SOURCE_TYPES = /** @type {const} */ ([".mdx", ".md", ".json", ".ts", ".tsx", ".css", ".svg", ".png", ".webp", ".txt"]);
export const allowedSourceFile = (path) => path.endsWith("/CNAME") || SOURCE_TYPES.some((ext) => path.endsWith(ext));

/** A fenced code block of a page longer than 8 lines is a copy, unless it is marked `illustrative` (```ts illustrative). */
export const MAX_CODE_LINES = 8;
export function longCodeBlocks(markdown) {
  const blocks = [...markdown.matchAll(/^(```|~~~)([^\n]*)\n([\s\S]*?)^\1\s*$/gm)];
  return blocks.filter(([, , info, body]) => !/\billustrative\b/.test(info) && body.split("\n").length - 1 > MAX_CODE_LINES).length;
}
