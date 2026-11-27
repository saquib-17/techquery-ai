import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { CodingProblemDto } from "@techquery/shared";
import { ActiveCodingWorkspace } from "@/features/coding/components/ActiveCodingWorkspace";
import { api } from "@/lib/api";

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

const UNSOLVED_PROBLEM: CodingProblemDto = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Two Sum",
  slug: "two-sum",
  difficulty: "EASY",
  pattern: "ARRAYS_TWO_POINTERS",
  statement: "Find two indices summing to target.",
  constraints: ["2 <= n <= 10^5"],
  examples: [{ input: "[2,7,11,15]\n9", output: "[0,1]" }],
  starterCode: {
    java: "class Solution { public int[] twoSum(int[] nums, int target) { return new int[]{}; } }",
    python: "class Solution:\n    def twoSum(self, nums, target):\n        pass",
    cpp: "class Solution {};",
    javascript: "var twoSum = function(nums, target) {};",
  },
  sampleTestCases: [
    {
      id: "sample-1",
      stdin: "[2,7,11,15]\n9",
      expectedOutput: "[0,1]",
      isSample: true,
    },
  ],
  hiddenTestCaseCount: 19,
  hints: ["Use a HashMap"],
  userStatus: "UNSOLVED",
  createdAt: new Date().toISOString(),
};

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("V2.5 Live Problem Status Badge & Human-Readable Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("renders human-readable pattern label and hides status badge for unattempted problem", () => {
    renderWithClient(
      <ActiveCodingWorkspace
        standaloneProblem={UNSOLVED_PROBLEM}
        onSessionCompleted={() => {}}
        onTimerExpired={() => {}}
      />
    );

    expect(screen.getByText("Arrays & Matrix")).toBeInTheDocument();
    expect(screen.queryByText("ARRAYS_TWO_POINTERS")).not.toBeInTheDocument();
    expect(screen.queryByTestId("problem-status-badge")).not.toBeInTheDocument();
  });

  it("immediately shows ◐ Attempted on failing SUBMIT and flips to ✓ Solved on 20/20 ACCEPTED (persisting across later failures)", async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            result: {
              verdict: "WRONG_ANSWER",
              passedCount: 5,
              totalCount: 20,
              runtimeMs: 12,
              memoryKb: 1024,
              results: [],
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            result: {
              verdict: "ACCEPTED",
              passedCount: 20,
              totalCount: 20,
              runtimeMs: 18,
              memoryKb: 1024,
              results: [],
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            result: {
              verdict: "RUNTIME_ERROR",
              passedCount: 0,
              totalCount: 20,
              runtimeMs: 5,
              memoryKb: 512,
              results: [],
            },
          },
        },
      });

    renderWithClient(
      <ActiveCodingWorkspace
        standaloneProblem={UNSOLVED_PROBLEM}
        onSessionCompleted={() => {}}
        onTimerExpired={() => {}}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Submit Solution/i });

    // 1. Failing submission -> ◐ Attempted
    fireEvent.click(submitBtn);
    await waitFor(() => {
      const badge = screen.getByTestId("problem-status-badge");
      expect(badge).toHaveTextContent("◐ Attempted");
    });

    // 2. Passing submission -> ✓ Solved
    fireEvent.click(submitBtn);
    await waitFor(() => {
      const badge = screen.getByTestId("problem-status-badge");
      expect(badge).toHaveTextContent("✓ Solved");
    });

    // 3. Subsequent failing experiment -> stays ✓ Solved (LeetCode behavior)
    fireEvent.click(submitBtn);
    await waitFor(() => {
      const badge = screen.getByTestId("problem-status-badge");
      expect(badge).toHaveTextContent("✓ Solved");
    });
  });
});
