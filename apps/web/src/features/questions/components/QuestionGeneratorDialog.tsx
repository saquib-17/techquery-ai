import * as React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowUpRight, Sparkles } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useResumesQuery } from "@/features/resumes/useResumes";
import { useJobDescriptionsQuery } from "@/features/job-descriptions/useJobDescriptions";
import { useMatchesQuery } from "@/features/matching/useMatches";
import type {
  QuestionCategory,
  QuestionDifficulty,
} from "@/features/questions/questions.api";
import { useGenerateQuestionSetMutation } from "@/features/questions/useQuestions";

const ALL_CATEGORIES: Array<{ value: QuestionCategory; label: string }> = [
  { value: "THEORETICAL", label: "Theoretical" },
  { value: "CODING", label: "Coding" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "PROJECT_DEFENSE", label: "Project Defense" },
];

const DIFFICULTIES: QuestionDifficulty[] = ["EASY", "MEDIUM", "HARD"];

export interface QuestionGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (questionSetId: string) => void;
  initialResumeId?: string | null;
  initialJdId?: string | null;
  initialMatchId?: string | null;
}

export function QuestionGeneratorDialog({
  open,
  onClose,
  onCreated,
  initialResumeId,
  initialJdId,
  initialMatchId,
}: QuestionGeneratorDialogProps) {
  const { toast } = useToast();
  const resumesQuery = useResumesQuery();
  const jdsQuery = useJobDescriptionsQuery();
  const matchesQuery = useMatchesQuery();
  const generateMutation = useGenerateQuestionSetMutation();

  const [topicFocus, setTopicFocus] = React.useState(
    "Full-Stack & Core Software Engineering",
  );
  const [difficulty, setDifficulty] =
    React.useState<QuestionDifficulty>("MEDIUM");
  const [categories, setCategories] = React.useState<QuestionCategory[]>([
    "THEORETICAL",
    "CODING",
    "SYSTEM_DESIGN",
    "BEHAVIORAL",
    "PROJECT_DEFENSE",
  ]);
  const [count, setCount] = React.useState<number>(10);
  const [resumeId, setResumeId] = React.useState<string>(initialResumeId ?? "");
  const [jdId, setJdId] = React.useState<string>(initialJdId ?? "");
  const [matchId, setMatchId] = React.useState<string>(initialMatchId ?? "");
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  );
  const [apiError, setApiError] = React.useState<{
    message: string;
    isQuotaExceeded: boolean;
  } | null>(null);

  React.useEffect(() => {
    if (open) {
      setResumeId(initialResumeId ?? "");
      setJdId(initialJdId ?? "");
      setMatchId(initialMatchId ?? "");
      setValidationError(null);
      setApiError(null);
    }
  }, [open, initialResumeId, initialJdId, initialMatchId]);

  const resumes = resumesQuery.data ?? [];
  const jds = jdsQuery.data ?? [];
  const matches = matchesQuery.data ?? [];

  const toggleCategory = (cat: QuestionCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    const trimmedFocus = topicFocus.trim();
    if (trimmedFocus.length < 3) {
      setValidationError("Topic focus must be at least 3 characters.");
      return;
    }
    if (categories.length === 0) {
      setValidationError("Select at least one question category.");
      return;
    }
    if (count < 3 || count > 20) {
      setValidationError("Question count must be between 3 and 20.");
      return;
    }

    try {
      const created = await generateMutation.mutateAsync({
        topicFocus: trimmedFocus,
        difficulty,
        categories,
        count,
        resumeId: resumeId || undefined,
        jdId: jdId || undefined,
        matchId: matchId || undefined,
      });

      toast({
        variant: "success",
        title: "Question set generated",
        description: `${created.questions.length} tailored questions are ready.`,
      });
      onCreated?.(created.id);
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setApiError({
          message: err.message,
          isQuotaExceeded: err.status === 429 || err.code === "QUOTA_EXCEEDED",
        });
      } else {
        setApiError({
          message: "Failed to generate question set. Please try again.",
          isQuotaExceeded: false,
        });
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Generate Question Set"
      description="Create a context-aware interview set grounded in your resume, target job description, or skill-gap match."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {(apiError || validationError) && (
          <div
            role="alert"
            className={cn(
              "rounded-lg border p-3 text-xs space-y-2",
              apiError?.isQuotaExceeded
                ? "border-amber/30 bg-amber-soft text-ink"
                : "border-danger/30 bg-danger-soft text-danger",
            )}
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                className={cn(
                  "h-4 w-4 shrink-0 mt-0.5",
                  apiError?.isQuotaExceeded ? "text-amber" : "text-danger",
                )}
              />
              <span>{apiError?.message ?? validationError}</span>
            </div>
            {apiError?.isQuotaExceeded && (
              <Link to="/usage" className="block">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span>Upgrade Plan / Manage Quotas</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="qs-topic-focus">Topic Focus *</Label>
          <Input
            id="qs-topic-focus"
            value={topicFocus}
            onChange={(e) => setTopicFocus(e.target.value)}
            placeholder="e.g., Distributed Systems & PostgreSQL Performance"
            maxLength={100}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Difficulty</Label>
            <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-border bg-surface-muted p-1">
              {DIFFICULTIES.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={cn(
                    "rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer",
                    difficulty === level
                      ? "bg-surface text-ink shadow-xs border border-border"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="qs-count">Question Count</Label>
              <span className="font-mono text-xs font-semibold text-primary tabular-nums">
                {count} questions
              </span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <input
                id="qs-count"
                type="range"
                min={3}
                max={20}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <input
                type="number"
                aria-label="Question Count Number"
                min={3}
                max={20}
                value={count}
                onChange={(e) =>
                  setCount(
                    Math.max(3, Math.min(20, Number(e.target.value) || 3)),
                  )
                }
                className="w-14 rounded-lg border border-border bg-surface px-2 py-1 text-center font-mono text-xs text-ink"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Question Categories *</Label>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const active = categories.includes(cat.value);
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategory(cat.value)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                    active
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-surface text-ink-muted hover:border-border-strong hover:text-ink",
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Grounding Context */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-border bg-canvas p-3.5">
          <div className="space-y-1">
            <Label htmlFor="qs-resume-select" className="text-xs">
              Resume (Optional)
            </Label>
            <select
              id="qs-resume-select"
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-xs text-ink focus:border-primary focus:outline-none"
            >
              <option value="">None</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.originalFileName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="qs-jd-select" className="text-xs">
              Target JD (Optional)
            </Label>
            <select
              id="qs-jd-select"
              value={jdId}
              onChange={(e) => setJdId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-xs text-ink focus:border-primary focus:outline-none"
            >
              <option value="">None</option>
              {jds.map((jd) => (
                <option key={jd.id} value={jd.id}>
                  {jd.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="qs-match-select" className="text-xs">
              Skill-Gap Match (Optional)
            </Label>
            <select
              id="qs-match-select"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-xs text-ink focus:border-primary focus:outline-none"
            >
              <option value="">None</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.jobDescription?.title ?? "Match"} ({m.matchScore}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={generateMutation.isPending}>
            <Sparkles className="h-4 w-4" />
            Generate Questions
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
