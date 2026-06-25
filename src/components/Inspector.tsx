import { useApp } from "../store/AppContext";
import { CopyButton, Icon, Pill } from "./ui";
import { evaluateContrast, readableTextColor } from "../lib/color";

export function Inspector() {
  const { inspecting, inspect, tokenMode, copy } = useApp();
  const open = !!inspecting;
  const t = inspecting;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => inspect(null)}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-drawer transition-transform dark:bg-ink-900 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {t && (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-ink-200 p-5 dark:border-ink-800">
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-wide text-ink-400">Token Inspector</div>
                <div className="mono mt-1 truncate text-lg font-semibold">{t.variable}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Pill tone="brand">{t.category}</Pill>
                  {t.semanticGroup && <Pill>{t.semanticGroup}</Pill>}
                  {t.family && <Pill>{t.family} · {t.step}</Pill>}
                  {t.hasAlpha && <Pill tone="neutral">alpha</Pill>}
                </div>
              </div>
              <button
                onClick={() => inspect(null)}
                className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <Icon.Close />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              {/* Big swatch preview for current mode */}
              <PreviewSwatch hex={t.modes[tokenMode] ?? t.value} />

              <Field label="Full token path">
                <div className="mono break-all text-sm">{t.path || "—"}</div>
              </Field>

              <Field label="Variable name" copyText={t.variable}>
                <div className="mono text-sm">{t.variable}</div>
              </Field>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  All theme values
                </div>
                <div className="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-800">
                  {Object.entries(t.modes).map(([mode, hex], i) => (
                    <div
                      key={mode}
                      className={`flex items-center gap-3 px-3 py-2 ${
                        i % 2 ? "bg-ink-50 dark:bg-ink-800/40" : ""
                      } ${mode === tokenMode ? "ring-1 ring-inset ring-brand-300" : ""}`}
                    >
                      <span
                        className="h-6 w-6 flex-none rounded border border-black/10"
                        style={{ background: hex }}
                      />
                      <span className="w-28 truncate text-sm font-medium">{mode}</span>
                      <span className="mono ml-auto text-xs text-ink-500 dark:text-ink-400">{hex}</span>
                      <CopyButton text={hex} label={mode} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage preview */}
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Usage preview
                </div>
                <UsagePreview hex={t.modes[tokenMode] ?? t.value} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-ink-200 p-4 dark:border-ink-800">
              <button className="btn-ghost" onClick={() => copy(t.variable, "Token name")}>
                <Icon.Copy /> Copy name
              </button>
              <button
                className="btn-primary"
                onClick={() =>
                  copy(
                    JSON.stringify(
                      { variable: t.variable, value: t.value, path: t.path, modes: t.modes },
                      null,
                      2
                    ),
                    "Token JSON"
                  )
                }
              >
                <Icon.Copy /> Copy JSON
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Field({
  label,
  children,
  copyText,
}: {
  label: string;
  children: React.ReactNode;
  copyText?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</span>
        {copyText && <CopyButton text={copyText} label={label} />}
      </div>
      {children}
    </div>
  );
}

function PreviewSwatch({ hex }: { hex: string }) {
  const txt = readableTextColor(hex);
  return (
    <div
      className="flex h-28 items-end justify-between rounded-xl border border-black/10 p-3"
      style={{ background: hex, color: txt }}
    >
      <span className="mono text-sm font-semibold">{hex}</span>
      <span className="text-xs opacity-80">Aa</span>
    </div>
  );
}

function UsagePreview({ hex }: { hex: string }) {
  const onWhite = evaluateContrast(hex, "#FFFFFF");
  const onBlack = evaluateContrast(hex, "#111111");
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white p-3 dark:border-ink-800">
        <span style={{ color: hex }} className="text-lg font-bold">
          Text sample
        </span>
        <span className="mono ml-auto text-xs text-ink-400">
          on white {onWhite.ratio.toFixed(2)}:1 · {onWhite.label}
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-ink-800 bg-[#111] p-3">
        <span style={{ color: hex }} className="text-lg font-bold">
          Text sample
        </span>
        <span className="mono ml-auto text-xs text-ink-500">
          on black {onBlack.ratio.toFixed(2)}:1 · {onBlack.label}
        </span>
      </div>
      <div className="flex gap-2">
        <button className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: hex }}>
          Button
        </button>
        <span
          className="inline-flex items-center rounded-full border-2 px-3 py-1 text-sm font-semibold"
          style={{ borderColor: hex, color: hex }}
        >
          Badge
        </span>
      </div>
    </div>
  );
}
