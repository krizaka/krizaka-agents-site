/* What a published page must never hold (krizaka-internal#3122). The site is public: a page that carries a secret, the
   founder's name, an internal path, the private repository of the harness, or an offer is a build failure, not a review remark.
   The founder's name is never written in a file: its words are compared by their SHA-256. */
import { createHash } from "node:crypto";

const NAME_HASHES = new Set(["86e08046be6344c1487dfaefe42a67f0fff79414916b0dfcdbb18cab0201a014", "a954e93925dca619a33955a410991a9ba133bd5ea18075caf0d6849455c6537e"]);

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
const INTERNAL_PATTERNS = [/krizaka-hq/, /workspace\//, /\/Users\//];
const PRIVATE_REPOSITORY = /github\.com\/krizaka\/krizaka-agents(?![\w-])/i;
const OFFER_WORDS = new RegExp(
  `\\b(?:${[
    "buy", "buying", "purchase", "install", "installing", "installation", "pricing", "price", "prices",
    "prix", "tarif", "tarifs", "acheter", "achat", "installer", "per month", "par mois", "free trial", "essai gratuit",
  ].join("|")})\\b`,
  "i",
);
const OFFER_AMOUNTS = [/[$€£]\s?\d/, /\d\s?[$€£]/, /\d\s?(?:USD|EUR|CAD)\b/];

const anyOf = (patterns, text) => patterns.some((re) => re.test(text));
const flat = (text) => text.replaceAll(/\s+/g, " ");
const words = (text) => text.toLowerCase().match(/[a-zà-ÿ]+/g) ?? [];
const isNameWord = (w) => NAME_HASHES.has(createHash("sha256").update(w).digest("hex"));

export const RULES = [
  { id: "secret", test: (text) => anyOf(SECRET_PATTERNS, text) },
  { id: "founder-name", test: (text) => words(text).some(isNameWord) },
  { id: "internal-path", test: (text) => anyOf(INTERNAL_PATTERNS, text) },
  { id: "private-repository", test: (text) => PRIVATE_REPOSITORY.test(text) },
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
