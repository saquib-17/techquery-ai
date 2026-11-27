import * as React from "react";
import Editor from "@monaco-editor/react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  FileText,
  Flag,
  Lightbulb,
  ListFilter,
  Play,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Wand2,
  XOctagon,
} from "lucide-react";
import {
  DSA_SHEET_PROBLEMS,
  type AssessmentSessionDto,
  type CodeExecutionResultDto,
  type CodingProblemDto,
  type ProblemAttemptStatus,
  type SupportedCodeLanguage,
} from "@techquery/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { ApiClientError } from "@/lib/api";
import {
  saveAssessmentDraftApi,
  useCancelAssessmentMutation,
  useFinishAssessmentMutation,
  useRunCodingCodeMutation,
} from "../api/codingApi";
import { ExecutionConsole } from "./ExecutionConsole";

const LANGUAGE_OPTIONS: Array<{
  value: SupportedCodeLanguage;
  label: string;
  monacoId: string;
}> = [
  { value: "java", label: "Java", monacoId: "java" },
  { value: "python", label: "Python", monacoId: "python" },
  { value: "cpp", label: "C++", monacoId: "cpp" },
  { value: "javascript", label: "JavaScript", monacoId: "javascript" },
];

const SLUG_TO_PATTERN_LABEL = new Map<string, string>(
  DSA_SHEET_PROBLEMS.map((p) => [p.slug, p.category.replace(/^\d+\.\s*/, "")])
);

const FALLBACK_PATTERN_LABELS: Record<string, string> = {
  ALL_PATTERNS: "General Practice",
  ARRAYS_TWO_POINTERS: "Arrays & Two Pointers",
  SLIDING_WINDOW: "Sliding Window",
  BINARY_SEARCH: "Binary Search",
  TREES_GRAPHS: "Trees & Graphs",
  DYNAMIC_PROGRAMMING: "Dynamic Programming",
  STACK_HEAP: "Stack & Heap",
};

function formatProblemPattern(problem: CodingProblemDto): string {
  return (
    SLUG_TO_PATTERN_LABEL.get(problem.slug) ??
    FALLBACK_PATTERN_LABELS[problem.pattern] ??
    problem.pattern
  );
}

export function buildDraftStorageKey(
  sessionId: string | undefined,
  problemId: string,
  language: SupportedCodeLanguage
): string {
  return `tq_coding_draft_${sessionId || "standalone"}_${problemId}_${language}`;
}

function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatStarterCode(
  source: string,
  lang: SupportedCodeLanguage
): string {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  if (lang === "python") {
    return lines
      .map((l) => l.replace(/\s+$/, ""))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd();
  }
  let indent = 0;
  const out: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      out.push("");
      continue;
    }
    if (line.startsWith("}") || line.startsWith("]")) {
      indent = Math.max(0, indent - 1);
    }
    out.push("  ".repeat(indent) + line);
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    if (line.startsWith("}")) {
      indent = Math.max(0, indent + Math.max(0, opens - (closes - 1)));
    } else {
      indent = Math.max(0, indent + opens - closes);
    }
  }
  return out.join("\n").trimEnd();
}

export interface ActiveCodingWorkspaceProps {
  session?: AssessmentSessionDto;
  standaloneProblem?: CodingProblemDto;
  problemsBank?: CodingProblemDto[];
  solvedSlugs?: Set<string>;
  onSelectStandaloneProblem?: (problem: CodingProblemDto) => void;
  onExitStandalone?: () => void;
  onSessionCompleted: (finalSession: AssessmentSessionDto) => void;
  onTimerExpired: () => void;
}

