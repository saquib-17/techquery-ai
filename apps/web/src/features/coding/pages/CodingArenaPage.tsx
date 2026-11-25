import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, Code2 } from "lucide-react";
import type { AssessmentSessionDto, CodingProblemDto } from "@techquery/shared";
import { cn } from "@/lib/cn";
import {
  useActiveAssessmentQuery,
  useCodingProblemQuery,
  useCodingProblemsQuery,
} from "../api/codingApi";
import { PreSessionLobby } from "../components/PreSessionLobby";
import { ActiveCodingWorkspace } from "../components/ActiveCodingWorkspace";
import { SessionScorecardModal } from "../components/SessionScorecardModal";
import { DsaSheetView } from "@/features/dsa-sheet/DsaSheetView";

export function CodingArenaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const problemIdParam = searchParams.get("problemId");

  const activeQuery = useActiveAssessmentQuery();
  const standaloneQuery = useCodingProblemQuery(
    activeQuery.data ? null : problemIdParam
  );
  const problemsBankQuery = useCodingProblemsQuery();

  const [arenaTab, setArenaTab] = React.useState<"practice" | "sheet">(
    "practice"
  );
  const [selectedStandalone, setSelectedStandalone] =
    React.useState<CodingProblemDto | null>(null);
  const [scorecardSession, setScorecardSession] =
    React.useState<AssessmentSessionDto | null>(null);

  const activeSession = activeQuery.data ?? null;
  const effectiveStandalone =
    selectedStandalone ?? standaloneQuery.data?.problem ?? null;

  const handleTimerExpired = React.useCallback(async () => {
    await activeQuery.refetch();
  }, [activeQuery]);

  const handleSelectProblem = (problem: CodingProblemDto) => {
    setSelectedStandalone(problem);
    setArenaTab("practice");
    setSearchParams({ problemId: problem.id });
  };

  const handleSolveFromSheet = (arenaSlug: string) => {
    const matched = (problemsBankQuery.data ?? []).find(
      (p) => p.slug === arenaSlug
    );
    if (matched) {
      handleSelectProblem(matched);
    } else {
      setArenaTab("practice");
    }
  };

  const handleExitStandalone = () => {
    setSelectedStandalone(null);
    setSearchParams({});
  };

  if (activeQuery.isLoading) {
    return (
      <div className="rounded-xl border border-[#242429] bg-[#151518] p-8 text-center text-sm text-zinc-400">
        Restoring coding workspace...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Workspace Switcher (hidden while an active OA session or standalone IDE is open) */}
      {!activeSession && !effectiveStandalone && (
        <div className="inline-flex items-center gap-1 rounded-xl border border-[#242429] bg-[#0B0B0D] p-1">
          <button
            type="button"
            onClick={() => setArenaTab("practice")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer",
              arenaTab === "practice"
                ? "bg-[#151518] text-white border border-[#2A2A32]"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Code2 className="h-3.5 w-3.5 text-[#10B981]" />
            Practice &amp; Timed OA
          </button>
          <button
            type="button"
            onClick={() => setArenaTab("sheet")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer",
              arenaTab === "sheet"
                ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Master DSA Sheet (300)
          </button>
        </div>
      )}

      {activeSession ? (
        <ActiveCodingWorkspace
          session={activeSession}
          onSessionCompleted={(finalSession) => setScorecardSession(finalSession)}
          onTimerExpired={handleTimerExpired}
        />
      ) : effectiveStandalone ? (
        <ActiveCodingWorkspace
          standaloneProblem={effectiveStandalone}
          onExitStandalone={handleExitStandalone}
          onSessionCompleted={() => {}}
          onTimerExpired={() => {}}
        />
      ) : arenaTab === "sheet" ? (
        <DsaSheetView onSolveInArena={handleSolveFromSheet} />
      ) : (
        <PreSessionLobby
          onSessionStarted={() => {
            void activeQuery.refetch();
          }}
          onSelectProblem={handleSelectProblem}
          onViewScorecard={(s) => setScorecardSession(s)}
        />
      )}

      <SessionScorecardModal
        session={scorecardSession}
        onClose={() => setScorecardSession(null)}
      />
    </div>
  );
}
