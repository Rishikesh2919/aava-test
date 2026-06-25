# Design System Review Portal

A polished, production-quality web app for **visually validating design tokens**.
Point it at a Figma/Tokens Studio JSON export and it auto-generates a full review
portal — palette explorer, scales, semantic tokens, a live component playground,
WCAG accessibility checks, validation issues, theme comparison, a token inspector,
and a UX sign-off workflow.

Built with **React + TypeScript + Tailwind CSS + Vite**.

---

## Why a build-time parser?

The raw export (`play--design-system(new).json`) is ~38 MB, but ~99% of that is the
`components` array (8 000+ entries) the portal doesn't need. A build step
([`scripts/parse-tokens.mjs`](scripts/parse-tokens.mjs)) slims it to a **~126 KB**
`public/design-system.json` (metadata + tokens + layout + component stats), which the
app fetches at runtime. This keeps the bundle and load fast.

The source JSON is the **single source of truth** — every section is generated
dynamically from it. No token data is hard-coded.

---

## Run locally

> Requires Node 18+.

```bash
cd viewer
npm install
npm run dev      # parses the export, then starts Vite on http://localhost:5173
```

`predev`/`prebuild` automatically run the parser. By default it looks for the
largest `*.json` one folder up (the export sitting next to `viewer/`). To point at a
different file:

```bash
DS_SOURCE=/absolute/path/to/export.json npm run parse
npm run dev
```

Production build / preview:

```bash
npm run build    # → dist/
npm run preview
```

---

## Folder structure

```
viewer/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tailwind.config.js / postcss.config.js
├─ tsconfig*.json
├─ scripts/
│  └─ parse-tokens.mjs        # 38MB export → slim public/design-system.json
├─ public/
│  └─ design-system.json      # generated (git-ignored in real projects)
└─ src/
   ├─ main.tsx                 # app entry
   ├─ App.tsx                  # layout, routing, nav registry
   ├─ index.css                # Tailwind layers + component classes
   ├─ types.ts                 # raw + normalized token types
   ├─ store/
   │  └─ AppContext.tsx        # data load, theme/mode state, inspector, review, toast
   ├─ lib/
   │  ├─ color.ts              # hex/alpha parsing, WCAG contrast, luminance
   │  ├─ parser.ts             # categorize colors, build families & semantic groups, warnings
   │  └─ theme.ts              # resolve a component theme from tokens for a mode
   ├─ components/
   │  ├─ Sidebar.tsx           # sticky grouped navigation
   │  ├─ Topbar.tsx            # theme switcher + app appearance toggle
   │  ├─ Inspector.tsx         # token drawer (all modes, usage, copy JSON/name)
   │  └─ ui.tsx                # icons, badges, copy button, headers
   └─ sections/
      ├─ Overview.tsx          # dashboard: project, version, counts, modes, validation
      ├─ Palette.tsx           # searchable/filterable swatch grid + list views
      ├─ Scales.tsx            # 50→900 family scales w/ gradient + contrast
      ├─ Semantic.tsx          # background/text/border/surface/interactive/feedback/icon
      ├─ Playground.tsx        # live buttons/inputs/cards/alerts/badges/tabs/modal
      ├─ Accessibility.tsx     # WCAG ratios, AA/AAA, failing-token highlights
      ├─ Issues.tsx            # warnings grouped (merge/collision/typo/scale/dark-mode)
      ├─ Compare.tsx           # side-by-side theme diff (changed/added/removed)
      └─ Review.tsx            # notes, comments, approve/needs-changes, export summary
```

---

## Features → requirements map

| Requirement | Where |
| --- | --- |
| Overview dashboard | `sections/Overview.tsx` |
| Theme switcher (Light/Dark/+modes, instant preview) | `components/Topbar.tsx` + `AppContext` |
| Color palette explorer (search, filter, grid/list, copy) | `sections/Palette.tsx` |
| Color scale visualization (gradient + contrast) | `sections/Scales.tsx` |
| Semantic tokens by role | `sections/Semantic.tsx` |
| Component playground (themed live) | `sections/Playground.tsx` + `lib/theme.ts` |
| Accessibility (WCAG AA/AAA, fails highlighted) | `sections/Accessibility.tsx` + `lib/color.ts` |
| Validation issues (grouped, severity, search/filter) | `sections/Issues.tsx` |
| Theme comparison (added/removed/changed) | `sections/Compare.tsx` |
| Token inspector drawer | `components/Inspector.tsx` |
| UX review (notes, comments, status, export) | `sections/Review.tsx` |
| Sticky sidebar, responsive, app dark mode | `Sidebar` + Tailwind `darkMode: class` |

---

## Notes on the data

This is a real-world, messy export, and the portal surfaces that honestly:

- **Alpha colors** (8-digit hex like `#0E1B2BB2`) are composited over the relevant
  background before contrast math.
- **Mode coverage is uneven** — most tokens carry `Light`/`Dark`, fewer carry the 17
  other modes. `valueForMode` falls back gracefully (mode → Light → Default → flat).
- **Noisy scale families** (e.g. single-letter `s`, `w` from `s-300`) appear because
  the source naming is inconsistent — the same inconsistency the validation warnings
  flag. The portal shows them rather than hiding them.

Review status, notes and comments persist to `localStorage`.
