import * as React from "react";
import { useSearchParams } from "react-router-dom";
import {
  Download,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  exportQuestionSetPdf,
  type QuestionCategory,
  type QuestionItem,
  type QuestionSetSummary,
} from "@/features/questions/questions.api";
import {
  useDeleteQuestionSetMutation,
  useQuestionSetDetailQuery,
  useQuestionSetsQuery,
} from "@/features/questions/useQuestions";
import { QuestionGeneratorDialog } from "@/features/questions/components/QuestionGeneratorDialog";
import { QuestionCard } from "@/features/questions/components/QuestionCard";
import { AnswerStudioDrawer } from "@/features/questions/components/AnswerStudioDrawer";

type CategoryFilter = "ALL" | QuestionCategory;

const FILTER_PILLS: Array<{ value: CategoryFilter; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "THEORETICAL", label: "Theoretical" },
  { value: "CODING", label: "Coding" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "PROJECT_DEFENSE", label: "Project Defense" },
];

export function QuestionsPage() {
  const [searchParams] = useSearchParams();
  const initialResumeId = searchParams.get("resumeId");
  const initialJdId = searchParams.get("jdId");
  const initialMatchId = searchParams.get("matchId");
  const hasHandoffParams = Boolean(
    initialResumeId || initialJdId || initialMatchId,
  );

  const { toast } = useToast();
  const setsQuery = useQuestionSetsQuery();
  const deleteMutation = useDeleteQuestionSetMutation();

  const [selectedSetId, setSelectedSetId] = React.useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] =
    React.useState<CategoryFilter>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [generatorOpen, setGeneratorOpen] =
    React.useState<boolean>(hasHandoffParams);
  const [deleteTarget, setDeleteTarget] =
    React.useState<QuestionSetSummary | null>(null);
  const [drawerQuestionId, setDrawerQuestionId] = React.useState<string | null>(
    null,
  );
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);

  const questionSets = setsQuery.data ?? [];

  React.useEffect(() => {
    if (questionSets.length === 0) {
      setSelectedSetId(null);
      return;
    }
    if (!selectedSetId || !questionSets.some((s) => s.id === selectedSetId)) {
      setSelectedSetId(questionSets[0].id);
    }
  }, [questionSets, selectedSetId]);

  const detailQuery = useQuestionSetDetailQuery(selectedSetId);
  const activeSet = detailQuery.data ?? null;

  const categoryCounts = React.useMemo(() => {
    const items = activeSet?.questions ?? [];
    const counts: Record<CategoryFilter, number> = {
      ALL: items.length,
      THEORETICAL: 0,
      CODING: 0,
      SYSTEM_DESIGN: 0,
      BEHAVIORAL: 0,
      PROJECT_DEFENSE: 0,
    };
    for (const q of items) {
      if (q.category in counts) {
        counts[q.category]++;
      }
    }
    return counts;
  }, [activeSet]);

  const filteredQuestions = React.useMemo(() => {
    const items = activeSet?.questions ?? [];
    const byCategory =
      categoryFilter === "ALL"
        ? items
        : items.filter((q) => q.category === categoryFilter);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter(
      (item) =>
        item.questionText.toLowerCase().includes(q) ||
        item.targetedSkill.toLowerCase().includes(q),
    );
  }, [activeSet, categoryFilter, searchQuery]);

  const activeDrawerQuestion: QuestionItem | null = React.useMemo(() => {
    if (!drawerQuestionId || !activeSet) return null;
    return activeSet.questions.find((q) => q.id === drawerQuestionId) ?? null;
  }, [activeSet, drawerQuestionId]);

  const handleExportPdf = async () => {
    if (!activeSet) return;
    setIsExportingPdf(true);
    try {
      await exportQuestionSetPdf(activeSet.id, activeSet.title);
      toast({
        variant: "success",
        title: "PDF exported",
        description: `Downloaded ${activeSet.title}.pdf`,
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Export failed",
        description:
          err instanceof ApiClientError
            ? err.message
            : "Could not export question set PDF.",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      if (selectedSetId === deleteTarget.id) {
        setSelectedSetId(null);
      }
      setDeleteTarget(null);
      toast({
        variant: "success",
        title: "Question set deleted",
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Delete failed",
        description:
          err instanceof ApiClientError
            ? err.message
            : "Could not delete question set.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Question &amp; Answer Studio
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Generate targeted technical &amp; behavioral sets and rehearse with
            structured AI model answers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeSet && (
            <Button
              type="button"
              variant="outline"
              isLoading={isExportingPdf}
              onClick={() => void handleExportPdf()}
            >
              <Download className="h-4 w-4" />
              Export Set PDF
            </Button>
          )}
          <Button type="button" onClick={() => setGeneratorOpen(true)}>
            <Plus className="h-4 w-4" />
            Generate Question Set
          </Button>
        </div>
      </div>

      {/* Main Full-Width Workbench */}
      {setsQuery.isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : questionSets.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="No question sets generated yet"
          description="Generate your first tailored interview question set from a topic focus, resume, or job description match."
          actionLabel="Generate Question Set"
          onAction={() => setGeneratorOpen(true)}
        />
      ) : (
        <div className="space-y-5">
          {/* Top Saved Question Sets Bar */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                Saved Question Sets ({questionSets.length})
              </span>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {questionSets.map((setItem) => {
                const selected = setItem.id === selectedSetId;
                return (
                  <li
                    key={setItem.id}
                    onClick={() => {
                      setSelectedSetId(setItem.id);
                      setCategoryFilter("ALL");
                      setSearchQuery("");
                    }}
                    className={cn(
                      "rounded-xl border p-4 transition-colors cursor-pointer",
                      selected
                        ? "border-primary bg-primary-soft/50"
                        : "border-border bg-surface hover:border-border-strong",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {setItem.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink-muted">
                          {setItem.topicFocus}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${setItem.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(setItem);
                        }}
                        className="h-7 w-7 shrink-0 text-ink-subtle hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="emerald" className="text-[10px]">
                        {setItem.difficulty}
                      </Badge>
                      <Badge variant="mono" className="text-[10px]">
                        {setItem.totalCount} questions
                      </Badge>
                      <span className="ml-auto font-mono text-[10px] text-ink-subtle">
                        {new Date(setItem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Filter & Search Toolbar + Full-Width Question Cards */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {FILTER_PILLS.map((pill) => (
                  <button
                    key={pill.value}
                    type="button"
                    onClick={() => setCategoryFilter(pill.value)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                      categoryFilter === pill.value
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-surface text-ink-muted hover:border-border-strong hover:text-ink",
                    )}
                  >
                    {pill.label} ({categoryCounts[pill.value]})
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-64 shrink-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter questions or skills..."
                  aria-label="Filter questions"
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>

            {detailQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-44 rounded-xl" />
                <Skeleton className="h-44 rounded-xl" />
              </div>
            ) : filteredQuestions.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-6 w-6" />}
                title="No questions in this category"
                description="Switch category filters above or generate a new question set."
              />
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question, idx) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={idx}
                    onOpenAnswerStudio={(q) => setDrawerQuestionId(q.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generator Dialog */}
      <QuestionGeneratorDialog
        open={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        initialResumeId={initialResumeId}
        initialJdId={initialJdId}
        initialMatchId={initialMatchId}
        onCreated={(id) => {
          setSelectedSetId(id);
          setCategoryFilter("ALL");
        }}
      />

      {/* Model Answer Studio Drawer */}
      <AnswerStudioDrawer
        open={Boolean(drawerQuestionId && activeDrawerQuestion)}
        onClose={() => setDrawerQuestionId(null)}
        question={activeDrawerQuestion}
        questionSetId={selectedSetId}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Question Set"
        description="This permanently removes the question set and any generated model answers."
      >
        <p className="text-sm text-ink-muted">
          Are you sure you want to delete{" "}
          <strong className="text-ink">{deleteTarget?.title}</strong>?
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => void handleConfirmDelete()}
          >
            Delete Set
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
