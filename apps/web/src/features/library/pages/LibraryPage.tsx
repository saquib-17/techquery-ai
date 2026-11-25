import * as React from "react";
import {
  Bookmark,
  CheckCircle2,
  Download,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  exportCollectionPdf,
  type CollectionSummary,
} from "@/features/library/collections.api";
import {
  useCollectionDetailQuery,
  useCollectionsQuery,
  useDeleteCollectionMutation,
  useRemoveCollectionItemMutation,
} from "@/features/library/useCollections";
import { CollectionFormDialog } from "@/features/library/components/CollectionFormDialog";
import { AnswerStudioDrawer } from "@/features/questions/components/AnswerStudioDrawer";
import type {
  QuestionDifficulty,
  QuestionItem,
} from "@/features/questions/questions.api";

function getDifficultyVariant(
  difficulty: QuestionDifficulty,
): "emerald" | "amber" | "danger" {
  switch (difficulty) {
    case "EASY":
      return "emerald";
    case "MEDIUM":
      return "amber";
    case "HARD":
      return "danger";
  }
}

export function LibraryPage() {
  const { toast } = useToast();
  const collectionsQuery = useCollectionsQuery();
  const deleteCollectionMutation = useDeleteCollectionMutation();
  const removeItemMutation = useRemoveCollectionItemMutation();

  const [selectedCollectionId, setSelectedCollectionId] = React.useState<
    string | null
  >(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingCollection, setEditingCollection] =
    React.useState<CollectionSummary | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<CollectionSummary | null>(null);
  const [drawerQuestion, setDrawerQuestion] =
    React.useState<QuestionItem | null>(null);
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);

  const collections = collectionsQuery.data ?? [];

  React.useEffect(() => {
    if (collections.length === 0) {
      setSelectedCollectionId(null);
      return;
    }
    if (
      !selectedCollectionId ||
      !collections.some((c) => c.id === selectedCollectionId)
    ) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId]);

  const detailQuery = useCollectionDetailQuery(selectedCollectionId);
  const activeCollection = detailQuery.data ?? null;

  const handleExportPdf = async () => {
    if (!activeCollection) return;
    setIsExportingPdf(true);
    try {
      await exportCollectionPdf(activeCollection.id, activeCollection.name);
      toast({
        variant: "success",
        title: "Study PDF exported",
        description: `Downloaded ${activeCollection.name}.pdf`,
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Export failed",
        description:
          err instanceof ApiClientError
            ? err.message
            : "Could not export study collection PDF.",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCollectionMutation.mutateAsync(deleteTarget.id);
      if (selectedCollectionId === deleteTarget.id) {
        setSelectedCollectionId(null);
      }
      setDeleteTarget(null);
      toast({
        variant: "success",
        title: "Collection deleted",
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Delete failed",
        description:
          err instanceof ApiClientError
            ? err.message
            : "Could not delete collection.",
      });
    }
  };

  const handleRemoveItem = async (questionId: string) => {
    if (!activeCollection) return;
    try {
      await removeItemMutation.mutateAsync({
        collectionId: activeCollection.id,
        questionId,
      });
      toast({
        variant: "success",
        title: "Removed from collection",
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Remove failed",
        description:
          err instanceof ApiClientError
            ? err.message
            : "Could not remove question from collection.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Saved Question Library
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Curate high-signal interview questions into study collections and
            export clean PDF study guides.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeCollection && (
            <Button
              type="button"
              variant="outline"
              isLoading={isExportingPdf}
              onClick={() => void handleExportPdf()}
            >
              <Download className="h-4 w-4" />
              Export Study PDF
            </Button>
          )}
          <Button
            type="button"
            onClick={() => {
              setEditingCollection(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New Collection
          </Button>
        </div>
      </div>

      {/* Main Workbench */}
      {collectionsQuery.isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="h-72 rounded-xl lg:col-span-4" />
          <Skeleton className="h-96 rounded-xl lg:col-span-8" />
        </div>
      ) : collections.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-6 w-6" />}
          title="No saved collections yet"
          description="Create a study collection to bookmark and organize your most important interview questions."
          actionLabel="New Collection"
          onAction={() => {
            setEditingCollection(null);
            setFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (4 cols): Saved Collections */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                Collections ({collections.length})
              </span>
            </div>

            <ul className="space-y-2.5">
              {collections.map((col) => {
                const selected = col.id === selectedCollectionId;
                return (
                  <li
                    key={col.id}
                    onClick={() => setSelectedCollectionId(col.id)}
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
                          {col.name}
                        </p>
                        {col.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">
                            {col.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${col.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCollection(col);
                            setFormOpen(true);
                          }}
                          className="h-7 w-7 text-ink-subtle hover:text-ink"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${col.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(col);
                          }}
                          className="h-7 w-7 text-ink-subtle hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <Badge variant="mono" className="text-[10px]">
                        {col.itemCount} questions
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right Column (8 cols): Collection Items */}
          <div className="lg:col-span-8 space-y-4">
            {detailQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
              </div>
            ) : !activeCollection || activeCollection.items.length === 0 ? (
              <EmptyState
                icon={<Bookmark className="h-6 w-6" />}
                title="This collection is empty"
                description="Use the Save button on any question card in Question Studio to bookmark questions into this collection."
              />
            ) : (
              <div className="space-y-4">
                {activeCollection.items.map((entry, idx) => {
                  const q = entry.question;
                  return (
                    <Card key={entry.id} className="border-border bg-surface">
                      <CardContent className="p-5 space-y-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-surface-muted px-2 font-mono text-xs font-semibold text-ink">
                              Q{idx + 1}
                            </span>
                            <Badge variant="neutral">{q.category}</Badge>
                            <Badge variant={getDifficultyVariant(q.difficulty)}>
                              {q.difficulty}
                            </Badge>
                            <Badge variant="mono">{q.targetedSkill}</Badge>
                          </div>

                          {q.answer && (
                            <Badge variant="emerald">
                              <CheckCircle2 className="h-3 w-3" />
                              Model Answer Ready
                            </Badge>
                          )}
                        </div>

                        <p className="text-[15px] font-medium leading-relaxed text-ink">
                          {q.questionText}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={removeItemMutation.isPending}
                            onClick={() => void handleRemoveItem(q.id)}
                            className="text-ink-muted hover:text-danger"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove from Collection
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant={q.answer ? "outline" : "primary"}
                            onClick={() => setDrawerQuestion(q)}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Open Answer Studio
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Collection Dialog */}
      <CollectionFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingCollection(null);
        }}
        editingCollection={editingCollection}
        onSaved={(id) => setSelectedCollectionId(id)}
      />

      {/* Model Answer Studio Drawer */}
      <AnswerStudioDrawer
        open={Boolean(drawerQuestion)}
        onClose={() => setDrawerQuestion(null)}
        question={drawerQuestion}
        questionSetId={null}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Collection"
        description="This deletes the collection folder. Your underlying questions remain in Question Studio."
      >
        <p className="text-sm text-ink-muted">
          Are you sure you want to delete{" "}
          <strong className="text-ink">{deleteTarget?.name}</strong>?
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            isLoading={deleteCollectionMutation.isPending}
            onClick={() => void handleConfirmDelete()}
          >
            Delete Collection
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
