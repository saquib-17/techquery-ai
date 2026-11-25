import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResumeAnalysis } from "@/features/resumes/resumes.api";

export interface AtsAnalysisPanelProps {
  analysis: ResumeAnalysis | null | undefined;
  isLoading: boolean;
  isAnalyzing: boolean;
  onRunAudit: () => void;
}

function getScoreBadge(score: number): {
  label: string;
  variant: "emerald" | "amber" | "danger";
  barClass: string;
} {
  if (score >= 75) {
    return { label: "ATS Strong", variant: "emerald", barClass: "bg-primary" };
  }
  if (score >= 50) {
    return { label: "Needs Polish", variant: "amber", barClass: "bg-amber" };
  }
  return { label: "High Risk", variant: "danger", barClass: "bg-danger" };
}

export function AtsAnalysisPanel({
  analysis,
  isLoading,
  isAnalyzing,
  onRunAudit,
}: AtsAnalysisPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="py-12 px-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary border border-primary/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-ink">
            Ready for AI ATS Intelligence
          </h3>
          <p className="mt-1.5 max-w-md text-sm text-ink-muted">
            Run an automated ATS audit to score section completeness, extract your structured
            career graph, and uncover high-impact bullet improvements.
          </p>
          <Button
            onClick={onRunAudit}
            isLoading={isAnalyzing}
            className="mt-5"
          >
            <Sparkles className="h-4 w-4" />
            Run AI ATS Audit
          </Button>
        </CardContent>
      </Card>
    );
  }

  const scoreMeta = getScoreBadge(analysis.atsScore);
  const sections = [
    { label: "Contact Info", score: analysis.sectionScores.contact },
    { label: "Summary", score: analysis.sectionScores.summary },
    { label: "Experience", score: analysis.sectionScores.experience },
    { label: "Skills", score: analysis.sectionScores.skills },
    { label: "Education", score: analysis.sectionScores.education },
  ];

  return (
    <div className="space-y-5">
      {/* Score & Section Breakdown */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>ATS Quality Audit</CardTitle>
              <CardDescription>
                Evaluated across structural clarity, impact quantification, and keyword density.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              isLoading={isAnalyzing}
              onClick={onRunAudit}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Re-run Audit
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Score Gauge */}
          <div className="md:col-span-4 rounded-xl border border-border bg-surface-muted/60 p-5 text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
              Overall ATS Score
            </span>
            <div className="mt-2 flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold font-mono text-ink tabular-nums">
                {analysis.atsScore}
              </span>
              <span className="text-sm font-mono text-ink-subtle">/ 100</span>
            </div>
            <div className="mt-3">
              <Badge variant={scoreMeta.variant}>{scoreMeta.label}</Badge>
            </div>
          </div>

          {/* Section Bars */}
          <div className="md:col-span-8 space-y-3">
            {sections.map((sec) => (
              <div key={sec.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-muted">{sec.label}</span>
                  <span className="font-mono font-semibold text-ink tabular-nums">
                    {sec.score}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted border border-border/60">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      sec.score >= 75 ? "bg-primary" : sec.score >= 50 ? "bg-amber" : "bg-danger"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, sec.score))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-ink-muted">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber" />
              Detected Gaps &amp; Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.issues.length === 0 ? (
              <p className="text-xs text-ink-subtle">No critical formatting issues detected.</p>
            ) : (
              <ul className="space-y-2">
                {analysis.issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-ink-muted">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber shrink-0 mt-0.5" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actionable Bullet Improvements */}
      {analysis.improvements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Actionable Bullet Improvements</CardTitle>
            <CardDescription>
              Targeted rewrites to strengthen impact metrics and ATS keyword relevance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.improvements.map((imp, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-amber/25 bg-amber-soft/50 p-4 space-y-2"
              >
                <div className="grid grid-cols-1 md:grid-cols-11 gap-2 items-start text-xs">
                  <div className="md:col-span-5 rounded-lg border border-border bg-surface p-2.5 text-ink-muted">
                    <span className="block text-[10px] font-mono uppercase text-ink-subtle mb-1">
                      Original
                    </span>
                    {imp.original}
                  </div>
                  <div className="hidden md:flex md:col-span-1 items-center justify-center pt-4 text-amber">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div className="md:col-span-5 rounded-lg border border-primary/25 bg-surface p-2.5 text-ink font-medium">
                    <span className="block text-[10px] font-mono uppercase text-primary mb-1">
                      Suggested
                    </span>
                    {imp.suggested}
                  </div>
                </div>
                <p className="text-[11px] text-ink-muted">
                  <strong className="text-ink">Why:</strong> {imp.reason}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
