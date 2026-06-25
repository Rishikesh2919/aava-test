// ---- Raw shapes coming out of the slimmed design-system.json ----

export interface RawColor {
  id: string;
  variable: string;
  value: string;
  details?: string;
  values?: Record<string, string>;
}

export interface RawTypography {
  id: string;
  role: string;
  family: string;
  size: string;
  weight: string;
  lineH: string;
}

export interface RawSpacing {
  id: string;
  name: string;
  px: number;
  source?: string;
}

export interface RawElevation {
  id: string;
  name: string;
  cssValue: string;
  desc?: string;
}

export interface RawWarning {
  stage: string;
  message: string;
  detail?: string;
}

export interface Metadata {
  project: string;
  version: string;
  lastUpdated: string;
  modes: string[];
  warnings: RawWarning[];
  scope?: string;
  pageName?: string;
}

export interface DesignSystem {
  metadata: Metadata;
  tokens: {
    colors: RawColor[];
    typography?: RawTypography[];
    spacing?: RawSpacing[];
    elevation?: RawElevation[];
    blur?: unknown[];
    strokes?: unknown[];
    opacity?: unknown[];
    borderRadius?: { id: string; name: string; px: number }[];
  };
  layout?: unknown;
  stats?: {
    componentCount: number;
    iconCount: number;
    componentCategories: Record<string, number>;
    sourceFile: string;
    generatedAt: string;
  };
}

// ---- Derived / normalized shapes used by the UI ----

export type SemanticGroup =
  | "Background"
  | "Text"
  | "Border"
  | "Surface"
  | "Interactive"
  | "Feedback"
  | "Icon"
  | "Other";

export interface ColorToken {
  id: string;
  /** variable name, e.g. "amber-50" */
  variable: string;
  /** default flat value (hex) */
  value: string;
  /** full path string, e.g. "Global color/Global colors/Amber/50" */
  path: string;
  /** per-mode value map */
  modes: Record<string, string>;
  /** top-level category from the path */
  category: string;
  /** true when this looks like a role token rather than a raw palette entry */
  isSemantic: boolean;
  semanticGroup: SemanticGroup | null;
  /** scale family name, e.g. "amber" (null when not a numbered scale) */
  family: string | null;
  /** scale step, e.g. 50, 100 ... (null when not a numbered scale) */
  step: number | null;
  /** whether the value carries an alpha channel */
  hasAlpha: boolean;
}

export interface ColorFamily {
  name: string;
  /** pretty display name, e.g. "Nova Green" */
  label: string;
  tokens: ColorToken[]; // sorted by step ascending
}

export interface WarningGroup {
  key: string;
  label: string;
  severity: Severity;
  warnings: NormalizedWarning[];
}

export type Severity = "high" | "medium" | "low";

export interface NormalizedWarning {
  id: string;
  stage: string;
  group: string;
  message: string;
  detail?: string;
  severity: Severity;
}