export function ActiveCodingWorkspace({
  session,
  standaloneProblem,
  problemsBank = [],
  solvedSlugs,
  onSelectStandaloneProblem,
  onExitStandalone,
  onSessionCompleted,
  onTimerExpired,
}: ActiveCodingWorkspaceProps) {
  const [activeSlotIdx, setActiveSlotIdx] = React.useState(0);
  const [language, setLanguage] = React.useState<SupportedCodeLanguage>("java");
  const [code, setCode] = React.useState("");
  const [leftTab, setLeftTab] = React.useState<"description" | "hints">(
    "description"
  );
  const [revealedHints, setRevealedHints] = React.useState<Set<number>>(
    () => new Set()
  );
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerSearch, setPickerSearch] = React.useState("");
  const [pickerDifficulty, setPickerDifficulty] = React.useState<string>("ALL");
  const [pickerPattern, setPickerPattern] = React.useState<string>("ALL");
  const [draftStatus, setDraftStatus] = React.useState<"saved" | "saving">(
    "saved"
  );
  const [executionResult, setExecutionResult] =
    React.useState<CodeExecutionResultDto | null>(null);
  const [executionMode, setExecutionMode] = React.useState<
    "SAMPLE" | "SUBMIT" | null
  >(null);
  const [executionError, setExecutionError] = React.useState<string | null>(null);
  const [liveStatusBySlug, setLiveStatusBySlug] = React.useState<
    Record<string, ProblemAttemptStatus>
  >({});
  const [confirmAction, setConfirmAction] = React.useState<
    "finish" | "cancel" | null
  >(null);

  const [remainingSeconds, setRemainingSeconds] = React.useState<number | null>(
    session?.mode === "TIMED" ? session.remainingSeconds : null
  );

  const runMutation = useRunCodingCodeMutation();
  const finishMutation = useFinishAssessmentMutation();
  const cancelMutation = useCancelAssessmentMutation();

  const activeProblem: CodingProblemDto | undefined = session
    ? session.problems[activeSlotIdx]?.problem ?? session.problems[0]?.problem
    : standaloneProblem;

  // Sync timer when session changes
  React.useEffect(() => {
    if (session?.mode === "TIMED") {
      setRemainingSeconds(session.remainingSeconds);
    } else {
      setRemainingSeconds(null);
    }
  }, [session?.id, session?.mode, session?.remainingSeconds]);

  // Countdown tick for TIMED mode
  React.useEffect(() => {
    if (!session || session.mode !== "TIMED" || remainingSeconds === null) {
      return;
    }
    if (remainingSeconds <= 0) {
      onTimerExpired();
      return;
    }
    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          window.clearInterval(timer);
          onTimerExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session?.id, session?.mode, remainingSeconds === 0, onTimerExpired]);

  // Load initial draft when switching problem or language
  React.useEffect(() => {
    if (!activeProblem) return;
    setExecutionResult(null);
    setExecutionError(null);
    setConfirmReset(false);
    setRevealedHints(new Set());
    setLeftTab("description");

    const key = buildDraftStorageKey(session?.id, activeProblem.id, language);
    const localDraft = window.localStorage.getItem(key);
    if (localDraft !== null) {
      setCode(localDraft);
      return;
    }

    const serverDraft = session?.drafts?.[activeProblem.id];
    if (serverDraft && serverDraft.language === language) {
      setCode(serverDraft.code);
      return;
    }

    setCode(activeProblem.starterCode[language] ?? "");
  }, [session?.id, activeProblem?.id, language]);

  // Debounced backend draft sync (every 4s in active session)
  React.useEffect(() => {
    if (!session || !activeProblem) return;
    setDraftStatus("saving");
    const handle = window.setTimeout(async () => {
      try {
        await saveAssessmentDraftApi(session.id, {
          problemId: activeProblem.id,
          language,
          code,
        });
        setDraftStatus("saved");
      } catch {
        setDraftStatus("saved");
      }
    }, 4000);
    return () => window.clearTimeout(handle);
  }, [session?.id, activeProblem?.id, language, code]);

  if (!activeProblem) {
    return null;
  }

  const handleCodeChange = (nextValue: string | undefined) => {
    const val = nextValue ?? "";
    setCode(val);
    const key = buildDraftStorageKey(session?.id, activeProblem.id, language);
    window.localStorage.setItem(key, val);
  };

  const handleResetCode = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    const starter = activeProblem.starterCode[language] ?? "";
    setCode(starter);
    setConfirmReset(false);
    const key = buildDraftStorageKey(session?.id, activeProblem.id, language);
    window.localStorage.setItem(key, starter);
  };

  const handleFormatCode = () => {
    const formatted = formatStarterCode(code, language);
    setCode(formatted);
    const key = buildDraftStorageKey(session?.id, activeProblem.id, language);
    window.localStorage.setItem(key, formatted);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1500);
    } catch {
      // Ignore clipboard unavailability in headless environments
    }
  };

  const filteredPickerProblems = React.useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    return problemsBank.filter((p, idx) => {
      if (pickerDifficulty !== "ALL" && p.difficulty !== pickerDifficulty) {
        return false;
      }
      if (pickerPattern !== "ALL" && p.pattern !== pickerPattern) {
        return false;
      }
      if (q) {
        const hay = `${idx + 1} ${p.title} ${p.slug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [problemsBank, pickerSearch, pickerDifficulty, pickerPattern]);

  const effectiveStatus: ProblemAttemptStatus = React.useMemo(() => {
    if (!activeProblem) return "UNSOLVED";
    const sessionSolved = session?.problems.find(
      (s) => s.problem.id === activeProblem.id
    )?.solved;
    if (
      liveStatusBySlug[activeProblem.slug] === "SOLVED" ||
      solvedSlugs?.has(activeProblem.slug) ||
      activeProblem.userStatus === "SOLVED" ||
      sessionSolved
    ) {
      return "SOLVED";
    }
    if (
      liveStatusBySlug[activeProblem.slug] === "ATTEMPTED" ||
      activeProblem.userStatus === "ATTEMPTED"
    ) {
      return "ATTEMPTED";
    }
    return "UNSOLVED";
  }, [activeProblem, liveStatusBySlug, solvedSlugs, session]);

  const handleExecute = async (mode: "SAMPLE" | "SUBMIT") => {
    setExecutionError(null);
    setExecutionMode(mode);
    try {
      const result = await runMutation.mutateAsync({
        problemId: activeProblem.id,
        language,
        code,
        mode,
        assessmentSessionId: session?.id,
      });
      setExecutionResult(result);
      if (mode === "SUBMIT") {
        if (result.verdict === "ACCEPTED") {
          setLiveStatusBySlug((prev) => ({
            ...prev,
            [activeProblem.slug]: "SOLVED",
          }));
        } else if (effectiveStatus !== "SOLVED") {
          setLiveStatusBySlug((prev) => ({
            ...prev,
            [activeProblem.slug]: "ATTEMPTED",
          }));
        }
      }
    } catch (err) {
      setExecutionError(
        err instanceof ApiClientError
          ? err.message
          : "Code execution failed. Please check your code or try again."
      );
    }
  };

  const handleConfirmFinishOrCancel = async () => {
    if (!session || !confirmAction) return;
    const action = confirmAction;
    setConfirmAction(null);
    const finalSession =
      action === "finish"
        ? await finishMutation.mutateAsync(session.id)
        : await cancelMutation.mutateAsync(session.id);
    onSessionCompleted(finalSession);
  };

  const monacoLanguage =
    LANGUAGE_OPTIONS.find((l) => l.value === language)?.monacoId || "java";

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#242429] bg-[#151518] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {session ? (
            session.problems.map((slot, idx) => (
              <button
                key={slot.problem.id}
                type="button"
                onClick={() => setActiveSlotIdx(idx)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors cursor-pointer",
                  activeSlotIdx === idx
                    ? "border-[#10B981]/60 bg-[#10B981]/15 text-white"
                    : "border-[#242429] bg-[#0F0F11] text-zinc-400 hover:text-zinc-200"
                )}
              >
                <span>Q{slot.orderIndex}</span>
                {slot.solved && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
                )}
                <span className="text-[10px] text-zinc-400">
                  {slot.earnedPoints}/100
                </span>
              </button>
            ))
          ) : (
            <div className="flex items-center gap-2">
              {onExitStandalone && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onExitStandalone}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Lobby
                </Button>
              )}
              {problemsBank.length > 0 && onSelectStandaloneProblem ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPickerOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#242429] bg-[#0F0F11] px-3 py-1.5 text-sm font-semibold text-white hover:border-[#10B981]/50 cursor-pointer"
                  >
                    <ListFilter className="h-3.5 w-3.5 text-[#10B981]" />
                    <span className="truncate max-w-[220px]">
                      {activeProblem.title}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                  </button>

                  {pickerOpen && (
                    <div className="absolute left-0 top-full z-40 mt-2 w-[340px] sm:w-[400px] rounded-xl border border-[#242429] bg-[#151518] p-3 shadow-2xl space-y-2.5">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                        <input
                          type="text"
                          value={pickerSearch}
                          onChange={(e) => setPickerSearch(e.target.value)}
                          placeholder="Search by # or problem title..."
                          className="w-full rounded-lg border border-[#242429] bg-[#0F0F11] pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-[#10B981] focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          aria-label="Filter problems by difficulty"
                          value={pickerDifficulty}
                          onChange={(e) => setPickerDifficulty(e.target.value)}
                          className="rounded-lg border border-[#242429] bg-[#0F0F11] px-2 py-1 font-mono text-[11px] text-zinc-200"
                        >
                          <option value="ALL">All Difficulties</option>
                          <option value="EASY">Easy</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HARD">Hard</option>
                        </select>
                        <select
                          aria-label="Filter problems by pattern"
                          value={pickerPattern}
                          onChange={(e) => setPickerPattern(e.target.value)}
                          className="rounded-lg border border-[#242429] bg-[#0F0F11] px-2 py-1 font-mono text-[11px] text-zinc-200"
                        >
                          <option value="ALL">All Patterns</option>
                          <option value="ARRAYS_TWO_POINTERS">Arrays &amp; Two Pointers</option>
                          <option value="SLIDING_WINDOW">Sliding Window</option>
                          <option value="BINARY_SEARCH">Binary Search</option>
                          <option value="STACK_HEAP">Stack &amp; Heap</option>
                          <option value="DYNAMIC_PROGRAMMING">Dynamic Programming</option>
                        </select>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-[#242429]/60">
                        {filteredPickerProblems.map((p, idx) => {
                          const isSolved = solvedSlugs?.has(p.slug);
                          const isCurrent = p.id === activeProblem.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                onSelectStandaloneProblem(p);
                                setPickerOpen(false);
                              }}
                              className={cn(
                                "flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-xs hover:bg-[#1E1E24] cursor-pointer",
                                isCurrent && "bg-[#10B981]/10 text-[#10B981]"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[10px] text-zinc-500 w-5 shrink-0">
                                  #{idx + 1}
                                </span>
                                {isSolved && (
                                  <Check className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                                )}
                                <span className="truncate font-medium">
                                  {p.title}
                                </span>
                              </div>
                              <span
                                className={cn(
                                  "font-mono text-[10px] shrink-0",
                                  p.difficulty === "EASY"
                                    ? "text-[#10B981]"
                                    : p.difficulty === "MEDIUM"
                                      ? "text-[#F59E0B]"
                                      : "text-rose-400"
                                )}
                              >
                                {p.difficulty}
                              </span>
                            </button>
                          );
                        })}
                        {filteredPickerProblems.length === 0 && (
                          <p className="py-4 text-center text-xs text-zinc-500">
                            No matching problems.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-sm font-semibold text-white">
                  {activeProblem.title}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {session && session.mode === "TIMED" && remainingSeconds !== null && (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold tabular-nums",
                remainingSeconds < 300
                  ? "border-amber-500/50 bg-amber-500/15 text-amber-300 animate-pulse"
                  : "border-[#242429] bg-[#0F0F11] text-[#10B981]"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              {formatCountdown(remainingSeconds)}
            </div>
          )}

          {session && session.mode === "UNTIMED" && (
            <Badge variant="emerald" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              Untimed Practice
            </Badge>
          )}

          {session && (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirmAction("cancel")}
              >
                <XOctagon className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setConfirmAction("finish")}
              >
                <Flag className="h-3.5 w-3.5" />
                Finish &amp; Submit
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Problem Panel */}
        <div className="lg:col-span-5 rounded-xl border border-[#242429] bg-[#151518] p-5 space-y-4 max-h-[calc(100vh-11rem)] overflow-y-auto">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  activeProblem.difficulty === "EASY"
                    ? "emerald"
                    : activeProblem.difficulty === "MEDIUM"
                      ? "amber"
                      : "danger"
                }
              >
                {activeProblem.difficulty}
              </Badge>
              <Badge variant="mono">{formatProblemPattern(activeProblem)}</Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-white">
                {activeProblem.title}
              </h2>
              {effectiveStatus === "SOLVED" && (
                <span
                  data-testid="problem-status-badge"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 shrink-0"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  ✓ Solved
                </span>
              )}
              {effectiveStatus === "ATTEMPTED" && (
                <span
                  data-testid="problem-status-badge"
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 shrink-0"
                >
                  <Clock className="h-3.5 w-3.5" />
                  ◐ Attempted
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 border-b border-[#242429] pb-2">
            <button
              type="button"
              onClick={() => setLeftTab("description")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-medium cursor-pointer transition-colors",
                leftTab === "description"
                  ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Description
            </button>
            <button
              type="button"
              onClick={() => setLeftTab("hints")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-medium cursor-pointer transition-colors",
                leftTab === "hints"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Hints ({activeProblem.hints.length})
            </button>
          </div>

          {leftTab === "description" ? (
            <>
              <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
                {activeProblem.statement}
              </p>

              {/* Examples */}
              {activeProblem.examples.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Examples
                  </div>
                  {activeProblem.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#242429] bg-[#0B0B0D] p-3 font-mono text-xs space-y-1.5"
                    >
                      <div>
                        <span className="text-zinc-500">Input: </span>
                        <span className="text-zinc-200 whitespace-pre-wrap">
                          {ex.input}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Output: </span>
                        <span className="text-[#10B981]">{ex.output}</span>
                      </div>
                      {ex.explanation && (
                        <div className="text-zinc-400 font-sans text-[11px] pt-0.5">
                          {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {activeProblem.constraints.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Constraints
                  </div>
                  <ul className="space-y-1">
                    {activeProblem.constraints.map((c, idx) => (
                      <li
                        key={idx}
                        className="font-mono text-xs text-zinc-300 flex items-start gap-2"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#10B981] shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2.5">
              {activeProblem.hints.length === 0 ? (
                <p className="text-xs text-zinc-400">
                  No hints available for this problem.
                </p>
              ) : (
                activeProblem.hints.map((hint, idx) => {
                  const revealed = revealedHints.has(idx);
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#242429] bg-[#0B0B0D] p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-400">
                          <Lightbulb className="h-3.5 w-3.5" />
                          Hint {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedHints((prev) => {
                              const next = new Set(prev);
                              if (next.has(idx)) {
                                next.delete(idx);
                              } else {
                                next.add(idx);
                              }
                              return next;
                            })
                          }
                          className="font-mono text-[11px] text-[#10B981] hover:underline cursor-pointer"
                        >
                          {revealed ? "Hide Hint" : "Reveal Hint"}
                        </button>
                      </div>
                      {revealed ? (
                        <p className="text-xs leading-relaxed text-zinc-300">
                          {hint}
                        </p>
                      ) : (
                        <p className="text-[11px] text-zinc-500">
                          Click &quot;Reveal Hint&quot; when you need a nudge.
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Monaco IDE & Execution Console */}
        <div className="lg:col-span-7 space-y-3">
          <div className="rounded-xl border border-[#242429] bg-[#151518] overflow-hidden">
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242429] bg-[#0F0F11] px-3.5 py-2">
              <div className="flex items-center gap-2">
                <select
                  aria-label="Programming Language"
                  value={language}
                  onChange={(e) =>
                    setLanguage(e.target.value as SupportedCodeLanguage)
                  }
                  className="h-8 rounded-md border border-[#242429] bg-[#151518] px-2.5 font-mono text-xs text-white focus:border-[#10B981] focus:outline-none"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleFormatCode}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Format
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyCode}
                >
                  {copiedCode ? (
                    <Check className="h-3.5 w-3.5 text-[#10B981]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedCode ? "Copied" : "Copy"}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant={confirmReset ? "danger" : "ghost"}
                  onClick={handleResetCode}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {confirmReset ? "Confirm Reset?" : "Reset"}
                </Button>
              </div>

              <div className="flex items-center gap-3">
                {session && (
                  <span className="font-mono text-[11px] text-zinc-500">
                    {draftStatus === "saving" ? "Syncing draft..." : "Draft Saved"}
                  </span>
                )}
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="h-[380px] w-full bg-[#1e1e1e]">
              <Editor
                height="380px"
                language={monacoLanguage}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 14,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                }}
              />
            </div>

            {/* Run / Submit Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#242429] bg-[#0F0F11] px-3.5 py-2.5">
              <span className="font-mono text-[11px] text-zinc-500">
                Sample cases: {activeProblem.sampleTestCases.length} · Hidden
                cases: {activeProblem.hiddenTestCaseCount}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleExecute("SAMPLE")}
                  isLoading={runMutation.isPending}
                >
                  <Play className="h-3.5 w-3.5" />
                  Run Sample Tests
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleExecute("SUBMIT")}
                  isLoading={runMutation.isPending}
                >
                  <Send className="h-3.5 w-3.5" />
                  Submit Solution
                </Button>
              </div>
            </div>
          </div>

          <ExecutionConsole
            result={executionResult}
            mode={executionMode}
            isRunning={runMutation.isPending}
            errorMessage={executionError}
          />
        </div>
      </div>

      {/* Finish / Cancel Confirmation Modal */}
      <Dialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction === "finish"
            ? "Finish & Submit Assessment?"
            : "Cancel Active Session?"
        }
        description={
          confirmAction === "finish"
            ? "This will lock your current scores and generate your final scorecard."
            : "Your active session will be marked as cancelled."
        }
        className="max-w-md"
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmAction(null)}
          >
            Keep Coding
          </Button>
          <Button
            type="button"
            variant={confirmAction === "cancel" ? "danger" : "primary"}
            onClick={handleConfirmFinishOrCancel}
            isLoading={finishMutation.isPending || cancelMutation.isPending}
          >
            {confirmAction === "finish" ? "Confirm Finish" : "Confirm Cancel"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
