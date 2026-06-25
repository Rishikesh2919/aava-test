import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import { SectionHeader, Icon, CopyButton } from "../components/ui";
import { valueForMode } from "../lib/parser";
import { readableTextColor } from "../lib/color";
import { ColorToken, SemanticGroup } from "../types";

const GROUP_ORDER: SemanticGroup[] = [
  "Background",
  "Text",
  "Border",
  "Surface",
  "Interactive",
  "Feedback",
  "Icon",
  "Other",
];

const GROUP_BLURB: Record<SemanticGroup, string> = {
  Background: "Page and section background fills",
  Text: "Foreground text and label colors",
  Border: "Borders, dividers and focus rings",
  Surface: "Cards, sheets and elevated surfaces",
  Interactive: "Buttons, links and interactive states",
  Feedback: "Success, error, warning and info",
  Icon: "Icon fills and strokes",
  Other: "Uncategorized semantic roles",
};

export function Semantic() {
  const { colors, tokenMode, inspect } = useApp();
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<SemanticGroup, ColorToken[]>();
    for (const t of colors.semantic) {
      if (q && !t.variable.toLowerCase().includes(q) && !t.path.toLowerCase().includes(q)) continue;
      const g = (t.semanticGroup ?? "Other") as SemanticGroup;
      (map.get(g) ?? map.set(g, []).get(g)!).push(t);
    }
    return map;
  }, [colors.semantic, query]);

  return (
    <div>
      <SectionHeader
        title="Semantic Tokens"
        subtitle={`${colors.semantic.length} role-based tokens · resolved for "${tokenMode}"`}
        right={
          <div className="relative w-56">
            <Icon.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input className="input pl-9" placeholder="Search tokens…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        }
      />

      {colors.semantic.length === 0 && (
        <div className="rounded-xl border border-dashed border-ink-300 p-12 text-center text-sm text-ink-400 dark:border-ink-700">
          No semantic tokens detected in this export.
        </div>
      )}

      <div className="space-y-8">
        {GROUP_ORDER.map((g) => {
          const list = grouped.get(g);
          if (!list || list.length === 0) return null;
          return (
            <section key={g}>
              <div className="mb-3 flex items-baseline gap-3">
                <h3 className="text-sm font-bold">{g}</h3>
                <span className="text-xs text-ink-400">{GROUP_BLURB[g]}</span>
                <span className="ml-auto text-xs font-semibold text-ink-400">{list.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((t) => (
                  <SemanticCard key={t.id} token={t} mode={tokenMode} onClick={() => inspect(t)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function SemanticCard({ token, mode, onClick }: { token: ColorToken; mode: string; onClick: () => void }) {
  const hex = valueForMode(token, mode);
  const txt = readableTextColor(hex);
  return (
    <button onClick={onClick} className="card group flex items-stretch overflow-hidden text-left transition hover:shadow-md">
      <div className="flex w-24 flex-none flex-col justify-end p-2" style={{ background: hex, color: txt }}>
        <span className="text-[10px] font-semibold opacity-80">Aa</span>
      </div>
      <div className="min-w-0 flex-1 p-3">
        <div className="mono truncate text-sm font-semibold">{token.variable}</div>
        <div className="mt-0.5 truncate text-[11px] text-ink-400">{token.path}</div>
        <div className="mt-2 flex items-center gap-2">
          <span className="mono text-xs text-ink-500 dark:text-ink-400">{hex}</span>
          <div onClick={(e) => e.stopPropagation()} className="ml-auto">
            <CopyButton text={hex} label={token.variable} />
          </div>
        </div>
      </div>
    </button>
  );
}
