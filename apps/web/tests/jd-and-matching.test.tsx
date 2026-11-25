import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ToastProvider } from "@/components/ui/toast";
import { JobDescriptionsPage } from "@/features/job-descriptions/pages/JobDescriptionsPage";
import { MatchesPage } from "@/features/matching/pages/MatchesPage";
import { ApiClientError } from "@/lib/api";
import * as jdApi from "@/features/job-descriptions/jd.api";
import * as matchingApi from "@/features/matching/matching.api";
import * as resumesApi from "@/features/resumes/resumes.api";

vi.mock("@/features/job-descriptions/jd.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/job-descriptions/jd.api")
  >("@/features/job-descriptions/jd.api");
  return {
    ...actual,
    getJobDescriptionsApi: vi.fn(),
    createJobDescriptionApi: vi.fn(),
    deleteJobDescriptionApi: vi.fn(),
  };
});

vi.mock("@/features/matching/matching.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/matching/matching.api")
  >("@/features/matching/matching.api");
  return {
    ...actual,
    getMatchesApi: vi.fn(),
    evaluateMatchApi: vi.fn(),
    deleteMatchApi: vi.fn(),
  };
});

vi.mock("@/features/resumes/resumes.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/resumes/resumes.api")
  >("@/features/resumes/resumes.api");
  return {
    ...actual,
    getResumesApi: vi.fn(),
  };
});

function renderWithProviders(
  ui: React.ReactElement,
  initialEntry = "/job-descriptions",
) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const SAMPLE_JD_RAW_TEXT =
  "We are seeking a Senior Backend Engineer with strong TypeScript, Node.js, PostgreSQL, and distributed systems architecture experience to design scalable APIs and mentor engineering teams.";

const MOCK_JD: jdApi.JobDescriptionItem = {
  id: "jd-1",
  userId: "user-1",
  title: "Senior Backend Engineer",
  company: "Acme Cloud",
  rawText: SAMPLE_JD_RAW_TEXT,
  providerUsed: "groq",
  structuredJson: {
    roleTitle: "Senior Backend Engineer",
    seniority: "SENIOR",
    experienceYears: { min: 4, max: 7 },
    mustHaveSkills: ["TypeScript", "Node.js", "PostgreSQL"],
    niceToHaveSkills: ["Redis", "Kubernetes"],
    responsibilities: [
      "Architect low-latency REST APIs",
      "Lead database schema optimization",
    ],
    techStackCategories: {
      languages: ["TypeScript"],
      frameworks: ["Express"],
      databases: ["PostgreSQL"],
      cloudAndDevops: ["AWS"],
      toolsAndOther: ["Git"],
    },
  },
  createdAt: "2026-11-25T08:00:00Z",
  updatedAt: "2026-11-25T08:00:00Z",
};

const MOCK_RESUME: resumesApi.ResumeItem = {
  id: "res-1",
  originalFileName: "saquib_backend_resume.pdf",
  mimeType: "application/pdf",
  fileExtension: "pdf",
  fileSize: 102400,
  processingStatus: "PROCESSED",
  isPrimary: true,
  createdAt: "2026-11-25T07:00:00Z",
  updatedAt: "2026-11-25T07:00:00Z",
};

const MOCK_MATCH: matchingApi.JobMatchItem = {
  id: "match-1",
  userId: "user-1",
  resumeId: "res-1",
  jdId: "jd-1",
  matchScore: 82,
  scoreBreakdown: {
    mustHaveSkillsScore: 88,
    niceToHaveSkillsScore: 70,
    experienceScore: 85,
    domainScore: 80,
  },
  matchedSkills: ["TypeScript", "Node.js", "PostgreSQL"],
  missingSkills: [
    { skill: "Kubernetes", importance: "HIGH", category: "Cloud & DevOps" },
    { skill: "Redis", importance: "MEDIUM", category: "Caching" },
  ],
  analysisJson: {
    experienceMatch: "5+ years of backend API engineering aligns well.",
    projectRelevance: "Production Node.js & PostgreSQL systems match core JD.",
    strengths: ["Strong relational database design and REST API ownership"],
    weaknesses: ["Limited hands-on Kubernetes orchestration listed"],
    recommendations: [
      "Highlight distributed caching or container deployment experience",
    ],
  },
  createdAt: "2026-11-25T09:00:00Z",
  updatedAt: "2026-11-25T09:00:00Z",
  resume: {
    id: "res-1",
    originalFileName: "saquib_backend_resume.pdf",
  },
  jobDescription: {
    id: "jd-1",
    title: "Senior Backend Engineer",
    company: "Acme Cloud",
  },
};

