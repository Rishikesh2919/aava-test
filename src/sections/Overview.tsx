import { useApp } from "../store/AppContext";
import { SectionHeader, Pill } from "../components/ui";

export function Overview({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { ds, colors, warnings } = useApp();
  if (!ds) return null;
  const m = ds.metadata;

  const highCount = warnings.all.filter((w) => w.severity === "high").length;

  const stats = [
    { label: "Total colors", value: colors.tokens.length, to: "palette" },
    { label: "Semantic tokens", value: colors.semantic.length, to: "semantic" },
    { label: "Color scales", value: colors.families.length, to: "scales" },
    { label: "Themes / modes", value: m.modes.length, to: "compare" },
    { label: "Validation warnings", value: warnings.all.length, to: "issues", tone: warnings.all.length ? "warn" : undefined },
    { label: "Components in source", value: ds.stats?.componentCount ?? 0 },
  ] as const;

  const tokenCounts = ds.tokens;

  return (
    <div>
      <SectionHeader
        title="Overview"
        subtitle="A snapshot of the design system export under review."
        right={
          <div className="flex items-center gap-2">
            <Pill tone="brand">v{m.version}</Pill>
            {highCount > 0 ? (
              <Pill tone="red">{highCount} high-severity</Pill>
            ) : (
              <Pill tone="green">No blocking issues</Pill>
            )}
          </div>
        }
      />

      {/* Project identity */}
      <div className="card mb-6 p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Project" value={m.project} />
          <Meta label="Version" value={m.version} />
          <Meta label="Last updated" value={m.lastUpdated} />
          <Meta label="Scope" value={m.scope ?? "—"} />
        </div>
      </div>

      {/* Key stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => "to" in s && s.to && onNavigate(s.to)}
            className={`card group p-5 text-left transition hover:shadow-md ${
              "to" in s && s.to ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <div className="text-xs font-medium uppercase tracking-wide text-ink-400">{s.label}</div>
            <div
              className={`mt-2 text-3xl font-extrabold tracking-tight ${
                "tone" in s && s.tone === "warn" ? "text-amber-500" : ""
              }`}
            >
              {s.value.toLocaleString()}
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Modes */}
        <div className="card p-6">
          <h3 className="mb-3 text-sm font-semibold">Available modes / themes</h3>
          <div className="flex flex-wrap gap-2">
            {m.modes.map((mode) => (
              <span key={mode} className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                {mode}
              </span>
            ))}
          </div>
        </div>

        {/* Token inventory */}
        <div className="card p-6">
          <h3 className="mb-3 text-sm font-semibold">Token inventory</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {Object.entries(tokenCounts).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-ink-100 py-1 dark:border-ink-800">
                <span className="capitalize text-ink-500 dark:text-ink-400">{k}</span>
                <span className="font-semibold">{Array.isArray(v) ? v.length : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warning summary by group */}
      <div className="card mt-6 p-6">
        <h3 className="mb-3 text-sm font-semibold">Validation summary</h3>
        {warnings.groups.length === 0 ? (
          <p className="text-sm text-ink-400">No warnings reported.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {warnings.groups.map((g) => (
              <button
                key={g.key}
                onClick={() => onNavigate("issues")}
                className="flex items-center justify-between rounded-lg border border-ink-200 px-4 py-3 text-left text-sm hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-800/50"
              >
                <span className="font-medium">{g.label}</span>
                <span className="font-bold">{g.warnings.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-1 text-lg font-bold tracking-tight">{value}</div>
    </div>
  );
}
