import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { CsFundamentalsPage } from "./CsFundamentalsPage";
import * as csApi from "./csFundamentalsApi";
import { CS_FUNDAMENTALS_TOPICS, CS_SUBJECTS } from "@techquery/shared";

vi.mock("./csFundamentalsApi", () => ({
  fetchCsFundamentalsApi: vi.fn(),
  updateCsProgressApi: vi.fn(),
  generateCsWalkthroughApi: vi.fn(),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <CsFundamentalsPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe("CsFundamentalsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const sampleTopics = [
      {
        ...CS_FUNDAMENTALS_TOPICS[0],
        status: "UNSTUDIED" as const,
        notes: null,
        updatedAt: null,
      },
      {
        ...CS_FUNDAMENTALS_TOPICS.find(
          (t) => t.subject === "SQL & Query Patterns"
        )!,
        status: "LEARNED" as const,
        notes: "Remember logical execution order",
        updatedAt: "2026-11-26T10:00:00.000Z",
      },
      {
        ...CS_FUNDAMENTALS_TOPICS.find(
          (t) => t.subject === "Behavioral & HR"
        )!,
        status: "UNSTUDIED" as const,
        notes: null,
        updatedAt: null,
      },
    ];

    vi.mocked(csApi.fetchCsFundamentalsApi).mockResolvedValue({
      summary: {
        total: 210,
        learned: 1,
        revision: 0,
        unstudied: 209,
        byPriority: {
          MUST_KNOW: { total: 90, learned: 1 },
          IMPORTANT: { total: 45, learned: 0 },
          ADVANCED: { total: 17, learned: 0 },
        },
        subjects: CS_SUBJECTS.map((subject, i) => ({
          subject,
          total: 25,
          learned: i === 2 ? 1 : 0,
          revision: 0,
        })),
      },
      topics: sampleTopics,
    });

    vi.mocked(csApi.updateCsProgressApi).mockResolvedValue({
      topicSlug: sampleTopics[0].slug,
      status: "LEARNED",
      notes: null,
      updatedAt: "2026-11-26T10:05:00.000Z",
    });

    vi.mocked(csApi.generateCsWalkthroughApi).mockResolvedValue({
      topicSlug: sampleTopics[1].slug,
      title: sampleTopics[1].title,
      subject: "SQL & Query Patterns",
      conceptBreakdown: "SQL executes FROM and JOIN before SELECT.",
      realWorldAnalogy: "Like sorting ingredients before plating.",
      visualType: "CODE",
      visualTitle: "SQL Query Pattern",
      codeOrQueryExample:
        "SELECT dept_id, COUNT(*)\nFROM employees\nGROUP BY dept_id;",
      exampleLanguage: "sql",
      diagramFlow: "",
      comparisonPoints: [],
      interviewQuestions: [
        {
          question: "Why can't WHERE reference SELECT aliases?",
          answer: "Because WHERE runs before SELECT in logical execution order.",
        },
      ],
      commonTraps: ["Filtering aggregates in WHERE instead of HAVING."],
      providerUsed: "FALLBACK",
    });
  });

  it("defaults to Operating Systems tab, switches cleanly between subject tabs, and opens AI Guide with SQL syntax highlighting", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/CS Subjects, System Design & HR Prep/i)).toBeInTheDocument();
      expect(screen.getByText(/1 \/ 210/i)).toBeInTheDocument();
    });

    // Only Operating Systems topic is shown by default
    expect(
      screen.getByText(CS_FUNDAMENTALS_TOPICS[0]!.title)
    ).toBeInTheDocument();
    const sqlTopic = CS_FUNDAMENTALS_TOPICS.find(
      (t) => t.subject === "SQL & Query Patterns"
    )!;
    expect(screen.queryByText(sqlTopic.title)).not.toBeInTheDocument();

    // Switch to SQL Queries tab
    fireEvent.click(
      screen.getByRole("button", { name: /SQL Queries/i })
    );

    await waitFor(() => {
      expect(screen.getByText(sqlTopic.title)).toBeInTheDocument();
      expect(
        screen.queryByText(CS_FUNDAMENTALS_TOPICS[0]!.title)
      ).not.toBeInTheDocument();
    });

    // Click AI Guide on the SQL topic
    fireEvent.click(screen.getByRole("button", { name: /AI Guide/i }));

    await waitFor(() => {
      expect(screen.getByText(/Simple AI Explanation/i)).toBeInTheDocument();
      expect(
        screen.getByText(/SQL executes FROM and JOIN before SELECT\./i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Why can't WHERE reference SELECT aliases\?/i)
      ).toBeInTheDocument();
    });

    // Close drawer, switch to Behavioral & HR tab, and open STAR AI Guide
    fireEvent.click(screen.getByRole("button", { name: /Close AI Guide/i }));

    vi.mocked(csApi.generateCsWalkthroughApi).mockResolvedValueOnce({
      topicSlug: "hr-tell-me-about-yourself",
      title: "Tell me about yourself.",
      subject: "Behavioral & HR",
      conceptBreakdown: "Tests clarity and confidence.",
      realWorldAnalogy: "",
      visualType: "STAR",
      visualTitle: "STAR Method Blueprint & Sample Answer",
      codeOrQueryExample: "",
      exampleLanguage: "java",
      diagramFlow: "",
      comparisonPoints: [],
      whatInterviewerTests: "Tests clarity and a crisp Present-Past-Future pitch.",
      starFramework: {
        situation: "Final-year CS student building full-stack projects.",
        task: "Introduce yourself in 60 seconds.",
        action: "Highlight your strongest project and core skills.",
        result: "Set a confident tone for the interview.",
      },
      sampleSpokenAnswer: "Hi, I am a final-year CS student...",
      avoidMistakes: ["Reciting your entire resume word for word."],
      interviewQuestions: [
        {
          question: "Which project are you most proud of?",
          answer: "Pick one with measurable impact.",
        },
      ],
      commonTraps: ["Reciting your entire resume word for word."],
      providerUsed: "FALLBACK",
    });

    fireEvent.click(screen.getByRole("button", { name: /HR & Behavioral/i }));
    await waitFor(() => {
      expect(screen.getByText(/Tell me about yourself\./i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /AI Guide/i }));
    await waitFor(() => {
      expect(screen.getByText(/4-Step STAR Blueprint/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Hi, I am a final-year CS student\.\.\./i)
      ).toBeInTheDocument();
    });
  });
});
