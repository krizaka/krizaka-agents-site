#!/usr/bin/env node
/* Generates site/lib/release-diagrams.json from the copied LikeC4 model (site/data/krizaka-agents.c4)
   and its French translation dictionary (site/data/krizaka-agents.fr.json). Zero external dependencies.
   Usage:
     node scripts/generate-release-diagrams.mjs           write lib/release-diagrams.json
     node scripts/generate-release-diagrams.mjs check     verify model sha256 and deterministic output */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { aiLook, problems } from "./publication-rules.mjs";

export const RELEASE_VIEW_IDS = ["v1_c1", "v1_c2", "v1_tower", "v1_events"];

const SITE_ROOT = fileURLToPath(new URL("..", import.meta.url));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const BASE_ELEMENTS = {
  founder: {
    id: "founder",
    kind: "person",
    title: "Founder",
    technology: null,
    description: "Decides the direction and the money. A second app approves pull requests and the train merges them.",
  },
  agents: {
    id: "agents",
    kind: "system",
    title: "Krizaka Agents",
    technology: null,
    description:
      "What we put around AI models so their work can be trusted: commands, guards, sessions, trains, watchdog, coordinator and operations service.",
  },
  github: {
    id: "github",
    kind: "external",
    title: "GitHub",
    technology: null,
    description: "Code, issues, pull requests, CI, the merge queue and the tags.",
  },
  models: {
    id: "models",
    kind: "external",
    title: "Model providers",
    technology: null,
    description: "The AI models the products and the agents run on, local or hosted.",
  },
};

const SHAPES = {
  person: "person",
  app: "browser",
  datastore: "storage",
  library: "component",
  container: "rectangle",
  system: "rectangle",
  external: "rectangle",
};

const SIZE = {
  titleFont: 21,
  titleLeading: 1.2,
  techFont: 15,
  techLeading: 1.3,
  labelFont: 14,
  sansEm: 0.54,
  monoEm: 0.6,
  pad: 12,
  gap: 10,
  lidRoom: 18,
  minLine: 4,
  minWidth: 188,
  maxWidth: 236,
  minHeight: 100,
  labelPad: 4,
};

/** Rewrites internal-only words or file paths from the .c4 source into public words. */
export function sanitizePublicText(text) {
  if (!text) return text;
  return text
    .replaceAll("Installation profile", "Configuration profile")
    .replaceAll("per installation", "per deployment")
    .replaceAll("the harness", "the system")
    .replaceAll("teams, install, policy", "teams, schedule, policy")
    .replace(/\s*\([^)]*\btools\/[\w./-]+[^)]*\)/g, "")
    .replaceAll(/\s{2,}/g, " ")
    .trim();
}

/** Find matching closing brace index starting from an opening brace index. */
function findBlockEnd(src, openIdx) {
  let depth = 0;
  let inSingle = false;
  for (let i = openIdx; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === "'" && src[i - 1] !== "\\") {
      inSingle = !inSingle;
      continue;
    }
    if (inSingle) continue;
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error(`Unclosed block starting at offset ${openIdx}`);
}

