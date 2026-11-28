import { CheckCircle2, Trophy, XCircle } from "lucide-react";
import type { AssessmentSessionDto } from "@techquery/shared";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AiTutorChat } from "@/components/ai/AiTutorChat";

export interface SessionScorecardModalProps {
  session: AssessmentSessionDto | null;
  onClose: () => void;
}

export function SessionScorecardModal({
  session,
  onClose,
}: SessionScorecardModalProps) {
  if (!session) return null;

  const solvedCount = session.problems.filter((p) => p.solved).length;
  const pct =
    session.maxTotalScore > 0
      ? Math.round((session.totalScore / session.maxTotalScore) * 100)
      : 0;

  return (
    <Dialog
      open={Boolean(session)}
      onClose={onClose}
      title="Session Scorecard"
      description={session.title}
      className="max-w-xl"
    >
      <div className="space-y-4">
        {/* Summary Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#242429] bg-[#0B0B0D] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-zinc-400">Final Score</div>
              <div className="font-mono text-2xl font-bold text-white tabular-nums">
                {session.totalScore}
                <span className="text-sm font-normal text-zinc-500">
                  {" "}
                  / {session.maxTotalScore} ({pct}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge
              variant={
                session.status === "COMPLETED"
                  ? "emerald"
                  : session.status === "EXPIRED"
                    ? "amber"
                    : "neutral"
              }
            >
              {session.status}
            </Badge>
            <span className="font-mono text-[11px] text-zinc-400">
              {solvedCount}/{session.problems.length} problems solved
            </span>
          </div>
        </div>

        {/* Per-Problem Breakdown */}
        <div className="space-y-2">
          {session.problems.map((slot) => (
            <div
              key={slot.problem.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#242429] bg-[#151518] px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {slot.solved ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981]" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-zinc-500" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">
                    Q{slot.orderIndex}: {slot.problem.title}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {slot.problem.difficulty} · {slot.problem.pattern}
                  </div>
                </div>
              </div>

              <span className="font-mono text-xs font-semibold text-zinc-200 tabular-nums shrink-0">
                {slot.earnedPoints} / {slot.maxPoints}
              </span>
            </div>
          ))}
        </div>

        <AiTutorChat
          contextType="OA_REVIEW"
          contextId={session.id}
          contextTitle={session.title}
          contextSummary={`Score: ${session.totalScore}/${session.maxTotalScore} (${pct}%) | Solved: ${solvedCount}/${session.problems.length} | Status: ${session.status}\nProblems: ${session.problems
            .map(
              (p) =>
                `${p.problem.title} (${p.problem.difficulty}, ${p.solved ? "Solved" : "Unsolved"}, ${p.earnedPoints}/${p.maxPoints})`
            )
            .join("; ")}`}
        />

        <div className="flex justify-end border-t border-[#242429] pt-3">
          <Button type="button" onClick={onClose}>
            Back to Lobby
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
