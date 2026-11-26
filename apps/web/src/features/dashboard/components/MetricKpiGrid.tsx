import { Link } from "react-router-dom";
import { Target, Code2, Layers, Map as MapIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  CsAndHrMasterySummary,
  DashboardMetrics,
  DsaMasterySummary,
  RoadmapProgressSummary,
} from "@/features/dashboard/dashboard.api";

export interface MetricKpiGridProps {
  metrics: DashboardMetrics;
  dsaMastery?: DsaMasterySummary;
  csAndHrMastery?: CsAndHrMasterySummary;
  roadmapProgress?: RoadmapProgressSummary;
}

export function MetricKpiGrid({
  metrics,
  dsaMastery,
  csAndHrMastery,
  roadmapProgress,
}: MetricKpiGridProps) {
  const avgScore = metrics.averageMatchScore;
  const avgScoreDisplay = avgScore !== null ? `${avgScore}%` : "—";
  const ringPct = avgScore !== null ? Math.max(0, Math.min(100, avgScore)) : 0;
  const ringRadius = 17;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringStrokeDashoffset =
    ringCircumference - (ringPct / 100) * ringCircumference;
  const ringColor =
    avgScore !== null && avgScore >= 75 ? "#10B981" : "#F59E0B";

  const dsaSolved = dsaMastery?.solvedCount ?? 0;
  const dsaTotal = dsaMastery?.totalProblems ?? 520;
  const dsaRevision = dsaMastery?.revisionCount ?? 0;
  const dsaPct = dsaTotal > 0 ? Math.min(100, Math.round((dsaSolved / dsaTotal) * 100)) : 0;

  const csLearned = csAndHrMastery?.learnedCount ?? 0;
  const csTotal = csAndHrMastery?.totalTopics ?? 210;
  const csPct = csTotal > 0 ? Math.min(100, Math.round((csLearned / csTotal) * 100)) : 0;

  const rmDone = roadmapProgress?.completedTasks ?? 0;
  const rmTotal = roadmapProgress?.totalTasks ?? 0;
  const rmPct = roadmapProgress?.percentage ?? 0;

  const cards = [
    {
      label: "Resume Job Match",
      value: avgScoreDisplay,
      subtext: `${metrics.jobMatchesCount} ${metrics.jobMatchesCount === 1 ? "check" : "checks"}`,
      badgeText:
        avgScore !== null && avgScore >= 75 ? "Strong Fit" : "Skill Match",
      badgeVariant: (avgScore !== null && avgScore >= 75
        ? "emerald"
        : "amber") as "emerald" | "amber",
      icon: Target,
      hasRing: true,
      progressPct: null as number | null,
      to: "/matches",
    },
    {
      label: "DSA Problems Solved",
      value: `${dsaSolved} / ${dsaTotal}`,
      subtext: `${dsaPct}% solved`,
      badgeText: `${dsaRevision} to revise`,
      badgeVariant: (dsaRevision > 0 ? "amber" : "emerald") as "amber" | "emerald",
      icon: Code2,
      hasRing: false,
      progressPct: dsaPct,
      to: "/practice",
    },
    {
      label: "CS & HR Topics Done",
      value: `${csLearned} / ${csTotal}`,
      subtext: `${csPct}% completed`,
      badgeText: "7 Subjects",
      badgeVariant: "emerald" as const,
      icon: Layers,
      hasRing: false,
      progressPct: csPct,
      to: "/cs-fundamentals",
    },
    {
      label: "Study Plan Progress",
      value: `${rmPct}%`,
      subtext:
        rmTotal > 0
          ? roadmapProgress?.activeRoadmapTitle ?? "Active study plan"
          : "No study plan yet",
      badgeText: rmTotal > 0 ? `${rmDone}/${rmTotal} tasks` : "Create Plan",
      badgeVariant: "mono" as const,
      icon: MapIcon,
      hasRing: false,
      progressPct: rmPct,
      to: "/roadmap",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.label} to={item.to} className="block group">
            <Card
              interactive
              className={
                item.hasRing
                  ? "h-full border-[#10B981]/35 bg-[radial-gradient(circle_at_35%_50%,rgba(16,185,129,0.16),#151518_72%)] shadow-[0_0_26px_rgba(16,185,129,0.14)]"
                  : "h-full group-hover:border-[#10B981]/40 transition-colors"
              }
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-ink-muted group-hover:text-ink transition-colors">
                    {item.label}
                  </span>
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
                {item.progressPct !== null && (
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#0F0F11] border border-[#242429]">
                    <div
                      className="h-full bg-[#10B981] transition-all duration-300"
                      style={{ width: `${item.progressPct}%` }}
                    />
                  </div>
                )}
                <p className="mt-2 text-xs text-ink-subtle truncate tabular-nums">
                  {item.subtext}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