/** Parses elements inside `extend agents { ... }`, relations, and public views from a .c4 source. */
export function parseC4Model(source) {
  const clean = source.replace(/\/\/.*$/gm, "");
  const elements = new Map();

  const extendMatch = /extend\s+agents\s*\{/.exec(clean);
  if (!extendMatch) throw new Error("krizaka-agents.c4 has no `extend agents` block");
  const extendStart = extendMatch.index + extendMatch[0].length - 1;
  const extendEnd = findBlockEnd(clean, extendStart);
  const extendBody = clean.slice(extendStart + 1, extendEnd);

  let pos = 0;
  const elHeadRe = /(\w+)\s*=\s*(container|app|library|datastore|external)\s*'([^']+)'\s*\{/g;
  elHeadRe.lastIndex = pos;
  let m;
  while ((m = elHeadRe.exec(extendBody)) !== null) {
    const braceAt = extendBody.indexOf("{", m.index + m[0].length - 1);
    const blockEnd = findBlockEnd(extendBody, braceAt);
    const body = extendBody.slice(braceAt + 1, blockEnd);
    const descMatch = /description\s+'([^']+)'/.exec(body);
    const techMatch = /technology\s+'([^']+)'/.exec(body);
    const tags = [...body.matchAll(/#(\w+)/g)].map((t) => t[1]);
    elements.set(`agents.${m[1]}`, {
      id: `agents.${m[1]}`,
      kind: m[2],
      title: m[3],
      technology: techMatch ? techMatch[1] : null,
      description: descMatch ? descMatch[1] : null,
      tags,
    });
    elHeadRe.lastIndex = blockEnd + 1;
  }

  const afterExtend = clean.slice(extendEnd + 1);
  const viewsMatch = /\bviews\s*\{/.exec(afterExtend);
  const relSection = viewsMatch ? afterExtend.slice(0, viewsMatch.index) : afterExtend;
  const viewsSection = viewsMatch ? afterExtend.slice(viewsMatch.index) : "";

  const relations = [];
  const relHeadRe = /([\w.]+)\s*->\s*([\w.]+)\s*'([^']+)'/g;
  while ((m = relHeadRe.exec(relSection)) !== null) {
    let cursor = relHeadRe.lastIndex;
    while (cursor < relSection.length && /\s/.test(relSection[cursor])) cursor += 1;
    let tags = [];
    if (relSection[cursor] === "{") {
      const end = findBlockEnd(relSection, cursor);
      const blk = relSection.slice(cursor + 1, end);
      tags = [...blk.matchAll(/#(\w+)/g)].map((t) => t[1]);
      relHeadRe.lastIndex = end + 1;
    }
    relations.push({ source: m[1], target: m[2], label: m[3], tags });
  }

  const views = new Map();
  const viewHeadRe = /view\s+(\w+)\s+of\s+(\w+)\s*\{/g;
  while ((m = viewHeadRe.exec(viewsSection)) !== null) {
    const braceAt = viewsSection.indexOf("{", m.index + m[0].length - 1);
    const blockEnd = findBlockEnd(viewsSection, braceAt);
    const body = viewsSection.slice(braceAt + 1, blockEnd);
    const titleMatch = /title\s+'([^']+)'/.exec(body);
    const incMatch = /include\s+([^\n}]+)/.exec(body);
    const include = incMatch ? incMatch[1].split(",").map((s) => s.trim()).filter(Boolean) : [];
    views.set(m[1], { id: m[1], scope: m[2], title: titleMatch ? titleMatch[1] : m[1], include });
    viewHeadRe.lastIndex = blockEnd + 1;
  }

  return { elements, relations, views };
}

function wrapLines(text, maxChars) {
  const glued = text.replaceAll("« ", "«\u00a0").replaceAll(" »", "\u00a0»");
  const rows = [];
  for (const word of glued.split(/\s+/).filter(Boolean)) {
    const last = rows.at(-1);
    if (last !== undefined && last.length + 1 + word.length <= maxChars) rows[rows.length - 1] = `${last} ${word}`;
    else rows.push(word);
  }
  return rows;
}

/** Measures node dimensions so both EN and FR labels fit inside the box without clipping. */
function measureNodeBox(enNode, frNode) {
  let width = SIZE.minWidth;
  for (const node of [enNode, frNode]) {
    const longestWord = Math.max(0, ...node.title.split(/\s+/).map((w) => w.length));
    const neededForWord = Math.ceil(longestWord * SIZE.titleFont * SIZE.sansEm + 2 * SIZE.pad + 12);
    if (neededForWord > width) width = Math.min(SIZE.maxWidth, neededForWord);
    if (node.title.length > 22 && width < 212) width = 212;
  }

  let height = SIZE.minHeight;
  for (const node of [enNode, frNode]) {
    const room = width - 2 * SIZE.pad;
    const maxTitleChars = Math.max(SIZE.minLine, Math.floor(room / (SIZE.titleFont * SIZE.sansEm)));
    const maxTechChars = Math.max(SIZE.minLine, Math.floor(room / (SIZE.techFont * SIZE.monoEm)));
    const titleRows = wrapLines(node.title, maxTitleChars);
    const techRows = node.technology ? wrapLines(node.technology, maxTechChars) : [];
    const titleH = titleRows.length * SIZE.titleFont * SIZE.titleLeading;
    const techH = techRows.length ? SIZE.gap + techRows.length * SIZE.techFont * SIZE.techLeading : 0;
    const lid = SHAPES[node.kind] === "storage" ? SIZE.lidRoom : 0;
    const neededH = Math.ceil(lid + titleH + techH + 26);
    if (neededH > height) height = neededH;
  }
  return { width, height };
}

