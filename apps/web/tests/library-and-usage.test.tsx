import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ToastProvider } from "@/components/ui/toast";
import { LibraryPage } from "@/features/library/pages/LibraryPage";
import { UsagePage } from "@/features/usage/pages/UsagePage";
import { QuestionCard } from "@/features/questions/components/QuestionCard";
import { ApiClientError } from "@/lib/api";
import * as collectionsApi from "@/features/library/collections.api";
import * as usageApi from "@/features/usage/usage.api";
import type { QuestionItem } from "@/features/questions/questions.api";

vi.mock("@/features/library/collections.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/library/collections.api")
  >("@/features/library/collections.api");
  return {
    ...actual,
    getCollectionsApi: vi.fn(),
    getCollectionDetailApi: vi.fn(),
    createCollectionApi: vi.fn(),
    updateCollectionApi: vi.fn(),
    deleteCollectionApi: vi.fn(),
    addCollectionItemApi: vi.fn(),
    removeCollectionItemApi: vi.fn(),
    exportCollectionPdf: vi.fn(),
  };
});

vi.mock("@/features/usage/usage.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/usage/usage.api")
  >("@/features/usage/usage.api");
  return {
    ...actual,
    getUsageQuotasApi: vi.fn(),
    updateTierApi: vi.fn(),
  };
});

