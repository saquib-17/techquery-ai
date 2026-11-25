import * as React from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
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
  strokeColor: string;
} {
  if (score >= 75) {
    return {
      label: "ATS Strong",
      variant: "emerald",
      barClass: "bg-primary",
      strokeColor: "#0F766E",
    };
  }
  if (score >= 50) {
    return {
      label: "Needs Polish",
      variant: "amber",
      barClass: "bg-amber",
      strokeColor: "#D97706",
    };
  }
  return {
    label: "High Risk",
    variant: "danger",
    barClass: "bg-danger",
    strokeColor: "#DC2626",
  };
}

export function AtsAnalysisPanel({
  analysis,
  isLoading,
  isAnalyzing,
  onRunAudit,
}: AtsAnalysisPanelProps) {
  const { toast } = useToast();
  const [copiedIdx, setCopiedIdx] = React.useState<number | null>(null);

  const handleCopyRewrite = async (idx: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      toast({
        variant: "success",
        title: "Bullet rewrite copied",
      });
      window.setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      toast({
        variant: "error",
        title: "Copy failed",
        description: "Clipboard access was blocked by the browser.",
      });
    }
  };

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
          {/* Circular Radial Score Gauge */}
          <div className="md:col-span-4 rounded-xl border border-border bg-surface-muted/60 p-5 flex flex-col items-center text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
              Overall ATS Score
            </span>
            <div className="relative mt-3 flex h-[76px] w-[76px] items-center justify-center">
              <svg
                width="76"
                height="76"
                viewBox="0 0 76 76"
                className="-rotate-90"
                aria-label="ATS score gauge"
              >
                <circle
                  cx="38"
                  cy="38"
                  r="31"
                  fill="none"
                  stroke="#E4E4E7"
                  strokeWidth="6"
                />
                <circle
                  cx="38"
                  cy="38"
                  r="31"
                  fill="none"
                  stroke={scoreMeta.strokeColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 31}
                  strokeDashoffset={
                    2 * Math.PI * 31 -
                    (Math.max(0, Math.min(100, analysis.atsScore)) / 100) *
                      (2 * Math.PI * 31)
                  }
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold font-mono text-ink tabular-nums leading-none">
                  {analysis.atsScore}
                </span>
                <span className="text-[10px] font-mono text-ink-subtle mt-0.5">
                  / 100
                </span>
              </div>
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
            {analysis.improvements.map((imp, idx) => {
              const cleanSuggested = imp.suggested.replace(/\s*\([XYZ]\)/g, "");
              const isCopied = copiedIdx === idx;
              return (
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
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono uppercase text-primary">
                          Suggested
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleCopyRewrite(idx, cleanSuggested)}
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary-soft transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy Rewrite</span>
                            </>
                          )}
                        </button>
                      </div>
                      {cleanSuggested}
                    </div>
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    <strong className="text-ink">Why:</strong> {imp.reason}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
