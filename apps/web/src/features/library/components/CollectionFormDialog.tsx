import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api";
import type { CollectionSummary } from "@/features/library/collections.api";
import {
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
} from "@/features/library/useCollections";

export interface CollectionFormDialogProps {
  open: boolean;
  onClose: () => void;
  editingCollection?: CollectionSummary | null;
  onSaved?: (collectionId: string) => void;
}

export function CollectionFormDialog({
  open,
  onClose,
  editingCollection,
  onSaved,
}: CollectionFormDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateCollectionMutation();
  const updateMutation = useUpdateCollectionMutation();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const isEditing = Boolean(editingCollection);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  React.useEffect(() => {
    if (open) {
      setName(editingCollection?.name ?? "");
      setDescription(editingCollection?.description ?? "");
      setErrorMsg(null);
    }
  }, [open, editingCollection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    const trimmedDesc = description.trim();

    if (trimmedName.length < 2) {
      setErrorMsg("Collection name must be at least 2 characters.");
      return;
    }

    try {
      if (editingCollection) {
        const updated = await updateMutation.mutateAsync({
          id: editingCollection.id,
          payload: {
            name: trimmedName,
            description: trimmedDesc ? trimmedDesc : null,
          },
        });
        toast({
          variant: "success",
          title: "Collection updated",
        });
        onSaved?.(updated.id);
      } else {
        const created = await createMutation.mutateAsync({
          name: trimmedName,
          description: trimmedDesc || undefined,
        });
        toast({
          variant: "success",
          title: "Collection created",
          description: `Created "${created.name}".`,
        });
        onSaved?.(created.id);
      }
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof ApiClientError
          ? err.message
          : "Could not save collection. Please try again.",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Collection" : "New Study Collection"}
      description={
        isEditing
          ? "Update your collection name or study notes."
          : "Organize bookmarked interview questions into a focused study folder."
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-xs text-danger"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="collection-name">Collection Name *</Label>
          <Input
            id="collection-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., System Design & Caching Must-Knows"
            maxLength={150}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="collection-desc">Description (Optional)</Label>
          <Textarea
            id="collection-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes or target interview loop for this collection..."
            maxLength={255}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? "Save Changes" : "Create Collection"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
