import { Target, Sparkles, BookOpenCheck, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardMetrics } from "@/features/dashboard/dashboard.api";

export interface MetricKpiGridProps {
  metrics: DashboardMetrics;
}

export function MetricKpiGrid({ metrics }: MetricKpiGridProps) {
  const answerCoveragePct =
    metrics.questionsCount > 0
      ? Math.min(100, Math.round((metrics.answersCount / metrics.questionsCount) * 100))
      : 0;

  const avgScore = metrics.averageMatchScore;
  const avgScoreDisplay = avgScore !== null ? `${avgScore}%` : "—";
  const ringPct = avgScore !== null ? Math.max(0, Math.min(100, avgScore)) : 0;
  const ringRadius = 17;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringStrokeDashoffset =
    ringCircumference - (ringPct / 100) * ringCircumference;
  const ringColor =
    avgScore !== null && avgScore >= 75 ? "#10B981" : "#F59E0B";

  const cards = [
    {
      label: "Average Match Score",
      value: avgScoreDisplay,
      subtext: `${metrics.jobMatchesCount} ${metrics.jobMatchesCount === 1 ? "evaluation" : "evaluations"}`,
      badgeText: avgScore !== null && avgScore >= 75 ? "Strong Fit" : "Skill Alignment",
      badgeVariant: (avgScore !== null && avgScore >= 75 ? "emerald" : "amber") as "emerald" | "amber",
      icon: Target,
      hasRing: true,
    },
    {
      label: "Questions Generated",
      value: String(metrics.questionsCount),
      subtext: `Across ${metrics.questionSetsCount} ${metrics.questionSetsCount === 1 ? "set" : "sets"}`,
      badgeText: "5 Categories",
      badgeVariant: "neutral" as const,
      icon: Sparkles,
      hasRing: false,
    },
    {
      label: "Model Answers Ready",
      value: String(metrics.answersCount),
      subtext: `${answerCoveragePct}% question coverage`,
      badgeText: "STAR & Big-O",
      badgeVariant: "emerald" as const,
      icon: BookOpenCheck,
      hasRing: false,
    },
    {
      label: "Saved Library",
      value: String(metrics.bookmarkedQuestionsCount),
      subtext: `In ${metrics.collectionsCount} ${metrics.collectionsCount === 1 ? "collection" : "collections"}`,
      badgeText: "PDF Ready",
      badgeVariant: "mono" as const,
      icon: Bookmark,
      hasRing: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.label}
            interactive
            className={
              item.hasRing
                ? "border-[#10B981]/35 bg-[radial-gradient(circle_at_35%_50%,rgba(16,185,129,0.16),#151518_72%)] shadow-[0_0_26px_rgba(16,185,129,0.14)]"
                : undefined
            }
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink-muted">{item.label}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-muted text-ink-muted border border-border">
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {item.hasRing && (
                    <svg
                      width="44"
                      height="44"
                      viewBox="0 0 44 44"
                      className="shrink-0 -rotate-90"
                      aria-label="Average match score ring"
                    >
                      <circle
                        cx="22"
                        cy="22"
                        r={ringRadius}
                        fill="none"
                        stroke="#242429"
                        strokeWidth="4"
                      />
                      <circle
                        cx="22"
                        cy="22"
                        r={ringRadius}
                        fill="none"
                        stroke={ringColor}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={ringStrokeDashoffset}
                        style={{ filter: `drop-shadow(0 0 5px ${ringColor})` }}
                        className="transition-all duration-500 ease-out"
                      />
                    </svg>
                  )}
                  <span className="text-2xl font-bold font-mono tracking-tight text-ink tabular-nums">
                    {item.value}
                  </span>
                </div>
                <Badge variant={item.badgeVariant}>{item.badgeText}</Badge>
              </div>
              <p className="mt-2 text-xs text-ink-subtle tabular-nums">{item.subtext}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
