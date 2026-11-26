import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  CheckSquare,
  Clock,
  ExternalLink,
  Loader2,
  Map as MapIcon,
  Plus,
  Sparkles,
  Square,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import type {
  LearningRoadmapDto,
  RoadmapLevel,
  RoadmapResourceType,
} from "@techquery/shared";
import {
  deleteRoadmapApi,
  fetchRoadmapsApi,
  generateRoadmapApi,
  toggleRoadmapTaskApi,
} from "./roadmapApi";
import { getMatchesApi } from "@/features/matching/matching.api";
import { useToast } from "@/components/ui/toast";

const ROLE_PRESETS = [
  "SDE-1 Full Stack",
  "Backend Engineer",
  "Software Engineer (Campus Placements)",
  "AI/ML Engineer",
];

const DURATION_OPTIONS = [4, 8, 12, 16, 24];

const HOURS_OPTIONS: Array<{ label: string; value: number }> = [
  { label: "1.5 hrs/day", value: 1.5 },
  { label: "2 hrs/day", value: 2 },
  { label: "3 hrs/day", value: 3 },
  { label: "4+ hrs/day", value: 4.5 },
];

const LEVEL_OPTIONS: Array<{ label: string; value: RoadmapLevel }> = [
  { label: "Beginner", value: "BEGINNER" },
  { label: "Intermediate", value: "INTERMEDIATE" },
  { label: "Advanced", value: "ADVANCED" },
];

const RESOURCE_BADGE: Record<RoadmapResourceType, string> = {
  DOCS: "text-sky-300 border-sky-500/30 bg-sky-500/10",
  COURSE: "text-purple-300 border-purple-500/30 bg-purple-500/10",
  PRACTICE: "text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10",
  ARTICLE: "text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10",
  VIDEO: "text-rose-300 border-rose-500/30 bg-rose-500/10",
};

