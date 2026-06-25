import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import { SectionHeader, SeverityBadge, Icon } from "../components/ui";
import { Severity } from "../types";

export function Issues() {
  const { warnings } = useApp();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [sev, setSev] = useState<"all" | Severity>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return warnings.all.filter((w) => {
      if (group !== "all" && w.group !== group) return false;
      if (sev !== "all" && w.severity !== sev) return false;
      if (!q) return true;
      return (
        w.message.toLowerCase().includes(q) ||
        (w.detail ?? "").toLowerCase().includes(q) ||
        w.stage.toLowerCase().includes(q)
      );
    });
  }, [warnings.all, query, group, sev]);

  // group the filtered results back into their buckets, preserving group meta
  const buckets = warnings.groups
    .map((g) => ({ ...g, items: filtered.filter((w) => w.group === g.key) }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <SectionHeader
        title="Validation Issues"
        subtitle={`${warnings.all.length} warnings from the export · ${filtered.length} shown`}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Icon.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input className="input pl-9" placeholder="Search warnings…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="input max-w-[220px]" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="all">All groups</option>
          {warnings.groups.map((g) => (
            <option key={g.key} value={g.key}>
              {g.label} ({g.warnings.length})
            </option>
          ))}
        </select>
        <select className="input max-w-[160px]" value={sev} onChange={(e) => setSev(e.target.value as never)}>
          <option value="all">All severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {buckets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-300 p-12 text-center text-sm text-ink-400 dark:border-ink-700">
          No warnings match your filters. 🎉
        </div>
      ) : (
        <div className="space-y-6">
          {buckets.map((g) => (
            <section key={g.key}>
              <div className="mb-2 flex items-center gap-3">
                <h3 className="text-sm font-bold">{g.label}</h3>
                <SeverityBadge severity={g.severity} />
                <span className="ml-auto text-xs text-ink-400">{g.items.length}</span>
              </div>
              <div className="card divide-y divide-ink-100 overflow-hidden dark:divide-ink-800">
                {g.items.map((w) => (
                  <div key={w.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="mt-0.5 text-ink-300 dark:text-ink-600">
                      <Icon.Warn className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{w.message}</div>
                      {w.detail && <div className="mt-0.5 text-xs text-ink-400">{w.detail}</div>}
                      <div className="mono mt-1 text-[10px] uppercase tracking-wide text-ink-400">{w.stage}</div>
                    </div>
                    <SeverityBadge severity={w.severity} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
