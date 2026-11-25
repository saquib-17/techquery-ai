import { useEffect, useState } from "react";
import { GitCompare, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { JobDescriptionItem } from "@/features/job-descriptions/jd.api";
import type { ResumeItem } from "@/features/resumes/resumes.api";

interface MatchEvaluatorBarProps {
  resumes: ResumeItem[];
  jobDescriptions: JobDescriptionItem[];
  initialJdId?: string | null;
  isEvaluating: boolean;
  onEvaluate: (resumeId: string, jdId: string) => void;
}

export function MatchEvaluatorBar({
  resumes,
  jobDescriptions,
  initialJdId,
  isEvaluating,
  onEvaluate,
}: MatchEvaluatorBarProps) {
  const primaryResumeId =
    resumes.find((r) => r.isPrimary)?.id ?? resumes[0]?.id ?? "";
  const defaultJdId =
    (initialJdId && jobDescriptions.some((jd) => jd.id === initialJdId)
      ? initialJdId
      : jobDescriptions[0]?.id) ?? "";

  const [selectedResumeId, setSelectedResumeId] = useState(primaryResumeId);
  const [selectedJdId, setSelectedJdId] = useState(defaultJdId);

  useEffect(() => {
    if (!selectedResumeId && primaryResumeId) {
      setSelectedResumeId(primaryResumeId);
    }
  }, [primaryResumeId, selectedResumeId]);

  useEffect(() => {
    if (initialJdId && jobDescriptions.some((jd) => jd.id === initialJdId)) {
      setSelectedJdId(initialJdId);
    } else if (!selectedJdId && defaultJdId) {
      setSelectedJdId(defaultJdId);
    }
  }, [initialJdId, jobDescriptions, defaultJdId, selectedJdId]);

  const canEvaluate =
    Boolean(selectedResumeId) && Boolean(selectedJdId) && !isEvaluating;

  return (
    <Card className="border-zinc-200 bg-white">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="match-resume-select">Candidate Resume</Label>
            <select
              id="match-resume-select"
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              disabled={isEvaluating || resumes.length === 0}
              className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resumes.length === 0 ? (
                <option value="">No resumes uploaded</option>
              ) : (
                resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.originalFileName}
                    {resume.isPrimary ? " (Primary)" : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="hidden items-center justify-center pb-2 text-zinc-400 lg:flex">
            <GitCompare className="h-4 w-4" />
          </div>

          <div className="flex-1 space-y-1.5">
            <Label htmlFor="match-jd-select">Target Job Description</Label>
            <select
              id="match-jd-select"
              value={selectedJdId}
              onChange={(e) => setSelectedJdId(e.target.value)}
              disabled={isEvaluating || jobDescriptions.length === 0}
              className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {jobDescriptions.length === 0 ? (
                <option value="">No job descriptions saved</option>
              ) : (
                jobDescriptions.map((jd) => (
                  <option key={jd.id} value={jd.id}>
                    {jd.title}
                    {jd.company ? ` — ${jd.company}` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          <Button
            type="button"
            variant="primary"
            disabled={!canEvaluate}
            isLoading={isEvaluating}
            onClick={() => onEvaluate(selectedResumeId, selectedJdId)}
            className="h-10 shrink-0 lg:px-5"
          >
            <Sparkles className="h-4 w-4" />
            Evaluate Compatibility
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
