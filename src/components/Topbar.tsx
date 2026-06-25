import { useApp } from "../store/AppContext";
import { Icon } from "./ui";

export function Topbar({
  title,
  onMenu,
}: {
  title: string;
  onMenu: () => void;
}) {
  const { ds, tokenMode, setTokenMode, uiDark, toggleUiDark } = useApp();
  const modes = ds?.metadata.modes ?? [];
  const primary = ["Light", "Dark"].filter((m) => modes.includes(m));
  const extra = modes.filter((m) => !primary.includes(m));

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-200 bg-white/80 px-4 backdrop-blur dark:border-ink-800 dark:bg-ink-900/80 lg:px-6">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 lg:hidden"
        aria-label="Open navigation"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <h2 className="hidden text-sm font-semibold text-ink-500 dark:text-ink-400 sm:block">{title}</h2>

      <div className="ml-auto flex items-center gap-3">
        {/* Token theme switcher */}
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-medium text-ink-400 md:block">Preview theme</span>
          <div className="flex items-center rounded-lg border border-ink-200 bg-ink-50 p-0.5 dark:border-ink-700 dark:bg-ink-800">
            {primary.map((m) => (
              <button
                key={m}
                onClick={() => setTokenMode(m)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  tokenMode === m
                    ? "bg-white text-ink-900 shadow-sm dark:bg-ink-900 dark:text-white"
                    : "text-ink-500 hover:text-ink-800 dark:hover:text-ink-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          {extra.length > 0 && (
            <select
              value={primary.includes(tokenMode) ? "" : tokenMode}
              onChange={(e) => e.target.value && setTokenMode(e.target.value)}
              className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs font-medium text-ink-600 focus:outline-none dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300"
            >
              <option value="">More modes…</option>
              {extra.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={toggleUiDark}
          className="rounded-lg border border-ink-200 p-2 text-ink-500 hover:bg-ink-100 dark:border-ink-700 dark:hover:bg-ink-800"
          title="Toggle app appearance"
        >
          {uiDark ? <Icon.Sun /> : <Icon.Moon />}
        </button>
      </div>
    </header>
  );
}
