import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ToastProvider } from "@/components/ui/toast";
import { QuestionsPage } from "@/features/questions/pages/QuestionsPage";
import { ApiClientError } from "@/lib/api";
import * as questionsApi from "@/features/questions/questions.api";
import * as answersApi from "@/features/questions/answers.api";
import * as resumesApi from "@/features/resumes/resumes.api";
import * as jdApi from "@/features/job-descriptions/jd.api";
import * as matchingApi from "@/features/matching/matching.api";

vi.mock("@/features/questions/questions.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/questions/questions.api")
  >("@/features/questions/questions.api");
  return {
    ...actual,
    getQuestionSetsApi: vi.fn(),
    getQuestionSetDetailApi: vi.fn(),
    generateQuestionSetApi: vi.fn(),
    deleteQuestionSetApi: vi.fn(),
    exportQuestionSetPdf: vi.fn(),
  };
});

vi.mock("@/features/questions/answers.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/questions/answers.api")
  >("@/features/questions/answers.api");
  return {
    ...actual,
    generateAnswerApi: vi.fn(),
    getAnswerByQuestionIdApi: vi.fn(),
    deleteAnswerApi: vi.fn(),
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

vi.mock("@/features/job-descriptions/jd.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/job-descriptions/jd.api")
  >("@/features/job-descriptions/jd.api");
  return {
    ...actual,
    getJobDescriptionsApi: vi.fn(),
  };
});

vi.mock("@/features/matching/matching.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/matching/matching.api")
  >("@/features/matching/matching.api");
  return {
    ...actual,
    getMatchesApi: vi.fn(),
  };
});