describe("Job Descriptions & Match Studio (Phase F6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. submits a new job description and displays extracted roleTitle, must-have/nice-to-have skills, and handoff links", async () => {
    vi.mocked(jdApi.getJobDescriptionsApi)
      .mockResolvedValueOnce([])
      .mockResolvedValue([MOCK_JD]);
    vi.mocked(jdApi.createJobDescriptionApi).mockResolvedValue(MOCK_JD);

    renderWithProviders(<JobDescriptionsPage />, "/job-descriptions");

    await waitFor(() => {
      expect(
        screen.getByText("No target job descriptions yet"),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Add Job Description/i })[0],
    );

    fireEvent.change(screen.getByLabelText(/Role Title/i), {
      target: { value: "Senior Backend Engineer" },
    });
    fireEvent.change(screen.getByLabelText(/Company/i), {
      target: { value: "Acme Cloud" },
    });
    fireEvent.change(screen.getByLabelText(/Job Description Text/i), {
      target: { value: SAMPLE_JD_RAW_TEXT },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Decompose Job Description/i }),
    );

    await waitFor(() => {
      expect(jdApi.createJobDescriptionApi).toHaveBeenCalledWith({
        title: "Senior Backend Engineer",
        company: "Acme Cloud",
        rawText: SAMPLE_JD_RAW_TEXT,
      });
    });

    await waitFor(() => {
      expect(screen.getAllByText("TypeScript").length).toBeGreaterThanOrEqual(
        1,
      );
      expect(screen.getByText("Node.js")).toBeInTheDocument();
      expect(screen.getByText("Kubernetes")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Run Resume Match/i }),
      ).toHaveAttribute("href", "/matches?jdId=jd-1");
      expect(
        screen.getByRole("link", { name: /Generate Questions/i }),
      ).toHaveAttribute("href", "/questions?jdId=jd-1");
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Show Original Job Posting/i }),
    );
    expect(screen.getByText(SAMPLE_JD_RAW_TEXT)).toBeInTheDocument();
  });

  it("2. displays quota upgrade prompt when JD creation hits 429 QUOTA_EXCEEDED", async () => {
    vi.mocked(jdApi.getJobDescriptionsApi).mockResolvedValue([]);
    vi.mocked(jdApi.createJobDescriptionApi).mockRejectedValue(
      new ApiClientError(
        "Daily job description quota exceeded",
        429,
        "QUOTA_EXCEEDED",
      ),
    );

    renderWithProviders(<JobDescriptionsPage />, "/job-descriptions");

    await waitFor(() => {
      expect(
        screen.getByText("No target job descriptions yet"),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Add Job Description/i })[0],
    );

    fireEvent.change(screen.getByLabelText(/Role Title/i), {
      target: { value: "Senior Backend Engineer" },
    });
    fireEvent.change(screen.getByLabelText(/Job Description Text/i), {
      target: { value: SAMPLE_JD_RAW_TEXT },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Decompose Job Description/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Daily job description quota exceeded/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Upgrade Plan \/ Manage Quotas/i }),
      ).toHaveAttribute("href", "/usage");
    });
  });

  it("3. evaluates compatibility on MatchesPage and renders Match Score, Skill Gap Matrix, and AI recommendations", async () => {
    vi.mocked(resumesApi.getResumesApi).mockResolvedValue([MOCK_RESUME]);
    vi.mocked(jdApi.getJobDescriptionsApi).mockResolvedValue([MOCK_JD]);
    vi.mocked(matchingApi.getMatchesApi)
      .mockResolvedValueOnce([])
      .mockResolvedValue([MOCK_MATCH]);
    vi.mocked(matchingApi.evaluateMatchApi).mockResolvedValue(MOCK_MATCH);

    renderWithProviders(<MatchesPage />, "/matches?jdId=jd-1");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Evaluate Compatibility/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Evaluate Compatibility/i }),
    );

    await waitFor(() => {
      expect(matchingApi.evaluateMatchApi).toHaveBeenCalledWith({
        resumeId: "res-1",
        jdId: "jd-1",
      });
    });

    await waitFor(() => {
      expect(screen.getAllByText("82%").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Matched Skills")).toBeInTheDocument();
      expect(screen.getByText("Missing & Gap Skills")).toBeInTheDocument();
      expect(screen.getByText("Kubernetes")).toBeInTheDocument();
      expect(
        screen.getByText(/5\+ years of backend API engineering aligns well/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", {
          name: /Generate Targeted Questions for This Match/i,
        }),
      ).toHaveAttribute(
        "href",
        "/questions?resumeId=res-1&jdId=jd-1&matchId=match-1",
      );
    });
  });
});
