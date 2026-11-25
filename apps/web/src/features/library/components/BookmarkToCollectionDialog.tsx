import * as React from "react";
import { AlertCircle, BookmarkCheck, FolderPlus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api";
import {
  useAddCollectionItemMutation,
  useCollectionsQuery,
  useCreateCollectionMutation,
} from "@/features/library/useCollections";

export interface BookmarkToCollectionDialogProps {
  open: boolean;
  onClose: () => void;
  questionId: string;
}

export function BookmarkToCollectionDialog({
  open,
  onClose,
  questionId,
}: BookmarkToCollectionDialogProps) {
  const { toast } = useToast();
  const collectionsQuery = useCollectionsQuery();
  const addMutation = useAddCollectionItemMutation();
  const createMutation = useCreateCollectionMutation();

  const [newName, setNewName] = React.useState("");
  const [inlineError, setInlineError] = React.useState<string | null>(null);
  const [duplicateMessage, setDuplicateMessage] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    if (open) {
      setNewName("");
      setInlineError(null);
      setDuplicateMessage(null);
    }
  }, [open, questionId]);

  const collections = collectionsQuery.data ?? [];

  const handleSaveToCollection = async (
    collectionId: string,
    collectionName: string,
  ) => {
    setInlineError(null);
    setDuplicateMessage(null);
    try {
      await addMutation.mutateAsync({ collectionId, questionId });
      toast({
        variant: "success",
        title: "Saved to collection",
        description: `Bookmarked into "${collectionName}".`,
      });
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        setDuplicateMessage(
          `Already saved in this collection ("${collectionName}").`,
        );
      } else {
        setInlineError(
          err instanceof ApiClientError
            ? err.message
            : "Could not bookmark question. Please try again.",
        );
      }
    }
  };

  const handleCreateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    setDuplicateMessage(null);

    const trimmed = newName.trim();
    if (trimmed.length < 2) {
      setInlineError("Collection name must be at least 2 characters.");
      return;
    }

    try {
      const created = await createMutation.mutateAsync({ name: trimmed });
      await addMutation.mutateAsync({
        collectionId: created.id,
        questionId,
      });
      toast({
        variant: "success",
        title: "Collection created & question saved",
        description: `Bookmarked into "${created.name}".`,
      });
      onClose();
    } catch (err) {
      setInlineError(
        err instanceof ApiClientError
          ? err.message
          : "Could not create collection and save question.",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Save to Collection"
      description="Bookmark this question into an existing study collection or create a new one."
    >
      <div className="space-y-4">
        {duplicateMessage && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-amber/30 bg-amber-soft p-3 text-xs text-ink"
          >
            <BookmarkCheck className="h-4 w-4 shrink-0 mt-0.5 text-amber" />
            <span>{duplicateMessage}</span>
          </div>
        )}

        {inlineError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-xs text-danger"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{inlineError}</span>
          </div>
        )}

        {/* Existing Collections */}
        <div className="space-y-2">
          <Label>Your Collections</Label>
          {collectionsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : collections.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-canvas px-3 py-4 text-center text-xs text-ink-muted">
              No collections yet. Create your first collection below.
            </p>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {collections.map((col) => (
                <li key={col.id}>
                  <button
                    type="button"
                    disabled={addMutation.isPending}
                    onClick={() =>
                      void handleSaveToCollection(col.id, col.name)
                    }
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-left transition-colors hover:border-primary hover:bg-primary-soft/40 cursor-pointer disabled:opacity-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {col.name}
                      </p>
                      {col.description && (
                        <p className="truncate text-xs text-ink-muted">
                          {col.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="mono" className="shrink-0 text-[11px]">
                      {col.itemCount} items
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Create Inline */}
        <form
          onSubmit={handleCreateAndSave}
          className="space-y-2 border-t border-border pt-4"
        >
          <Label htmlFor="inline-collection-name">
            Or Create New Collection
          </Label>
          <div className="flex gap-2">
            <Input
              id="inline-collection-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New collection name..."
              maxLength={150}
            />
            <Button
              type="submit"
              variant="outline"
              isLoading={createMutation.isPending || addMutation.isPending}
              className="shrink-0"
            >
              <FolderPlus className="h-4 w-4" />
              Create &amp; Save
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