function measureLabelBox(label, maxChars = 24) {
  const rows = wrapLines(label, maxChars);
  const longest = Math.max(4, ...rows.map((r) => r.length));
  const width = Math.ceil(longest * SIZE.labelFont * SIZE.monoEm + 6);
  const height = Math.ceil(rows.length * SIZE.labelFont * SIZE.techLeading);
  return { width, height };
}

function resolveElement(model, id) {
  const raw = BASE_ELEMENTS[id] ?? model.elements.get(id);
  if (!raw) throw new Error(`Unknown model element ${id}`);
  return {
    id,
    kind: raw.kind,
    shape: SHAPES[raw.kind] ?? "rectangle",
    title: sanitizePublicText(raw.title),
    technology: sanitizePublicText(raw.technology),
    description: sanitizePublicText(raw.description),
  };
}

function buildC1Spec(model) {
  const externalSet = new Set(["founder", "github", "models", "agents.quality", "agents.observability", "agents.gpu"]);
  const c1Group = (id) => (externalSet.has(id) ? id : id.startsWith("agents.") ? "agents" : null);

  const grouped = new Map();
  for (const rel of model.relations) {
    if (rel.tags.includes("retiring")) continue;
    const src = c1Group(rel.source);
    const dst = c1Group(rel.target);
    if (!src || !dst || src === dst) continue;
    const key = `${src}->${dst}`;
    if (!grouped.has(key)) grouped.set(key, { source: src, target: dst, labels: new Set() });
    grouped.get(key).labels.add(sanitizePublicText(rel.label));
  }

  const labelOverrides = {
    "founder->agents": "asks, decides, approves; watches the work and the architecture",
    "agents->github": "REST, GraphQL, merge queue (app token); reads and checks",
    "agents->models": "runs on Claude models; Claude models today",
    "agents->agents.quality": "reads the findings of a pull request",
    "agents->agents.observability": "exports the events (OpenTelemetry logs)",
    "agents.observability->agents": "probe results beside the alerts",
    "agents->agents.gpu": "lists the pods still billing",
  };

  const edges = [...grouped.entries()].map(([key, g], i) => ({
    id: `c1-${i + 1}`,
    source: g.source,
    target: g.target,
    label: labelOverrides[key] ?? [...g.labels].slice(0, 2).join("; "),
    step: null,
  }));

  return {
    id: "v1_c1",
    title: "Krizaka Agents 1.0 · system context (C1)",
    dynamic: false,
    hasAgentsGroup: false,
    nodeIds: ["founder", "agents", "github", "models", "agents.quality", "agents.observability", "agents.gpu"],
    ranks: [
      ["founder"],
      ["agents"],
      ["github", "models", "agents.quality"],
      ["agents.observability", "agents.gpu"],
    ],
    edges,
  };
}

function buildC2Spec(model) {
  const targetView = model.views.get("agents_public_target");
  if (!targetView) throw new Error("Model has no `agents_public_target` view");
  const included = new Set(targetView.include);
  const edges = model.relations
    .filter((r) => !r.tags.includes("retiring") && included.has(r.source) && included.has(r.target))
    .map((r, i) => ({
      id: `c2-${i + 1}`,
      source: r.source,
      target: r.target,
      label: sanitizePublicText(r.label),
      step: null,
    }));

  // Layered ranks keeping all `agents.*` inside the compound box and `github`/`models` outside at the bottom.
  const ranks = [
    ["agents.profile", "agents.envContract", "agents.builder", "agents.watchdog"],
    ["agents.sessions", "agents.commands", "agents.trains", "agents.coordinator"],
    ["agents.events", "agents.ports", "agents.ops"],
    ["agents.secretsAdapter", "agents.storageAdapter", "agents.notifyAdapter"],
    ["agents.vcsGithub", "agents.runtimeClaudeCode", "agents.modelClaude"],
    ["github", "models"],
  ];
  const ranked = new Set(ranks.flat());
  for (const id of included) {
    if (!ranked.has(id)) throw new Error(`v1_c2 rank missing ${id}`);
  }

  return {
    id: "v1_c2",
    title: "Krizaka Agents 1.0 · ports and adapters (C2)",
    dynamic: false,
    hasAgentsGroup: true,
    nodeIds: ["agents", ...targetView.include],
    ranks,
    edges,
  };
}

