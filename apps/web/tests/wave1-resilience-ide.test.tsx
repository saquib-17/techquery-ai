import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NotFoundPage } from "@/components/NotFoundPage";
import { ActiveCodingWorkspace } from "@/features/coding/components/ActiveCodingWorkspace";
import type { CodingProblemDto } from "@techquery/shared";

const SAMPLE_PROBLEM: CodingProblemDto = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Two Sum",
  slug: "two-sum",
  difficulty: "EASY",
  pattern: "ARRAYS_TWO_POINTERS",
  statement: "Find two numbers that add up to target.",
  constraints: ["2 <= nums.length <= 10^5"],
  examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]" }],
  starterCode: {
    java: "class Solution {\n  public int[] twoSum(int[] nums, int target) {\n    return new int[]{-1, -1};\n  }\n}",
    python: "class Solution:\n  def twoSum(self, nums, target):\n    return [-1, -1]",
    cpp: "class Solution {\npublic:\n  vector<int> twoSum(vector<int>& nums, int target) { return {-1, -1}; }\n};",
    javascript: "var twoSum = function(nums, target) {\n  return [-1, -1];\n};",
  },
  sampleTestCases: [
    { id: "sample-1", stdin: "4\n2 7 11 15\n9", expectedOutput: "[0,1]", isSample: true },
    { id: "sample-2", stdin: "3\n3 2 4\n6", expectedOutput: "[1,2]", isSample: true },
    { id: "sample-3", stdin: "2\n3 3\n6", expectedOutput: "[0,1]", isSample: true },
  ],
  hiddenTestCaseCount: 17,
  hints: [
    "Store seen values in a hash map.",
    "Check if target - x is already in the map.",
  ],
  createdAt: new Date().toISOString(),
};

function Boom(): never {
  throw new Error("Simulated render crash");
}

describe("Wave 1: Resilience, 404, IDE Toolbar & Hints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("renders ErrorBoundary recovery card when a child component throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onReset = vi.fn();

    render(
      <ErrorBoundary onReset={onReset}>
        <Boom />
      </ErrorBoundary>
    );

    expect(
      screen.getByText(/Something went wrong loading this view/i)
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /Reload Practice Session/i })
    );
    expect(onReset).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("renders NotFoundPage with Back to Coding Practice and Go Home links", () => {
    render(
      <MemoryRouter initialEntries={["/unknown-route"]}>
        <Routes>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page Not Found")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to Coding Practice/i })
    ).toHaveAttribute("href", "/practice");
    expect(screen.getByRole("link", { name: /Go Home/i })).toHaveAttribute(
      "href",
      "/dashboard"
    );
  });

  it("supports Format, Copy, 2-step Reset, and progressive Hints tab in ActiveCodingWorkspace", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <MemoryRouter>
            <ActiveCodingWorkspace
              standaloneProblem={SAMPLE_PROBLEM}
              problemsBank={[SAMPLE_PROBLEM]}
              onSelectStandaloneProblem={vi.fn()}
              onExitStandalone={vi.fn()}
              onSessionCompleted={vi.fn()}
              onTimerExpired={vi.fn()}
            />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );

    // Hints tab with progressive click-to-reveal
    fireEvent.click(screen.getByRole("button", { name: /Hints \(2\)/i }));
    expect(screen.getByText("Hint 1")).toBeInTheDocument();
    expect(
      screen.queryByText("Store seen values in a hash map.")
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Reveal Hint/i })[0]!);
    expect(
      screen.getByText("Store seen values in a hash map.")
    ).toBeInTheDocument();

    // Format & Copy buttons
    fireEvent.click(screen.getByRole("button", { name: /Format/i }));
    fireEvent.click(screen.getByRole("button", { name: /Copy/i }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Copied")).toBeInTheDocument();
    });

    // 2-step Reset guard
    fireEvent.click(screen.getByRole("button", { name: /^Reset$/i }));
    expect(
      screen.getByRole("button", { name: /Confirm Reset\?/i })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Confirm Reset\?/i }));
    expect(
      screen.getByRole("button", { name: /^Reset$/i })
    ).toBeInTheDocument();
  });
});
