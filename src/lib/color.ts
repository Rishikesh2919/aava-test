// Color parsing + WCAG contrast utilities.
//
// Handles 3/4/6/8-digit hex (the export contains 8-digit alpha values such as
// "#0E1B2BB2"). Alpha colors are composited over a supplied background before
// luminance/contrast math, since contrast is only meaningful for opaque pixels.

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number; // 0..1
}

export function parseColor(input: string): RGBA | null {
  if (!input) return null;
  let s = input.trim();

  // rgb()/rgba()
  const rgbMatch = s.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(/[,\s/]+/).filter(Boolean);
    const r = clamp255(parseFloat(parts[0]));
    const g = clamp255(parseFloat(parts[1]));
    const b = clamp255(parseFloat(parts[2]));
    const a = parts[3] != null ? clamp01(parseFloat(parts[3])) : 1;
    if ([r, g, b].some(Number.isNaN)) return null;
    return { r, g, b, a };
  }

  if (s[0] === "#") s = s.slice(1);
  if (!/^[0-9a-fA-F]+$/.test(s)) return null;

  if (s.length === 3 || s.length === 4) {
    const r = parseInt(s[0] + s[0], 16);
    const g = parseInt(s[1] + s[1], 16);
    const b = parseInt(s[2] + s[2], 16);
    const a = s.length === 4 ? parseInt(s[3] + s[3], 16) / 255 : 1;
    return { r, g, b, a };
  }
  if (s.length === 6 || s.length === 8) {
    const r = parseInt(s.slice(0, 2), 16);
    const g = parseInt(s.slice(2, 4), 16);
    const b = parseInt(s.slice(4, 6), 16);
    const a = s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }
  return null;
}

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Composite a (possibly translucent) color over an opaque background. */
export function flatten(fg: RGBA, bg: RGBA = { r: 255, g: 255, b: 255, a: 1 }): RGBA {
  const a = fg.a;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
    a: 1,
  };
}

export function toHex({ r, g, b, a }: RGBA): string {
  const h = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  const base = `#${h(r)}${h(g)}${h(b)}`;
  return a < 1 ? `${base}${h(Math.round(a * 255))}` : base;
}

export function toCss(rgba: RGBA): string {
  return rgba.a < 1
    ? `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a.toFixed(3)})`
    : `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(rgb: RGBA): number {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio between two colors (alpha composited over white). */
export function contrastRatio(fg: string | RGBA, bg: string | RGBA): number {
  const f = typeof fg === "string" ? parseColor(fg) : fg;
  const b = typeof bg === "string" ? parseColor(bg) : bg;
  if (!f || !b) return 1;
  const bFlat = flatten(b);
  const fFlat = flatten(f, bFlat);
  const l1 = relativeLuminance(fFlat);
  const l2 = relativeLuminance(bFlat);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export interface ContrastResult {
  ratio: number;
  aaNormal: boolean; // >= 4.5
  aaLarge: boolean; // >= 3
  aaaNormal: boolean; // >= 7
  aaaLarge: boolean; // >= 4.5
  label: "Fail" | "AA Large" | "AA" | "AAA";
}

export function evaluateContrast(fg: string | RGBA, bg: string | RGBA): ContrastResult {
  const ratio = contrastRatio(fg, bg);
  const aaNormal = ratio >= 4.5;
  const aaLarge = ratio >= 3;
  const aaaNormal = ratio >= 7;
  const aaaLarge = ratio >= 4.5;
  let label: ContrastResult["label"] = "Fail";
  if (aaaNormal) label = "AAA";
  else if (aaNormal) label = "AA";
  else if (aaLarge) label = "AA Large";
  return { ratio, aaNormal, aaLarge, aaaNormal, aaaLarge, label };
}

/** Pick black or white text for best legibility on a given background. */
export function readableTextColor(bg: string | RGBA): "#000000" | "#FFFFFF" {
  const c = typeof bg === "string" ? parseColor(bg) : bg;
  if (!c) return "#000000";
  const lum = relativeLuminance(flatten(c));
  return lum > 0.5 ? "#000000" : "#FFFFFF";
}

export function isValidColor(input: string): boolean {
  return parseColor(input) != null;
}

/** HSL of a color (alpha composited over white). h:0-360, s/l:0-1. */
export function toHsl(input: string | RGBA): { h: number; s: number; l: number } | null {
  const c = typeof input === "string" ? parseColor(input) : input;
  if (!c) return null;
  const { r, g, b } = flatten(c);
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6;
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}