function buildTowerSpec(model) {
  const nodeIds = [
    "founder",
    "agents",
    "agents.cto",
    "agents.cockpit",
    "agents.crons",
    "agents.watchdog",
    "agents.automatic",
    "agents.builder",
    "agents.ports",
    "agents.notifyAdapter",
    "agents.ops",
    "agents.opsStore",
    "agents.observability",
  ];
  const nodeSet = new Set(nodeIds);
  const edges = model.relations
    .filter((r) => !r.tags.includes("retiring") && nodeSet.has(r.source) && nodeSet.has(r.target))
    .map((r, i) => ({
      id: `tower-${i + 1}`,
      source: r.source,
      target: r.target,
      label: sanitizePublicText(r.label),
      step: null,
    }));

  return {
    id: "v1_tower",
    title: "Krizaka Agents 1.0 · supervision and the tower",
    dynamic: false,
    hasAgentsGroup: true,
    nodeIds,
    ranks: [
      ["founder"],
      ["agents.cto", "agents.crons", "agents.cockpit"],
      ["agents.automatic", "agents.watchdog", "agents.notifyAdapter"],
      ["agents.builder", "agents.ports", "agents.ops"],
      ["agents.opsStore"],
      ["agents.observability"],
    ],
    edges,
  };
}

function buildEventsSpec(model) {
  const orderedPairs = [
    ["agents.builder", "agents.events"],
    ["agents.commands", "agents.events"],
    ["agents.commands", "agents.trains"],
    ["agents.trains", "agents.events"],
    ["agents.events", "agents.ops"],
    ["agents.ops", "agents.opsStore"],
    ["agents.watchdog", "agents.events"],
    ["agents.notifyAdapter", "agents.ops"],
    ["agents.notifyAdapter", "agents.cockpit"],
    ["agents.cockpit", "agents.ops"],
    ["agents.ops", "agents.observability"],
    ["agents.observability", "agents.cockpit"],
  ];
  const relByPair = new Map();
  for (const r of model.relations) {
    if (!r.tags.includes("retiring")) relByPair.set(`${r.source}->${r.target}`, r);
  }
  const edges = orderedPairs.map(([source, target], i) => {
    const rel = relByPair.get(`${source}->${target}`);
    if (!rel) throw new Error(`Missing .c4 relation ${source} -> ${target} for v1_events`);
    return {
      id: `step-${String(i + 1).padStart(2, "0")}`,
      source,
      target,
      label: sanitizePublicText(rel.label),
      step: i + 1,
    };
  });

  return {
    id: "v1_events",
    title: "Krizaka Agents 1.0 · the event flow",
    dynamic: true,
    hasAgentsGroup: false,
    nodeIds: [
      "agents.builder",
      "agents.commands",
      "agents.trains",
      "agents.events",
      "agents.watchdog",
      "agents.notifyAdapter",
      "agents.ops",
      "agents.opsStore",
      "agents.cockpit",
      "agents.observability",
    ],
    ranks: [
      ["agents.builder", "agents.commands", "agents.trains"],
      ["agents.events", "agents.watchdog", "agents.notifyAdapter"],
      ["agents.ops", "agents.cockpit"],
      ["agents.opsStore", "agents.observability"],
    ],
    edges,
  };
}

