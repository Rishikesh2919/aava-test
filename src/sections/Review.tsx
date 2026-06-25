import { useState } from "react";
import { useApp } from "../store/AppContext";
import { SectionHeader, Icon } from "../components/ui";

export function Review() {
  const { review, setReview, ds, colors, warnings } = useApp();
  const [comment, setComment] = useState("");

  const addComment = () => {
    const text = comment.trim();
    if (!text) return;
    setReview({
      ...review,
      comments: [{ id: `c_${Date.now()}`, text, at: new Date().toISOString() }, ...review.comments],
    });
    setComment("");
  };

  const buildSummary = () => {
    const m = ds!.metadata;
    const lines: string[] = [];
    lines.push(`# Design System Review — ${m.project}`);
    lines.push("");
    lines.push(`- **Version:** ${m.version}`);
    lines.push(`- **Last updated:** ${m.lastUpdated}`);
    lines.push(`- **Reviewed:** ${new Date().toLocaleString()}`);
    lines.push(
      `- **Status:** ${
        review.status === "approved" ? "✅ Approved" : review.status === "changes" ? "⚠️ Needs Changes" : "⏳ Pending"
      }`
    );
    lines.push("");
    lines.push("## Inventory");
    lines.push(`- Colors: ${colors.tokens.length}`);
    lines.push(`- Semantic tokens: ${colors.semantic.length}`);
    lines.push(`- Color families: ${colors.families.length}`);
    lines.push(`- Modes: ${m.modes.length} (${m.modes.join(", ")})`);
    lines.push("");
    lines.push("## Validation");
    lines.push(`- Total warnings: ${warnings.all.length}`);
    warnings.groups.forEach((g) => lines.push(`  - ${g.label}: ${g.warnings.length} (${g.severity})`));
    lines.push("");
    lines.push("## Review summary");
    lines.push(review.summary.trim() || "_No summary provided._");
    lines.push("");
    lines.push("## Comments");
    if (review.comments.length === 0) lines.push("_No comments._");
    review.comments.forEach((c) => lines.push(`- (${new Date(c.at).toLocaleString()}) ${c.text}`));
    return lines.join("\n");
  };

  const exportSummary = () => {
    const blob = new Blob([buildSummary()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `design-review-${ds!.metadata.project.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <SectionHeader title="UX Review" subtitle="Capture sign-off, notes and comments for this design system." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Status */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-bold">Review status</h3>
            <div className="grid grid-cols-3 gap-2">
              <StatusButton active={review.status === "approved"} tone="green" onClick={() => setReview({ ...review, status: "approved" })}>
                ✓ Approved
              </StatusButton>
              <StatusButton active={review.status === "changes"} tone="amber" onClick={() => setReview({ ...review, status: "changes" })}>
                ⚠ Needs Changes
              </StatusButton>
              <StatusButton active={review.status === "pending"} tone="neutral" onClick={() => setReview({ ...review, status: "pending" })}>
                ⏳ Pending
              </StatusButton>
            </div>
          </div>

          {/* Notes */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-bold">Review notes</h3>
            <textarea
              className="input min-h-[140px] resize-y"
              placeholder="Overall assessment, blockers, follow-ups…"
              value={review.summary}
              onChange={(e) => setReview({ ...review, summary: e.target.value })}
            />
          </div>

          {/* Comments */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-bold">Comments</h3>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Add a comment…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addComment()}
              />
              <button className="btn-primary" onClick={addComment}>
                Add
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {review.comments.length === 0 && <li className="text-sm text-ink-400">No comments yet.</li>}
              {review.comments.map((c) => (
                <li key={c.id} className="flex items-start gap-3 rounded-lg border border-ink-200 p-3 dark:border-ink-800">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{c.text}</div>
                    <div className="mt-0.5 text-[11px] text-ink-400">{new Date(c.at).toLocaleString()}</div>
                  </div>
                  <button
                    onClick={() => setReview({ ...review, comments: review.comments.filter((x) => x.id !== c.id) })}
                    className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-red-500 dark:hover:bg-ink-800"
                  >
                    <Icon.Close className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar: export + at-a-glance */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-bold">Export</h3>
            <p className="mb-3 text-xs text-ink-400">
              Download a Markdown review summary including inventory, validation and your notes.
            </p>
            <button className="btn-primary w-full" onClick={exportSummary}>
              <Icon.Copy /> Export review summary
            </button>
          </div>

          <div className="card p-5 text-sm">
            <h3 className="mb-3 text-sm font-bold">At a glance</h3>
            <Glance label="Colors" value={colors.tokens.length} />
            <Glance label="Semantic" value={colors.semantic.length} />
            <Glance label="Families" value={colors.families.length} />
            <Glance label="Warnings" value={warnings.all.length} />
            <Glance label="High severity" value={warnings.all.filter((w) => w.severity === "high").length} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusButton({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: "green" | "amber" | "neutral";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const tones = {
    green: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber: "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    neutral: "border-ink-400 bg-ink-50 text-ink-700 dark:bg-ink-800 dark:text-ink-200",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border-2 px-3 py-2.5 text-xs font-bold transition ${
        active ? tones[tone] : "border-ink-200 text-ink-500 hover:border-ink-300 dark:border-ink-700 dark:text-ink-400"
      }`}
    >
      {children}
    </button>
  );
}

function Glance({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 py-1.5 last:border-0 dark:border-ink-800">
      <span className="text-ink-500 dark:text-ink-400">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
