import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import { SectionHeader, Icon } from "../components/ui";
import { valueForMode } from "../lib/parser";
import { readableTextColor, evaluateContrast } from "../lib/color";
import { ColorFamily } from "../types";

export function Scales() {
  const { colors, tokenMode, inspect } = useApp();
  const [query, setQuery] = useState("");

  const families = useMemo(() => {
    const q = query.trim().toLowerCase();
    return colors.families.filter((f) => !q || f.label.toLowerCase().includes(q));
  }, [colors.families, query]);

  return (
    <div>
      <SectionHeader
        title="Color Scale Visualization"
        subtitle={`${colors.families.length} token families · 50 → 900 progressions for "${tokenMode}"`}
        right={
          <div className="relative w-56">
            <Icon.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-9"
              placeholder="Filter families…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        }
      />

      <div className="space-y-5">
        {families.map((f) => (
          <ScaleRow key={f.name} family={f} mode={tokenMode} onPick={(id) => {
            const tok = f.tokens.find((t) => t.id === id);
            if (tok) inspect(tok);
          }} />
        ))}
        {families.length === 0 && (
          <div className="rounded-xl border border-dashed border-ink-300 p-12 text-center text-sm text-ink-400 dark:border-ink-700">
            No families match.
          </div>
        )}
      </div>
    </div>
  );
}

function ScaleRow({ family, mode, onPick }: { family: ColorFamily; mode: string; onPick: (id: string) => void }) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold capitalize">{family.label}</h3>
        <span className="text-xs text-ink-400">{family.tokens.length} steps</span>
      </div>

      {/* gradient progression bar */}
      <div className="mb-3 h-2 overflow-hidden rounded-full">
        <div
          className="h-full w-full"
          style={{
            background: `linear-gradient(90deg, ${family.tokens
              .map((t) => valueForMode(t, mode))
              .join(", ")})`,
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-11">
        {family.tokens.map((t) => {
          const hex = valueForMode(t, mode);
          const txt = readableTextColor(hex);
          const onWhite = evaluateContrast(hex, "#FFFFFF").ratio;
          return (
            <button
              key={t.id}
              onClick={() => onPick(t.id)}
              className="group overflow-hidden rounded-lg border border-black/5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
              title={`${t.variable} · ${hex}`}
            >
              <div className="flex h-16 items-start justify-end p-1.5" style={{ background: hex, color: txt }}>
                <span className="text-[10px] font-bold opacity-80">{t.step}</span>
              </div>
              <div className="bg-white px-1.5 py-1 dark:bg-ink-900">
                <div className="mono truncate text-[10px] text-ink-500 dark:text-ink-400">{hex}</div>
                <div className="text-[9px] text-ink-400">{onWhite.toFixed(1)}:1</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
