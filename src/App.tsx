import { useMemo, useState } from "react";
import { useApp } from "./store/AppContext";
import { Sidebar, NavItem } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Inspector } from "./components/Inspector";
import { Icon } from "./components/ui";

import { Overview } from "./sections/Overview";
import { Palette } from "./sections/Palette";
import { Scales } from "./sections/Scales";
import { Semantic } from "./sections/Semantic";
import { Playground } from "./sections/Playground";
import { Accessibility } from "./sections/Accessibility";
import { Issues } from "./sections/Issues";
import { Compare } from "./sections/Compare";
import { Review } from "./sections/Review";

export default function App() {
  const { state, colors, warnings, ds } = useApp();
  const [active, setActive] = useState("overview");
  const [navOpen, setNavOpen] = useState(false);

  const nav: NavItem[] = useMemo(
    () => [
      { id: "overview", label: "Overview", group: "Dashboard" },
      { id: "palette", label: "Color Palette", group: "Tokens", badge: colors.tokens.length },
      { id: "scales", label: "Color Scales", group: "Tokens", badge: colors.families.length },
      { id: "semantic", label: "Semantic Tokens", group: "Tokens", badge: colors.semantic.length },
      { id: "playground", label: "Components", group: "Preview" },
      { id: "accessibility", label: "Accessibility", group: "Validation" },
      { id: "issues", label: "Validation Issues", group: "Validation", badge: warnings.all.length },
      { id: "compare", label: "Theme Comparison", group: "Validation" },
      { id: "review", label: "UX Review", group: "Sign-off" },
    ],
    [colors, warnings]
  );

  const title = nav.find((n) => n.id === active)?.label ?? "";

  if (state === "loading") {
    return <CenterMsg>Loading design system…</CenterMsg>;
  }
  if (state === "error") {
    return <CenterMsg>Failed to load <code>design-system.json</code>.</CenterMsg>;
  }
  if (state === "empty" || !ds) {
    return (
      <CenterMsg>
        No design tokens found. Run <code className="mono">npm run parse</code> with your export present.
      </CenterMsg>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar
        items={nav}
        active={active}
        onSelect={(id) => {
          setActive(id);
          setNavOpen(false);
        }}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <div className="lg:pl-72">
        <Topbar title={title} onMenu={() => setNavOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {active === "overview" && <Overview onNavigate={setActive} />}
          {active === "palette" && <Palette />}
          {active === "scales" && <Scales />}
          {active === "semantic" && <Semantic />}
          {active === "playground" && <Playground />}
          {active === "accessibility" && <Accessibility />}
          {active === "issues" && <Issues />}
          {active === "compare" && <Compare />}
          {active === "review" && <Review />}
        </main>
      </div>

      <Inspector />
      <Toast />
    </div>
  );
}

function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg dark:bg-ink-100 dark:text-ink-900">
        <Icon.Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
        {toast}
      </div>
    </div>
  );
}

function CenterMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8 text-center text-sm text-ink-500">
      <div>{children}</div>
    </div>
  );
}
