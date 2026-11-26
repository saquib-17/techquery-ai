import * as React from "react";
import { Flame, CalendarCheck2, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  CsAndHrMasterySummary,
  DashboardMetrics,
  DsaMasterySummary,
  RoadmapProgressSummary,
  StreakResult,
} from "@/features/dashboard/dashboard.api";

export interface StreakMatrixProps {
  streak: StreakResult;
  metrics?: DashboardMetrics;
  dsaMastery?: DsaMasterySummary;
  csAndHrMastery?: CsAndHrMasterySummary;
  roadmapProgress?: RoadmapProgressSummary;
  completedOaSessions?: number;
}

function buildLast30Days(matrix: Array<{ date: string; count: number }>) {
  const countsByDate = new Map<string, number>();
  for (const item of matrix) {
    countsByDate.set(item.date, item.count);
  }

  const now = new Date();
  const days: Array<{ date: string; count: number; label: string }> = [];

  for (let offset = 29; offset >= 0; offset--) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset)
    );
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    days.push({
      date: iso,
      count: countsByDate.get(iso) ?? 0,
      label,
    });
  }

  return days;
}

function getHeatStyle(count: number): React.CSSProperties {
  if (count === 0) {
    return { backgroundColor: "#1B1B20", borderColor: "#242429" };
  }
  if (count === 1) {
    return { backgroundColor: "#064E3B", borderColor: "#065F46" };
  }
  if (count <= 3) {
    return { backgroundColor: "#059669", borderColor: "#10B981" };
  }
  return {
    backgroundColor: "#10B981",
    borderColor: "#34D399",
    boxShadow: "0 0 8px rgba(16, 185, 129, 0.45)",
  };
}

export function StreakMatrix({
  streak,
  metrics,
  dsaMastery,
  csAndHrMastery,
  roadmapProgress,
  completedOaSessions = 0,
}: StreakMatrixProps) {
  const days = React.useMemo(
    () => buildLast30Days(streak.activityMatrix),
    [streak.activityMatrix]
  );

  const [hoveredDay, setHoveredDay] = React.useState<{
    date: string;
    label: string;
    count: number;
  } | null>(null);

  const dsaSolved = dsaMastery?.solvedCount ?? 0;
  const csLearned = csAndHrMastery?.learnedCount ?? 0;
  const csTotal = csAndHrMastery?.totalTopics ?? 210;
  const rmDone = roadmapProgress?.completedTasks ?? 0;
  const rmTotal = roadmapProgress?.totalTasks ?? 0;
  const resumesCount = metrics?.resumesCount ?? 0;
  const jobsCount = metrics?.jobDescriptionsCount ?? 0;

  const breakdownPills = [
    {
      label: "DSA & Coding",
      value: `${dsaSolved + completedOaSessions}`,
      sub: `${dsaSolved} solved · ${completedOaSessions} tests`,
      accent: "text-[#10B981]",
    },
    {
      label: "CS & HR Prep",
      value: `${csLearned}`,
      sub: `of ${csTotal} done`,
      accent: "text-[#F59E0B]",
    },
    {
      label: "Study Plans",
      value: `${rmDone}`,
      sub: rmTotal > 0 ? `of ${rmTotal} tasks` : "No plan yet",
      accent: "text-sky-400",
    },
    {
      label: "Resume & Jobs",
      value: `${resumesCount + jobsCount}`,
      sub: `${resumesCount} resumes · ${jobsCount} jobs`,
      accent: "text-zinc-200",
    },
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Daily Study Streak</CardTitle>
            <CardDescription>
              Your last 30 days of coding, CS prep, and resume practice.
            </CardDescription>
          </div>
          <Badge variant="neutral" className="px-2.5 py-1 text-xs">
            Last 30 Days
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 4-Pill Activity Breakdown Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {breakdownPills.map((pill) => (
            <div
              key={pill.label}
              className="rounded-lg border border-[#242429] bg-[#0F0F11] px-3 py-2.5 min-w-0"
            >
              <p className="text-[11px] font-medium text-zinc-400 truncate">
                {pill.label}
              </p>
              <p className={`mt-0.5 text-base font-bold font-mono tabular-nums ${pill.accent}`}>
                {pill.value}
              </p>
              <p className="text-[10px] font-mono text-zinc-500 truncate">
                {pill.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Streak Summary Counters */}
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-surface-muted/60 p-3.5">
          <div>
            <span className="flex items-center gap-1 text-[11px] font-medium text-ink-subtle">
              <Flame className="h-3 w-3 text-amber" />
              Current Streak
            </span>
            <p className="mt-1 text-lg font-bold font-mono text-ink tabular-nums">
              {streak.currentStreak}d
            </p>
          </div>
          <div>
            <span className="flex items-center gap-1 text-[11px] font-medium text-ink-subtle">
              <Trophy className="h-3 w-3 text-primary" />
              Longest Streak
            </span>
            <p className="mt-1 text-lg font-bold font-mono text-ink tabular-nums">
              {streak.longestStreak}d
            </p>
          </div>
          <div>
            <span className="flex items-center gap-1 text-[11px] font-medium text-ink-subtle">
              <CalendarCheck2 className="h-3 w-3 text-ink-muted" />
              Active Days
            </span>
            <p className="mt-1 text-lg font-bold font-mono text-ink tabular-nums">
              {streak.totalActiveDays}
            </p>
          </div>
        </div>

        {/* 30-Day Heatmap Grid */}
        <div className="space-y-2">
          <div
            role="grid"
            aria-label="30-day preparation activity heatmap"
            className="grid grid-cols-10 sm:grid-cols-15 gap-1.5"
          >
            {days.map((day) => (
              <div
                key={day.date}
                role="gridcell"
                title={`${day.label}: ${day.count} ${day.count === 1 ? "action" : "actions"}`}
                aria-label={`${day.label}: ${day.count} actions`}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                style={getHeatStyle(day.count)}
                className="h-6 w-full rounded-md border transition-transform duration-150 hover:scale-110 cursor-default"
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-ink-subtle">
            <span className="font-mono">
              {hoveredDay
                ? `${hoveredDay.label} (${hoveredDay.date}) — ${hoveredDay.count} ${hoveredDay.count === 1 ? "action" : "actions"}`
                : streak.lastActiveDate
                  ? `Last active: ${streak.lastActiveDate}`
                  : "No recorded sessions yet"}
            </span>

            <div className="flex items-center gap-1.5">
              <span>Less</span>
              {[0, 1, 2, 4].map((level) => (
                <span
                  key={level}
                  style={getHeatStyle(level)}
                  className="inline-block h-3 w-3 rounded-xs border"
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
