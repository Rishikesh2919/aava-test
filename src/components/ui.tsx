import { ReactNode } from "react";
import { Severity } from "../types";
import { useApp } from "../store/AppContext";

// ---------- Minimal inline icon set (no icon dependency) ----------
type IconProps = { className?: string };
const base = "h-4 w-4";

export const Icon = {
  Copy: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  ),
  Check: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={className}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  ),
  Search: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Grid: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  List: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  Sun: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  Moon: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  ),
  Close: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  Warn: ({ className = base }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  ),
};

// ---------- Severity badge ----------
const sevStyles: Record<Severity, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  low: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`chip ${sevStyles[severity]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {severity}
    </span>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" | "green" | "red" }) {
  const map = {
    neutral: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
    brand: "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    red: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  };
  return <span className={`chip ${map[tone]}`}>{children}</span>;
}

// ---------- Copy button ----------
export function CopyButton({
  text,
  label,
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const { copy } = useApp();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        copy(text, label);
      }}
      title={`Copy ${text}`}
      className={`inline-flex items-center justify-center rounded-md p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-100 ${className}`}
    >
      <Icon.Copy />
    </button>
  );
}

// ---------- Section heading ----------
export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-300 p-10 text-center text-sm text-ink-500 dark:border-ink-700 dark:text-ink-400">
      {children}
    </div>
  );
}
