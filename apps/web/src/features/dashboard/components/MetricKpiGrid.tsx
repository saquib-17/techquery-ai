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

  const avgScoreDisplay =
    metrics.averageMatchScore !== null ? `${metrics.averageMatchScore}%` : "—";

  const cards = [
    {
      label: "Average Match Score",
      value: avgScoreDisplay,
      subtext: `${metrics.jobMatchesCount} ${metrics.jobMatchesCount === 1 ? "evaluation" : "evaluations"}`,
      badgeText: metrics.averageMatchScore !== null && metrics.averageMatchScore >= 75 ? "Strong Fit" : "Skill Alignment",
      badgeVariant: (metrics.averageMatchScore !== null && metrics.averageMatchScore >= 75 ? "emerald" : "amber") as "emerald" | "amber",
      icon: Target,
    },
    {
      label: "Questions Generated",
      value: String(metrics.questionsCount),
      subtext: `Across ${metrics.questionSetsCount} ${metrics.questionSetsCount === 1 ? "set" : "sets"}`,
      badgeText: "5 Categories",
      badgeVariant: "neutral" as const,
      icon: Sparkles,
    },
    {
      label: "Model Answers Ready",
      value: String(metrics.answersCount),
      subtext: `${answerCoveragePct}% question coverage`,
      badgeText: "STAR & Big-O",
      badgeVariant: "emerald" as const,
      icon: BookOpenCheck,
    },
    {
      label: "Saved Library",
      value: String(metrics.bookmarkedQuestionsCount),
      subtext: `In ${metrics.collectionsCount} ${metrics.collectionsCount === 1 ? "collection" : "collections"}`,
      badgeText: "PDF Ready",
      badgeVariant: "mono" as const,
      icon: Bookmark,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} interactive>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink-muted">{item.label}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-muted text-ink-muted border border-border">
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <span className="text-2xl font-bold font-mono tracking-tight text-ink tabular-nums">
                  {item.value}
                </span>
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
