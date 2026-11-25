import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AssessmentSessionDto, CodingProblemDto } from "@techquery/shared";

import { ToastProvider } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { CodingArenaPage } from "./pages/CodingArenaPage";
import { buildDraftStorageKey } from "./components/ActiveCodingWorkspace";
import { QuestionCard } from "@/features/questions/components/QuestionCard";
import { QuestionGeneratorDialog } from "@/features/questions/components/QuestionGeneratorDialog";
import * as questionsApi from "@/features/questions/questions.api";

vi.mock("@monaco-editor/react", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange?: (val: string) => void;
  }) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

vi.mock("@/features/questions/questions.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/questions/questions.api")
  >("@/features/questions/questions.api");
  return {
    ...actual,
    generateQuestionSetApi: vi.fn(),
  };
});

vi.mock("@/features/resumes/resumes.api", () => ({
  getResumesApi: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/job-descriptions/jd.api", () => ({
  getJobDescriptionsApi: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/matching/matching.api", () => ({
  getMatchesApi: vi.fn().mockResolvedValue([]),
}));

const SAMPLE_PROBLEM: CodingProblemDto = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Two Sum Indices",
  slug: "two-sum-indices",
  difficulty: "EASY",
  pattern: "ARRAYS_TWO_POINTERS",
  statement: "Find two indices summing to target.",
  constraints: ["2 <= n <= 10^5"],
  examples: [{ input: "4\n2 7 11 15\n9", output: "0 1" }],
  starterCode: {
    java: "public class Main {}",
    python: "def solve(): pass",
    cpp: "int main() { return 0; }",
    javascript: "console.log(0);",
  },
  sampleTestCases: [
    {
      id: "sample-1",
      stdin: "4\n2 7 11 15\n9",
      expectedOutput: "0 1",
      isSample: true,
    },
  ],
  hiddenTestCaseCount: 3,
  hints: ["Use a HashMap"],
  createdAt: new Date().toISOString(),
};