function translateNode(node, frDict) {
  const t = frDict.elements?.[node.id];
  if (!t) throw new Error(`Missing French element translation for ${node.id}`);
  return {
    ...node,
    title: t.title,
    technology: t.technology !== undefined ? t.technology : node.technology,
    description: t.description ?? node.description,
  };
}

function rectanglesOverlap(a, b, pad = 6) {
  return !(
    a.x + a.width + pad <= b.x ||
    b.x + b.width + pad <= a.x ||
    a.y + a.height + pad <= b.y ||
    b.y + b.height + pad <= a.y
  );
}

/** Deterministic layered layout generating valid ArchView geometry for EN and FR. */
function layoutView(spec, model, frDict) {
  const enNodesById = new Map();
  const frNodesById = new Map();
  for (const id of spec.nodeIds) {
    const en = resolveElement(model, id);
    const fr = translateNode(en, frDict);
    enNodesById.set(id, en);
    frNodesById.set(id, fr);
  }

  const sizeById = new Map();
  for (const id of spec.nodeIds) {
    if (spec.hasAgentsGroup && id === "agents") continue;
    sizeById.set(id, measureNodeBox(enNodesById.get(id), frNodesById.get(id)));
  }

  const gapX = spec.id === "v1_c2" ? 84 : 96;
  const rowWidths = spec.ranks.map((row) =>
    row.reduce((sum, id) => sum + sizeById.get(id).width, 0) + Math.max(0, row.length - 1) * gapX,
  );
  const maxRowWidth = Math.max(...rowWidths);

  const rankGapY = spec.id === "v1_c2" ? 132 : 124;
  const posById = new Map();
  let curY = 48;
  const rankMeta = [];

  for (let r = 0; r < spec.ranks.length; r += 1) {
    const row = spec.ranks[r];
    const rowW = rowWidths[r];
    const rowH = Math.max(...row.map((id) => sizeById.get(id).height));

    // Add extra space when crossing into or out of the compound `agents` box
    if (spec.hasAgentsGroup && r > 0) {
      const prevInGroup = enNodesById.get(spec.ranks[r - 1][0]).kind !== "external" && spec.ranks[r - 1][0] !== "founder";
      const currInGroup = enNodesById.get(row[0]).kind !== "external" && row[0] !== "founder";
      if (prevInGroup !== currInGroup) curY += 36;
    }

    let curX = 56 + (maxRowWidth - rowW) / 2;
    for (const id of row) {
      const sz = sizeById.get(id);
      posById.set(id, { x: Math.round(curX), y: Math.round(curY + (rowH - sz.height) / 2), width: sz.width, height: sz.height, rank: r });
      curX += sz.width + gapX;
    }
    rankMeta.push({ y: curY, height: rowH });
    curY += rowH + rankGapY;
  }

  // Compute compound `agents` box if needed
  let groupBox = null;
  if (spec.hasAgentsGroup) {
    const inner = [...posById.entries()].filter(([id]) => id.startsWith("agents.") && enNodesById.get(id).kind !== "external");
    const minX = Math.min(...inner.map(([, b]) => b.x)) - 34;
    const minY = Math.min(...inner.map(([, b]) => b.y)) - 58;
    const maxX = Math.max(...inner.map(([, b]) => b.x + b.width)) + 34;
    const maxY = Math.max(...inner.map(([, b]) => b.y + b.height)) + 30;
    groupBox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    posById.set("agents", { ...groupBox, rank: -1 });
  }

  const nodeParentOf = (id) => {
    if (!spec.hasAgentsGroup) return null;
    if (id === "agents") return null;
    const el = enNodesById.get(id);
    return id.startsWith("agents.") && el.kind !== "external" ? "agents" : null;
  };

  // Count outgoing/incoming edges per node to spread port attachment offsets cleanly
  const outCounts = new Map();
  const inCounts = new Map();
  for (const e of spec.edges) {
    outCounts.set(e.source, (outCounts.get(e.source) ?? 0) + 1);
    inCounts.set(e.target, (inCounts.get(e.target) ?? 0) + 1);
  }
  const outSeen = new Map();
  const inSeen = new Map();

  const placedLabels = [];
  const nodeRects = [...posById.entries()]
    .filter(([id]) => !(spec.hasAgentsGroup && id === "agents"))
    .map(([, b]) => b);

  const laidEdges = spec.edges.map((e, edgeIdx) => {
    const s = posById.get(e.source);
    const t = posById.get(e.target);
    const sIdx = outSeen.get(e.source) ?? 0;
    outSeen.set(e.source, sIdx + 1);
    const tIdx = inSeen.get(e.target) ?? 0;
    inSeen.set(e.target, tIdx + 1);
    const sTot = outCounts.get(e.source) ?? 1;
    const tTot = inCounts.get(e.target) ?? 1;

    const sSpread = ((sIdx + 1) / (sTot + 1) - 0.5) * 0.72;
    const tSpread = ((tIdx + 1) / (tTot + 1) - 0.5) * 0.72;

    const sameRank = s.rank === t.rank;
    const back = t.rank < s.rank;

    let points;
    if (sameRank) {
      const goRight = t.x > s.x;
      const sx = goRight ? s.x + s.width : s.x;
      const sy = Math.round(s.y + s.height * (0.5 + sSpread * 0.6));
      const tx = goRight ? t.x : t.x + t.width;
      const ty = Math.round(t.y + t.height * (0.5 + tSpread * 0.6));
      const arc = Math.abs(t.rank - s.rank) === 0 && Math.abs(tx - sx) > 120 ? -54 : -34;
      const mx = Math.round((sx + tx) / 2);
      const my = Math.round(Math.min(sy, ty) + arc);
      points = [
        [sx, sy],
        [Math.round(sx + (mx - sx) * 0.45), my],
        [Math.round(tx + (mx - tx) * 0.45), my],
        [tx, ty],
      ];
    } else if (!back) {
      const sx = Math.round(s.x + s.width * (0.5 + sSpread));
      const sy = s.y + s.height;
      const tx = Math.round(t.x + t.width * (0.5 + tSpread));
      const ty = t.y;
      const span = t.rank - s.rank;
      if (span === 1) {
        const dy = Math.round((ty - sy) * 0.5);
        points = [
          [sx, sy],
          [sx, sy + dy],
          [tx, ty - dy],
          [tx, ty],
        ];
      } else {
        // Route multi-rank edges along an inter-column lane to avoid cutting through middle boxes
        const laneShift = (edgeIdx % 2 === 0 ? 1 : -1) * (44 + (edgeIdx % 3) * 18);
        const mx = Math.round((sx + tx) / 2 + laneShift);
        const my = Math.round((sy + ty) / 2);
        points = [
          [sx, sy],
          [sx, sy + 52],
          [mx, my - 56],
          [mx, my],
          [mx, my + 56],
          [tx, ty - 52],
          [tx, ty],
        ];
      }
    } else {
      // Upward / back edge (note ArchitectureDiagram uses arrowOf([...points].reverse()) when back=true?
      // Wait: ArchitectureDiagram draws arrow at reverse().at(-1) which is points[0] when back=true!
      // Verify: in architecture.json back=true edges start at target and end at source!)
      // Let's keep back=false and route from source up to target so points.at(-1) IS always the target!
      const sx = Math.round(s.x + s.width * (0.5 + sSpread));
      const sy = s.y;
      const tx = Math.round(t.x + t.width * (0.5 + tSpread));
      const ty = t.y + t.height;
      const laneShift = (edgeIdx % 2 === 0 ? 1 : -1) * 38;
      const mx = Math.round((sx + tx) / 2 + laneShift);
      const my = Math.round((sy + ty) / 2);
      points = [
        [sx, sy],
        [sx, sy - 46],
        [mx, my + 46],
        [mx, my],
        [mx, my - 46],
        [tx, ty + 46],
        [tx, ty],
      ];
    }

    const midPt = points.length === 7 ? points[3] : [Math.round((points[0][0] + points[3][0]) / 2), Math.round((points[0][1] + points[3][1]) / 2)];
    const lbEn = measureLabelBox(e.label);
    const frLabel = frDict.labels?.[e.label];
    if (!frLabel) throw new Error(`Missing French label translation for "${e.label}"`);
    const lbFr = measureLabelBox(frLabel);
    const maxW = Math.max(lbEn.width, lbFr.width);
    const maxH = Math.max(lbEn.height, lbFr.height);

    let lx = Math.round(midPt[0] - maxW / 2);
    let ly = Math.round(midPt[1] - maxH / 2);
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const cand = { x: lx, y: ly, width: maxW, height: maxH };
      const hitsNode = nodeRects.some((r) => rectanglesOverlap(cand, r, 6));
      const hitsLabel = placedLabels.some((r) => rectanglesOverlap(cand, r, 8));
      if (!hitsNode && !hitsLabel) break;
      const dir = attempt % 2 === 0 ? 1 : -1;
      const step = Math.ceil((attempt + 1) / 2) * 16;
      ly += dir * step;
      if (attempt % 4 === 3) lx += dir * 24;
    }
    placedLabels.push({ x: lx, y: ly, width: maxW, height: maxH });

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      frLabel,
      points,
      labelBBox: { x: lx, y: ly, width: maxW, height: maxH },
      labelBBoxEn: { x: lx, y: ly, width: lbEn.width, height: lbEn.height },
      labelBBoxFr: { x: lx, y: ly, width: lbFr.width, height: lbFr.height },
      step: e.step,
      back: false,
    };
  });

  // Shift everything so there is >= 48px left margin (for step badges & component tabs) and >= 36px top margin (for person head)
  const allXs = [
    ...[...posById.values()].flatMap((b) => [b.x, b.x + b.width]),
    ...laidEdges.flatMap((e) => e.points.map((p) => p[0])),
    ...laidEdges.flatMap((e) => [e.labelBBox.x - (spec.dynamic ? 38 : 8), e.labelBBox.x + e.labelBBox.width + 8]),
  ];
  const allYs = [
    ...[...posById.values()].flatMap((b) => [b.y, b.y + b.height]),
    ...laidEdges.flatMap((e) => e.points.map((p) => p[1])),
    ...laidEdges.flatMap((e) => [e.labelBBox.y - 6, e.labelBBox.y + e.labelBBox.height + 6]),
  ];
  const minX = Math.min(...allXs);
  const minY = Math.min(...allYs);
  const shiftX = minX < 44 ? Math.ceil(44 - minX) : 0;
  const shiftY = minY < 32 ? Math.ceil(32 - minY) : 0;

  if (shiftX || shiftY) {
    for (const b of posById.values()) {
      b.x += shiftX;
      b.y += shiftY;
    }
    for (const e of laidEdges) {
      e.points = e.points.map(([px, py]) => [px + shiftX, py + shiftY]);
      e.labelBBox = { ...e.labelBBox, x: e.labelBBox.x + shiftX, y: e.labelBBox.y + shiftY };
      e.labelBBoxEn = { ...e.labelBBoxEn, x: e.labelBBoxEn.x + shiftX, y: e.labelBBoxEn.y + shiftY };
      e.labelBBoxFr = { ...e.labelBBoxFr, x: e.labelBBoxFr.x + shiftX, y: e.labelBBoxFr.y + shiftY };
    }
  }

  const maxX = Math.max(
    ...[...posById.values()].map((b) => b.x + b.width),
    ...laidEdges.flatMap((e) => e.points.map((p) => p[0])),
    ...laidEdges.map((e) => e.labelBBox.x + e.labelBBox.width + 12),
  );
  const maxY = Math.max(
    ...[...posById.values()].map((b) => b.y + b.height),
    ...laidEdges.flatMap((e) => e.points.map((p) => p[1])),
    ...laidEdges.map((e) => e.labelBBox.y + e.labelBBox.height + 12),
  );

  const bounds = { x: 0, y: 0, width: Math.ceil(maxX + 24), height: Math.ceil(maxY + 24) };
  const orderIds = spec.hasAgentsGroup ? ["agents", ...spec.nodeIds.filter((id) => id !== "agents")] : spec.nodeIds;

  const buildLocaleView = (locale) => ({
    id: spec.id,
    title: locale === "fr" ? frDict.views[spec.id] : spec.title,
    dynamic: spec.dynamic,
    bounds,
    nodes: orderIds.map((id) => {
      const el = (locale === "fr" ? frNodesById : enNodesById).get(id);
      const box = posById.get(id);
      return {
        id: el.id,
        parent: nodeParentOf(id),
        kind: el.kind,
        shape: el.shape,
        title: el.title,
        technology: el.technology,
        description: el.description,
        compound: spec.hasAgentsGroup && id === "agents",
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      };
    }),
    edges: laidEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: locale === "fr" ? e.frLabel : e.label,
      points: e.points,
      labelBBox: locale === "fr" ? e.labelBBoxFr : e.labelBBoxEn,
      step: e.step,
      back: e.back,
    })),
  });

  return { en: buildLocaleView("en"), fr: buildLocaleView("fr") };
}

