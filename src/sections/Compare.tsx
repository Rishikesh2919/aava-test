import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import { SectionHeader, Pill } from "../components/ui";

type DiffKind = "changed" | "same" | "onlyA" | "onlyB";

export function Compare() {
  const { colors, inspect } = useApp();
  const modes = colors.valueModes;

  const [a, setA] = useState(modes.includes("Light") ? "Light" : modes[0] ?? "");
  const [b, setB] = useState(modes.includes("Dark") ? "Dark" : modes[1] ?? modes[0] ?? "");
  const [filter, setFilter] = useState<"changed" | "all" | "onlyA" | "onlyB">("changed");

  const rows = useMemo(() => {
    return colors.tokens
      .map((t) => {
        const va = t.modes[a];
        const vb = t.modes[b];
        let kind: DiffKind;
        if (va && vb) kind = va.toLowerCase() === vb.toLowerCase() ? "same" : "changed";
        else if (va) kind = "onlyA";
        else if (vb) kind = "onlyB";
        else return null;
        return { token: t, va, vb, kind };
      })
      .filter(Boolean) as { token: (typeof colors.tokens)[number]; va?: string; vb?: string; kind: DiffKind }[];
  }, [colors.tokens, a, b]);

  const counts = useMemo(() => {
    const c = { changed: 0, same: 0, onlyA: 0, onlyB: 0 };
    rows.forEach((r) => c[r.kind]++);
    return c;
  }, [rows]);

  const shown = rows.filter((r) => (filter === "all" ? true : r.kind === filter));

  return (
    <div>
      <SectionHeader title="Theme Comparison" subtitle="Side-by-side token values across two modes." />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <ModeSelect label="Theme A" value={a} onChange={setA} options={modes} />
        <span className="text-ink-400">vs</span>
        <ModeSelect label="Theme B" value={b} onChange={setB} options={modes} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip active={filter === "changed"} onClick={() => setFilter("changed")}>
          Changed {counts.changed}
        </FilterChip>
        <FilterChip active={filter === "onlyB"} onClick={() => setFilter("onlyB")}>
          Added in B {counts.onlyB}
        </FilterChip>
        <FilterChip active={filter === "onlyA"} onClick={() => setFilter("onlyA")}>
          Only in A {counts.onlyA}
        </FilterChip>
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          All {rows.length}
        </FilterChip>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-12 gap-3 border-b border-ink-200 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-800">
          <div className="col-span-4">Token</div>
          <div className="col-span-3">{a || "A"}</div>
          <div className="col-span-3">{b || "B"}</div>
          <div className="col-span-2 text-right">Status</div>
        </div>
        <div className="divide-y divide-ink-100 dark:divide-ink-800">
          {shown.map((r) => (
            <button
              key={r.token.id}
              onClick={() => inspect(r.token)}
              className="grid w-full grid-cols-12 items-center gap-3 px-4 py-2.5 text-left hover:bg-ink-50 dark:hover:bg-ink-800/50"
            >
              <div className="col-span-4 min-w-0">
                <div className="mono truncate text-sm font-medium">{r.token.variable}</div>
              </div>
              <Cell hex={r.va} />
              <Cell hex={r.vb} />
              <div className="col-span-2 flex justify-end">
                <StatusPill kind={r.kind} />
              </div>
            </button>
          ))}
          {shown.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-ink-400">No tokens in this category.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Cell({ hex }: { hex?: string }) {
  return (
    <div className="col-span-3 flex items-center gap-2">
      {hex ? (
        <>
          <span className="h-5 w-5 flex-none rounded border border-black/10" style={{ background: hex }} />
          <span className="mono truncate text-xs text-ink-500 dark:text-ink-400">{hex}</span>
        </>
      ) : (
        <span className="text-xs text-ink-300">—</span>
      )}
    </div>
  );
}

function StatusPill({ kind }: { kind: DiffKind }) {
  if (kind === "changed") return <Pill tone="brand">changed</Pill>;
  if (kind === "onlyB") return <Pill tone="green">added</Pill>;
  if (kind === "onlyA") return <Pill tone="red">removed</Pill>;
  return <Pill tone="neutral">same</Pill>;
}

function ModeSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-ink-400">{label}</span>
      <select className="input w-40" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-brand-600 text-white"
          : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
      }`}
    >
      {children}
    </button>
  );
}