const SAMPLE_SESSION: AssessmentSessionDto = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "Timed OA (60m) · Mixed Patterns",
  mode: "TIMED",
  difficultyPreset: "EASY_TO_MEDIUM",
  status: "IN_PROGRESS",
  durationMinutes: 60,
  startedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  remainingSeconds: 3590,
  totalScore: 0,
  maxTotalScore: 100,
  problems: [
    {
      orderIndex: 1,
      maxPoints: 100,
      earnedPoints: 0,
      solved: false,
      problem: SAMPLE_PROBLEM,
    },
  ],
  drafts: {},
};

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe("Coding Arena, Refresh-Safe OA & Question Studio DSA Mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("resumes active assessment session on load and restores localStorage draft buffer", async () => {
    const key = buildDraftStorageKey(
      SAMPLE_SESSION.id,
      SAMPLE_PROBLEM.id,
      "java"
    );
    window.localStorage.setItem(key, "// restored after refresh");

    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === "/assessments/active") {
        return { data: { success: true, data: { session: SAMPLE_SESSION } } };
      }
      return { data: { success: true, data: {} } };
    });

    renderWithProviders(<CodingArenaPage />);

    await waitFor(() => {
      expect(screen.getByText("Two Sum Indices")).toBeInTheDocument();
    });

    expect(screen.getByText("Q1")).toBeInTheDocument();
    const editor = screen.getByTestId("monaco-editor") as HTMLTextAreaElement;
    expect(editor.value).toBe("// restored after refresh");
  });

  it("renders PreSessionLobby when no session is active and starts UNTIMED session with EASY_ONLY preset", async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === "/assessments/active") {
        return { data: { success: true, data: { session: null } } };
      }
      if (url.startsWith("/coding/problems")) {
        return { data: { success: true, data: { problems: [SAMPLE_PROBLEM] } } };
      }
      if (url === "/assessments/history") {
        return { data: { success: true, data: { sessions: [] } } };
      }
      return { data: { success: true, data: {} } };
    });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        data: {
          session: {
            ...SAMPLE_SESSION,
            mode: "UNTIMED",
            durationMinutes: null,
            expiresAt: null,
            remainingSeconds: null,
          },
        },
      },
    });

    renderWithProviders(<CodingArenaPage />);

    await waitFor(() => {
      expect(screen.getByText("Untimed Practice")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Untimed Practice"));
    fireEvent.click(screen.getByText("Foundation"));
    fireEvent.click(screen.getByText("Start Practice Session"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/assessments",
        expect.objectContaining({
          mode: "UNTIMED",
          difficultyPreset: "EASY_ONLY",
        })
      );
    });
  });

  it("supports DSA & Algorithms mode toggle in QuestionGeneratorDialog and renders Solve in Coding Arena button", async () => {
    vi.mocked(questionsApi.generateQuestionSetApi).mockResolvedValue({
      id: "qs-1",
      userId: "u-1",
      resumeId: null,
      jdId: null,
      matchId: null,
      title: "DSA Set",
      topicFocus: "Sliding Window",
      difficulty: "MEDIUM",
      totalCount: 3,
      providerUsed: "MOCK",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [],
    });

    renderWithProviders(
      <>
        <QuestionGeneratorDialog open={true} onClose={() => {}} />
        <QuestionCard
          index={0}
          onOpenAnswerStudio={() => {}}
          question={{
            id: "q-1",
            questionSetId: "qs-1",
            category: "CODING",
            difficulty: "MEDIUM",
            targetedSkill: "SLIDING_WINDOW",
            questionText: "Find longest unique substring.",
            interviewerIntent: "Tests sliding window.",
            keyEvaluationPoints: ["O(n) time"],
            codingProblemId: SAMPLE_PROBLEM.id,
            createdAt: new Date().toISOString(),
          }}
        />
      </>
    );

    const arenaLink = screen.getByRole("link", {
      name: /Solve in Coding Arena/i,
    });
    expect(arenaLink).toHaveAttribute(
      "href",
      `/practice?problemId=${SAMPLE_PROBLEM.id}`
    );

    fireEvent.click(screen.getByRole("button", { name: /DSA & Algorithms/i }));
    expect(screen.getByLabelText("DSA Pattern")).toBeInTheDocument();
    expect(screen.getByLabelText("Preferred Language")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Generate Questions/i }));

    await waitFor(() => {
      expect(questionsApi.generateQuestionSetApi).toHaveBeenCalledWith(
        expect.objectContaining({
          generationMode: "DSA_ALGORITHMS",
          dsaPattern: "ALL_PATTERNS",
          preferredLanguage: "java",
        })
      );
    });
  });

  it("switches to Master DSA Sheet (240+) tab inside CodingArenaPage and filters problems", async () => {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === "/assessments/active") {
        return { data: { success: true, data: { session: null } } };
      }
      if (url.startsWith("/coding/problems")) {
        return { data: { success: true, data: { problems: [SAMPLE_PROBLEM] } } };
      }
      if (url === "/assessments/history") {
        return { data: { success: true, data: { sessions: [] } } };
      }
      if (url === "/dsa-sheet") {
        return {
          data: {
            success: true,
            data: {
              summary: {
                total: 2,
                solved: 1,
                revision: 0,
                unsolved: 1,
                byDifficulty: {
                  EASY: { total: 1, solved: 1 },
                  MEDIUM: { total: 1, solved: 0 },
                  HARD: { total: 0, solved: 0 },
                },
                byCategory: [
                  {
                    category: "1. Arrays & Matrix",
                    total: 1,
                    solved: 1,
                    revision: 0,
                  },
                  {
                    category: "6. Sliding Window",
                    total: 1,
                    solved: 0,
                    revision: 0,
                  },
                ],
              },
              problems: [
                {
                  order: 1,
                  title: "Two Sum",
                  slug: "two-sum",
                  leetcodeUrl: "https://leetcode.com/problems/two-sum/",
                  category: "1. Arrays & Matrix",
                  subPattern: "Hash Lookup",
                  difficulty: "EASY",
                  companies: ["Amazon"],
                  sourceSheets: ["Blind 75", "Striver SDE"],
                  patternClue: "Use a HashMap.",
                  arenaSlug: "two-sum",
                  status: "SOLVED",
                  notes: "",
                  updatedAt: null,
                },
                {
                  order: 2,
                  title: "Fruit Into Baskets",
                  slug: "fruit-into-baskets",
                  leetcodeUrl: "https://leetcode.com/problems/fruit-into-baskets/",
                  category: "6. Sliding Window",
                  subPattern: "At-Most-2-Distinct",
                  difficulty: "MEDIUM",
                  companies: ["Google"],
                  sourceSheets: ["Striver A2Z"],
                  patternClue: "Shrink when map size > 2.",
                  status: "UNSOLVED",
                  notes: "",
                  updatedAt: null,
                },
              ],
            },
          },
        };
      }
      return { data: { success: true, data: {} } };
    });

    renderWithProviders(<CodingArenaPage />);

    await waitFor(() => {
      expect(screen.getByText(/Master DSA Sheet \(300\)/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Master DSA Sheet \(300\)/i }));

    await waitFor(() => {
      expect(screen.getByText("Two Sum")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Filter by Difficulty"), {
      target: { value: "MEDIUM" },
    });

    expect(screen.queryByText("Two Sum")).not.toBeInTheDocument();
  });
});
