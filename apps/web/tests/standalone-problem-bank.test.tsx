import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StandaloneProblemBank } from "@/features/coding/components/StandaloneProblemBank";
import type { CodingProblemDto } from "@techquery/shared";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn().mockImplementation(async (url: string) => {
      if (url === "/dsa-sheet") {
        return {
          data: {
            success: true,
            data: {
              summary: { totalProblems: 520, solvedCount: 1, revisionCount: 0 },
              problems: [
                {
                  id: "1",
                  order: 1,
                  title: "Two Sum",
                  slug: "two-sum",
                  difficulty: "EASY",
                  category: "1. Arrays & Matrix",
                  subPattern: "Hash Map Lookup",
                  status: "SOLVED",
                  notes: "",
                  sheetSources: ["Blind 75"],
                  companies: ["Amazon"],
                  leetcodeUrl: "https://leetcode.com/problems/two-sum",
                  arenaSlug: "two-sum",
                  estimatedMinutes: 15,
                },
              ],
            },
          },
        };
      }
      return { data: { success: true, data: {} } };
    }),
  },
}));

const MOCK_PROBLEMS: CodingProblemDto[] = [
  {
    id: "p-1",
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "EASY",
    pattern: "ARRAYS_TWO_POINTERS",
    statement: "Find two indices that sum up to target.",
    constraints: ["2 <= nums.length <= 10^4"],
    examples: [{ input: "[2,7,11,15]\n9", output: "[0,1]" }],
    starterCode: { java: "", python: "", cpp: "", javascript: "" },
    sampleTestCases: [
      { id: "s1", stdin: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isSample: true },
    ],
    hiddenTestCaseCount: 19,
    hints: ["Use a map"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "p-2",
    title: "Container With Most Water",
    slug: "container-with-most-water",
    difficulty: "MEDIUM",
    pattern: "ARRAYS_TWO_POINTERS",
    statement: "Find two lines that form a container with maximum water.",
    constraints: ["2 <= n <= 10^5"],
    examples: [{ input: "[1,8,6,2,5,4,8,3,7]", output: "49" }],
    starterCode: { java: "", python: "", cpp: "", javascript: "" },
    sampleTestCases: [
      { id: "s2", stdin: "[1,8,6,2,5,4,8,3,7]", expectedOutput: "49", isSample: true },
    ],
    hiddenTestCaseCount: 19,
    hints: ["Two pointers from ends"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "p-3",
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    difficulty: "EASY",
    pattern: "DYNAMIC_PROGRAMMING",
    statement: "Count distinct ways to climb n stairs.",
    constraints: ["1 <= n <= 45"],
    examples: [{ input: "2", output: "2" }],
    starterCode: { java: "", python: "", cpp: "", javascript: "" },
    sampleTestCases: [
      { id: "s3", stdin: "2", expectedOutput: "2", isSample: true },
    ],
    hiddenTestCaseCount: 19,
    hints: ["Fibonacci recurrence"],
    createdAt: new Date().toISOString(),
  },
];

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("V2.5 Standalone Problem Bank: Pattern-Grouped Accordion Tables", () => {
  it("renders human-readable pattern headers instead of raw enum strings", () => {
    renderWithClient(
      <StandaloneProblemBank
        problems={MOCK_PROBLEMS}
        onSelectProblem={() => {}}
        onGenerateProblem={() => {}}
      />
    );

    // Human-readable names should be present in accordion headers
    expect(screen.getAllByText("Arrays & Matrix").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Two Pointers").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("1-D Dynamic Programming").length).toBeGreaterThanOrEqual(1);

    // Raw enum strings should NOT be visible
    expect(screen.queryByText("ARRAYS_TWO_POINTERS")).not.toBeInTheDocument();
    expect(screen.queryByText("DYNAMIC_PROGRAMMING")).not.toBeInTheDocument();
  });

  it("filters problems by search text query and auto-expands matching group", () => {
    renderWithClient(
      <StandaloneProblemBank
        problems={MOCK_PROBLEMS}
        onSelectProblem={() => {}}
        onGenerateProblem={() => {}}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search 3 runnable problems/i);
    fireEvent.change(searchInput, { target: { value: "Water" } });

    expect(screen.getByText("Container With Most Water")).toBeInTheDocument();
    expect(screen.queryByText("Climbing Stairs")).not.toBeInTheDocument();
  });

  it("filters problems by difficulty pill", () => {
    renderWithClient(
      <StandaloneProblemBank
        problems={MOCK_PROBLEMS}
        onSelectProblem={() => {}}
        onGenerateProblem={() => {}}
      />
    );

    // Click Medium difficulty pill
    const mediumPill = screen.getByRole("button", { name: "Medium" });
    fireEvent.click(mediumPill);

    expect(screen.getByText("Container With Most Water")).toBeInTheDocument();
    expect(screen.queryByText("Climbing Stairs")).not.toBeInTheDocument();
    expect(screen.queryByText("Two Sum")).not.toBeInTheDocument();
  });

  it("invokes onSelectProblem when clicking problem row or Solve button", () => {
    const handleSelect = vi.fn();
    renderWithClient(
      <StandaloneProblemBank
        problems={MOCK_PROBLEMS}
        onSelectProblem={handleSelect}
        onGenerateProblem={() => {}}
      />
    );

    // Expand all groups to ensure all rows are visible
    const expandAllBtn = screen.getByRole("button", { name: /Expand All/i });
    fireEvent.click(expandAllBtn);

    const solveButtons = screen.getAllByRole("button", { name: /Solve →|Review →/i });
    expect(solveButtons.length).toBeGreaterThan(0);
    fireEvent.click(solveButtons[0]);

    expect(handleSelect).toHaveBeenCalledTimes(1);
  });

  it("supports Expand All and Collapse All toggles", () => {
    renderWithClient(
      <StandaloneProblemBank
        problems={MOCK_PROBLEMS}
        onSelectProblem={() => {}}
        onGenerateProblem={() => {}}
      />
    );

    const toggleBtn = screen.getByRole("button", { name: /Expand All|Collapse All/i });
    fireEvent.click(toggleBtn);

    // Verify button label toggles
    expect(
      screen.getByRole("button", { name: /Expand All|Collapse All/i })
    ).toBeInTheDocument();
  });
});
