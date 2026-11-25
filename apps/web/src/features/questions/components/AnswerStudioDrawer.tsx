import * as React from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Check,
  Copy,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  highlightCodeLine,
  inferCodeFilename,
} from "@/features/questions/utils/highlightCode";
import { FormattedAnswerText } from "@/features/questions/utils/formatStructuredText";
import type {
  AnswerStyle,
  ModelAnswer,
  QuestionItem,
} from "@/features/questions/questions.api";
import { useGenerateAnswerMutation } from "@/features/questions/useAnswers";

const ANSWER_STYLES: Array<{ value: AnswerStyle; label: string }> = [
  { value: "INTERVIEW", label: "Interview" },
  { value: "CONCISE", label: "Concise" },
  { value: "DETAILED", label: "Detailed" },
];

interface StarSection {
  label: string;
  content: string;
}

function parseStarSections(text: string): StarSection[] | null {
  const regex =
    /\b(Situation|Task|Action|Result)\s*[:\-–]\s*([\s\S]*?)(?=\b(?:Situation|Task|Action|Result)\s*[:\-–]|$)/gi;
  const matches: StarSection[] = [];
  let match: RegExpExecArray | null = regex.exec(text);
  while (match) {
    const content = match[2].trim();
    if (content) {
      matches.push({
        label:
          match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase(),
        content,
      });
    }
    match = regex.exec(text);
  }
  return matches.length >= 2 ? matches : null;
}

function formatExplanationParagraphs(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (/\n/.test(trimmed)) {
    return trimmed
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  if (trimmed.length <= 350) {
    return [trimmed];
  }

  const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [trimmed];
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(
      sentences
        .slice(i, i + 2)
        .map((s) => s.trim())
        .join(" "),
    );
  }
  return paragraphs;
}

export interface AnswerStudioDrawerProps {
  open: boolean;
  onClose: () => void;
  question: QuestionItem | null;
  questionSetId: string | null;
}

