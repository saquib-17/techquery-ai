import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AiTutorChat } from "../src/components/ai/AiTutorChat";
import { aiTutorApi } from "../src/components/ai/aiTutorApi";

vi.mock("../src/components/ai/aiTutorApi", () => ({
  aiTutorApi: {
    chat: vi.fn(),
  },
}));

describe("<AiTutorChat />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it("renders context-appropriate quick-action chips for each contextType", () => {
    const { rerender } = render(
      <AiTutorChat
        contextType="CS_TOPIC"
        contextId="os-deadlock"
        contextTitle="Deadlock & Coffman Conditions"
      />
    );
    expect(screen.getByRole("button", { name: "Explain simpler" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Real-life example" })).toBeInTheDocument();

    rerender(
      <AiTutorChat
        contextType="DSA_PROBLEM"
        contextId="two-sum"
        contextTitle="Two Sum"
      />
    );
    expect(screen.getByRole("button", { name: "Dry-run with example" })).toBeInTheDocument();

    rerender(
      <AiTutorChat
        contextType="CODING_IDE"
        contextId="merge-intervals"
        contextTitle="Merge Intervals"
      />
    );
    expect(screen.getByRole("button", { name: "Why is my code failing?" })).toBeInTheDocument();

    rerender(
      <AiTutorChat
        contextType="OA_REVIEW"
        contextId="oa-1"
        contextTitle="Mock OA #1"
      />
    );
    expect(screen.getByRole("button", { name: "How to improve speed?" })).toBeInTheDocument();

    rerender(
      <AiTutorChat
        contextType="STUDY_ROADMAP"
        contextId="rm-1"
        contextTitle="SDE-1 8-Week Plan"
      />
    );
    expect(screen.getByRole("button", { name: "Break down this week" })).toBeInTheDocument();

    rerender(
      <AiTutorChat
        contextType="RESUME_MATCH"
        contextId="match-1"
        contextTitle="Backend Engineer Match"
      />
    );
    expect(screen.getByRole("button", { name: "How to fix missing skills?" })).toBeInTheDocument();
  });

  it("sends a quick-chip prompt and renders the assistant reply", async () => {
    vi.mocked(aiTutorApi.chat).mockResolvedValueOnce({
      reply: "Think of a deadlock like two people in a narrow hallway.",
      providerUsed: "FALLBACK",
    });

    render(
      <AiTutorChat
        contextType="CS_TOPIC"
        contextId="os-deadlock"
        contextTitle="Deadlock"
        contextSummary="Mutual exclusion, hold and wait, no preemption, circular wait."
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Explain simpler" }));

    await waitFor(() => {
      expect(
        screen.getByText("Think of a deadlock like two people in a narrow hallway.")
      ).toBeInTheDocument();
    });

    expect(aiTutorApi.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        contextType: "CS_TOPIC",
        contextId: "os-deadlock",
        contextTitle: "Deadlock",
        messages: [{ role: "user", content: "Explain simpler" }],
      })
    );
  });

  it("sends a custom follow-up question and supports Clear", async () => {
    vi.mocked(aiTutorApi.chat).mockResolvedValueOnce({
      reply: "Use a hash map to store complements in O(n) time.",
      providerUsed: "GROQ",
    });

    render(
      <AiTutorChat
        contextType="DSA_PROBLEM"
        contextId="two-sum"
        contextTitle="Two Sum"
      />
    );

    const input = screen.getByLabelText("Ask a follow-up doubt");
    fireEvent.change(input, { target: { value: "Why not sort first?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(
        screen.getByText("Use a hash map to store complements in O(n) time.")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(
      screen.queryByText("Use a hash map to store complements in O(n) time.")
    ).not.toBeInTheDocument();
  });

  it("displays an error banner if the API call fails", async () => {
    vi.mocked(aiTutorApi.chat).mockRejectedValueOnce(
      new Error("Rate limit exceeded")
    );

    render(
      <AiTutorChat
        contextType="CODING_IDE"
        contextId="valid-parentheses"
        contextTitle="Valid Parentheses"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Explain time complexity" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Rate limit exceeded");
    });
  });

  it("isolates persisted chat history per contextType and contextId", async () => {
    vi.mocked(aiTutorApi.chat).mockResolvedValueOnce({
      reply: "First topic reply",
      providerUsed: "FALLBACK",
    });

    const { rerender } = render(
      <AiTutorChat
        contextType="CS_TOPIC"
        contextId="topic-a"
        contextTitle="Topic A"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Explain simpler" }));
    await waitFor(() => {
      expect(screen.getByText("First topic reply")).toBeInTheDocument();
    });

    rerender(
      <AiTutorChat
        contextType="CS_TOPIC"
        contextId="topic-b"
        contextTitle="Topic B"
      />
    );
    expect(screen.queryByText("First topic reply")).not.toBeInTheDocument();

    rerender(
      <AiTutorChat
        contextType="CS_TOPIC"
        contextId="topic-a"
        contextTitle="Topic A"
      />
    );
    expect(screen.getByText("First topic reply")).toBeInTheDocument();
  });
});
