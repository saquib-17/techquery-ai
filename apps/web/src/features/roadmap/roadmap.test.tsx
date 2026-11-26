import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { RoadmapPage } from "./RoadmapPage";
import * as roadmapApi from "./roadmapApi";
import * as matchingApi from "@/features/matching/matching.api";
import type { LearningRoadmapDto } from "@techquery/shared";

vi.mock("./roadmapApi", () => ({
  fetchRoadmapsApi: vi.fn(),
  generateRoadmapApi: vi.fn(),
  toggleRoadmapTaskApi: vi.fn(),
  deleteRoadmapApi: vi.fn(),
}));

vi.mock("@/features/matching/matching.api", () => ({
  getMatchesApi: vi.fn(),
}));

function makeSampleRoadmap(): LearningRoadmapDto {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    title: "SDE-1 Full Stack — 12-Week Mastery Roadmap",
    targetRole: "SDE-1 Full Stack",
    durationWeeks: 12,
    dailyHours: 2,
    currentLevel: "INTERMEDIATE",
    completedTasks: 0,
    totalTasks: 2,
    createdAt: "2026-11-26T10:00:00.000Z",
    updatedAt: "2026-11-26T10:00:00.000Z",
    phases: [
      {
        phaseNumber: 1,
        weekLabel: "Weeks 1–4",
        title: "Core DSA & TypeScript Foundations",
        summary: "Master arrays, hashing, and strict TypeScript.",
        milestoneDeliverable: "Solve 25 core pattern problems.",
        tasks: [
          {
            id: "p1-t1",
            order: 1,
            title: "Arrays & Two Pointers Sprint",
            description: "Solve 15 foundational array problems.",
            estimatedHours: 8,
            completed: false,
          },
          {
            id: "p1-t2",
            order: 2,
            title: "PostgreSQL Indexing Lab",
            description: "Analyze EXPLAIN plans on composite indexes.",
            estimatedHours: 6,
            completed: false,
          },
        ],
        resources: [
          {
            title: "React Official Docs",
            platform: "React",
            type: "DOCS",
            url: "https://react.dev",
          },
        ],
      },
    ],
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <RoadmapPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe("RoadmapPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(matchingApi.getMatchesApi).mockResolvedValue([
      {
        id: "m1",
        userId: "u1",
        resumeId: "r1",
        jdId: "j1",
        matchScore: 72,
        scoreBreakdown: {
          mustHaveSkillsScore: 70,
          niceToHaveSkillsScore: 80,
          experienceScore: 75,
          domainScore: 70,
        },
        matchedSkills: ["TypeScript", "React"],
        missingSkills: [
          { skill: "Redis", importance: "HIGH", category: "Caching" },
        ],
        analysisJson: {
          experienceMatch: "Good fit",
          projectRelevance: "Strong alignment",
          strengths: [],
          weaknesses: [],
          recommendations: [],
        },
        createdAt: "2026-11-26T09:00:00.000Z",
      },
    ]);
  });

  it("imports JD gaps, generates a roadmap, toggles task completion, and deletes a roadmap", async () => {
    const sample = makeSampleRoadmap();
    vi.mocked(roadmapApi.fetchRoadmapsApi).mockResolvedValue([]);
    vi.mocked(roadmapApi.generateRoadmapApi).mockResolvedValue(sample);
    vi.mocked(roadmapApi.toggleRoadmapTaskApi).mockResolvedValue({
      ...sample,
      completedTasks: 1,
      phases: [
        {
          ...sample.phases[0]!,
          tasks: [
            { ...sample.phases[0]!.tasks[0]!, completed: true },
            sample.phases[0]!.tasks[1]!,
          ],
        },
      ],
    });
    vi.mocked(roadmapApi.deleteRoadmapApi).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/My Study Plan/i)
      ).toBeInTheDocument();
    });

    // Import missing skills from latest JD match
    fireEvent.click(
      screen.getByRole("button", {
        name: /Import Gaps from Latest JD Match/i,
      })
    );
    await waitFor(() => {
      expect(screen.getByText("Redis")).toBeInTheDocument();
    });

    // Generate study plan
    fireEvent.click(screen.getByRole("button", { name: /Create Study Plan/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: /SDE-1 Full Stack — 12-Week Mastery Roadmap/i,
        })
      ).toBeInTheDocument();
    });

    // Toggle first task
    fireEvent.click(
      screen.getByRole("button", { name: /1\. Arrays & Two Pointers Sprint/i })
    );

    await waitFor(() => {
      expect(roadmapApi.toggleRoadmapTaskApi).toHaveBeenCalledWith(sample.id, {
        taskId: "p1-t1",
        completed: true,
      });
    });

    // Delete roadmap
    fireEvent.click(
      screen.getByRole("button", {
        name: /Delete SDE-1 Full Stack — 12-Week Mastery Roadmap/i,
      })
    );
    await waitFor(() => {
      expect(roadmapApi.deleteRoadmapApi).toHaveBeenCalledWith(sample.id);
    });
  });
});