function renderWithProviders(ui: React.ReactElement, initialEntry = "/library") {
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

const MOCK_COLLECTION: collectionsApi.CollectionSummary = {
  id: "col-1",
  userId: "user-1",
  name: "System Design Loops",
  description: "High-leverage distributed systems prep",
  createdAt: "2026-11-25T09:00:00Z",
  updatedAt: "2026-11-25T09:00:00Z",
  itemCount: 1,
};

const MOCK_QUESTION: QuestionItem = {
  id: "q-1",
  questionSetId: "set-1",
  category: "SYSTEM_DESIGN",
  difficulty: "HARD",
  targetedSkill: "Consistent Hashing",
  questionText: "Design a distributed cache with minimal key movement on node churn.",
  interviewerIntent: "Checks consistent hashing and virtual nodes knowledge.",
  keyEvaluationPoints: ["Hash ring", "Virtual nodes", "Replication factor"],
  createdAt: "2026-11-25T09:00:00Z",
  answer: null,
};

const MOCK_COLLECTION_DETAIL: collectionsApi.CollectionDetail = {
  id: "col-1",
  userId: "user-1",
  name: "System Design Loops",
  description: "High-leverage distributed systems prep",
  createdAt: "2026-11-25T09:00:00Z",
  updatedAt: "2026-11-25T09:00:00Z",
  items: [
    {
      id: "item-1",
      collectionId: "col-1",
      questionId: "q-1",
      addedAt: "2026-11-25T09:10:00Z",
      question: MOCK_QUESTION,
    },
  ],
};

const FREE_QUOTAS: usageApi.UserQuotasResponse = {
  tier: "FREE",
  quotas: {
    resumes: { used: 1, limit: 3, remaining: 2, isUnlimited: false },
    jobDescriptions: { used: 2, limit: 5, remaining: 3, isUnlimited: false },
    questionSetsMonthly: { used: 4, limit: 5, remaining: 1, isUnlimited: false },
    answersMonthly: { used: 18, limit: 20, remaining: 2, isUnlimited: false },
  },
};

const PRO_QUOTAS: usageApi.UserQuotasResponse = {
  tier: "PRO",
  quotas: {
    resumes: { used: 1, limit: 10, remaining: 9, isUnlimited: false },
    jobDescriptions: { used: 2, limit: 50, remaining: 48, isUnlimited: false },
    questionSetsMonthly: { used: 4, limit: 50, remaining: 46, isUnlimited: false },
    answersMonthly: { used: 18, limit: null, remaining: null, isUnlimited: true },
  },
};

describe("Saved Library & Quotas/Tier Manager (Phase F8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. creates a collection, displays bookmarked questions, exports PDF, and removes an item on LibraryPage", async () => {
    vi.mocked(collectionsApi.getCollectionsApi)
      .mockResolvedValueOnce([])
      .mockResolvedValue([MOCK_COLLECTION]);
    vi.mocked(collectionsApi.createCollectionApi).mockResolvedValue(MOCK_COLLECTION);
    vi.mocked(collectionsApi.getCollectionDetailApi).mockResolvedValue(
      MOCK_COLLECTION_DETAIL,
    );
    vi.mocked(collectionsApi.exportCollectionPdf).mockResolvedValue(undefined);
    vi.mocked(collectionsApi.removeCollectionItemApi).mockResolvedValue(undefined);

    renderWithProviders(<LibraryPage />, "/library");

    await waitFor(() => {
      expect(screen.getByText("No saved collections yet")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /New Collection/i })[0],
    );

    fireEvent.change(screen.getByLabelText(/Collection Name/i), {
      target: { value: "System Design Loops" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "High-leverage distributed systems prep" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create Collection/i }));

    await waitFor(() => {
      expect(collectionsApi.createCollectionApi).toHaveBeenCalledWith({
        name: "System Design Loops",
        description: "High-leverage distributed systems prep",
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Design a distributed cache with minimal key movement/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Export Study PDF/i }));
    await waitFor(() => {
      expect(collectionsApi.exportCollectionPdf).toHaveBeenCalledWith(
        "col-1",
        "System Design Loops",
      );
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Remove from Collection/i }),
    );
    await waitFor(() => {
      expect(collectionsApi.removeCollectionItemApi).toHaveBeenCalledWith(
        "col-1",
        "q-1",
      );
    });
  });

  it("2. bookmarks a question from QuestionCard and handles 409 Conflict duplicate cleanly", async () => {
    vi.mocked(collectionsApi.getCollectionsApi).mockResolvedValue([MOCK_COLLECTION]);
    vi.mocked(collectionsApi.addCollectionItemApi)
      .mockRejectedValueOnce(
        new ApiClientError("Already in collection", 409, "CONFLICT"),
      )
      .mockResolvedValueOnce(undefined);

    renderWithProviders(
      <QuestionCard
        question={MOCK_QUESTION}
        index={0}
        onOpenAnswerStudio={vi.fn()}
      />,
      "/questions",
    );

    fireEvent.click(screen.getByRole("button", { name: /^Save$/i }));

    await waitFor(() => {
      expect(screen.getByText("System Design Loops")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /System Design Loops/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Already saved in this collection/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /System Design Loops/i }));

    await waitFor(() => {
      expect(collectionsApi.addCollectionItemApi).toHaveBeenCalledTimes(2);
      expect(collectionsApi.addCollectionItemApi).toHaveBeenLastCalledWith(
        "col-1",
        "q-1",
      );
    });
  });

  it("3. renders live quota meters on UsagePage and switches FREE -> PRO in 1 click", async () => {
    vi.mocked(usageApi.getUsageQuotasApi)
      .mockResolvedValueOnce(FREE_QUOTAS)
      .mockResolvedValue(PRO_QUOTAS);
    vi.mocked(usageApi.updateTierApi).mockResolvedValue({
      tier: "PRO",
      message: "Tier updated to PRO successfully",
      quotas: PRO_QUOTAS.quotas,
    });

    renderWithProviders(<UsagePage />, "/usage");

    await waitFor(() => {
      expect(screen.getByText("Active Tier: FREE")).toBeInTheDocument();
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
      expect(screen.getByText("18 / 20")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Switch to Pro \(₹0 Demo\)/i }),
    );

    await waitFor(() => {
      expect(usageApi.updateTierApi).toHaveBeenCalledWith("PRO");
      expect(screen.getByText("Active Tier: PRO")).toBeInTheDocument();
      expect(screen.getByText("Unlimited")).toBeInTheDocument();
    });
  });
});
