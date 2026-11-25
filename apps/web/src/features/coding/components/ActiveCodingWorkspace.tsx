import * as React from "react";
import Editor from "@monaco-editor/react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  Lightbulb,
  Play,
  RotateCcw,
  Send,
  ShieldCheck,
  XOctagon,
} from "lucide-react";
import type {
  AssessmentSessionDto,
  CodeExecutionResultDto,
  CodingProblemDto,
  SupportedCodeLanguage,
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

export interface ActiveCodingWorkspaceProps {
  session?: AssessmentSessionDto;
  standaloneProblem?: CodingProblemDto;
  onExitStandalone?: () => void;
  onSessionCompleted: (finalSession: AssessmentSessionDto) => void;
  onTimerExpired: () => void;
}

export function ActiveCodingWorkspace({
  session,
  standaloneProblem,
  onExitStandalone,
  onSessionCompleted,
  onTimerExpired,
}: ActiveCodingWorkspaceProps) {
  const [activeSlotIdx, setActiveSlotIdx] = React.useState(0);
  const [language, setLanguage] = React.useState<SupportedCodeLanguage>("java");
  const [code, setCode] = React.useState("");
  const [showHints, setShowHints] = React.useState(false);
  const [draftStatus, setDraftStatus] = React.useState<"saved" | "saving">(
    "saved"
  );
  const [executionResult, setExecutionResult] =
    React.useState<CodeExecutionResultDto | null>(null);
  const [executionError, setExecutionError] = React.useState<string | null>(null);
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
    const starter = activeProblem.starterCode[language] ?? "";
    setCode(starter);
    const key = buildDraftStorageKey(session?.id, activeProblem.id, language);
    window.localStorage.setItem(key, starter);
  };

  const handleExecute = async (mode: "SAMPLE" | "SUBMIT") => {
    setExecutionError(null);
    try {
      const result = await runMutation.mutateAsync({
        problemId: activeProblem.id,
        language,
        code,
        mode,
        assessmentSessionId: session?.id,
      });
      setExecutionResult(result);
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
              <span className="text-sm font-semibold text-white">
                {activeProblem.title}
              </span>
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
              <Badge variant="mono">{activeProblem.pattern}</Badge>
            </div>
            <h2 className="text-lg font-bold text-white">
              {activeProblem.title}
            </h2>
          </div>

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

          {/* Hints */}
          {activeProblem.hints.length > 0 && (
            <div className="rounded-lg border border-[#242429] bg-[#0B0B0D] p-3">
              <button
                type="button"
                onClick={() => setShowHints((prev) => !prev)}
                className="flex w-full items-center justify-between text-xs font-semibold text-zinc-300 cursor-pointer"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                  Hints ({activeProblem.hints.length})
                </span>
                {showHints ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              {showHints && (
                <ul className="mt-2.5 space-y-1.5 border-t border-[#242429] pt-2.5 text-xs text-zinc-400">
                  {activeProblem.hints.map((h, idx) => (
                    <li key={idx}>• {h}</li>
                  ))}
                </ul>
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
                  onClick={handleResetCode}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Code
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
