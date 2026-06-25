import { useMemo, useState } from "react";
import { useApp } from "../store/AppContext";
import { SectionHeader } from "../components/ui";
import { resolveTheme, ResolvedTheme } from "../lib/theme";
import { parseColor, toCss } from "../lib/color";

function tint(hex: string, alpha: number): string {
  const c = parseColor(hex);
  if (!c) return hex;
  return toCss({ ...c, a: alpha });
}

export function Playground() {
  const { colors, tokenMode } = useApp();
  const t = useMemo(() => resolveTheme(colors.tokens, tokenMode), [colors.tokens, tokenMode]);

  return (
    <div>
      <SectionHeader
        title="Component Preview Playground"
        subtitle={`Sample UI rendered live from "${tokenMode}" theme tokens.`}
      />

      <div
        className="rounded-2xl border p-6 lg:p-8"
        style={{ background: t.bg, color: t.text, borderColor: t.border }}
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <Buttons t={t} />
          <Inputs t={t} />
          <Cards t={t} />
          <Badges t={t} />
          <div className="lg:col-span-2">
            <Alerts t={t} />
          </div>
          <Tabs t={t} />
          <ModalDemo t={t} />
        </div>
      </div>

      <SourceTable t={t} />
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide opacity-60">{title}</h4>
      {children}
    </div>
  );
}

function Buttons({ t }: { t: ResolvedTheme }) {
  return (
    <Block title="Buttons">
      <div className="flex flex-wrap items-center gap-3">
        <button className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: t.primary, color: t.primaryText }}>
          Primary
        </button>
        <button
          className="rounded-lg border px-4 py-2 text-sm font-semibold"
          style={{ borderColor: t.primary, color: t.primary, background: tint(t.primary, 0.08) }}
        >
          Secondary
        </button>
        <button className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ color: t.primary, background: "transparent" }}>
          Tertiary
        </button>
        <button
          className="cursor-not-allowed rounded-lg px-4 py-2 text-sm font-semibold"
          style={{ background: t.secondary, color: tint(t.text, 0.4) }}
          disabled
        >
          Disabled
        </button>
      </div>
    </Block>
  );
}

function Inputs({ t }: { t: ResolvedTheme }) {
  return (
    <Block title="Inputs">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: t.textMuted }}>
            Email
          </label>
          <input
            placeholder="you@company.com"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ background: t.bg, color: t.text, borderColor: t.border }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: t.textMuted }}>
            Disabled
          </label>
          <input
            disabled
            value="Read only"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ background: t.secondary, color: t.textMuted, borderColor: t.border }}
          />
        </div>
      </div>
    </Block>
  );
}

function Cards({ t }: { t: ResolvedTheme }) {
  return (
    <Block title="Card">
      <div className="rounded-xl border p-4" style={{ background: t.surface, borderColor: t.border }}>
        <div className="text-sm font-bold">Monthly usage</div>
        <div className="mt-1 text-xs" style={{ color: t.textMuted }}>
          You have used 64% of your quota.
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: t.secondary }}>
          <div className="h-full rounded-full" style={{ width: "64%", background: t.primary }} />
        </div>
      </div>
    </Block>
  );
}

function Badges({ t }: { t: ResolvedTheme }) {
  const b = (c: string, label: string) => (
    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: tint(c, 0.14), color: c }}>
      {label}
    </span>
  );
  return (
    <Block title="Badges">
      <div className="flex flex-wrap gap-2">
        {b(t.primary, "Primary")}
        {b(t.success, "Success")}
        {b(t.error, "Error")}
        {b(t.warning, "Warning")}
        {b(t.info, "Info")}
      </div>
    </Block>
  );
}

function Alerts({ t }: { t: ResolvedTheme }) {
  const rows = [
    { c: t.success, title: "Payment received", msg: "Your subscription is now active." },
    { c: t.error, title: "Upload failed", msg: "The file exceeds the 10 MB limit." },
    { c: t.warning, title: "Approaching limit", msg: "You are nearing your monthly quota." },
    { c: t.info, title: "New feature", msg: "Dark mode is now available in settings." },
  ];
  return (
    <Block title="Alerts">
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div
            key={r.title}
            className="flex gap-3 rounded-lg border p-3"
            style={{ background: tint(r.c, 0.1), borderColor: tint(r.c, 0.35) }}
          >
            <span className="mt-0.5 h-2.5 w-2.5 flex-none rounded-full" style={{ background: r.c }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: r.c }}>
                {r.title}
              </div>
              <div className="text-xs" style={{ color: t.textMuted }}>
                {r.msg}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Block>
  );
}

function Tabs({ t }: { t: ResolvedTheme }) {
  const [active, setActive] = useState(0);
  const tabs = ["Overview", "Activity", "Settings"];
  return (
    <Block title="Tabs">
      <div className="flex gap-1 border-b" style={{ borderColor: t.border }}>
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActive(i)}
            className="-mb-px border-b-2 px-3 py-2 text-sm font-medium"
            style={{
              borderColor: active === i ? t.primary : "transparent",
              color: active === i ? t.primary : t.textMuted,
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="pt-3 text-sm" style={{ color: t.textMuted }}>
        Content for <span style={{ color: t.text, fontWeight: 600 }}>{tabs[active]}</span>.
      </div>
    </Block>
  );
}

function ModalDemo({ t }: { t: ResolvedTheme }) {
  const [open, setOpen] = useState(false);
  return (
    <Block title="Modal">
      <button className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: t.primary, color: t.primaryText }} onClick={() => setOpen(true)}>
        Open modal
      </button>
      {open && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-sm rounded-xl border p-5 shadow-2xl"
            style={{ background: t.surface, color: t.text, borderColor: t.border }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-base font-bold">Delete project?</div>
            <p className="mt-1 text-sm" style={{ color: t.textMuted }}>
              This action cannot be undone. All data will be permanently removed.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-lg border px-3 py-1.5 text-sm font-semibold" style={{ borderColor: t.border, color: t.text }} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ background: t.error }} onClick={() => setOpen(false)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Block>
  );
}

function SourceTable({ t }: { t: ResolvedTheme }) {
  const roles = Object.keys(t).filter((k) => k !== "sources") as (keyof ResolvedTheme)[];
  return (
    <div className="card mt-6 p-5">
      <h3 className="mb-3 text-sm font-semibold">Resolved theme roles</h3>
      <p className="mb-4 text-xs text-ink-400">
        Which token backs each role. Roles without a match fall back to a sensible default.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {roles.map((r) => (
          <div key={r} className="flex items-center gap-2 rounded-lg border border-ink-200 p-2 dark:border-ink-800">
            <span className="h-7 w-7 flex-none rounded border border-black/10" style={{ background: t[r] as string }} />
            <div className="min-w-0">
              <div className="text-xs font-semibold capitalize">{r}</div>
              <div className="mono truncate text-[10px] text-ink-400">
                {t.sources[r as keyof typeof t.sources] ?? "fallback"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
