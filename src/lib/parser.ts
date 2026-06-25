// Normalizes the raw design-system export into the typed shapes the UI uses.
// All categorization heuristics live here so they are transparent and tweakable.

import {
  ColorFamily,
  ColorToken,
  DesignSystem,
  NormalizedWarning,
  RawColor,
  RawWarning,
  SemanticGroup,
  Severity,
  WarningGroup,
} from "../types";
import { parseColor } from "./color";

const SEMANTIC_GROUP_RULES: { group: SemanticGroup; words: string[] }[] = [
  { group: "Background", words: ["background", "bg-", "-bg", "backdrop"] },
  { group: "Text", words: ["text", "label", "foreground", "content", "-fg", "typography"] },
  { group: "Border", words: ["border", "stroke", "outline", "divider", "focus-ring"] },
  { group: "Surface", words: ["surface", "fill", "card", "sheet", "layer", "elevation", "overlay"] },
  {
    group: "Feedback",
    words: ["feedback", "success", "error", "danger", "warning", "info", "alert", "positive", "negative", "caution"],
  },
  {
    group: "Interactive",
    words: ["interactive", "action", "button", "link", "hover", "pressed", "active", "accent", "cta", "primary", "secondary"],
  },
  { group: "Icon", words: ["icon"] },
];

const ROLE_WORDS = SEMANTIC_GROUP_RULES.flatMap((r) => r.words);

const SCALE_RE = /[-_ ]?(\d{2,3})$/; // trailing 2–3 digit step

export function prettyLabel(name: string): string {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function deriveSemanticGroup(variable: string, path: string): SemanticGroup | null {
  const hay = `${variable} ${path}`.toLowerCase();
  for (const rule of SEMANTIC_GROUP_RULES) {
    if (rule.words.some((w) => hay.includes(w))) return rule.group;
  }
  return null;
}

function normalizeColor(c: RawColor): ColorToken {
  const path = c.details ?? "";
  const variable = c.variable ?? c.id;
  const value = c.value ?? Object.values(c.values ?? {})[0] ?? "#000000";

  const modes: Record<string, string> =
    c.values && Object.keys(c.values).length ? { ...c.values } : { Default: value };

  // scale family + step
  let family: string | null = null;
  let step: number | null = null;
  const m = variable.match(SCALE_RE);
  if (m) {
    step = parseInt(m[1], 10);
    family = variable.slice(0, m.index).replace(/[-_ ]+$/, "") || variable;
  }

  const isScale = step !== null;
  const hasRole = ROLE_WORDS.some((w) => `${variable} ${path}`.toLowerCase().includes(w));
  const hasSemanticPath = /semantic/i.test(path);
  const isSemantic = (hasSemanticPath || hasRole) && !isScale;
  const semanticGroup = isSemantic ? deriveSemanticGroup(variable, path) ?? "Other" : null;

  const rgba = parseColor(value);
  const hasAlpha = !!rgba && rgba.a < 1;

  let category: string;
  if (isSemantic) category = "Semantic";
  else if (hasAlpha || /opacity/i.test(path)) category = "Opacity";
  else if (isScale) category = "Scale";
  else category = "Primitive";

  return {
    id: c.id,
    variable,
    value,
    path,
    modes,
    category,
    isSemantic,
    semanticGroup,
    family,
    step,
    hasAlpha,
  };
}

export interface ParsedColors {
  tokens: ColorToken[];
  semantic: ColorToken[];
  families: ColorFamily[];
  categories: string[];
  /** every mode key that actually appears in color values, in stable order */
  valueModes: string[];
}

export function parseColors(ds: DesignSystem): ParsedColors {
  const raw = ds.tokens.colors ?? [];
  const tokens = raw.map(normalizeColor);

  const semantic = tokens.filter((t) => t.isSemantic);

  // Build scale families (require >= 3 steps to qualify as a real scale).
  const byFamily = new Map<string, ColorToken[]>();
  for (const t of tokens) {
    if (t.family && t.step !== null && !t.isSemantic) {
      const arr = byFamily.get(t.family) ?? [];
      arr.push(t);
      byFamily.set(t.family, arr);
    }
  }
  const families: ColorFamily[] = [];
  for (const [name, arr] of byFamily) {
    if (arr.length < 3) continue;
    const sorted = [...arr].sort((a, b) => (a.step! - b.step!));
    families.push({ name, label: prettyLabel(name), tokens: sorted });
  }
  families.sort((a, b) => b.tokens.length - a.tokens.length || a.label.localeCompare(b.label));

  const categories = Array.from(new Set(tokens.map((t) => t.category))).sort();

  // Order value modes with Light/Dark first, then the rest as encountered.
  const seen = new Set<string>();
  const valueModes: string[] = [];
  for (const pref of ["Light", "Dark"]) {
    if (tokens.some((t) => pref in t.modes)) {
      valueModes.push(pref);
      seen.add(pref);
    }
  }
  for (const t of tokens) {
    for (const k of Object.keys(t.modes)) {
      if (!seen.has(k)) {
        seen.add(k);
        valueModes.push(k);
      }
    }
  }

  return { tokens, semantic, families, categories, valueModes };
}

/** Resolve a token's value for a given mode, falling back gracefully. */
export function valueForMode(t: ColorToken, mode: string): string {
  if (t.modes[mode]) return t.modes[mode];
  // fall back to Light, then Default, then the flat value
  return t.modes.Light ?? t.modes.Default ?? t.value;
}

// ---------- Warnings ----------

const WARNING_GROUPS: { test: RegExp; key: string; label: string; severity: Severity }[] = [
  { test: /^colors:merge/, key: "merge", label: "Merge issues", severity: "low" },
  { test: /^colors:collision/, key: "collision", label: "Collision issues", severity: "high" },
  { test: /typo/, key: "typo", label: "Typo issues", severity: "medium" },
  { test: /scale-validation/, key: "scale", label: "Scale validation issues", severity: "medium" },
  { test: /dark-mode-validation/, key: "darkmode", label: "Dark mode validation issues", severity: "medium" },
];

function classifyWarning(w: RawWarning, idx: number): NormalizedWarning {
  const stage = w.stage ?? "unknown";
  const match = WARNING_GROUPS.find((g) => g.test.test(stage));
  return {
    id: `w_${idx}`,
    stage,
    group: match?.key ?? "other",
    message: w.message ?? "",
    detail: w.detail,
    severity: match?.severity ?? "low",
  };
}

export function parseWarnings(ds: DesignSystem): {
  all: NormalizedWarning[];
  groups: WarningGroup[];
} {
  const all = (ds.metadata.warnings ?? []).map(classifyWarning);
  const groups: WarningGroup[] = [];
  for (const def of WARNING_GROUPS) {
    const warnings = all.filter((w) => w.group === def.key);
    if (warnings.length) {
      groups.push({ key: def.key, label: def.label, severity: def.severity, warnings });
    }
  }
  const other = all.filter((w) => w.group === "other");
  if (other.length) {
    groups.push({ key: "other", label: "Other issues", severity: "low", warnings: other });
  }
  return { all, groups };
}
