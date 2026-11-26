import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExecutionConsole } from "@/features/coding/components/ExecutionConsole";
import type { CodeExecutionResultDto } from "@techquery/shared";

describe("Wave 2: Clean LeetCode Submit Console", () => {
  it("renders ONLY the compact Accepted Summary Card on SUBMIT 20/20 pass (no 20 pill buttons or IO boxes)", () => {
    const result: CodeExecutionResultDto = {
      verdict: "ACCEPTED",
      passedCount: 20,
      totalCount: 20,
      runtimeMs: 42,
      memoryKb: 2048,
      results: Array.from({ length: 20 }, (_, i) => ({
        testCaseId: i < 3 ? `sample-${i + 1}` : `hidden-${i - 2}`,
        caseNumber: i + 1,
        isHidden: i >= 3,
        passed: true,
        stdin: `input-${i + 1}`,
        expectedOutput: `out-${i + 1}`,
        actualOutput: `out-${i + 1}`,
      })),
    };

    render(<ExecutionConsole result={result} mode="SUBMIT" isRunning={false} />);

    expect(
      screen.getByText(/✓ ACCEPTED · 20 \/ 20 Test Cases Passed/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Synced to Master DSA Sheet/i)).toBeInTheDocument();
    expect(screen.getByText(/Runtime: 42 ms/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Case 1/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Expected Output/i)).not.toBeInTheDocument();
  });

  it("renders ONLY the first failing hidden test case on SUBMIT failure", () => {
    const result: CodeExecutionResultDto = {
      verdict: "WRONG_ANSWER",
      passedCount: 9,
      totalCount: 20,
      runtimeMs: 25,
      memoryKb: 1024,
      friendlyMessage:
        "Wrong Answer on Test Case #10 — compare your output with the expected output and check edge cases.",
      results: [
        ...Array.from({ length: 9 }, (_, i) => ({
          testCaseId: `case-${i + 1}`,
          caseNumber: i + 1,
          isHidden: i >= 3,
          passed: true,
          stdin: "x",
          expectedOutput: "y",
          actualOutput: "y",
        })),
        {
          testCaseId: "hidden-7",
          caseNumber: 10,
          isHidden: true,
          passed: false,
          stdin: "secret",
          expectedOutput: "10",
          actualOutput: "9",
        },
      ],
    };

    render(<ExecutionConsole result={result} mode="SUBMIT" isRunning={false} />);

    expect(screen.getByText(/\(9 \/ 20 Test Cases Passed\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Failed on Hidden Edge Case #10/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Case 1/i })).not.toBeInTheDocument();
  });

  it("keeps interactive Case 1..3 tabs in SAMPLE mode", () => {
    const result: CodeExecutionResultDto = {
      verdict: "ACCEPTED",
      passedCount: 3,
      totalCount: 3,
      runtimeMs: 12,
      memoryKb: 512,
      results: [1, 2, 3].map((n) => ({
        testCaseId: `sample-${n}`,
        caseNumber: n,
        isHidden: false,
        passed: true,
        stdin: `in-${n}`,
        expectedOutput: `out-${n}`,
        actualOutput: `out-${n}`,
      })),
    };

    render(<ExecutionConsole result={result} mode="SAMPLE" isRunning={false} />);

    expect(screen.getByRole("button", { name: /Case 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Case 2/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Case 3/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Case 2/i }));
    expect(screen.getByText("in-2")).toBeInTheDocument();
  });
});
