import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  JobMatchItem,
  MissingSkillItem,
} from "@/features/matching/matching.api";
import { cn } from "@/lib/cn";

interface SkillGapMatrixCardProps {
  match: JobMatchItem;
  onRequestDelete?: (match: JobMatchItem) => void;
}

function getScoreTier(score: number) {
  if (score >= 75) {
    return {
      label: "Strong Fit",
      textClass: "text-[#34D399]",
      bgClass: "bg-[#10B981]/12 border-[#10B981]/35 shadow-[0_0_24px_rgba(16,185,129,0.18)]",
      barClass: "bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.45)]",
    };
  }
  if (score >= 50) {
    return {
      label: "Moderate Fit",
      textClass: "text-[#FBBF24]",
      bgClass: "bg-[#F59E0B]/12 border-[#F59E0B]/35 shadow-[0_0_20px_rgba(245,158,11,0.16)]",
      barClass: "bg-[#F59E0B]",
    };
  }
  return {
    label: "Needs Tailoring",
    textClass: "text-[#F87171]",
    bgClass: "bg-[#EF4444]/12 border-[#EF4444]/35 shadow-[0_0_20px_rgba(239,68,68,0.16)]",
    barClass: "bg-[#EF4444]",
  };
}

function getImportanceVariant(
  importance: MissingSkillItem["importance"],
): "danger" | "amber" | "neutral" {
  switch (importance) {
    case "HIGH":
      return "danger";
    case "MEDIUM":
      return "amber";
    default:
      return "neutral";
  }
}

export function SkillGapMatrixCard({
  match,
  onRequestDelete,
}: SkillGapMatrixCardProps) {
  const [showAllGaps, setShowAllGaps] = useState(false);
  const tier = getScoreTier(match.matchScore);
  const breakdown = match.scoreBreakdown;
  const analysis = match.analysisJson;
  const matchedSkills = match.matchedSkills ?? [];
  const missingSkills = match.missingSkills ?? [];
  const visibleMissingSkills = showAllGaps
    ? missingSkills
    : missingSkills.slice(0, 6);

  const breakdownRows = breakdown
    ? [
        { label: "Must-Have Skills", value: breakdown.mustHaveSkillsScore },
        { label: "Nice-to-Have Skills", value: breakdown.niceToHaveSkillsScore },
        { label: "Experience Alignment", value: breakdown.experienceScore },
        { label: "Domain Relevance", value: breakdown.domainScore },
      ]
    : [];

  const questionStudioHref = `/questions?resumeId=${encodeURIComponent(
    match.resumeId,
  )}&jdId=${encodeURIComponent(match.jdId)}&matchId=${encodeURIComponent(
    match.id,
  )}`;

  return (
    <div className="space-y-5">
      {/* Header & Score Summary */}
      <Card className="border-border bg-surface">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">Compatibility Report</Badge>
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                    tier.bgClass,
                    tier.textClass,
                  )}
                >
                  {tier.label}
                </span>
              </div>
              <CardTitle className="text-xl text-ink">
                {match.jobDescription?.title ?? "Target Job Description"}
                {match.jobDescription?.company
                  ? ` — ${match.jobDescription.company}`
                  : ""}
              </CardTitle>
              <CardDescription className="text-sm text-ink-muted">
                Evaluated against{" "}
                <span className="font-mono text-xs font-medium text-[#E4E4E7]">
                  {match.resume?.originalFileName ?? "Selected Resume"}
                </span>
              </CardDescription>
            </div>

            <div className="flex items-center gap-3 self-start">
              <div
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border px-4 py-2.5",
                  tier.bgClass,
                )}
              >
                <span
                  className={cn(
                    "font-mono text-3xl font-bold leading-none tabular-nums",
                    tier.textClass,
                  )}
                >
                  {match.matchScore}%
                </span>
                <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                  Match Score
                </span>
              </div>

              {onRequestDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Delete match report"
                  onClick={() => onRequestDelete(match)}
                  className="text-ink-subtle hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 border-t border-border pt-5">
          {/* Score Breakdown Bars */}
          {breakdownRows.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {breakdownRows.map((row) => {
                const clamped = Math.max(0, Math.min(100, row.value));
                const rowTier = getScoreTier(clamped);
                return (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ink-muted">
                        {row.label}
                      </span>
                      <span className="font-mono font-semibold text-ink tabular-nums">
                        {clamped}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted border border-border/60">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          rowTier.barClass,
                        )}
                        style={{ width: `${clamped}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Primary Handoff CTA */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary-soft px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-ink">
                Ready to practice for this role?
              </p>
              <p className="text-xs text-ink-muted">
                Generate tailored technical and behavioral questions targeting
                these exact skill gaps.
              </p>
            </div>
            <Link to={questionStudioHref}>
              <Button variant="primary" size="sm">
                <Sparkles className="h-3.5 w-3.5" />
                Generate Targeted Questions for This Match
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Full-Width Matched Skills Card */}
      <Card className="w-full border-border bg-surface">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Matched Skills
            </CardTitle>
            <Badge variant="emerald" className="font-mono">
              {matchedSkills.length}
            </Badge>
          </div>
          <CardDescription>
            Verified skills present in both your resume and the JD.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {matchedSkills.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No overlapping skills were detected automatically.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#10B981]/35 bg-[#10B981]/12 px-2.5 py-1 text-xs font-medium text-[#34D399]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                  <span>{skill}</span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full-Width 2-Column Missing & Gap Skills Card */}
      <Card className="w-full border-border bg-surface">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber" />
              Missing &amp; Gap Skills
            </CardTitle>
            <Badge variant="amber" className="font-mono">
              {missingSkills.length}
            </Badge>
          </div>
          <CardDescription>
            Prioritized gaps to address in your resume or interview prep.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {missingSkills.length === 0 ? (
            <p className="text-sm text-primary">
              No critical skill gaps detected for this role.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleMissingSkills.map((item) => (
                  <div
                    key={`${item.skill}-${item.category}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-amber/30 bg-amber-soft px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {item.skill}
                      </p>
                      <p className="text-xs text-ink-muted">{item.category}</p>
                    </div>
                    <Badge variant={getImportanceVariant(item.importance)}>
                      {item.importance}
                    </Badge>
                  </div>
                ))}
              </div>

              {missingSkills.length > 6 && (
                <div className="border-t border-border pt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllGaps((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-soft transition-colors cursor-pointer"
                  >
                    {showAllGaps ? (
                      <>
                        <span>Show top 6</span>
                        <ChevronUp className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        <span>Show all ({missingSkills.length} gaps)</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Tailoring & Qualitative Analysis */}
      {analysis ? (
        <Card className="border-border bg-surface">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-amber" />
              AI Tailoring &amp; Gap Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface-muted p-3.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                  Experience Match
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-[#E4E4E7]">
                  {analysis.experienceMatch}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface-muted p-3.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                  Project Relevance
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-[#E4E4E7]">
                  {analysis.projectRelevance}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Key Strengths
                </h4>
                <ul className="mt-2 space-y-1.5 text-sm text-ink-muted">
                  {analysis.strengths.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber">
                  Areas to Address
                </h4>
                <ul className="mt-2 space-y-1.5 text-sm text-ink-muted">
                  {analysis.weaknesses.map((w) => (
                    <li key={w} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {analysis.recommendations.length > 0 ? (
              <div className="border-t border-border pt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                  Actionable Next Steps
                </h4>
                <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm text-[#E4E4E7]">
                  {analysis.recommendations.map((rec) => (
                    <li
                      key={rec}
                      className="rounded-md border border-border bg-surface-muted px-3 py-2"
                    >
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
