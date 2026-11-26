import { Link } from "react-router-dom";
import {
  Code2,
  Layers,
  Map as MapIcon,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth.context";
import { useProfileQuery } from "@/features/onboarding/useCandidateProfile";
import { useDashboardSummaryQuery } from "@/features/dashboard/useDashboardSummary";
import { MetricKpiGrid } from "@/features/dashboard/components/MetricKpiGrid";
import { StreakMatrix } from "@/features/dashboard/components/StreakMatrix";
import { ContinuePrepCard } from "@/features/dashboard/components/ContinuePrepCard";
import { ActivityFeed } from "@/features/dashboard/components/ActivityFeed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { DashboardMetrics } from "@/features/dashboard/dashboard.api";

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Skeleton className="lg:col-span-8 h-72 rounded-xl" />
        <Skeleton className="lg:col-span-4 h-72 rounded-xl" />
      </div>

      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

interface ReadinessStage {
  step: number;
  title: string;
  subtitle: string;
  done: boolean;
  to: string;
}

function getReadinessStages(metrics: DashboardMetrics): ReadinessStage[] {
  const matchSubtitle =
    metrics.jobMatchesCount > 0 && metrics.averageMatchScore !== null
      ? `${metrics.averageMatchScore}% score across ${metrics.jobMatchesCount} ${metrics.jobMatchesCount === 1 ? "match" : "matches"}`
      : "Compare your resume against a JD";

  const practiceDone = metrics.questionsCount > 0 && metrics.answersCount > 0;
  const practiceSubtitle =
    metrics.questionsCount > 0
      ? `${metrics.answersCount}/${metrics.questionsCount} answered`
      : "Generate & rehearse target questions";

  return [
    {
      step: 1,
      title: "Resume Uploaded",
      subtitle:
        metrics.resumesCount > 0
          ? `${metrics.resumesCount} ${metrics.resumesCount === 1 ? "resume" : "resumes"} on file`
          : "Upload PDF or DOCX for ATS audit",
      done: metrics.resumesCount > 0,
      to: "/resumes",
    },
    {
      step: 2,
      title: "Target JD Analyzed",
      subtitle:
        metrics.jobDescriptionsCount > 0
          ? `${metrics.jobDescriptionsCount} ${metrics.jobDescriptionsCount === 1 ? "posting" : "postings"} decomposed`
          : "Extract must-have & nice-to-have skills",
      done: metrics.jobDescriptionsCount > 0,
      to: "/job-descriptions",
    },
    {
      step: 3,
      title: "Resume-JD Match Run",
      subtitle: matchSubtitle,
      done: metrics.jobMatchesCount > 0,
      to: "/matches",
    },
    {
      step: 4,
      title: "Question Set & Answers",
      subtitle: practiceSubtitle,
      done: practiceDone,
      to: "/questions",
    },
  ];
}

export function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const { data: profile } = useProfileQuery(isAuthenticated);
  const { data, isLoading, isError, refetch } = useDashboardSummaryQuery(isAuthenticated);

  const fullName = profile?.fullName || user?.name || "Candidate";
  const firstName = fullName.split(" ")[0] || "Candidate";

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card className="border-danger/30">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-semibold text-ink">
                Unable to load dashboard summary
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                We couldn&apos;t fetch your latest preparation metrics. Please check your API connection and try again.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stages = getReadinessStages(data.metrics);
  const completedStagesCount = stages.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Welcome back, {firstName}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Track your daily study streak, solved problems, and placement readiness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/practice">
            <Button variant="outline" size="sm">
              <Code2 className="h-3.5 w-3.5" />
              Practice Coding
            </Button>
          </Link>
          <Link to="/cs-fundamentals">
            <Button variant="outline" size="sm">
              <Layers className="h-3.5 w-3.5" />
              CS &amp; HR Prep
            </Button>
          </Link>
          <Link to="/roadmap">
            <Button size="sm">
              <MapIcon className="h-3.5 w-3.5" />
              My Study Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <MetricKpiGrid
        metrics={data.metrics}
        dsaMastery={data.dsaMastery}
        csAndHrMastery={data.csAndHrMastery}
        roadmapProgress={data.roadmapProgress}
      />

      {/* Row 2: 7-col StreakMatrix + 5-col ContinuePrepCard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 min-w-0">
          <StreakMatrix
            streak={data.streak}
            metrics={data.metrics}
            dsaMastery={data.dsaMastery}
            csAndHrMastery={data.csAndHrMastery}
            roadmapProgress={data.roadmapProgress}
            completedOaSessions={data.completedOaSessions}
          />
        </div>
        <div className="lg:col-span-5 min-w-0">
          <ContinuePrepCard
            metrics={data.metrics}
            dsaMastery={data.dsaMastery}
            csAndHrMastery={data.csAndHrMastery}
            roadmapProgress={data.roadmapProgress}
            completedOaSessions={data.completedOaSessions}
          />
        </div>
      </div>

      {/* Row 3: 8-col ActivityFeed + 4-col Interview Readiness Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <ActivityFeed activities={data.recentActivities} />
        </div>
        <div className="lg:col-span-4">
          <Card className="border-border bg-surface">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">
                  Interview Readiness Checklist
                </CardTitle>
                <Badge variant="emerald" className="font-mono text-[11px]">
                  {completedStagesCount}/4 Done
                </Badge>
              </div>
              <CardDescription>
                Complete each stage to calibrate your interview prep.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border pt-0">
              {stages.map((stage) => (
                <Link
                  key={stage.step}
                  to={stage.to}
                  className="group flex items-center justify-between gap-3 py-3 first:pt-2 last:pb-1 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {stage.done ? (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary border border-primary/20">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-mono font-semibold text-ink-muted border border-border">
                        {stage.step}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate group-hover:text-primary transition-colors">
                        {stage.title}
                      </p>
                      <p className="text-xs text-ink-muted truncate">
                        {stage.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