function assertPublicClean(view, locale) {
  const strings = [
    view.title,
    ...view.nodes.flatMap((n) => [n.title, n.technology ?? "", n.description ?? ""]),
    ...view.edges.map((e) => e.label ?? ""),
  ];
  for (const s of strings) {
    if (!s) continue;
    const p = problems(s);
    if (p.length) throw new Error(`${view.id} (${locale}) breaks publication rules [${p.join(", ")}]: ${s}`);
    if (/harness/i.test(s)) throw new Error(`${view.id} (${locale}) contains forbidden word "harness": ${s}`);
    const look = aiLook(s);
    if (look.length) throw new Error(`${view.id} (${locale}) contains template words [${look.join(", ")}]: ${s}`);
  }
}

export function generateReleaseDiagrams(siteRoot = SITE_ROOT) {
  const modelMeta = JSON.parse(readFileSync(join(siteRoot, "data", "model-source.json"), "utf8"));
  const c4Path = join(siteRoot, "data", modelMeta.file);
  const c4Bytes = readFileSync(c4Path);
  const actualSha = sha256(c4Bytes);
  if (actualSha !== modelMeta.sha256) {
    throw new Error(`data/${modelMeta.file} sha256 (${actualSha}) does not match data/model-source.json (${modelMeta.sha256})`);
  }

  const frPath = join(siteRoot, "data", "krizaka-agents.fr.json");
  const frBytes = readFileSync(frPath);
  const frDict = JSON.parse(frBytes.toString("utf8"));
  const model = parseC4Model(c4Bytes.toString("utf8"));

  const specs = [buildC1Spec(model), buildC2Spec(model), buildTowerSpec(model), buildEventsSpec(model)];
  const enViews = [];
  const frViews = [];
  for (const spec of specs) {
    const { en, fr } = layoutView(spec, model, frDict);
    assertPublicClean(en, "en");
    assertPublicClean(fr, "fr");
    enViews.push(en);
    frViews.push(fr);
  }

  return {
    schema: "krizaka.layout/1",
    source: {
      file: modelMeta.file,
      sha256: modelMeta.sha256,
      repository: modelMeta.source.repository,
      path: modelMeta.source.path,
      copiedDate: modelMeta.source.copiedDate,
    },
    views: enViews,
    translations: {
      fr: {
        path: "data/krizaka-agents.fr.json",
        sha256: sha256(frBytes),
        views: frViews,
      },
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cmd = process.argv[2] ?? "generate";
  const outPath = join(SITE_ROOT, "lib", "release-diagrams.json");
  const payload = `${JSON.stringify(generateReleaseDiagrams(SITE_ROOT), null, 2)}\n`;
  if (cmd === "check") {
    const current = readFileSync(outPath, "utf8");
    if (current !== payload) {
      console.error("release-diagrams: lib/release-diagrams.json is out of date; run `node scripts/generate-release-diagrams.mjs`");
      process.exit(1);
    }
    console.log(`release-diagrams: ${RELEASE_VIEW_IDS.length} views verified from data/krizaka-agents.c4`);
  } else if (cmd === "generate") {
    writeFileSync(outPath, payload, "utf8");
    console.log(`release-diagrams: wrote ${RELEASE_VIEW_IDS.length} views to lib/release-diagrams.json`);
  } else {
    console.error("usage: generate-release-diagrams.mjs [generate|check]");
    process.exit(2);
  }
}
