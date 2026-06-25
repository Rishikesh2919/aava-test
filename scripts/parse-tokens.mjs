// Build-time preprocessor.
//
// The raw Figma export is ~38 MB, but ~99% of that is the `components` array
// (8k+ entries) which the review portal does not need. This script extracts the
// token-relevant slices (metadata + tokens + layout) into a small JSON the app
// loads at runtime, and records a few component stats for the dashboard.
//
// Source resolution order:
//   1. $DS_SOURCE env var
//   2. first matching ../*.json (the file dropped next to the viewer folder)
// Output: ./public/design-system.json

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const publicDir = join(root, "public");
const outFile = join(publicDir, "design-system.json");

import { statSync } from "node:fs";

function findSource() {
  if (process.env.DS_SOURCE && existsSync(process.env.DS_SOURCE)) {
    return process.env.DS_SOURCE;
  }
  // Search the parent directory and its immediate subfolders for *.json
  // exports (so the app can live in a clean-named folder next to the export).
  const parent = resolve(root, "..");
  const candidates = [];
  for (const entry of safeReadDir(parent)) {
    const full = join(parent, entry);
    if (entry.toLowerCase().endsWith(".json")) {
      candidates.push(full);
    } else if (isDir(full) && entry !== "node_modules") {
      for (const sub of safeReadDir(full)) {
        if (sub.toLowerCase().endsWith(".json")) candidates.push(join(full, sub));
      }
    }
  }
  if (candidates.length) {
    // Prefer the largest json (the design system export).
    candidates.sort((a, b) => statSize(b) - statSize(a));
    return candidates[0];
  }
  return null;
}

function safeReadDir(p) {
  try {
    return readdirSync(p);
  } catch {
    return [];
  }
}

function isDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function statSize(p) {
  try {
    return statSync(p).size;
  } catch {
    return 0;
  }
}

function main() {
  const src = findSource();
  if (!src) {
    console.error(
      "[parse-tokens] No source JSON found. Set DS_SOURCE=/path/to/export.json or place the export next to the viewer/ folder."
    );
    // Write an empty-but-valid file so the app still boots with an empty state.
    if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
    writeFileSync(outFile, JSON.stringify({ empty: true }));
    process.exit(0);
  }

  console.log(`[parse-tokens] Reading ${src}`);
  const raw = JSON.parse(readFileSync(src, "utf8"));

  const componentList = Array.isArray(raw.components) ? raw.components : [];
  const componentCategories = {};
  let iconCount = 0;
  for (const c of componentList) {
    const cat = c?.category || "Uncategorized";
    componentCategories[cat] = (componentCategories[cat] || 0) + 1;
    if (c?.isIcon) iconCount++;
  }

  const slim = {
    metadata: raw.metadata ?? {},
    tokens: raw.tokens ?? {},
    layout: raw.layout ?? {},
    stats: {
      componentCount: componentList.length,
      iconCount,
      componentCategories,
      sourceFile: src.split("/").pop(),
      generatedAt: new Date().toISOString(),
    },
  };

  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
  const out = JSON.stringify(slim);
  writeFileSync(outFile, out);
  console.log(
    `[parse-tokens] Wrote ${outFile} (${(out.length / 1024).toFixed(1)} KB) — ` +
      `${(raw.tokens?.colors?.length ?? 0)} colors, ${componentList.length} components dropped.`
  );
}

main();
