import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/features/auth/auth.context";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import * as authApi from "@/features/auth/auth.api";
import * as candidateApi from "@/features/onboarding/candidate.api";
import * as dashboardApi from "@/features/dashboard/dashboard.api";

vi.mock("@/features/auth/auth.api", async () => {
  const actual = await vi.importActual<typeof import("@/features/auth/auth.api")>(
    "@/features/auth/auth.api"
  );
  return {
    ...actual,
    refreshApi: vi.fn(),
  };
});

vi.mock("@/features/onboarding/candidate.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/onboarding/candidate.api")
  >("@/features/onboarding/candidate.api");
  return {
    ...actual,
    getProfileApi: vi.fn(),
  };
});

vi.mock("@/features/dashboard/dashboard.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/dashboard/dashboard.api")
  >("@/features/dashboard/dashboard.api");
  return {
    ...actual,
    getDashboardSummaryApi: vi.fn(),
  };
});

function renderDashboard() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={["/dashboard"]}>
            <DashboardPage />
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe("Candidate Dashboard Page & Widgets (Phase F4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const payloadB64 = btoa(
      JSON.stringify({ sub: "user-1", role: "CANDIDATE", tier: "PRO" })
    );
    vi.mocked(authApi.refreshApi).mockResolvedValue({
      accessToken: `header.${payloadB64}.sig`,
    });
    vi.mocked(candidateApi.getProfileApi).mockResolvedValue({
      id: "prof-1",
      userId: "user-1",
      fullName: "Saquib Ansari",
      phoneNumber: null,
      location: "Bengaluru",
      headline: "Backend Engineer",
      summary: null,
      currentRole: "SDE-1",
      yearsOfExperience: 2,
      highestEducation: "MCA",
      university: "NIT",
      graduationYear: 2026,
      linkedinUrl: null,
      githubUrl: null,
      portfolioUrl: null,
      createdAt: "2026-11-25T00:00:00Z",
      updatedAt: "2026-11-25T00:00:00Z",
    });
  });

  it("1. renders editorial skeleton loading state while fetching dashboard summary", async () => {
    // Keep promise pending during assertion
    vi.mocked(dashboardApi.getDashboardSummaryApi).mockImplementation(
      () => new Promise(() => {})
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByLabelText("Loading dashboard")).toBeInTheDocument();
    });
  });

  it("2. renders populated KPI metrics, StreakMatrix counters, ActivityFeed items, and QuotaSnapshotCard bars", async () => {
    const todayIso = new Date().toISOString().slice(0, 10);

    vi.mocked(dashboardApi.getDashboardSummaryApi).mockResolvedValue({
      metrics: {
        resumesCount: 2,
        jobDescriptionsCount: 3,
        jobMatchesCount: 2,
        averageMatchScore: 84.5,
        questionSetsCount: 4,
        questionsCount: 20,
        answersCount: 15,
        collectionsCount: 2,
        bookmarkedQuestionsCount: 7,
      },
      dsaMastery: {
        solvedCount: 12,
        revisionCount: 3,
        totalProblems: 520,
        nextProblem: {
          slug: "maximum-subarray",
          title: "Maximum Subarray",
          pattern: "Kadane's Algorithm",
          difficulty: "MEDIUM",
        },
      },
      csAndHrMastery: {
        learnedCount: 18,
        revisionCount: 2,
        totalTopics: 210,
        nextTopic: {
          slug: "os-process-vs-thread",
          title: "Process vs Thread & PCB vs TCB",
          subject: "Operating Systems",
        },
      },
      roadmapProgress: {
        activeRoadmapId: "rm-1",
        activeRoadmapTitle: "Backend Engineer — 8W Roadmap",
        completedTasks: 4,
        totalTasks: 8,
        percentage: 50,
        nextTask: {
          title: "Relational Schema & Query Optimization",
          weekLabel: "Weeks 3–4",
        },
      },
      completedOaSessions: 2,
      streak: {
        currentStreak: 4,
        longestStreak: 6,
        totalActiveDays: 10,
        lastActiveDate: todayIso,
        activityMatrix: [{ date: todayIso, count: 5 }],
      },
      recentActivities: [
        {
          id: "act-1",
          userId: "user-1",
          activityType: "QUESTIONS_GENERATED",
          activityDate: todayIso,
          metadata: { topicFocus: "Distributed Systems", difficulty: "HARD" },
          createdAt: "2026-11-25T08:00:00Z",
        },
        {
          id: "act-2",
          userId: "user-1",
          activityType: "MATCH_EVALUATED",
          activityDate: todayIso,
          metadata: { overallScore: 88 },
          createdAt: "2026-11-25T07:45:00Z",
        },
      ],
      usage: {
        tier: "PRO",
        quotas: {
          resumes: { used: 2, limit: 10, remaining: 8, isUnlimited: false },
          jobDescriptions: { used: 3, limit: 50, remaining: 47, isUnlimited: false },
          questionSetsMonthly: { used: 4, limit: 50, remaining: 46, isUnlimited: false },
          answersMonthly: { used: 15, limit: null, remaining: null, isUnlimited: true },
        },
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Welcome back, Saquib")).toBeInTheDocument();
    });

    // KPI values & circular ring
    expect(screen.getByLabelText("Average match score ring")).toBeInTheDocument();
    expect(screen.getByText("84.5%")).toBeInTheDocument();
    expect(screen.getByText("12 / 520")).toBeInTheDocument();
    expect(screen.getByText("3 to revise")).toBeInTheDocument();
    expect(screen.getByText("18 / 210")).toBeInTheDocument();
    expect(screen.getByText("7 Subjects")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("4/8 tasks")).toBeInTheDocument();

    // Quick-action buttons
    expect(screen.getByRole("button", { name: /Practice Coding/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /CS & HR Prep/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /My Study Plan/i })).toBeInTheDocument();

    // StreakMatrix counters & heatmap
    expect(screen.getByText("Last 30 Days")).toBeInTheDocument();
    expect(screen.getByText("4d")).toBeInTheDocument();
    expect(screen.getByText("6d")).toBeInTheDocument();
    expect(screen.getByRole("grid", { name: "30-day preparation activity heatmap" })).toBeInTheDocument();

    // Pick Up Where You Left Off card
    expect(screen.getByText("Pick Up Where You Left Off")).toBeInTheDocument();
    expect(screen.getByText("Maximum Subarray")).toBeInTheDocument();
    expect(screen.getByText("Process vs Thread & PCB vs TCB")).toBeInTheDocument();
    expect(screen.getByText("Relational Schema & Query Optimization")).toBeInTheDocument();
    expect(screen.getByText("2 Resumes · 3 Target Jobs Saved · 2 Timed Tests Done")).toBeInTheDocument();

    // Interview Readiness Checklist
    expect(screen.getByText("Interview Readiness Checklist")).toBeInTheDocument();
    expect(screen.getByText("4/4 Done")).toBeInTheDocument();
    expect(screen.getByText("Resume Uploaded")).toBeInTheDocument();
    expect(screen.getByText("Target JD Analyzed")).toBeInTheDocument();
    expect(screen.getByText("Resume-JD Match Run")).toBeInTheDocument();
    expect(screen.getByText("Question Set & Answers")).toBeInTheDocument();

    // ActivityFeed items
    expect(screen.getByText("Generated interview question set")).toBeInTheDocument();
    expect(screen.getByText("Distributed Systems (HARD)")).toBeInTheDocument();
    expect(screen.getByText("Evaluated resume-to-JD match")).toBeInTheDocument();
    expect(screen.getByText("Match Score: 88%")).toBeInTheDocument();
  });

  it("3. renders fresh new-user empty state cleanly with null averageMatchScore and 0 streak", async () => {
    vi.mocked(dashboardApi.getDashboardSummaryApi).mockResolvedValue({
      metrics: {
        resumesCount: 0,
        jobDescriptionsCount: 0,
        jobMatchesCount: 0,
        averageMatchScore: null,
        questionSetsCount: 0,
        questionsCount: 0,
        answersCount: 0,
        collectionsCount: 0,
        bookmarkedQuestionsCount: 0,
      },
      dsaMastery: {
        solvedCount: 0,
        revisionCount: 0,
        totalProblems: 520,
        nextProblem: {
          slug: "two-sum",
          title: "Two Sum",
          pattern: "Hash Lookup / Pair Sum",
          difficulty: "EASY",
        },
      },
      csAndHrMastery: {
        learnedCount: 0,
        revisionCount: 0,
        totalTopics: 210,
        nextTopic: {
          slug: "os-kernel-user-mode-syscalls",
          title: "OS Kernel vs User Mode & System Calls",
          subject: "Operating Systems",
        },
      },
      roadmapProgress: {
        activeRoadmapId: null,
        activeRoadmapTitle: null,
        completedTasks: 0,
        totalTasks: 0,
        percentage: 0,
        nextTask: null,
      },
      completedOaSessions: 0,
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        lastActiveDate: null,
        activityMatrix: [],
      },
      recentActivities: [],
      usage: {
        tier: "FREE",
        quotas: {
          resumes: { used: 0, limit: 3, remaining: 3, isUnlimited: false },
          jobDescriptions: { used: 0, limit: 5, remaining: 5, isUnlimited: false },
          questionSetsMonthly: { used: 0, limit: 5, remaining: 5, isUnlimited: false },
          answersMonthly: { used: 0, limit: 20, remaining: 20, isUnlimited: false },
        },
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("No preparation activity yet")).toBeInTheDocument();
    });

    // Em dash for null match score, 0% roadmap, 0/520 & 0/210 zero-states
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("0 / 520")).toBeInTheDocument();
    expect(screen.getByText("0 / 210")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("Two Sum")).toBeInTheDocument();
    expect(screen.getByText("Create Study Plan")).toBeInTheDocument();
    expect(screen.getByText("Last 30 Days")).toBeInTheDocument();
    expect(screen.getByText("0/4 Done")).toBeInTheDocument();
  });

  it("4. caps Recent Activity to 5 items by default, enriches ANSWER_GENERATED subtitles, and expands on Show all", async () => {
    const todayIso = new Date().toISOString().slice(0, 10);

    vi.mocked(dashboardApi.getDashboardSummaryApi).mockResolvedValue({
      metrics: {
        resumesCount: 1,
        jobDescriptionsCount: 1,
        jobMatchesCount: 1,
        averageMatchScore: 80,
        questionSetsCount: 1,
        questionsCount: 5,
        answersCount: 3,
        collectionsCount: 1,
        bookmarkedQuestionsCount: 2,
      },
      streak: {
        currentStreak: 1,
        longestStreak: 1,
        totalActiveDays: 1,
        lastActiveDate: todayIso,
        activityMatrix: [{ date: todayIso, count: 7 }],
      },
      recentActivities: [
        {
          id: "act-1",
          userId: "user-1",
          activityType: "ANSWER_GENERATED",
          activityDate: todayIso,
          metadata: { style: "INTERVIEW", category: "CODING" },
          createdAt: "2026-11-25T09:00:00Z",
        },
        {
          id: "act-2",
          userId: "user-1",
          activityType: "COLLECTION_CREATED",
          activityDate: todayIso,
          metadata: { name: "Item Two" },
          createdAt: "2026-11-25T08:50:00Z",
        },
        {
          id: "act-3",
          userId: "user-1",
          activityType: "COLLECTION_CREATED",
          activityDate: todayIso,
          metadata: { name: "Item Three" },
          createdAt: "2026-11-25T08:40:00Z",
        },
        {
          id: "act-4",
          userId: "user-1",
          activityType: "COLLECTION_CREATED",
          activityDate: todayIso,
          metadata: { name: "Item Four" },
          createdAt: "2026-11-25T08:30:00Z",
        },
        {
          id: "act-5",
          userId: "user-1",
          activityType: "COLLECTION_CREATED",
          activityDate: todayIso,
          metadata: { name: "Item Five" },
          createdAt: "2026-11-25T08:20:00Z",
        },
        {
          id: "act-6",
          userId: "user-1",
          activityType: "COLLECTION_CREATED",
          activityDate: todayIso,
          metadata: { name: "Item Six" },
          createdAt: "2026-11-25T08:10:00Z",
        },
        {
          id: "act-7",
          userId: "user-1",
          activityType: "COLLECTION_CREATED",
          activityDate: todayIso,
          metadata: { name: "Item Seven" },
          createdAt: "2026-11-25T08:00:00Z",
        },
      ],
      usage: {
        tier: "FREE",
        quotas: {
          resumes: { used: 1, limit: 3, remaining: 2, isUnlimited: false },
          jobDescriptions: { used: 1, limit: 5, remaining: 4, isUnlimited: false },
          questionSetsMonthly: { used: 1, limit: 5, remaining: 4, isUnlimited: false },
          answersMonthly: { used: 3, limit: 20, remaining: 17, isUnlimited: false },
        },
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Style: INTERVIEW • CODING")).toBeInTheDocument();
      expect(screen.getByText("Item Five")).toBeInTheDocument();
    });

    expect(screen.queryByText("Item Six")).not.toBeInTheDocument();
    expect(screen.queryByText("Item Seven")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Show all \(7\)/i }));

    expect(screen.getByText("Item Six")).toBeInTheDocument();
    expect(screen.getByText("Item Seven")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Show less/i })).toBeInTheDocument();
  });
});
