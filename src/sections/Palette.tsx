import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import { SectionHeader, Icon, CopyButton } from "../components/ui";
import { valueForMode } from "../lib/parser";
import { readableTextColor } from "../lib/color";
import { ColorToken } from "../types";

export function Palette() {
  const { colors, tokenMode, inspect } = useApp();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return colors.tokens.filter((t) => {
      if (cat !== "all" && t.category !== cat) return false;
      if (!q) return true;
      return (
        t.variable.toLowerCase().includes(q) ||
        t.path.toLowerCase().includes(q) ||
        valueForMode(t, tokenMode).toLowerCase().includes(q)
      );
    });
  }, [colors.tokens, query, cat, tokenMode]);

  return (
    <div>
      <SectionHeader
        title="Color Palette Explorer"
        subtitle={`${filtered.length} of ${colors.tokens.length} tokens · values shown for "${tokenMode}"`}
        right={
          <div className="flex items-center gap-1 rounded-lg border border-ink-200 p-0.5 dark:border-ink-700">
            <ViewBtn active={view === "grid"} onClick={() => setView("grid")}>
              <Icon.Grid />
            </ViewBtn>
            <ViewBtn active={view === "list"} onClick={() => setView("list")}>
              <Icon.List />
            </ViewBtn>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Icon.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Search name, path or hex…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="input max-w-[200px]" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {colors.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-300 p-12 text-center text-sm text-ink-400 dark:border-ink-700">
          No tokens match your filters.
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filtered.map((t) => (
            <SwatchCard key={t.id} token={t} mode={tokenMode} onClick={() => inspect(t)} />
          ))}
        </div>
      ) : (
        <div className="card divide-y divide-ink-100 overflow-hidden dark:divide-ink-800">
          {filtered.map((t) => (
            <Row key={t.id} token={t} mode={tokenMode} onClick={() => inspect(t)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ViewBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md p-1.5 transition ${
        active ? "bg-brand-600 text-white" : "text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
      }`}
    >
      {children}
    </button>
  );
}

function SwatchCard({ token, mode, onClick }: { token: ColorToken; mode: string; onClick: () => void }) {
  const hex = valueForMode(token, mode);
  const txt = readableTextColor(hex);
  return (
    <button
      onClick={onClick}
      className="card group overflow-hidden text-left transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-24" style={{ background: hex, color: txt }}>
        <span className="mono absolute bottom-2 left-2 text-[11px] font-semibold opacity-90">{hex}</span>
        <div onClick={(e) => e.stopPropagation()} className="absolute right-1.5 top-1.5 opacity-0 transition group-hover:opacity-100">
          <CopyButton text={hex} label={token.variable} className="!text-current hover:!bg-black/10" />
        </div>
      </div>
      <div className="p-3">
        <div className="mono truncate text-xs font-semibold">{token.variable}</div>
        <div className="mt-0.5 truncate text-[11px] text-ink-400">{token.category}</div>
      </div>
    </button>
  );
}

function Row({ token, mode, onClick }: { token: ColorToken; mode: string; onClick: () => void }) {
  const hex = valueForMode(token, mode);
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 px-4 py-2.5 text-left hover:bg-ink-50 dark:hover:bg-ink-800/50">
      <span className="h-9 w-9 flex-none rounded-md border border-black/10" style={{ background: hex }} />
      <span className="mono w-48 flex-none truncate text-sm font-semibold">{token.variable}</span>
      <span className="hidden flex-1 truncate text-xs text-ink-400 sm:block">{token.path}</span>
      <span className="chip bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">{token.category}</span>
      <span className="mono w-24 text-right text-xs text-ink-500 dark:text-ink-400">{hex}</span>
      <div onClick={(e) => e.stopPropagation()}>
        <CopyButton text={hex} label={token.variable} />
      </div>
    </button>
  );
}
