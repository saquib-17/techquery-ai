import * as React from "react";
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookmarkToCollectionDialog } from "@/features/library/components/BookmarkToCollectionDialog";
import type {
  QuestionCategory,
  QuestionDifficulty,
  QuestionItem,
} from "@/features/questions/questions.api";

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  THEORETICAL: "Theoretical",
  CODING: "Coding",
  SYSTEM_DESIGN: "System Design",
  BEHAVIORAL: "Behavioral",
  PROJECT_DEFENSE: "Project Defense",
};

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

export interface QuestionCardProps {
  question: QuestionItem;
  index: number;
  onOpenAnswerStudio: (question: QuestionItem) => void;
}

export function QuestionCard({
  question,
  index,
  onOpenAnswerStudio,
}: QuestionCardProps) {
  const [showIntent, setShowIntent] = React.useState(false);
  const [bookmarkOpen, setBookmarkOpen] = React.useState(false);
  const evalPoints = Array.isArray(question.keyEvaluationPoints)
    ? question.keyEvaluationPoints
    : [];

  return (
    <Card className="border-border bg-surface transition-colors hover:border-border-strong">
      <CardContent className="p-5 space-y-4">
        {/* Top Metadata Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-surface-muted px-2 font-mono text-xs font-semibold text-ink">
              Q{index + 1}
            </span>
            <Badge variant="neutral">
              {CATEGORY_LABELS[question.category] ?? question.category}
            </Badge>
            <Badge variant={getDifficultyVariant(question.difficulty)}>
              {question.difficulty}
            </Badge>
            <Badge variant="mono" className="gap-1">
              <Target className="h-3 w-3 text-primary" />
              {question.targetedSkill}
            </Badge>
          </div>

          {question.answer ? (
            <Badge variant="emerald">
              <CheckCircle2 className="h-3 w-3" />
              Model Answer Ready
            </Badge>
          ) : null}
        </div>

        {/* Question Prompt */}
        <p className="text-[15px] font-medium leading-relaxed text-ink">
          {question.questionText}
        </p>

        {/* Collapsible Interviewer Intent */}
        <div className="rounded-lg border border-border bg-canvas px-3.5 py-2.5">
          <button
            type="button"
            onClick={() => setShowIntent((prev) => !prev)}
            className="flex w-full items-center justify-between text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer"
          >
            <span>Interviewer Intent &amp; Evaluation Rubric</span>
            {showIntent ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showIntent && (
            <div className="mt-2.5 space-y-3 border-t border-border pt-2.5">
              <p className="text-xs leading-relaxed text-ink-muted">
                {question.interviewerIntent}
              </p>

              {evalPoints.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                    <ListChecks className="h-3.5 w-3.5 text-primary" />
                    Key Evaluation Points
                  </div>
                  <ul className="space-y-1">
                    {evalPoints.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 text-xs text-ink"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setBookmarkOpen(true)}
          >
            <Bookmark className="h-3.5 w-3.5" />
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant={question.answer ? "outline" : "primary"}
            onClick={() => onOpenAnswerStudio(question)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Open Answer Studio
          </Button>
        </div>

        {bookmarkOpen && (
          <BookmarkToCollectionDialog
            open={bookmarkOpen}
            onClose={() => setBookmarkOpen(false)}
            questionId={question.id}
          />
        )}
      </CardContent>
    </Card>
  );
}
