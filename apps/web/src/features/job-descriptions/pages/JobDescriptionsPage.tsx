import * as React from "react";
import { Briefcase, Plus, Trash2, Building2, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  useJobDescriptionsQuery,
  useDeleteJobDescriptionMutation,
} from "@/features/job-descriptions/useJobDescriptions";
import type { JobDescriptionItem } from "@/features/job-descriptions/jd.api";
import { JdSubmissionDialog } from "@/features/job-descriptions/components/JdSubmissionDialog";
import { JdDetailPanel } from "@/features/job-descriptions/components/JdDetailPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

export function JobDescriptionsPage() {
  const { data: jobDescriptions = [], isLoading } = useJobDescriptionsQuery();
  const deleteMutation = useDeleteJobDescriptionMutation();
  const { toast } = useToast();

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<JobDescriptionItem | null>(null);

  const filteredJobDescriptions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return jobDescriptions;
    return jobDescriptions.filter((jd) => {
      const role = (jd.structuredJson?.roleTitle || jd.title || "").toLowerCase();
      const company = (jd.company || "").toLowerCase();
      return role.includes(q) || company.includes(q);
    });
  }, [jobDescriptions, searchQuery]);

  React.useEffect(() => {
    if (jobDescriptions.length === 0) {
      setSelectedId(null);
      return;
    }
    const stillExists = jobDescriptions.some((j) => j.id === selectedId);
    if (!stillExists) {
      setSelectedId(jobDescriptions[0].id);
    }
  }, [jobDescriptions, selectedId]);

  const selectedJd = jobDescriptions.find((j) => j.id === selectedId) ?? null;

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    toast({
      title: "Job description deleted",
      description: `${deleteTarget.title} has been removed.`,
      variant: "info",
    });
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Job Description Intelligence
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Paste any job posting to extract required skills, tech stack, and role expectations.
          </p>
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Job Description
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      ) : jobDescriptions.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-6 w-6" />}
          title="No target job descriptions yet"
          description="Paste a job posting to extract must-have vs. nice-to-have skills and run compatibility checks against your resume."
          actionLabel="Add Job Description"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="space-y-5">
          {/* Top Compact Saved Job Postings Selector Bar */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-0.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                Saved Postings ({jobDescriptions.length})
              </h3>
              {jobDescriptions.length > 2 && (
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by role or company..."
                    aria-label="Filter saved postings"
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              )}
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredJobDescriptions.map((jd) => {
                const isSelected = jd.id === selectedJd?.id;
                return (
                  <li
                    key={jd.id}
                    onClick={() => setSelectedId(jd.id)}
                    className={cn(
                      "rounded-xl border p-3.5 transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary-soft/40 shadow-xs"
                        : "border-border bg-surface hover:border-border-strong"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {jd.structuredJson?.roleTitle || jd.title}
                        </p>
                        {jd.company && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted truncate">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{jd.company}</span>
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${jd.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(jd);
                        }}
                        className="h-7 w-7 shrink-0 text-ink-subtle hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <Badge variant="emerald" className="text-[10px]">
                        {jd.structuredJson?.seniority || "MID"}
                      </Badge>
                      <Badge variant="mono" className="text-[10px]">
                        {jd.structuredJson?.mustHaveSkills?.length ?? 0} must-have
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Full-Width Structured JD Detail */}
          <div>
            {selectedJd && <JdDetailPanel jd={selectedJd} />}
          </div>
        </div>
      )}

      <JdSubmissionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => setSelectedId(id)}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Job Description"
        description="This removes the saved job posting from your workspace."
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
            Delete Posting
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
