import { Link } from "react-router-dom";
import {
  FileUp,
  Briefcase,
  Sparkles,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Compass,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth.context";
import { useProfileQuery } from "@/features/onboarding/useCandidateProfile";
import { useDashboardSummaryQuery } from "@/features/dashboard/useDashboardSummary";
import { MetricKpiGrid } from "@/features/dashboard/components/MetricKpiGrid";
import { StreakMatrix } from "@/features/dashboard/components/StreakMatrix";
import { QuotaSnapshotCard } from "@/features/dashboard/components/QuotaSnapshotCard";
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

function getRecommendedNextStep(metrics: DashboardMetrics): {
  stepBadge: string;
  title: string;
  description: string;
  ctaLabel: string;
  to: string;
} {
  if (metrics.resumesCount === 0) {
    return {
      stepBadge: "Step 01 / 04",
      title: "Upload your primary resume",
      description:
        "Start by uploading a PDF or DOCX resume to unlock automated ATS diagnostics and skill extraction.",
      ctaLabel: "Upload Resume",
      to: "/resumes",
    };
  }
  if (metrics.jobDescriptionsCount === 0) {
    return {
      stepBadge: "Step 02 / 04",
      title: "Decompose a target job description",
      description:
        "Paste a real job posting to extract must-have vs. nice-to-have skills and seniority expectations.",
      ctaLabel: "Analyze JD",
      to: "/job-descriptions",
    };
  }
  if (metrics.jobMatchesCount === 0) {
    return {
      stepBadge: "Step 03 / 04",
      title: "Run Resume-to-JD Skill-Gap Match",
      description:
        "Compute your weighted alignment score and surface missing skills before generating interview questions.",
      ctaLabel: "Open Match Studio",
      to: "/matches",
    };
  }
  if (metrics.questionSetsCount === 0) {
    return {
      stepBadge: "Step 04 / 04",
      title: "Generate tailored interview questions",
      description:
        "Synthesize calibrated questions across coding, system design, and behavioral categories.",
      ctaLabel: "Generate Questions",
      to: "/questions",
    };
  }
  return {
    stepBadge: "Ready for Review",
    title: "Curate & export your study sheet",
    description:
      "Bookmark your highest-priority questions into a collection and export a clean PDF prep packet.",
    ctaLabel: "Open Saved Library",
    to: "/library",
  };
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

  const nextStep = getRecommendedNextStep(data.metrics);

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Welcome back, {firstName}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Track your interview readiness, skill alignment, and daily preparation streak.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/resumes">
            <Button variant="outline" size="sm">
              <FileUp className="h-3.5 w-3.5" />
              Upload Resume
            </Button>
          </Link>
          <Link to="/job-descriptions">
            <Button variant="outline" size="sm">
              <Briefcase className="h-3.5 w-3.5" />
              Analyze JD
            </Button>
          </Link>
          <Link to="/questions">
            <Button size="sm">
              <Sparkles className="h-3.5 w-3.5" />
              Generate Questions
            </Button>
          </Link>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <MetricKpiGrid metrics={data.metrics} />

      {/* Row 2: 8-col StreakMatrix + 4-col QuotaSnapshotCard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <StreakMatrix streak={data.streak} />
        </div>
        <div className="lg:col-span-4">
          <QuotaSnapshotCard usage={data.usage} />
        </div>
      </div>

      {/* Row 3: 8-col ActivityFeed + 4-col Recommended Next Step */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ActivityFeed activities={data.recentActivities} />
        </div>
        <div className="lg:col-span-4">
          <Card className="h-full flex flex-col justify-between bg-surface-muted/40">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary border border-primary/20">
                  <Compass className="h-4 w-4" />
                </div>
                <Badge variant="mono">{nextStep.stepBadge}</Badge>
              </div>
              <CardTitle className="pt-2">Recommended Next Step</CardTitle>
              <CardDescription className="text-ink font-medium pt-1">
                {nextStep.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-ink-muted leading-relaxed">
                {nextStep.description}
              </p>
              <Link to={nextStep.to} className="block">
                <Button className="w-full justify-between">
                  <span>{nextStep.ctaLabel}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
