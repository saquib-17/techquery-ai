import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GitCompare, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useJobDescriptionsQuery } from "@/features/job-descriptions/useJobDescriptions";
import { MatchEvaluatorBar } from "@/features/matching/components/MatchEvaluatorBar";
import { SkillGapMatrixCard } from "@/features/matching/components/SkillGapMatrixCard";
import type { JobMatchItem } from "@/features/matching/matching.api";
import {
  useDeleteMatchMutation,
  useEvaluateMatchMutation,
  useMatchesQuery,
} from "@/features/matching/useMatches";
import { useResumesQuery } from "@/features/resumes/useResumes";
import { AiTutorChat } from "@/components/ai/AiTutorChat";
import { ApiClientError } from "@/lib/api";
import { cn } from "@/lib/cn";

export function MatchesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialJdId = searchParams.get("jdId");

  const { toast } = useToast();
  const resumesQuery = useResumesQuery();
  const jdsQuery = useJobDescriptionsQuery();
  const matchesQuery = useMatchesQuery();

  const evaluateMutation = useEvaluateMatchMutation();
  const deleteMutation = useDeleteMatchMutation();

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<JobMatchItem | null>(null);

  const resumes = resumesQuery.data ?? [];
  const jobDescriptions = jdsQuery.data ?? [];
  const matches = matchesQuery.data ?? [];

  useEffect(() => {
    if (matches.length === 0) {
      setSelectedMatchId(null);
      return;
    }

    if (selectedMatchId && matches.some((m) => m.id === selectedMatchId)) {
      return;
    }

    if (initialJdId) {
      const matchingForJd = matches.find((m) => m.jdId === initialJdId);
      if (matchingForJd) {
        setSelectedMatchId(matchingForJd.id);
        return;
      }
    }

    setSelectedMatchId(matches[0].id);
  }, [matches, selectedMatchId, initialJdId]);

  const activeMatch =
    matches.find((m) => m.id === selectedMatchId) ?? matches[0] ?? null;

  const isLoadingPrerequisites =
    resumesQuery.isLoading || jdsQuery.isLoading || matchesQuery.isLoading;

  const handleEvaluate = async (resumeId: string, jdId: string) => {
    try {
      const created = await evaluateMutation.mutateAsync({ resumeId, jdId });
      setSelectedMatchId(created.id);
      toast({
        variant: "success",
        title: "Compatibility evaluation complete",
        description: `Match score: ${created.matchScore}%`,
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Evaluation failed",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Could not evaluate compatibility. Please try again.",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!matchToDelete) return;
    try {
      await deleteMutation.mutateAsync(matchToDelete.id);
      if (selectedMatchId === matchToDelete.id) {
        setSelectedMatchId(null);
      }
      setMatchToDelete(null);
      toast({
        variant: "success",
        title: "Match report removed",
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Delete failed",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Could not delete match report.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Skill Match
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Resume &amp; Job Skill Match
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Compare your resume against any saved job to see matched skills, missing skills, and what to learn next.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingPrerequisites ? (
        <div className="space-y-5">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      ) : resumes.length === 0 || jobDescriptions.length === 0 ? (
        <EmptyState
          icon={<GitCompare className="h-6 w-6" />}
          title={
            resumes.length === 0
              ? "Upload a resume first"
              : "Save a job description first"
          }
          description={
            resumes.length === 0
              ? "You need at least one uploaded resume before running a compatibility evaluation."
              : "Add a target job description so we can benchmark your resume skills against its requirements."
          }
          actionLabel={
            resumes.length === 0 ? "Go to Resumes" : "Add Job Description"
          }
          onAction={() =>
            navigate(resumes.length === 0 ? "/resumes" : "/job-descriptions")
          }
        />
      ) : (
        <>
          <MatchEvaluatorBar
            resumes={resumes}
            jobDescriptions={jobDescriptions}
            initialJdId={initialJdId}
            isEvaluating={evaluateMutation.isPending}
            onEvaluate={handleEvaluate}
          />

          {matches.length === 0 ? (
            <EmptyState
              icon={<GitCompare className="h-6 w-6" />}
              title="No compatibility evaluations yet"
              description="Select a resume and target job description above, then click Evaluate Compatibility to generate your first skill gap matrix."
            />
          ) : (
            <div className="space-y-5">
              {/* Compact Horizontal Saved Evaluations Strip */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                    Saved Evaluations ({matches.length})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {matches.map((item) => {
                    const isSelected = activeMatch?.id === item.id;
                    const scoreVariant =
                      item.matchScore >= 75
                        ? "emerald"
                        : item.matchScore >= 50
                          ? "amber"
                          : "danger";
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "group inline-flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors",
                          isSelected
                            ? "border-primary bg-primary-soft shadow-[0_0_16px_rgba(16,185,129,0.12)]"
                            : "border-border bg-surface hover:border-border-strong",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedMatchId(item.id)}
                          className="inline-flex items-center gap-2 text-left cursor-pointer"
                        >
                          <span className="text-xs font-semibold text-ink">
                            {item.jobDescription?.title ?? "Target Role"}
                          </span>
                          <span className="hidden sm:inline font-mono text-[11px] text-ink-muted">
                            • {item.resume?.originalFileName ?? "Resume"}
                          </span>
                          <Badge variant={scoreVariant} className="font-mono text-[11px]">
                            {item.matchScore}%
                          </Badge>
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete match for ${
                            item.jobDescription?.title ?? "Target Role"
                          }`}
                          onClick={() => setMatchToDelete(item)}
                          className="rounded p-1 text-ink-subtle hover:bg-danger-soft hover:text-danger transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Full-Width Skill Gap Matrix */}
              {activeMatch ? (
                <div className="space-y-4">
                  <SkillGapMatrixCard
                    match={activeMatch}
                    onRequestDelete={(m) => setMatchToDelete(m)}
                  />
                  <AiTutorChat
                    contextType="RESUME_MATCH"
                    contextId={activeMatch.id}
                    contextTitle={
                      activeMatch.jobDescription?.title ?? "JD Skill Match"
                    }
                    contextSummary={`Match Score: ${activeMatch.matchScore}% | Matched Skills: ${activeMatch.matchedSkills.slice(0, 8).join(", ")} | Missing Skills: ${activeMatch.missingSkills.slice(0, 8).join(", ")}`}
                  />
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(matchToDelete)}
        onClose={() => setMatchToDelete(null)}
        title="Delete Compatibility Report?"
        description="This removes the saved match report from your workspace."
      >
        <p className="text-sm text-ink-muted">
          Are you sure you want to delete the match report for{" "}
          <span className="font-medium text-ink">
            {matchToDelete?.jobDescription?.title ?? "this job description"}
          </span>
          ? Your resume and job description will remain saved.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setMatchToDelete(null)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={handleConfirmDelete}
          >
            Delete Report
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
