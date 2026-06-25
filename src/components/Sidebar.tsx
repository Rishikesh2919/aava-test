import { useApp } from "../store/AppContext";

export interface NavItem {
  id: string;
  label: string;
  group: string;
  badge?: number;
}

export function Sidebar({
  items,
  active,
  onSelect,
  open,
  onClose,
}: {
  items: NavItem[];
  active: string;
  onSelect: (id: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const { ds } = useApp();
  const groups = items.reduce<Record<string, NavItem[]>>((acc, it) => {
    (acc[it.group] ??= []).push(it);
    return acc;
  }, {});

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-ink-200 bg-white transition-transform dark:border-ink-800 dark:bg-ink-900 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-ink-200 px-5 py-4 dark:border-ink-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-extrabold text-white">
            DS
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{ds?.metadata.project ?? "Design System"}</div>
            <div className="text-xs text-ink-400">Review Portal</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {Object.entries(groups).map(([group, list]) => (
            <div key={group} className="mb-5">
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                {group}
              </div>
              <ul className="space-y-0.5">
                {list.map((it) => {
                  const isActive = it.id === active;
                  return (
                    <li key={it.id}>
                      <button
                        onClick={() => onSelect(it.id)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                            : "text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
                        }`}
                      >
                        <span>{it.label}</span>
                        {it.badge ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              isActive
                                ? "bg-brand-600 text-white"
                                : "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400"
                            }`}
                          >
                            {it.badge}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-ink-200 px-5 py-3 text-[11px] text-ink-400 dark:border-ink-800">
          v{ds?.metadata.version} · {ds?.stats?.sourceFile}
        </div>
      </aside>
    </>
  );
}
