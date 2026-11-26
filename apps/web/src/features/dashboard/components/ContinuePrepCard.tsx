import { Link } from "react-router-dom";
import { ArrowRight, Code2, Layers, Map as MapIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  CsAndHrMasterySummary,
  DashboardMetrics,
  DsaMasterySummary,
  RoadmapProgressSummary,
} from "@/features/dashboard/dashboard.api";

export interface ContinuePrepCardProps {
  metrics: DashboardMetrics;
  dsaMastery?: DsaMasterySummary;
  csAndHrMastery?: CsAndHrMasterySummary;
  roadmapProgress?: RoadmapProgressSummary;
  completedOaSessions?: number;
}

export function ContinuePrepCard({
  metrics,
  dsaMastery,
  csAndHrMastery,
  roadmapProgress,
  completedOaSessions = 0,
}: ContinuePrepCardProps) {
  const nextDsa = dsaMastery?.nextProblem;
  const nextCs = csAndHrMastery?.nextTopic;
  const nextTask = roadmapProgress?.nextTask;

  return (
    <Card className="border-border bg-surface h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Pick Up Where You Left Off</CardTitle>
            <Badge variant="emerald" className="font-mono text-[10px]">
              Next Up
            </Badge>
          </div>
          <CardDescription>
            Jump straight into your next recommended item.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* 1. Next DSA Problem */}
          <div className="rounded-lg border border-[#242429] bg-[#0F0F11] p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                <Code2 className="h-3 w-3 text-[#10B981]" />
                Next DSA Problem
              </span>
              {nextDsa && (
                <Badge
                  variant={
                    nextDsa.difficulty === "EASY"
                      ? "emerald"
                      : nextDsa.difficulty === "MEDIUM"
                        ? "amber"
                        : "neutral"
                  }
                  className="text-[10px]"
                >
                  {nextDsa.difficulty}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-100 truncate">
                  {nextDsa ? nextDsa.title : "All 520 DSA Problems Solved!"}
                </p>
                {nextDsa && (
                  <p className="text-[11px] text-zinc-400 truncate">
                    {nextDsa.pattern}
                  </p>
                )}
              </div>
              <Link
                to="/practice"
                className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#10B981] hover:underline shrink-0"
              >
                Solve <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* 2. Next CS / HR Topic */}
          <div className="rounded-lg border border-[#242429] bg-[#0F0F11] p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                <Layers className="h-3 w-3 text-[#F59E0B]" />
                Next CS / HR Topic
              </span>
              {nextCs && (
                <span className="rounded border border-[#242429] bg-[#151518] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 truncate max-w-[120px]">
                  {nextCs.subject}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-zinc-100 truncate">
                {nextCs ? nextCs.title : "All 210 CS & HR Topics Done!"}
              </p>
              <Link
                to="/cs-fundamentals"
                className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#10B981] hover:underline shrink-0"
              >
                AI Guide <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* 3. Current Study Plan Task */}
          <div className="rounded-lg border border-[#242429] bg-[#0F0F11] p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                <MapIcon className="h-3 w-3 text-sky-400" />
                Current Study Plan Task
              </span>
              {nextTask && (
                <span className="font-mono text-[10px] text-zinc-400">
                  {nextTask.weekLabel}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-100 truncate">
                  {roadmapProgress?.activeRoadmapId
                    ? nextTask?.title ?? "Study Plan Completed!"
                    : "No study plan yet"}
                </p>
                {roadmapProgress?.activeRoadmapTitle && (
                  <p className="text-[11px] text-zinc-400 truncate">
                    {roadmapProgress.activeRoadmapTitle}
                  </p>
                )}
              </div>
              <Link
                to="/roadmap"
                className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#10B981] hover:underline shrink-0"
              >
                {roadmapProgress?.activeRoadmapId
                  ? "Continue"
                  : "Create Study Plan"}{" "}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Compact Assets Footer */}
      <div className="border-t border-[#242429] px-5 py-3 font-mono text-[11px] text-zinc-400">
        {metrics.resumesCount} {metrics.resumesCount === 1 ? "Resume" : "Resumes"} ·{" "}
        {metrics.jobDescriptionsCount}{" "}
        {metrics.jobDescriptionsCount === 1 ? "Target Job" : "Target Jobs"} Saved ·{" "}
        {completedOaSessions} Timed {completedOaSessions === 1 ? "Test" : "Tests"} Done
      </div>
    </Card>
  );
}
