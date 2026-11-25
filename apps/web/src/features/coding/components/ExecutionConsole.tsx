import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Terminal,
  XCircle,
} from "lucide-react";
import type { CodeExecutionResultDto } from "@techquery/shared";
import { cn } from "@/lib/cn";

export interface ExecutionConsoleProps {
  result: CodeExecutionResultDto | null;
  isRunning: boolean;
  errorMessage?: string | null;
}

export function ExecutionConsole({
  result,
  isRunning,
  errorMessage,
}: ExecutionConsoleProps) {
  const [selectedIdx, setSelectedIdx] = React.useState(0);

  React.useEffect(() => {
    setSelectedIdx(0);
  }, [result]);

  if (isRunning) {
    return (
      <div className="rounded-xl border border-[#242429] bg-[#0B0B0D] p-4 font-mono text-xs text-zinc-400 flex items-center gap-2.5">
        <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
        Executing code against sandboxed Judge0 CE test runner...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-500/35 bg-red-500/10 p-4 text-xs text-red-300 flex items-start gap-2.5"
      >
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
        <div>
          <p className="font-semibold">Execution Error</p>
          <p className="mt-1 text-red-200/80">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-[#242429] bg-[#0B0B0D] p-4 text-xs text-zinc-500 flex items-center gap-2">
        <Terminal className="h-4 w-4 text-zinc-500" />
        Run sample tests or submit your solution to inspect execution results.
      </div>
    );
  }

  const isAccepted = result.verdict === "ACCEPTED";
  const activeCase = result.results[selectedIdx] ?? result.results[0];

  return (
    <div className="rounded-xl border border-[#242429] bg-[#0B0B0D] overflow-hidden">
      {/* Verdict Banner */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5",
          isAccepted
            ? "border-[#10B981]/30 bg-[#10B981]/10"
            : "border-red-500/30 bg-red-500/10"
        )}
      >
        <div className="flex items-center gap-2">
          {isAccepted ? (
            <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400" />
          )}
          <span
            className={cn(
              "font-mono text-xs font-bold tracking-wide",
              isAccepted ? "text-[#10B981]" : "text-red-400"
            )}
          >
            {result.verdict.replace(/_/g, " ")}
          </span>
          <span className="font-mono text-xs text-zinc-300">
            ({result.passedCount}/{result.totalCount} passed)
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-zinc-500" />
            {result.runtimeMs} ms
          </span>
          <span className="inline-flex items-center gap-1">
            <Cpu className="h-3 w-3 text-zinc-500" />
            {result.memoryKb} KB
          </span>
        </div>
      </div>

      {/* Test Case Tabs */}
      {result.results.length > 0 && (
        <div className="p-3 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {result.results.map((tc, idx) => (
              <button
                key={tc.testCaseId || idx}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors cursor-pointer",
                  selectedIdx === idx
                    ? "border-zinc-500 bg-[#1A1A20] text-white"
                    : "border-[#242429] bg-[#131317] text-zinc-400 hover:text-zinc-200"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    tc.passed ? "bg-[#10B981]" : "bg-red-400"
                  )}
                />
                Case {idx + 1}
              </button>
            ))}
          </div>

          {activeCase && (
            <div className="space-y-2 font-mono text-xs">
              {activeCase.compileOutput && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-200 whitespace-pre-wrap">
                  <div className="text-[10px] uppercase tracking-wider text-amber-400 mb-1">
                    Compiler Output
                  </div>
                  {activeCase.compileOutput}
                </div>
              )}

              {activeCase.stderr && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-red-200 whitespace-pre-wrap">
                  <div className="text-[10px] uppercase tracking-wider text-red-400 mb-1">
                    Runtime Stderr
                  </div>
                  {activeCase.stderr}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="rounded-lg border border-[#242429] bg-[#151518] p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                    Input (stdin)
                  </div>
                  <pre className="text-zinc-200 whitespace-pre-wrap break-all">
                    {activeCase.stdin || "(empty)"}
                  </pre>
                </div>

                <div className="rounded-lg border border-[#242429] bg-[#151518] p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                    Expected Output
                  </div>
                  <pre className="text-[#10B981] whitespace-pre-wrap break-all">
                    {activeCase.expectedOutput}
                  </pre>
                </div>

                <div className="rounded-lg border border-[#242429] bg-[#151518] p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                    Your Output
                  </div>
                  <pre
                    className={cn(
                      "whitespace-pre-wrap break-all",
                      activeCase.passed ? "text-[#10B981]" : "text-red-300"
                    )}
                  >
                    {activeCase.actualOutput || "(no output)"}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