export function RoadmapPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [targetRole, setTargetRole] = React.useState("SDE-1 Full Stack");
  const [durationWeeks, setDurationWeeks] = React.useState<number>(12);
  const [dailyHours, setDailyHours] = React.useState<number>(2);
  const [currentLevel, setCurrentLevel] =
    React.useState<RoadmapLevel>("INTERMEDIATE");
  const [focusSkills, setFocusSkills] = React.useState<string[]>([]);
  const [skillInput, setSkillInput] = React.useState("");
  const [activeRoadmapId, setActiveRoadmapId] = React.useState<string | null>(
    null
  );

  const { data: roadmaps = [], isLoading } = useQuery({
    queryKey: ["roadmaps"],
    queryFn: fetchRoadmapsApi,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: getMatchesApi,
  });

  React.useEffect(() => {
    if (roadmaps.length === 0) {
      setActiveRoadmapId(null);
      return;
    }
    if (!activeRoadmapId || !roadmaps.some((r) => r.id === activeRoadmapId)) {
      setActiveRoadmapId(roadmaps[0]!.id);
    }
  }, [roadmaps, activeRoadmapId]);

  const activeRoadmap: LearningRoadmapDto | null =
    roadmaps.find((r) => r.id === activeRoadmapId) ?? roadmaps[0] ?? null;

  const generateMutation = useMutation({
    mutationFn: generateRoadmapApi,
    onSuccess: (created) => {
      queryClient.setQueryData<LearningRoadmapDto[]>(["roadmaps"], (prev) => [
        created,
        ...(prev ?? []).filter((r) => r.id !== created.id),
      ]);
      setActiveRoadmapId(created.id);
      toast({
        variant: "success",
        title: "Roadmap Generated",
        description: `Created ${created.title}.`,
      });
    },
    onError: () => {
      toast({
        variant: "error",
        title: "Generation Failed",
        description: "Could not generate learning roadmap.",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      roadmapId,
      taskId,
      completed,
    }: {
      roadmapId: string;
      taskId: string;
      completed: boolean;
    }) => toggleRoadmapTaskApi(roadmapId, { taskId, completed }),
    onSuccess: (updated) => {
      queryClient.setQueryData<LearningRoadmapDto[]>(["roadmaps"], (prev) =>
        (prev ?? []).map((r) => (r.id === updated.id ? updated : r))
      );
    },
    onError: () => {
      toast({
        variant: "error",
        title: "Update Failed",
        description: "Could not save task progress.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (roadmapId: string) => deleteRoadmapApi(roadmapId),
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData<LearningRoadmapDto[]>(["roadmaps"], (prev) =>
        (prev ?? []).filter((r) => r.id !== deletedId)
      );
      toast({
        variant: "success",
        title: "Roadmap Deleted",
        description: "Removed saved roadmap.",
      });
    },
    onError: () => {
      toast({
        variant: "error",
        title: "Delete Failed",
        description: "Could not delete roadmap.",
      });
    },
  });

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (!focusSkills.includes(trimmed) && focusSkills.length < 20) {
      setFocusSkills((prev) => [...prev, trimmed]);
    }
    setSkillInput("");
  };

  const handleImportLatestGaps = async () => {
    const resolvedMatches =
      matches.length > 0
        ? matches
        : await queryClient
            .fetchQuery({
              queryKey: ["matches"],
              queryFn: getMatchesApi,
            })
            .catch(() => []);
    const latestMatch = resolvedMatches[0];
    if (!latestMatch || !latestMatch.missingSkills?.length) {
      toast({
        variant: "error",
        title: "No JD Gaps Found",
        description:
          "Run a Resume vs JD Match in Match Studio first to import missing skills.",
      });
      return;
    }

    const imported = latestMatch.missingSkills
      .map((s) => s.skill)
      .filter((s) => !focusSkills.includes(s));

    if (imported.length === 0) {
      toast({
        variant: "success",
        title: "Already Imported",
        description: "All missing skills from your latest match are already added.",
      });
      return;
    }

    setFocusSkills((prev) => [...prev, ...imported].slice(0, 20));
    toast({
      variant: "success",
      title: "Gaps Imported",
      description: `Imported ${imported.length} missing skills from your latest JD match.`,
    });
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetRole.trim().length < 2) {
      toast({
        variant: "error",
        title: "Target Role Required",
        description: "Enter a target role (at least 2 characters).",
      });
      return;
    }
    generateMutation.mutate({
      targetRole: targetRole.trim(),
      durationWeeks,
      dailyHours,
      currentLevel,
      focusSkills: focusSkills.length > 0 ? focusSkills : undefined,
    });
  };

  const overallPct =
    activeRoadmap && activeRoadmap.totalTasks > 0
      ? Math.round(
          (activeRoadmap.completedTasks / activeRoadmap.totalTasks) * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MapIcon className="h-4 w-4 text-[#10B981]" />
            <h1 className="text-lg font-bold text-white">
              AI Learning Roadmap Studio
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Generate week-by-week preparation roadmaps with curated resources,
            deliverables, and persistent milestone tracking.
          </p>
        </div>

        {activeRoadmap && (
          <div className="rounded-full border border-[#242429] bg-[#151518] px-3 py-1 font-mono text-xs text-zinc-300">
            <span className="font-semibold text-[#10B981]">
              {activeRoadmap.completedTasks} / {activeRoadmap.totalTasks}
            </span>{" "}
            Tasks Completed ({overallPct}%)
          </div>
        )}
      </div>

      {/* ── Roadmap Configuration Card ─────────────────────────────────────── */}
      <form
        onSubmit={handleGenerate}
        className="rounded-xl border border-[#242429] bg-[#151518] p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Configure Target Roadmap
          </span>
          <button
            type="button"
            onClick={handleImportLatestGaps}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[11px] text-[#F59E0B] hover:bg-amber-500/20 cursor-pointer"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Import Gaps from Latest JD Match
          </button>
        </div>

        {/* Role Presets */}
        <div className="flex flex-wrap gap-2">
          {ROLE_PRESETS.map((preset) => {
            const active = targetRole === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setTargetRole(preset)}
                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                  active
                    ? "border-[#10B981] bg-[#10B981]/15 text-[#10B981] font-medium"
                    : "border-[#242429] bg-[#0F0F11] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block font-mono text-[11px] text-zinc-400 mb-1">
              Target Role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. SDE-1 Full Stack"
              className="w-full rounded-lg border border-[#242429] bg-[#0F0F11] px-3 py-2 text-xs text-zinc-200 focus:border-[#10B981] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] text-zinc-400 mb-1">
              Timeline
            </label>
            <select
              aria-label="Timeline"
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(Number(e.target.value))}
              className="w-full rounded-lg border border-[#242429] bg-[#0F0F11] px-3 py-2 font-mono text-xs text-zinc-200 focus:border-[#10B981] focus:outline-none"
            >
              {DURATION_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  {w} Weeks
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-[11px] text-zinc-400 mb-1">
              Daily Study Hours
            </label>
            <select
              aria-label="Daily Study Hours"
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="w-full rounded-lg border border-[#242429] bg-[#0F0F11] px-3 py-2 font-mono text-xs text-zinc-200 focus:border-[#10B981] focus:outline-none"
            >
              {HOURS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-[11px] text-zinc-400 mb-1">
              Current Level
            </label>
            <select
              aria-label="Current Level"
              value={currentLevel}
              onChange={(e) => setCurrentLevel(e.target.value as RoadmapLevel)}
              className="w-full rounded-lg border border-[#242429] bg-[#0F0F11] px-3 py-2 font-mono text-xs text-zinc-200 focus:border-[#10B981] focus:outline-none"
            >
              {LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Focus Skills Tag Input */}
        <div>
          <label className="block font-mono text-[11px] text-zinc-400 mb-1">
            Focus Skills / Weak Areas (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Add skill (e.g. Redis, Dynamic Programming, Docker)..."
              className="flex-1 rounded-lg border border-[#242429] bg-[#0F0F11] px-3 py-1.5 text-xs text-zinc-200 focus:border-[#10B981] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="inline-flex items-center gap-1 rounded-lg border border-[#242429] bg-[#0F0F11] px-3 py-1.5 font-mono text-xs text-zinc-300 hover:border-zinc-500 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>

          {focusSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {focusSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-md border border-[#10B981]/30 bg-[#10B981]/10 px-2 py-0.5 font-mono text-[11px] text-[#10B981]"
                >
                  {skill}
                  <button
                    type="button"
                    aria-label={`Remove ${skill}`}
                    onClick={() =>
                      setFocusSkills((prev) => prev.filter((s) => s !== skill))
                    }
                    className="hover:text-white cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={generateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[#10B981] px-4 py-2 font-mono text-xs font-semibold text-black hover:bg-[#0ea572] disabled:opacity-60 cursor-pointer"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {generateMutation.isPending
              ? "Generating Roadmap..."
              : "Generate Roadmap"}
          </button>
        </div>
      </form>

      {/* ── Saved Roadmaps Switcher ────────────────────────────────────────── */}
      {roadmaps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-zinc-400 mr-1">
            Saved Roadmaps:
          </span>
          {roadmaps.map((rm) => {
            const active = activeRoadmap?.id === rm.id;
            return (
              <div
                key={rm.id}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  active
                    ? "border-[#10B981] bg-[#10B981]/10 text-white"
                    : "border-[#242429] bg-[#151518] text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveRoadmapId(rm.id)}
                  className="font-medium cursor-pointer"
                >
                  {rm.targetRole} ({rm.durationWeeks}W)
                </button>
                <span className="font-mono text-[10px] text-[#10B981]">
                  {rm.completedTasks}/{rm.totalTasks}
                </span>
                <button
                  type="button"
                  aria-label={`Delete ${rm.title}`}
                  onClick={() => deleteMutation.mutate(rm.id)}
                  disabled={deleteMutation.isPending}
                  className="ml-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Active Roadmap Timeline ────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#242429] bg-[#151518] py-14 text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin text-[#10B981] mb-3" />
          <p className="font-mono text-xs">Loading saved roadmaps...</p>
        </div>
      ) : !activeRoadmap ? (
        <div className="rounded-xl border border-[#242429] bg-[#151518] p-10 text-center text-sm text-zinc-400">
          No roadmaps yet. Configure your target role and timeline above, then
          click <span className="text-[#10B981] font-semibold">Generate Roadmap</span>.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#242429] bg-[#151518] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-white">
                  {activeRoadmap.title}
                </h2>
                <p className="font-mono text-[11px] text-zinc-400 mt-0.5">
                  {activeRoadmap.durationWeeks} Weeks ·{" "}
                  {activeRoadmap.dailyHours} hrs/day ·{" "}
                  {activeRoadmap.currentLevel}
                </p>
              </div>
              <span className="font-mono text-xs text-[#10B981] font-semibold">
                {overallPct}% Complete
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#0F0F11] border border-[#242429]">
              <div
                className="h-full bg-[#10B981] transition-all duration-300"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>

          {activeRoadmap.phases.map((phase) => {
            const doneCount = phase.tasks.filter((t) => t.completed).length;
            const phasePct =
              phase.tasks.length > 0
                ? Math.round((doneCount / phase.tasks.length) * 100)
                : 0;

            return (
              <div
                key={phase.phaseNumber}
                className="rounded-xl border border-[#242429] bg-[#151518] overflow-hidden"
              >
                <div className="border-b border-[#242429] bg-[#121215] px-5 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-md border border-[#10B981]/30 bg-[#10B981]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#10B981]">
                        Phase {phase.phaseNumber} · {phase.weekLabel}
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        {phase.title}
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-zinc-400">
                      <span className="text-[#10B981] font-semibold">
                        {doneCount}/{phase.tasks.length}
                      </span>{" "}
                      tasks ({phasePct}%)
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1.5">{phase.summary}</p>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#0F0F11]">
                    <div
                      className="h-full bg-[#10B981] transition-all duration-300"
                      style={{ width: `${phasePct}%` }}
                    />
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Tasks */}
                  <div className="space-y-2">
                    {phase.tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() =>
                          toggleMutation.mutate({
                            roadmapId: activeRoadmap.id,
                            taskId: task.id,
                            completed: !task.completed,
                          })
                        }
                        className={`w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                          task.completed
                            ? "border-[#10B981]/30 bg-[#10B981]/5"
                            : "border-[#242429] bg-[#0F0F11] hover:border-zinc-600"
                        }`}
                      >
                        {task.completed ? (
                          <CheckSquare className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                        ) : (
                          <Square className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className={`text-xs font-semibold ${
                                task.completed
                                  ? "line-through text-zinc-400"
                                  : "text-zinc-100"
                              }`}
                            >
                              {task.order}. {task.title}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-400">
                              <Clock className="h-3 w-3" />
                              {task.estimatedHours}h
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {task.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Where to Learn Resources */}
                  <div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-400 mb-2">
                      <BookOpen className="h-3.5 w-3.5 text-[#10B981]" />
                      Where to Learn
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {phase.resources.map((res, rIdx) => (
                        <a
                          key={rIdx}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#242429] bg-[#0F0F11] px-2.5 py-1.5 text-xs text-zinc-200 hover:border-zinc-500 transition-colors"
                        >
                          <span
                            className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold ${RESOURCE_BADGE[res.type]}`}
                          >
                            {res.type}
                          </span>
                          <span>{res.title}</span>
                          <span className="text-zinc-500 text-[10px]">
                            ({res.platform})
                          </span>
                          <ExternalLink className="h-3 w-3 text-zinc-500" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Phase Milestone Deliverable */}
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#F59E0B] mb-1">
                      <Award className="h-3.5 w-3.5" />
                      Phase Milestone Deliverable
                    </div>
                    <p className="text-xs text-zinc-200">
                      {phase.milestoneDeliverable}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
