import * as React from "react";
import {
  Clock,
  Code2,
  Flame,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";
import type {
  AssessmentSessionDto,
  CodingProblemDto,
  DifficultyPreset,
  DsaPattern,
  ProblemDifficulty,
  SessionMode,
} from "@techquery/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import {
  useAssessmentHistoryQuery,
  useClearAssessmentHistory,
  useCodingProblemsQuery,
  useDeleteAssessmentSession,
  useGenerateCodingProblemMutation,
  useStartAssessmentMutation,
} from "../api/codingApi";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api";

const DIFFICULTY_PRESETS: Array<{
  value: DifficultyPreset;
  title: string;
  subtitle: string;
}> = [
  {
    value: "EASY_ONLY",
    title: "Foundation",
    subtitle: "Easy problems only — build confidence",
  },
  {
    value: "EASY_TO_MEDIUM",
    title: "Placement Ready",
    subtitle: "1 Easy warmup + Medium interview mix",
  },
  {
    value: "MIXED_WITH_HARD",
    title: "Product / Hardcore",
    subtitle: "Easy, Medium, and Hard OA spread",
  },
  {
    value: "SINGLE_FOCUS",
    title: "Single Focus",
    subtitle: "Lock every slot to one difficulty",
  },
];

const DSA_PATTERNS: Array<{ value: DsaPattern; label: string }> = [
  { value: "ALL_PATTERNS", label: "All Patterns" },
  { value: "ARRAYS_TWO_POINTERS", label: "Arrays & Two Pointers" },
  { value: "SLIDING_WINDOW", label: "Sliding Window" },
  { value: "BINARY_SEARCH", label: "Binary Search" },
  { value: "TREES_GRAPHS", label: "Trees & Graphs" },
  { value: "DYNAMIC_PROGRAMMING", label: "Dynamic Programming" },
  { value: "STACK_HEAP", label: "Stack & Heap" },
];

export interface PreSessionLobbyProps {
  onSessionStarted: (session: AssessmentSessionDto) => void;
  onSelectProblem: (problem: CodingProblemDto) => void;
  onViewScorecard: (session: AssessmentSessionDto) => void;
}