export function AnswerStudioDrawer({
  open,
  onClose,
  question,
  questionSetId,
}: AnswerStudioDrawerProps) {
  const { toast } = useToast();
  const generateAnswer = useGenerateAnswerMutation(questionSetId);

  const [selectedStyle, setSelectedStyle] =
    React.useState<AnswerStyle>("INTERVIEW");
  const [activeAnswer, setActiveAnswer] = React.useState<ModelAnswer | null>(
    null,
  );
  const [copied, setCopied] = React.useState(false);
  const [apiError, setApiError] = React.useState<{
    message: string;
    isQuotaExceeded: boolean;
  } | null>(null);

  const requestAnswer = React.useCallback(
    async (questionId: string, style: AnswerStyle, regenerate: boolean) => {
      setApiError(null);
      try {
        const answer = await generateAnswer.mutateAsync({
          questionId,
          style,
          regenerate,
        });
        setActiveAnswer(answer);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setApiError({
            message: err.message,
            isQuotaExceeded:
              err.status === 429 || err.code === "QUOTA_EXCEEDED",
          });
        } else {
          setApiError({
            message: "Unable to generate model answer. Please try again.",
            isQuotaExceeded: false,
          });
        }
      }
    },
    [generateAnswer],
  );

  React.useEffect(() => {
    if (!open || !question) return;
    setCopied(false);
    setApiError(null);

    if (question.answer) {
      setActiveAnswer(question.answer);
      setSelectedStyle(question.answer.style);
    } else {
      setActiveAnswer(null);
      setSelectedStyle("INTERVIEW");
      void requestAnswer(question.id, "INTERVIEW", false);
    }
    // Only trigger when opening or changing the target question
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, question?.id]);

  const handleStyleSwitch = (style: AnswerStyle) => {
    setSelectedStyle(style);
    if (!question) return;
    if (activeAnswer && activeAnswer.style === style) return;
    void requestAnswer(question.id, style, true);
  };

  const handleRegenerate = () => {
    if (!question) return;
    void requestAnswer(question.id, selectedStyle, true);
  };

  const handleCopyCode = async () => {
    if (!activeAnswer?.codeSnippet) return;
    try {
      await navigator.clipboard.writeText(activeAnswer.codeSnippet);
      setCopied(true);
      toast({
        variant: "success",
        title: "Code copied to clipboard",
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "error",
        title: "Copy failed",
        description: "Clipboard access was blocked by the browser.",
      });
    }
  };

  const isBehavioral =
    question?.category === "BEHAVIORAL" ||
    question?.category === "PROJECT_DEFENSE";
  const starSections =
    isBehavioral && activeAnswer
      ? parseStarSections(activeAnswer.detailedExplanation)
      : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Model Answer Studio"
      description={question?.targetedSkill ?? "Structured AI Answer Workbench"}
      className="max-w-2xl"
    >
      {!question ? null : (
        <div className="space-y-5">
          {/* Active Question Header */}
          <div className="rounded-xl border border-border bg-canvas p-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{question.category}</Badge>
              <Badge variant="mono">{question.targetedSkill}</Badge>
            </div>
            <p className="text-sm font-semibold leading-relaxed text-ink">
              {question.questionText}
            </p>
          </div>

          {/* Style Switcher & Regenerate */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-border bg-surface-muted p-1">
              {ANSWER_STYLES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  disabled={generateAnswer.isPending}
                  onClick={() => handleStyleSwitch(item.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50",
                    selectedStyle === item.value
                      ? "bg-surface text-ink shadow-xs border border-border"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={generateAnswer.isPending}
              onClick={handleRegenerate}
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  generateAnswer.isPending && "animate-spin",
                )}
              />
              Regenerate
            </Button>
          </div>

          {/* API Error / Quota Exceeded */}
          {apiError && (
            <div
              role="alert"
              className={cn(
                "rounded-lg border p-3 text-xs space-y-2",
                apiError.isQuotaExceeded
                  ? "border-amber/30 bg-amber-soft text-ink"
                  : "border-danger/30 bg-danger-soft text-danger",
              )}
            >
              <div className="flex items-start gap-2">
                <AlertCircle
                  className={cn(
                    "h-4 w-4 shrink-0 mt-0.5",
                    apiError.isQuotaExceeded ? "text-amber" : "text-danger",
                  )}
                />
                <span>{apiError.message}</span>
              </div>
              {apiError.isQuotaExceeded && (
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

          {/* Loading State */}
          {generateAnswer.isPending && !activeAnswer ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : activeAnswer ? (
            <div className="space-y-5">
              {/* Short Summary Highlight */}
              <div className="rounded-xl border border-primary/25 bg-primary-soft p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Short Summary
                </div>
                <div className="text-sm leading-relaxed text-ink">
                  <FormattedAnswerText text={activeAnswer.shortSummary} />
                </div>
              </div>

              {/* Complexity Badges */}
              {(activeAnswer.timeComplexity ||
                activeAnswer.spaceComplexity) && (
                <div className="flex flex-wrap items-center gap-2">
                  {activeAnswer.timeComplexity && (
                    <Badge variant="mono" className="px-2.5 py-1 text-xs">
                      Time: {activeAnswer.timeComplexity}
                    </Badge>
                  )}
                  {activeAnswer.spaceComplexity && (
                    <Badge variant="mono" className="px-2.5 py-1 text-xs">
                      Space: {activeAnswer.spaceComplexity}
                    </Badge>
                  )}
                </div>
              )}

              {/* Detailed Explanation (STAR or Technical) */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                  {starSections
                    ? "STAR Behavioral Breakdown"
                    : "Detailed Explanation"}
                </h3>

                {starSections ? (
                  <div className="grid gap-3">
                    {starSections.map((section) => (
                      <div
                        key={section.label}
                        className="rounded-lg border border-border bg-surface p-3.5"
                      >
                        <span className="inline-block rounded bg-primary-soft px-2 py-0.5 font-mono text-[11px] font-semibold uppercase text-primary">
                          {section.label}
                        </span>
                        <div className="mt-2 text-sm leading-relaxed text-[#E4E4E7]">
                          <FormattedAnswerText text={section.content} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed text-[#E4E4E7]">
                    {formatExplanationParagraphs(
                      activeAnswer.detailedExplanation,
                    ).map((para, idx) => (
                      <FormattedAnswerText key={idx} text={para} />
                    ))}
                  </div>
                )}
              </div>

              {/* Code Snippet — VS Code IDE Window */}
              {activeAnswer.codeSnippet && (() => {
                const filename = inferCodeFilename(
                  activeAnswer.codeSnippet,
                  question.targetedSkill,
                );
                const codeLines = activeAnswer.codeSnippet.split("\n");
                return (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                      Reference Implementation
                    </h3>
                    <div className="rounded-xl border border-[#242429] bg-[#0B0B0E] overflow-hidden shadow-lg">
                      {/* IDE Title Bar */}
                      <div className="bg-[#151518] border-b border-[#242429] px-4 py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/80" />
                            <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/80" />
                            <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]/80" />
                          </div>
                          <span className="rounded-md border border-[#242429] bg-[#0B0B0E] px-2.5 py-0.5 font-mono text-xs text-[#E4E4E7] truncate">
                            {filename}
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleCopyCode}
                          className="h-7 px-2.5 text-xs shrink-0"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-primary" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy Code
                            </>
                          )}
                        </Button>
                      </div>

                      {/* IDE Code Body */}
                      <div className="overflow-x-auto py-3.5 font-mono text-[13px] leading-6 [font-variant-ligatures:none]">
                        {codeLines.map((line, lineIdx) => (
                          <div
                            key={lineIdx}
                            className="flex hover:bg-[#151518]/60 transition-colors"
                          >
                            <span className="w-11 shrink-0 select-none pr-4 text-right text-[#52525B] border-r border-[#242429]/70">
                              {lineIdx + 1}
                            </span>
                            <span className="pl-4 pr-5 whitespace-pre">
                              {highlightCodeLine(line)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Common Mistakes to Avoid */}
              {Array.isArray(activeAnswer.commonMistakes) &&
                activeAnswer.commonMistakes.length > 0 && (
                  <div className="rounded-xl border border-amber/30 bg-amber-soft p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Common Mistakes to Avoid
                    </div>
                    <ul className="space-y-1.5">
                      {activeAnswer.commonMistakes.map((mistake) => (
                        <li
                          key={mistake}
                          className="flex items-start gap-2 text-xs leading-relaxed text-ink"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                          <FormattedAnswerText text={mistake} className="space-y-1" />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          ) : null}
        </div>
      )}
    </Drawer>
  );
}
