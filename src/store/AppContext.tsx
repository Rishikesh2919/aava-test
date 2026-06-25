import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { ColorToken, DesignSystem } from "../types";
import { parseColors, parseWarnings, ParsedColors } from "../lib/parser";

type LoadState = "loading" | "ready" | "error" | "empty";

export interface ReviewState {
  status: "pending" | "approved" | "changes";
  summary: string;
  comments: { id: string; text: string; at: string }[];
}

interface AppContextValue {
  state: LoadState;
  ds: DesignSystem | null;
  colors: ParsedColors;
  warnings: ReturnType<typeof parseWarnings>;

  /** design-token preview mode (Light / Dark / Console ...) */
  tokenMode: string;
  setTokenMode: (m: string) => void;

  /** app chrome theme */
  uiDark: boolean;
  toggleUiDark: () => void;

  inspecting: ColorToken | null;
  inspect: (t: ColorToken | null) => void;

  review: ReviewState;
  setReview: (r: ReviewState) => void;

  copy: (text: string, label?: string) => void;
  toast: string | null;
}

const EMPTY_COLORS: ParsedColors = {
  tokens: [],
  semantic: [],
  families: [],
  categories: [],
  valueModes: [],
};

const AppContext = createContext<AppContextValue | null>(null);

const REVIEW_KEY = "ds-review-v1";

function loadReview(): ReviewState {
  try {
    const raw = localStorage.getItem(REVIEW_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { status: "pending", summary: "", comments: [] };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoadState>("loading");
  const [ds, setDs] = useState<DesignSystem | null>(null);
  const [tokenMode, setTokenMode] = useState("Light");
  const [uiDark, setUiDark] = useState(
    () => localStorage.getItem("ds-ui-dark") === "1"
  );
  const [inspecting, setInspecting] = useState<ColorToken | null>(null);
  const [review, setReviewState] = useState<ReviewState>(loadReview);
  const [toast, setToast] = useState<string | null>(null);

  // Load the slim dataset.
  useEffect(() => {
    fetch("/design-system.json")
      .then((r) => r.json())
      .then((data: DesignSystem & { empty?: boolean }) => {
        if (data.empty || !data.tokens) {
          setState("empty");
          return;
        }
        setDs(data);
        const modes = data.metadata?.modes ?? [];
        if (modes.includes("Light")) setTokenMode("Light");
        else if (modes.length) setTokenMode(modes[0]);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  // Apply chrome theme to <html>.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", uiDark);
    localStorage.setItem("ds-ui-dark", uiDark ? "1" : "0");
  }, [uiDark]);

  // Persist review.
  useEffect(() => {
    localStorage.setItem(REVIEW_KEY, JSON.stringify(review));
  }, [review]);

  const colors = useMemo(() => (ds ? parseColors(ds) : EMPTY_COLORS), [ds]);
  const warnings = useMemo(
    () => (ds ? parseWarnings(ds) : { all: [], groups: [] }),
    [ds]
  );

  const copy = useCallback((text: string, label = "Copied") => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setToast(`${label}: ${text.length > 40 ? text.slice(0, 40) + "…" : text}`);
        window.setTimeout(() => setToast(null), 1800);
      },
      () => setToast("Copy failed")
    );
  }, []);

  const value: AppContextValue = {
    state,
    ds,
    colors,
    warnings,
    tokenMode,
    setTokenMode,
    uiDark,
    toggleUiDark: () => setUiDark((v) => !v),
    inspecting,
    inspect: setInspecting,
    review,
    setReview: setReviewState,
    copy,
    toast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
