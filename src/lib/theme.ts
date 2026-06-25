// Resolves a usable component theme from the token set for a given mode.
// Picks the best-matching token per role (preferring page-level semantic tokens),
// with validation + fallbacks so the playground always renders something coherent.
//
// Two classes of failure this guards against, both seen in real exports:
//  1. Component/state tokens leaking into structural roles — e.g. a *button*
//     `background-default` (#E91E63) being chosen for the page background.
//  2. The wrong brand color for a neutral role — e.g. `brand-secondary` (purple)
//     chosen for a disabled-button background that should be a light neutral.
// We exclude component/state tokens from structural roles and validate the picked
// color's lightness/saturation against what the role plausibly allows.

import { ColorToken } from "../types";
import { valueForMode } from "./parser";
import { toHsl } from "./color";

export interface ResolvedTheme {
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  secondary: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  /** which token (if any) backed each role, for provenance display */
  sources: Partial<Record<Role, string>>;
}

type Role = Exclude<keyof ResolvedTheme, "sources">;

// keyword priority list per role. Earlier = stronger match.
const RULES: Record<Role, string[]> = {
  bg: ["background-primary", "background-default", "page", "canvas", "bg-default", "background"],
  surface: ["surface", "card-background", "background-secondary", "elevated", "panel"],
  text: ["text-primary", "text-heading", "text-default", "text-body", "foreground", "text"],
  textMuted: ["text-secondary", "text-caption", "text-muted", "text-tertiary"],
  border: ["border-default", "border-subtle", "border", "divider", "stroke", "outline"],
  primary: ["brand-primary", "interactive-default", "interactive", "accent", "primary", "brand", "action"],
  primaryText: ["text-on-brand", "on-brand", "text-on-primary", "on-primary", "text-inverse"],
  secondary: ["background-secondary", "surface-secondary", "neutral-100", "muted", "secondary"],
  success: ["success", "positive", "feedback-success"],
  error: ["error", "danger", "negative", "feedback-error"],
  warning: ["warning", "caution", "feedback-warning"],
  info: ["info", "feedback-info"],
};

const FALLBACK_LIGHT: Record<Role, string> = {
  bg: "#FFFFFF",
  surface: "#F7F8FA",
  text: "#101828",
  textMuted: "#667085",
  border: "#E4E7EC",
  primary: "#3563FF",
  primaryText: "#FFFFFF",
  secondary: "#EAECF0",
  success: "#16A34A",
  error: "#DC2626",
  warning: "#D97706",
  info: "#2563EB",
};

const FALLBACK_DARK: Record<Role, string> = {
  bg: "#0E121B",
  surface: "#161B26",
  text: "#F5F7FA",
  textMuted: "#98A2B3",
  border: "#2A313F",
  primary: "#5984FF",
  primaryText: "#0E121B",
  secondary: "#222A38",
  success: "#4ADE80",
  error: "#F87171",
  warning: "#FBBF24",
  info: "#60A5FA",
};

// Structural roles must be sourced from base theme tokens, never component/state ones.
const STRUCTURAL = new Set<Role>(["bg", "surface", "text", "textMuted", "border", "secondary", "primaryText"]);

// Component- or state-specific tokens that should not define the base theme.
const EXCLUDE_RE =
  /component|button|input field|\bcards?\/|tooltip|skeleton|nav bar|badge|chip|\btab\b|modal|hover|active|pressed|disabled|focus|selected|placeholder/i;

function isComponentOrState(t: ColorToken): boolean {
  return EXCLUDE_RE.test(t.path) || /(hover|active|pressed|disabled|focus)$/i.test(t.variable);
}

/** Does a candidate color make sense for the role, given light/dark mode? */
function validate(role: Role, hex: string, isDark: boolean): boolean {
  const hsl = toHsl(hex);
  if (!hsl) return false;
  const { s, l } = hsl;
  switch (role) {
    case "bg":
      return isDark ? l <= 0.22 : l >= 0.9;
    case "surface":
      return isDark ? l <= 0.3 : l >= 0.85;
    case "secondary": // light neutral fill (track / disabled bg)
      return isDark ? l <= 0.35 && s <= 0.3 : l >= 0.82 && s <= 0.35;
    case "text":
      return isDark ? l >= 0.7 : l <= 0.5;
    case "textMuted":
      return isDark ? l >= 0.55 && l <= 0.9 : l >= 0.3 && l <= 0.72;
    case "border":
      return isDark ? l >= 0.2 && l <= 0.45 : l >= 0.7 && l <= 0.97;
    case "primaryText":
      return isDark ? l <= 0.25 : l >= 0.82;
    case "primary":
      return l >= 0.2 && l <= 0.78 && s >= 0.25;
    case "success":
    case "error":
    case "warning":
    case "info":
      return l >= 0.25 && l <= 0.78 && s >= 0.2;
    default:
      return true;
  }
}

function pick(
  tokens: ColorToken[],
  mode: string,
  role: Role,
  isDark: boolean
): { hex: string; source: string } | null {
  const kws = RULES[role];
  let bestVar = "";
  let bestHex = "";
  let bestScore = -Infinity;

  for (let rank = 0; rank < kws.length; rank++) {
    const kw = kws[rank];
    for (const t of tokens) {
      const hay = `${t.variable} ${t.path}`.toLowerCase();
      if (!hay.includes(kw)) continue;
      if (STRUCTURAL.has(role) && (t.hasAlpha || isComponentOrState(t))) continue;

      const hex = valueForMode(t, mode);
      if (!validate(role, hex, isDark)) continue;

      let s = (kws.length - rank) * 100; // earlier keyword = stronger
      if (t.isSemantic) s += 40;
      if (t.variable.toLowerCase().includes(kw)) s += 30;
      if (t.step !== null) s -= 80; // avoid scale steps (blue-500) for roles
      if (s > bestScore) {
        bestScore = s;
        bestHex = hex;
        bestVar = t.variable;
      }
    }
  }

  return bestScore > -Infinity ? { hex: bestHex, source: bestVar } : null;
}

export function resolveTheme(tokens: ColorToken[], mode: string): ResolvedTheme {
  const isDark = /dark/i.test(mode);
  const fallback = isDark ? FALLBACK_DARK : FALLBACK_LIGHT;
  const out = { sources: {} } as ResolvedTheme;
  (Object.keys(RULES) as Role[]).forEach((role) => {
    const found = pick(tokens, mode, role, isDark);
    out[role] = found?.hex ?? fallback[role];
    if (found) out.sources[role] = found.source;
  });
  return out;
}
