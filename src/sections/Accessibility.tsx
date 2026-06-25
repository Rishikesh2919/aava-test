import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import { SectionHeader, Pill } from "../components/ui";
import { resolveTheme } from "../lib/theme";
import { evaluateContrast, ContrastResult } from "../lib/color";
import { valueForMode } from "../lib/parser";

interface Pair {
  label: string;
  fg: string;
  bg: string;
  fgName: string;
  bgName: string;
  result: ContrastResult;
}

export function Accessibility() {
  const { colors, tokenMode } = useApp();
  const [filter, setFilter] = useState<"all" | "pass" | "fail">("all");

  const t = useMemo(() => resolveTheme(colors.tokens, tokenMode), [colors.tokens, tokenMode]);

  // Key role pairings.
  const keyPairs: Pair[] = useMemo(() => {
    const mk = (label: string, fg: string, bg: string, fgName: string, bgName: string): Pair => ({
      label,
      fg,
      bg,
      fgName,
      bgName,
      result: evaluateContrast(fg, bg),
    });
    return [
      mk("Body text on background", t.text, t.bg, "text", "bg"),
      mk("Muted text on background", t.textMuted, t.bg, "textMuted", "bg"),
      mk("Body text on surface", t.text, t.surface, "text", "surface"),
      mk("Label on primary button", t.primaryText, t.primary, "primaryText", "primary"),
      mk("Success on background", t.success, t.bg, "success", "bg"),
      mk("Error on background", t.error, t.bg, "error", "bg"),
      mk("Warning on background", t.warning, t.bg, "warning", "bg"),
      mk("Info on background", t.info, t.bg, "info", "bg"),
    ];
  }, [t]);

  // Full audit: every semantic text/icon token vs bg & surface.
  const auditPairs: Pair[] = useMemo(() => {
    const textTokens = colors.semantic.filter(
      (s) => s.semanticGroup === "Text" || s.semanticGroup === "Icon"
    );
    const out: Pair[] = [];
    for (const tok of textTokens) {
      const fg = valueForMode(tok, tokenMode);
      out.push({
        label: tok.variable,
        fg,
        bg: t.bg,
        fgName: tok.variable,
        bgName: "bg",
        result: evaluateContrast(fg, t.bg),
      });
    }
    return out;
  }, [colors.semantic, tokenMode, t.bg]);

  const filteredAudit = auditPairs.filter((p) =>
    filter === "all" ? true : filter === "pass" ? p.result.aaNormal : !p.result.aaNormal
  );

  const failCount = auditPairs.filter((p) => !p.result.aaNormal).length;

  return (
    <div>
      <SectionHeader
        title="Accessibility Validation"
        subtitle={`WCAG 2.1 contrast against the "${tokenMode}" background. ${failCount} text token(s) fail AA.`}
      />

      <h3 className="mb-3 text-sm font-bold">Key role pairings</h3>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {keyPairs.map((p) => (
          <PairCard key={p.label} pair={p} />
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">Text & icon token audit</h3>
        <div className="flex items-center gap-1 rounded-lg border border-ink-200 p-0.5 text-xs dark:border-ink-700">
          {(["all", "pass", "fail"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 font-semibold capitalize transition ${
                filter === f ? "bg-brand-600 text-white" : "text-ink-500 hover:text-ink-800 dark:hover:text-ink-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filteredAudit.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-300 p-10 text-center text-sm text-ink-400 dark:border-ink-700">
          No text tokens to audit.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-12 gap-3 border-b border-ink-200 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-800 sm:grid">
            <div className="col-span-5">Token</div>
            <div className="col-span-2">Preview</div>
            <div className="col-span-2">Ratio</div>
            <div className="col-span-3">Compliance</div>
          </div>
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {filteredAudit.map((p) => (
              <AuditRow key={p.fgName} pair={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function statusTone(r: ContrastResult) {
  if (r.label === "Fail") return "red" as const;
  if (r.label === "AA Large") return "neutral" as const;
  return "green" as const;
}

function PairCard({ pair }: { pair: Pair }) {
  const r = pair.result;
  const failing = !r.aaNormal;
  return (
    <div className={`card overflow-hidden ${failing ? "ring-1 ring-red-300 dark:ring-red-900" : ""}`}>
      <div className="flex h-20 items-center justify-center" style={{ background: pair.bg }}>
        <span className="text-lg font-bold" style={{ color: pair.fg }}>
          Aa Bb Cc
        </span>
      </div>
      <div className="p-3">
        <div className="text-xs font-semibold">{pair.label}</div>
        <div className="mono mt-0.5 text-[10px] text-ink-400">
          {pair.fgName} on {pair.bgName}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-bold">{r.ratio.toFixed(2)}:1</span>
          <Pill tone={statusTone(r)}>{r.label}</Pill>
        </div>
      </div>
    </div>
  );
}

function AuditRow({ pair }: { pair: Pair }) {
  const r = pair.result;
  const failing = !r.aaNormal;
  return (
    <div
      className={`grid grid-cols-1 items-center gap-3 px-4 py-3 sm:grid-cols-12 ${
        failing ? "bg-red-50/60 dark:bg-red-950/20" : ""
      }`}
    >
      <div className="mono col-span-5 truncate text-sm font-medium">{pair.fgName}</div>
      <div className="col-span-2">
        <span className="inline-flex items-center rounded px-2 py-1 text-xs font-bold" style={{ background: pair.bg, color: pair.fg }}>
          Aa
        </span>
      </div>
      <div className="col-span-2 text-sm font-semibold">{r.ratio.toFixed(2)}:1</div>
      <div className="col-span-3 flex flex-wrap gap-1.5">
        <Pill tone={r.aaNormal ? "green" : "red"}>AA {r.aaNormal ? "✓" : "✕"}</Pill>
        <Pill tone={r.aaaNormal ? "green" : "neutral"}>AAA {r.aaaNormal ? "✓" : "✕"}</Pill>
      </div>
    </div>
  );
}