function renderQuestionsPage(initialEntry = "/questions") {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <QuestionsPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const MOCK_SET_SUMMARY: questionsApi.QuestionSetSummary = {
  id: "set-1",
  userId: "user-1",
  resumeId: null,
  jdId: "jd-1",
  matchId: null,
  title: "Senior Backend Interview Prep",
  topicFocus: "Distributed Systems & Node.js",
  difficulty: "MEDIUM",
  totalCount: 2,
  providerUsed: "groq",
  createdAt: "2026-11-25T09:00:00Z",
  updatedAt: "2026-11-25T09:00:00Z",
};

const MOCK_CODING_QUESTION: questionsApi.QuestionItem = {
  id: "q-coding",
  questionSetId: "set-1",
  category: "CODING",
  difficulty: "MEDIUM",
  targetedSkill: "Rate Limiting",
  questionText: "Implement a thread-safe Token Bucket rate limiter in TypeScript.",
  interviewerIntent: "Tests concurrency awareness and O(1) state updates.",
  keyEvaluationPoints: ["Tracks tokens and refill timestamp", "Handles burst capacity"],
  createdAt: "2026-11-25T09:00:00Z",
  answer: null,
};

const MOCK_BEHAVIORAL_QUESTION: questionsApi.QuestionItem = {
  id: "q-behavioral",
  questionSetId: "set-1",
  category: "BEHAVIORAL",
  difficulty: "MEDIUM",
  targetedSkill: "Incident Ownership",
  questionText: "Tell me about a production outage you resolved under pressure.",
  interviewerIntent: "Evaluates calm debugging and post-mortem ownership.",
  keyEvaluationPoints: ["Clear root cause analysis", "Preventive follow-up"],
  createdAt: "2026-11-25T09:01:00Z",
  answer: null,
};

const MOCK_SET_DETAIL: questionsApi.QuestionSetDetail = {
  ...MOCK_SET_SUMMARY,
  questions: [MOCK_CODING_QUESTION, MOCK_BEHAVIORAL_QUESTION],
};

const MOCK_INTERVIEW_ANSWER: questionsApi.ModelAnswer = {
  id: "ans-1",
  questionId: "q-coding",
  userId: "user-1",
  style: "INTERVIEW",
  shortSummary: "Use lazy token refilling based on elapsed time since last request.",
  detailedExplanation:
    "Compute elapsed time on each request, refill proportional tokens capped at capacity, and consume one token if available.",
  codeSnippet:
    "class TokenBucket {\n  allow(): boolean {\n    return true;\n  }\n}",
  timeComplexity: "O(1)",
  spaceComplexity: "O(1)",
  commonMistakes: ["Using a background setInterval per user instead of lazy refill"],
  providerUsed: "groq",
  createdAt: "2026-11-25T09:05:00Z",
  updatedAt: "2026-11-25T09:05:00Z",
};

describe("Question & Model Answer Studio (Phase F7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resumesApi.getResumesApi).mockResolvedValue([]);
    vi.mocked(jdApi.getJobDescriptionsApi).mockResolvedValue([
      {
        id: "jd-1",
        userId: "user-1",
        title: "Senior Backend Engineer",
        company: "Acme",
        rawText: "Backend role",
        structuredJson: {
          roleTitle: "Senior Backend Engineer",
          seniority: "SENIOR",
          experienceYears: { min: 4, max: 7 },
          mustHaveSkills: ["Node.js"],
          niceToHaveSkills: [],
          responsibilities: ["Build APIs"],
          techStackCategories: {
            languages: ["TypeScript"],
            frameworks: ["Express"],
            databases: ["PostgreSQL"],
            cloudAndDevops: [],
            toolsAndOther: [],
          },
        },
        providerUsed: "groq",
        createdAt: "2026-11-25T08:00:00Z",
        updatedAt: "2026-11-25T08:00:00Z",
      },
    ]);
    vi.mocked(matchingApi.getMatchesApi).mockResolvedValue([]);
  });

  it("1. renders saved question sets and filters questions by category", async () => {
    vi.mocked(questionsApi.getQuestionSetsApi).mockResolvedValue([MOCK_SET_SUMMARY]);
    vi.mocked(questionsApi.getQuestionSetDetailApi).mockResolvedValue(MOCK_SET_DETAIL);

    renderQuestionsPage();

    await waitFor(() => {
      expect(screen.getByText("Senior Backend Interview Prep")).toBeInTheDocument();
      expect(
        screen.getByText(/Implement a thread-safe Token Bucket rate limiter/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Tell me about a production outage you resolved/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Coding \(1\)$/i }));

    expect(
      screen.getByText(/Implement a thread-safe Token Bucket rate limiter/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Tell me about a production outage you resolved/i),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Behavioral \(1\)$/i }));

    expect(
      screen.getByText(/Tell me about a production outage you resolved/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Implement a thread-safe Token Bucket rate limiter/i),
    ).not.toBeInTheDocument();
  });

  it("2. auto-opens QuestionGeneratorDialog with pre-filled ?jdId= and submits generateQuestionSetApi", async () => {
    vi.mocked(questionsApi.getQuestionSetsApi)
      .mockResolvedValueOnce([])
      .mockResolvedValue([MOCK_SET_SUMMARY]);
    vi.mocked(questionsApi.generateQuestionSetApi).mockResolvedValue(MOCK_SET_DETAIL);
    vi.mocked(questionsApi.getQuestionSetDetailApi).mockResolvedValue(MOCK_SET_DETAIL);

    renderQuestionsPage("/questions?jdId=jd-1");

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByLabelText(/Target JD/i)).toHaveValue("jd-1");
    });

    fireEvent.change(screen.getByLabelText(/Topic Focus/i), {
      target: { value: "Distributed Systems & Node.js" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Generate Questions/i }));

    await waitFor(() => {
      expect(questionsApi.generateQuestionSetApi).toHaveBeenCalledWith(
        expect.objectContaining({
          topicFocus: "Distributed Systems & Node.js",
          jdId: "jd-1",
        }),
      );
    });
  });

  it("3. opens AnswerStudioDrawer, renders code snippet, copy button, complexity badges, and switches answer style", async () => {
    vi.mocked(questionsApi.getQuestionSetsApi).mockResolvedValue([MOCK_SET_SUMMARY]);
    vi.mocked(questionsApi.getQuestionSetDetailApi).mockResolvedValue(MOCK_SET_DETAIL);
    vi.mocked(answersApi.generateAnswerApi)
      .mockResolvedValueOnce(MOCK_INTERVIEW_ANSWER)
      .mockResolvedValueOnce({
        ...MOCK_INTERVIEW_ANSWER,
        style: "CONCISE",
        shortSummary: "Concise summary: refill tokens lazily on each request.",
      });

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    renderQuestionsPage();

    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: /Open Answer Studio/i }).length,
      ).toBe(2);
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Open Answer Studio/i })[0],
    );

    await waitFor(() => {
      expect(answersApi.generateAnswerApi).toHaveBeenCalledWith({
        questionId: "q-coding",
        style: "INTERVIEW",
        regenerate: false,
      });
      expect(screen.getByText("Time: O(1)")).toBeInTheDocument();
      expect(screen.getByText("Space: O(1)")).toBeInTheDocument();
      expect(screen.getByText("solution.ts")).toBeInTheDocument();
      expect(screen.getByText(/TokenBucket/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Copy Code/i }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        MOCK_INTERVIEW_ANSWER.codeSnippet,
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Concise" }));
    await waitFor(() => {
      expect(answersApi.generateAnswerApi).toHaveBeenCalledWith({
        questionId: "q-coding",
        style: "CONCISE",
        regenerate: true,
      });
      expect(
        screen.getByText(/Concise summary: refill tokens lazily/i),
      ).toBeInTheDocument();
    });
  });

  it("4. displays 429 QUOTA_EXCEEDED upgrade prompt in QuestionGeneratorDialog", async () => {
    vi.mocked(questionsApi.getQuestionSetsApi).mockResolvedValue([]);
    vi.mocked(questionsApi.generateQuestionSetApi).mockRejectedValue(
      new ApiClientError(
        "Monthly question generation quota exceeded",
        429,
        "QUOTA_EXCEEDED",
      ),
    );

    renderQuestionsPage();

    await waitFor(() => {
      expect(
        screen.getByText("No question sets generated yet"),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /Generate Question Set/i })[0],
    );

    fireEvent.click(screen.getByRole("button", { name: /Generate Questions/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Monthly question generation quota exceeded/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Upgrade Plan \/ Manage Quotas/i }),
      ).toHaveAttribute("href", "/usage");
    });
  });
});
