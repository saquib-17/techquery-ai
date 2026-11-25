import * as React from "react";
import { Star, Download, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  downloadResumeFile,
  type ResumeItem,
} from "@/features/resumes/resumes.api";
import {
  useDeleteResumeMutation,
  useSetPrimaryResumeMutation,
} from "@/features/resumes/useResumes";

export interface ResumePortfolioSidebarProps {
  resumes: ResumeItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ResumePortfolioSidebar({
  resumes,
  selectedId,
  onSelect,
}: ResumePortfolioSidebarProps) {
  const [deleteTarget, setDeleteTarget] = React.useState<ResumeItem | null>(null);
  const setPrimaryMutation = useSetPrimaryResumeMutation();
  const deleteMutation = useDeleteResumeMutation();
  const { toast } = useToast();

  const handleSetPrimary = async (e: React.MouseEvent, resume: ResumeItem) => {
    e.stopPropagation();
    await setPrimaryMutation.mutateAsync(resume.id);
    toast({
      title: "Primary resume updated",
      description: `${resume.originalFileName} is now your active default.`,
      variant: "success",
    });
  };

  const handleDownload = async (e: React.MouseEvent, resume: ResumeItem) => {
    e.stopPropagation();
    await downloadResumeFile(resume.id, resume.originalFileName);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    toast({
      title: "Resume deleted",
      description: `${deleteTarget.originalFileName} has been removed.`,
      variant: "info",
    });
    setDeleteTarget(null);
  };

  if (resumes.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            Uploaded Resumes ({resumes.length})
          </h3>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {resumes.map((resume) => {
            const isSelected = resume.id === selectedId;
            const uploadedDate = new Date(resume.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

            return (
              <li
                key={resume.id}
                onClick={() => onSelect(resume.id)}
                className={cn(
                  "rounded-xl border p-3.5 transition-all cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary-soft/40 shadow-xs"
                    : "border-border bg-surface hover:border-border-strong"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <FileText
                      className={cn(
                        "h-4 w-4 shrink-0 mt-0.5",
                        isSelected ? "text-primary" : "text-ink-subtle"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {resume.originalFileName}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <Badge variant="mono" className="text-[10px]">
                          {resume.fileExtension.toUpperCase()}
                        </Badge>
                        <span className="text-[11px] text-ink-subtle font-mono">
                          {uploadedDate}
                        </span>
                        {resume.isPrimary && (
                          <Badge variant="emerald" className="text-[10px]">
                            Primary
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-1 border-t border-border/70 pt-2">
                  {!resume.isPrimary && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      isLoading={setPrimaryMutation.isPending}
                      onClick={(e) => void handleSetPrimary(e, resume)}
                      className="h-7 px-2 text-xs text-ink-muted hover:text-primary"
                    >
                      <Star className="h-3 w-3" />
                      Set Primary
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Download ${resume.originalFileName}`}
                    onClick={(e) => void handleDownload(e, resume)}
                    className="h-7 w-7 text-ink-muted hover:text-ink"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${resume.originalFileName}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(resume);
                    }}
                    className="h-7 w-7 text-ink-muted hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Resume"
        description="This will permanently remove the uploaded document and its ATS audit report."
      >
        <p className="text-sm text-ink-muted">
          Are you sure you want to delete{" "}
          <strong className="text-ink">{deleteTarget?.originalFileName}</strong>?
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
            Delete Resume
          </Button>
        </div>
      </Dialog>
    </>
  );
}