export function PreSessionLobby({
  onSessionStarted,
  onSelectProblem,
  onViewScorecard,
}: PreSessionLobbyProps) {
  const { toast } = useToast();
  const [mode, setMode] = React.useState<SessionMode>("TIMED");
  const [difficultyPreset, setDifficultyPreset] =
    React.useState<DifficultyPreset>("EASY_TO_MEDIUM");
  const [singleDifficulty, setSingleDifficulty] =
    React.useState<ProblemDifficulty>("MEDIUM");
  const [problemCount, setProblemCount] = React.useState<number>(3);
  const [durationMinutes, setDurationMinutes] = React.useState<number>(60);
  const [focusPattern, setFocusPattern] =
    React.useState<DsaPattern>("ALL_PATTERNS");
  const [bankFilter, setBankFilter] = React.useState<ProblemDifficulty | "ALL">(
    "ALL"
  );

  const problemsQuery = useCodingProblemsQuery(
    bankFilter === "ALL" ? undefined : { difficulty: bankFilter }
  );
  const historyQuery = useAssessmentHistoryQuery();
  const startMutation = useStartAssessmentMutation();
  const generateProblemMutation = useGenerateCodingProblemMutation();
  const deleteSessionMutation = useDeleteAssessmentSession();
  const clearHistoryMutation = useClearAssessmentHistory();
  const [deletingSessionId, setDeletingSessionId] = React.useState<
    string | null
  >(null);

  const handleStartSession = async () => {
    try {
      const session = await startMutation.mutateAsync({
        mode,
        difficultyPreset,
        singleDifficulty:
          difficultyPreset === "SINGLE_FOCUS" ? singleDifficulty : undefined,
        problemCount,
        durationMinutes: mode === "TIMED" ? durationMinutes : undefined,
        focusPattern,
      });
      toast({
        variant: "success",
        title:
          mode === "TIMED" ? "Timed OA started" : "Untimed practice started",
        description: `${session.problems.length} coding problems loaded.`,
      });
      onSessionStarted(session);
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : "Unable to start coding session.";
      toast({ variant: "error", title: "Could not start session", description: msg });
    }
  };

  const handleGenerateProblem = async () => {
    try {
      const created = await generateProblemMutation.mutateAsync({
        difficulty: bankFilter === "ALL" ? "MEDIUM" : bankFilter,
        pattern: focusPattern,
      });
      toast({
        variant: "success",
        title: "AI DSA Problem Ready",
        description: created.title,
      });
      onSelectProblem(created);
    } catch {
      toast({
        variant: "error",
        title: "Generation failed",
        description: "Please try again.",
      });
    }
  };

  const problems = problemsQuery.data ?? [];
  const history = historyQuery.data ?? [];

  const handleDeleteSession = async (sessionId: string) => {
    setDeletingSessionId(sessionId);
    try {
      await deleteSessionMutation.mutateAsync(sessionId);
      toast({
        variant: "info",
        title: "Session deleted",
        description: "Removed from your recent sessions.",
      });
    } catch {
      toast({
        variant: "error",
        title: "Delete failed",
        description: "Could not delete session. Please try again.",
      });
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearHistoryMutation.mutateAsync();
      toast({
        variant: "info",
        title: "History cleared",
        description: "All past sessions have been removed.",
      });
    } catch {
      toast({
        variant: "error",
        title: "Clear failed",
        description: "Could not clear session history.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Coding &amp; OA Arena
          </h1>
          <p className="text-sm text-zinc-400">
            Practice stress-free in Untimed mode or run a refresh-safe Timed OA
            simulation powered by Judge0 CE.
          </p>
        </div>
      </div>

      {/* Session Builder Card */}
      <Card className="border-[#242429] bg-[#151518]">
        <CardContent className="p-5 space-y-5">
          {/* Mode Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("UNTIMED")}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer",
                mode === "UNTIMED"
                  ? "border-[#10B981]/60 bg-[#10B981]/10"
                  : "border-[#242429] bg-[#0F0F11] hover:border-zinc-700"
              )}
            >
              <ShieldCheck
                className={cn(
                  "h-5 w-5 mt-0.5 shrink-0",
                  mode === "UNTIMED" ? "text-[#10B981]" : "text-zinc-400"
                )}
              />
              <div>
                <div className="text-sm font-semibold text-white">
                  Untimed Practice
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  No countdown clock. Focus on clean algorithm design and edge
                  cases with autosaved drafts.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("TIMED")}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer",
                mode === "TIMED"
                  ? "border-[#10B981]/60 bg-[#10B981]/10"
                  : "border-[#242429] bg-[#0F0F11] hover:border-zinc-700"
              )}
            >
              <Clock
                className={cn(
                  "h-5 w-5 mt-0.5 shrink-0",
                  mode === "TIMED" ? "text-[#10B981]" : "text-zinc-400"
                )}
              />
              <div>
                <div className="text-sm font-semibold text-white">
                  Timed OA Simulation
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Server-enforced countdown that survives page refreshes, with
                  100-point partial scoring per problem.
                </div>
              </div>
            </button>
          </div>

          {/* Difficulty Presets */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Difficulty Track
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {DIFFICULTY_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDifficultyPreset(preset.value)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors cursor-pointer",
                    difficultyPreset === preset.value
                      ? "border-[#10B981]/60 bg-[#10B981]/10"
                      : "border-[#242429] bg-[#0F0F11] hover:border-zinc-700"
                  )}
                >
                  <div className="text-xs font-semibold text-white">
                    {preset.title}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {preset.subtitle}
                  </div>
                </button>
              ))}
            </div>

            {difficultyPreset === "SINGLE_FOCUS" && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-zinc-400">Target Difficulty:</span>
                {(["EASY", "MEDIUM", "HARD"] as ProblemDifficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSingleDifficulty(d)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 font-mono text-xs cursor-pointer",
                      singleDifficulty === d
                        ? "border-[#10B981] bg-[#10B981]/15 text-[#10B981]"
                        : "border-[#242429] bg-[#0F0F11] text-zinc-400"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Count, Duration, Pattern */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#242429] pt-4">
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-zinc-300">
                Problem Count
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setProblemCount(n)}
                    className={cn(
                      "rounded-lg border py-1.5 font-mono text-xs cursor-pointer",
                      problemCount === n
                        ? "border-[#10B981] bg-[#10B981]/15 text-[#10B981]"
                        : "border-[#242429] bg-[#0F0F11] text-zinc-400"
                    )}
                  >
                    {n} {n === 1 ? "Problem" : "Problems"}
                  </button>
                ))}
              </div>
            </div>

            {mode === "TIMED" && (
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-zinc-300">
                  Duration
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[30, 45, 60, 75].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={cn(
                        "rounded-lg border py-1.5 font-mono text-xs cursor-pointer",
                        durationMinutes === mins
                          ? "border-[#10B981] bg-[#10B981]/15 text-[#10B981]"
                          : "border-[#242429] bg-[#0F0F11] text-zinc-400"
                      )}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="oa-pattern-select"
                className="text-xs font-medium text-zinc-300 block"
              >
                Pattern Focus
              </label>
              <select
                id="oa-pattern-select"
                value={focusPattern}
                onChange={(e) => setFocusPattern(e.target.value as DsaPattern)}
                className="flex h-9 w-full rounded-lg border border-[#242429] bg-[#0F0F11] px-2.5 text-xs text-white focus:border-[#10B981] focus:outline-none"
              >
                {DSA_PATTERNS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              onClick={handleStartSession}
              isLoading={startMutation.isPending}
            >
              <Play className="h-4 w-4" />
              {mode === "TIMED"
                ? "Start Timed Assessment"
                : "Start Practice Session"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Standalone Problem Bank */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-[#10B981]" />
            <h2 className="text-base font-semibold text-white">
              Standalone Problem Bank
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-[#242429] bg-[#151518] p-1">
              {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setBankFilter(level)}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-mono text-[11px] cursor-pointer",
                    bankFilter === level
                      ? "bg-[#242429] text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleGenerateProblem}
              isLoading={generateProblemMutation.isPending}
              className="border-[#10B981]/40 text-[#10B981] hover:bg-[#10B981]/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate AI DSA Problem
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {problems.map((p) => (
            <Card
              key={p.id}
              className="border-[#242429] bg-[#151518] hover:border-zinc-600 transition-colors"
            >
              <CardContent className="p-4 flex flex-col justify-between gap-3 h-full">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        p.difficulty === "EASY"
                          ? "emerald"
                          : p.difficulty === "MEDIUM"
                            ? "amber"
                            : "danger"
                      }
                    >
                      {p.difficulty}
                    </Badge>
                    <span className="font-mono text-[10px] text-zinc-400">
                      {p.pattern}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white line-clamp-1">
                    {p.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {p.statement}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectProblem(p)}
                  className="w-full"
                >
                  Solve Problem
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Session History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <h2 className="text-base font-semibold text-white">
                Recent Sessions
              </h2>
            </div>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleClearHistory}
              isLoading={clearHistoryMutation.isPending}
              className="text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear History
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {history.slice(0, 6).map((s) => {
              const isDeleting = deletingSessionId === s.id;
              return (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onViewScorecard(s)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onViewScorecard(s);
                    }
                  }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#242429] bg-[#151518] p-3.5 text-left hover:border-zinc-600 transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">
                      {s.title}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                      <Flame className="h-3 w-3 text-[#10B981]" />
                      <span>{s.status}</span>
                      <span>·</span>
                      <span>{s.problems.length} problems</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-sm font-bold text-[#10B981] tabular-nums">
                      {s.totalScore}/{s.maxTotalScore}
                    </span>
                    <button
                      type="button"
                      aria-label="Delete session"
                      disabled={isDeleting}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteSession(s.id);
                      }}
                      className="rounded-lg p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
