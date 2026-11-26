import * as React from "react";
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Code2,
  ExternalLink,
  Flag,
  Search,
  Sparkles,
  StickyNote,
} from "lucide-react";
import {
  DSA_SHEET_CATEGORIES,
  type DsaSheetCategory,
  type DsaSheetProblemWithProgress,
  type DsaSheetStatus,
  type DsaSheetWalkthroughDto,
  type ProblemDifficulty,
  type SheetSourceTag,
  type SupportedCodeLanguage,
} from "@techquery/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CodeSyntaxBlock } from "@/components/ui/CodeSyntaxBlock";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import {
  useDsaSheetQuery,
  useGenerateDsaWalkthroughMutation,
  useUpdateDsaSheetProgressMutation,
} from "./dsaSheetApi";

const SOURCE_SHEETS: SheetSourceTag[] = [
  "Striver SDE",
  "Striver A2Z",
  "NeetCode 150",
  "Blind 75",
  "Grind 169",
  "Apna College",
];

const COMPANIES = [
  "Amazon",
  "Google",
  "Meta",
  "Microsoft",
  "Apple",
  "Uber",
  "Adobe",
  "LinkedIn",
  "Flipkart",
];

export interface DsaSheetViewProps {
  onSolveInArena: (arenaSlug: string) => void;
}

function nextStatus(current: DsaSheetStatus): DsaSheetStatus {
  if (current === "UNSOLVED") return "SOLVED";
  if (current === "SOLVED") return "REVISION";
  return "UNSOLVED";
}

export function DsaSheetView({ onSolveInArena }: DsaSheetViewProps) {
  const { toast } = useToast();
  const sheetQuery = useDsaSheetQuery();
  const updateProgress = useUpdateDsaSheetProgressMutation();
  const walkthroughMutation = useGenerateDsaWalkthroughMutation();

  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<
    DsaSheetCategory | "ALL"
  >("ALL");
  const [selectedSource, setSelectedSource] = React.useState<
    SheetSourceTag | "ALL"
  >("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<
    ProblemDifficulty | "ALL"
  >("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<
    DsaSheetStatus | "ALL"
  >("ALL");
  const [selectedCompany, setSelectedCompany] = React.useState<string>("ALL");

  const [expandedCategories, setExpandedCategories] = React.useState<
    Set<string>
  >(() => new Set(DSA_SHEET_CATEGORIES.slice(0, 3)));

  const [notesTarget, setNotesTarget] =
    React.useState<DsaSheetProblemWithProgress | null>(null);
  const [notesDraft, setNotesDraft] = React.useState("");

  const [walkthroughTarget, setWalkthroughTarget] =
    React.useState<DsaSheetProblemWithProgress | null>(null);
  const [walkthroughData, setWalkthroughData] =
    React.useState<DsaSheetWalkthroughDto | null>(null);
  const [walkthroughLang, setWalkthroughLang] =
    React.useState<SupportedCodeLanguage>("java");
  const [showBruteCode, setShowBruteCode] = React.useState(false);
  const [showOptimalCode, setShowOptimalCode] = React.useState(false);

  const summary = sheetQuery.data?.summary;
  const problems = sheetQuery.data?.problems ?? [];

  const filteredProblems = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return problems.filter((p) => {
      if (selectedCategory !== "ALL" && p.category !== selectedCategory)
        return false;
      if (
        selectedSource !== "ALL" &&
        !p.sourceSheets.includes(selectedSource)
      )
        return false;
      if (selectedDifficulty !== "ALL" && p.difficulty !== selectedDifficulty)
        return false;
      if (selectedStatus !== "ALL" && p.status !== selectedStatus)
        return false;
      if (selectedCompany !== "ALL" && !p.companies.includes(selectedCompany))
        return false;
      if (q) {
        const hay =
          `${p.title} ${p.subPattern} ${p.patternClue}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    problems,
    search,
    selectedCategory,
    selectedSource,
    selectedDifficulty,
    selectedStatus,
    selectedCompany,
  ]);

  const groupedProblems = React.useMemo(() => {
    const map = new Map<DsaSheetCategory, DsaSheetProblemWithProgress[]>();
    for (const cat of DSA_SHEET_CATEGORIES) {
      map.set(cat, []);
    }
    for (const p of filteredProblems) {
      map.get(p.category)?.push(p);
    }
    return DSA_SHEET_CATEGORIES.map((cat) => ({
      category: cat,
      items: map.get(cat) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [filteredProblems]);

  const toggleCategoryExpand = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedCategories(new Set(groupedProblems.map((g) => g.category)));
  };

  const handleCollapseAll = () => {
    setExpandedCategories(new Set());
  };

  const handleCycleStatus = (p: DsaSheetProblemWithProgress) => {
    const next = nextStatus(p.status);
    updateProgress.mutate({
      problemSlug: p.slug,
      status: next,
    });
  };

  const handleOpenNotes = (p: DsaSheetProblemWithProgress) => {
    setNotesTarget(p);
    setNotesDraft(p.notes || "");
  };

  const handleSaveNotes = async () => {
    if (!notesTarget) return;
    await updateProgress.mutateAsync({
      problemSlug: notesTarget.slug,
      status: notesTarget.status,
      notes: notesDraft,
    });
    toast({
      variant: "success",
      title: "Notes saved",
      description: notesTarget.title,
    });
    setNotesTarget(null);
  };

  const fetchWalkthrough = async (
    p: DsaSheetProblemWithProgress,
    lang: SupportedCodeLanguage
  ) => {
    setWalkthroughData(null);
    setShowBruteCode(false);
    setShowOptimalCode(false);
    try {
      const res = await walkthroughMutation.mutateAsync({
        problemSlug: p.slug,
        language: lang,
      });
      setWalkthroughData(res);
    } catch {
      toast({
        variant: "error",
        title: "AI Walkthrough unavailable",
        description: "Please try again in a moment.",
      });
    }
  };

  const handleOpenWalkthrough = async (p: DsaSheetProblemWithProgress) => {
    setWalkthroughTarget(p);
    await fetchWalkthrough(p, walkthroughLang);
  };

  const handleWalkthroughLangChange = async (lang: SupportedCodeLanguage) => {
    setWalkthroughLang(lang);
    if (walkthroughTarget) {
      await fetchWalkthrough(walkthroughTarget, lang);
    }
  };

  if (sheetQuery.isLoading) {
    return (
      <div className="rounded-xl border border-[#242429] bg-[#151518] p-8 text-center text-sm text-zinc-400">
        Loading 300-Problem Master DSA Pattern Sheet...
      </div>
    );
  }

  const totalCount = summary?.total ?? 0;
  const solvedCount = summary?.solved ?? 0;
  const completionPct =
    totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Mastery Telemetry Strip */}
      <Card className="border-[#242429] bg-[#151518]">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-[#10B981]" />
                <h2 className="text-lg font-bold text-white">
                  Master DSA Pattern Sheet ({totalCount} Problems)
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Synthesized across Blind 75, NeetCode 150, Grind 169, Striver
                SDE, Striver A2Z &amp; Apna College across all 22 core patterns.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <div className="rounded-lg border border-[#242429] bg-[#0F0F11] px-3 py-1.5">
                <span className="text-zinc-400">Solved: </span>
                <span className="font-bold text-[#10B981]">
                  {solvedCount}/{totalCount}
                </span>
                <span className="text-zinc-500 ml-1">({completionPct}%)</span>
              </div>
              <div className="rounded-lg border border-[#242429] bg-[#0F0F11] px-3 py-1.5 text-[#10B981]">
                Easy: {summary?.byDifficulty.EASY.solved ?? 0}/
                {summary?.byDifficulty.EASY.total ?? 0}
              </div>
              <div className="rounded-lg border border-[#242429] bg-[#0F0F11] px-3 py-1.5 text-amber-400">
                Med: {summary?.byDifficulty.MEDIUM.solved ?? 0}/
                {summary?.byDifficulty.MEDIUM.total ?? 0}
              </div>
              <div className="rounded-lg border border-[#242429] bg-[#0F0F11] px-3 py-1.5 text-red-400">
                Hard: {summary?.byDifficulty.HARD.solved ?? 0}/
                {summary?.byDifficulty.HARD.total ?? 0}
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-300">
                Revision: {summary?.revision ?? 0}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full rounded-full bg-[#0B0B0D] overflow-hidden border border-[#242429]">
            <div
              className="h-full bg-[#10B981] transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>

          {/* 22-Pattern Mastery Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                22 Core Patterns &amp; Topics (Click to Filter)
              </span>
              {selectedCategory !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className="text-xs text-[#10B981] hover:underline cursor-pointer"
                >
                  Reset Pattern Filter (All 22 Categories)
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {(summary?.byCategory ?? []).map((cat) => {
                const active = selectedCategory === cat.category;
                return (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(active ? "ALL" : cat.category);
                      setExpandedCategories(new Set([cat.category]));
                    }}
                    className={cn(
                      "rounded-lg border px-2.5 py-2 text-left transition-colors cursor-pointer",
                      active
                        ? "border-[#10B981] bg-[#10B981]/15"
                        : "border-[#242429] bg-[#0F0F11] hover:border-zinc-700"
                    )}
                  >
                    <div className="truncate text-[11px] font-medium text-white">
                      {cat.category}
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-zinc-400">
                      <span className="text-[#10B981]">{cat.solved}</span>/
                      {cat.total} solved
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rich Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[#242429] bg-[#151518] p-3.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problem, sub-pattern, or clue..."
            className="pl-9 h-9 bg-[#0F0F11]"
          />
        </div>

        <select
          aria-label="Filter by Source Sheet"
          value={selectedSource}
          onChange={(e) =>
            setSelectedSource(e.target.value as SheetSourceTag | "ALL")
          }
          className="h-9 rounded-lg border border-[#242429] bg-[#0F0F11] px-2.5 text-xs text-white"
        >
          <option value="ALL">All Sheets</option>
          {SOURCE_SHEETS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by Difficulty"
          value={selectedDifficulty}
          onChange={(e) =>
            setSelectedDifficulty(e.target.value as ProblemDifficulty | "ALL")
          }
          className="h-9 rounded-lg border border-[#242429] bg-[#0F0F11] px-2.5 text-xs text-white"
        >
          <option value="ALL">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        <select
          aria-label="Filter by Status"
          value={selectedStatus}
          onChange={(e) =>
            setSelectedStatus(e.target.value as DsaSheetStatus | "ALL")
          }
          className="h-9 rounded-lg border border-[#242429] bg-[#0F0F11] px-2.5 text-xs text-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="UNSOLVED">Unsolved</option>
          <option value="SOLVED">Solved</option>
          <option value="REVISION">Revision</option>
        </select>

        <select
          aria-label="Filter by Company"
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="h-9 rounded-lg border border-[#242429] bg-[#0F0F11] px-2.5 text-xs text-white"
        >
          <option value="ALL">All Companies</option>
          {COMPANIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleExpandAll}
          >
            Expand All
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCollapseAll}
          >
            Collapse All
          </Button>
        </div>

        {/* Active Filter Problem Count */}
        <div className="w-full flex flex-wrap items-center justify-between gap-2 border-t border-[#242429] pt-2.5 text-xs">
          <span className="font-mono text-zinc-400">
            {selectedCategory !== "ALL" ||
            selectedSource !== "ALL" ||
            selectedDifficulty !== "ALL" ||
            selectedStatus !== "ALL" ||
            selectedCompany !== "ALL" ||
            search.trim().length > 0 ? (
              <>
                Showing{" "}
                <span className="font-semibold text-[#10B981]">
                  {filteredProblems.length}
                </span>{" "}
                of {totalCount} problems
              </>
            ) : (
              <>
                Showing all{" "}
                <span className="font-semibold text-white">{totalCount}</span>{" "}
                problems across 22 categories
              </>
            )}
          </span>
          {(selectedCategory !== "ALL" ||
            selectedSource !== "ALL" ||
            selectedDifficulty !== "ALL" ||
            selectedStatus !== "ALL" ||
            selectedCompany !== "ALL" ||
            search.trim().length > 0) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("ALL");
                setSelectedSource("ALL");
                setSelectedDifficulty("ALL");
                setSelectedStatus("ALL");
                setSelectedCompany("ALL");
              }}
              className="text-xs text-zinc-400 hover:text-[#10B981] transition-colors cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Pattern Sections */}
      <div className="space-y-3">
        {groupedProblems.map((group) => {
          const isOpen = expandedCategories.has(group.category);
          const groupSolved = group.items.filter(
            (i) => i.status === "SOLVED"
          ).length;

          return (
            <div
              key={group.category}
              className="rounded-xl border border-[#242429] bg-[#151518] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleCategoryExpand(group.category)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#1B1B20] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">
                    {group.category}
                  </span>
                  <span className="font-mono text-xs text-zinc-400">
                    {groupSolved}/{group.items.length} solved
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                )}
              </button>

              {isOpen && (
                <div className="divide-y divide-[#242429] border-t border-[#242429]">
                  {group.items.map((p) => (
                    <div
                      key={p.slug}
                      className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 py-3 hover:bg-[#111114]"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleCycleStatus(p)}
                          title={`Status: ${p.status} (click to cycle)`}
                          className="mt-0.5 shrink-0 cursor-pointer"
                        >
                          {p.status === "SOLVED" ? (
                            <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                          ) : p.status === "REVISION" ? (
                            <Flag className="h-5 w-5 text-amber-400" />
                          ) : (
                            <Circle className="h-5 w-5 text-zinc-600 hover:text-zinc-400" />
                          )}
                        </button>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] text-zinc-500">
                              #{p.order}
                            </span>
                            <span className="text-sm font-semibold text-white">
                              {p.title}
                            </span>
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
                            <Badge variant="mono">{p.subPattern}</Badge>
                          </div>

                          <p className="text-xs text-zinc-400">
                            {p.patternClue}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {p.sourceSheets.map((src) => (
                              <span
                                key={src}
                                className="rounded bg-[#0B0B0D] border border-[#242429] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300"
                              >
                                {src}
                              </span>
                            ))}
                            {p.companies.slice(0, 3).map((comp) => (
                              <span
                                key={comp}
                                className="rounded bg-[#10B981]/5 border border-[#10B981]/20 px-1.5 py-0.5 text-[10px] text-[#10B981]"
                              >
                                {comp}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 pl-8 lg:pl-0">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenNotes(p)}
                          className={
                            p.notes
                              ? "border-amber-500/40 text-amber-300"
                              : undefined
                          }
                        >
                          <StickyNote className="h-3.5 w-3.5" />
                          Notes
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenWalkthrough(p)}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-[#10B981]" />
                          AI Guide
                        </Button>

                        {p.arenaSlug && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => onSolveInArena(p.arenaSlug!)}
                          >
                            <Code2 className="h-3.5 w-3.5" />
                            Solve in Arena
                          </Button>
                        )}

                        <a
                          href={p.leetcodeUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button type="button" size="sm" variant="ghost">
                            LeetCode
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {groupedProblems.length === 0 && (
          <div className="rounded-xl border border-[#242429] bg-[#151518] p-8 text-center text-sm text-zinc-400">
            No problems match your current filters.
          </div>
        )}
      </div>

      {/* Personal Notes Modal */}
      <Dialog
        open={notesTarget !== null}
        onClose={() => setNotesTarget(null)}
        title={notesTarget ? `Notes: ${notesTarget.title}` : "Notes"}
        description="Save intuition, complexity reminders, or edge-case traps."
        className="max-w-lg"
      >
        <div className="space-y-3">
          <textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="Write your approach notes or key invariant..."
            className="w-full rounded-lg border border-[#242429] bg-[#0B0B0D] p-3 text-xs text-white focus:border-[#10B981] focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNotesTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveNotes}
              isLoading={updateProgress.isPending}
            >
              Save Notes
            </Button>
          </div>
        </div>
      </Dialog>

      {/* AI Walkthrough Drawer */}
      <Drawer
        open={walkthroughTarget !== null}
        onClose={() => setWalkthroughTarget(null)}
        title={walkthroughTarget?.title ?? "AI Walkthrough"}
        description={
          walkthroughTarget
            ? `${walkthroughTarget.category} · ${walkthroughTarget.subPattern}`
            : undefined
        }
      >
        <div className="space-y-4 text-xs leading-relaxed">
          {/* Language Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#242429] bg-[#0B0B0D] p-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-1.5">
              Reference Language
            </span>
            <div className="flex items-center gap-1">
              {(
                [
                  { value: "java", label: "Java" },
                  { value: "python", label: "Python" },
                  { value: "cpp", label: "C++" },
                  { value: "javascript", label: "JavaScript" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => void handleWalkthroughLangChange(opt.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors cursor-pointer",
                    walkthroughLang === opt.value
                      ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {walkthroughMutation.isPending ? (
            <div className="rounded-lg border border-[#242429] bg-[#0B0B0D] p-4 text-xs text-zinc-400">
              Generating structured AI pattern walkthrough...
            </div>
          ) : walkthroughData ? (
            <>
              {/* 1. Problem Explanation & Intuition */}
              <div className="rounded-lg border border-[#242429] bg-[#0B0B0D] p-3.5 space-y-2.5">
                <div className="font-semibold text-[#10B981] uppercase tracking-wider text-[10px]">
                  Problem Explanation &amp; Pattern Intuition
                </div>
                <p className="text-zinc-200">
                  {walkthroughData.problemExplanation}
                </p>
                <div className="border-t border-[#242429] pt-2 text-zinc-400">
                  <span className="font-semibold text-zinc-300">
                    Pattern Intuition:{" "}
                  </span>
                  {walkthroughData.patternRecognition}
                </div>
              </div>

              {/* 2. Brute Force Approach + Collapsible Code */}
              <div className="rounded-lg border border-[#242429] bg-[#0B0B0D] p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-amber-400 uppercase tracking-wider text-[10px]">
                    Brute Force Approach
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <Badge variant="amber">
                      Time: {walkthroughData.bruteForceComplexity.time}
                    </Badge>
                    <Badge variant="neutral">
                      Space: {walkthroughData.bruteForceComplexity.space}
                    </Badge>
                  </div>
                </div>
                <p className="text-zinc-300">
                  {walkthroughData.bruteForceApproach}
                </p>

                <button
                  type="button"
                  onClick={() => setShowBruteCode((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#242429] bg-[#151518] px-2.5 py-1.5 font-mono text-[11px] text-zinc-300 hover:border-zinc-600 cursor-pointer"
                >
                  <Code2 className="h-3.5 w-3.5 text-amber-400" />
                  {showBruteCode
                    ? "Hide Brute Force Code"
                    : "View Brute Force Code"}
                  {showBruteCode ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>

                {showBruteCode && (
                  <CodeSyntaxBlock
                    code={walkthroughData.bruteForceCode}
                    language={walkthroughLang}
                  />
                )}
              </div>

              {/* 3. Optimal Approach + Collapsible Code */}
              <div className="rounded-lg border border-[#10B981]/30 bg-[#10B981]/5 p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-[#10B981] uppercase tracking-wider text-[10px]">
                    Optimal Approach
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <Badge variant="emerald">
                      Time: {walkthroughData.optimalComplexity.time}
                    </Badge>
                    <Badge variant="neutral">
                      Space: {walkthroughData.optimalComplexity.space}
                    </Badge>
                  </div>
                </div>
                <p className="text-zinc-200">
                  {walkthroughData.optimalApproach}
                </p>

                <button
                  type="button"
                  onClick={() => setShowOptimalCode((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#10B981]/40 bg-[#151518] px-2.5 py-1.5 font-mono text-[11px] text-[#10B981] hover:bg-[#10B981]/10 cursor-pointer"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  {showOptimalCode
                    ? "Hide Optimal Code"
                    : "View Optimal Code"}
                  {showOptimalCode ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>

                {showOptimalCode && (
                  <CodeSyntaxBlock
                    code={walkthroughData.optimalCode}
                    language={walkthroughLang}
                  />
                )}
              </div>

              {/* 4. Edge Cases & Interview Pitfalls */}
              <div className="rounded-lg border border-[#242429] bg-[#0B0B0D] p-3.5 space-y-1.5">
                <div className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                  Edge Cases &amp; Interview Pitfalls
                </div>
                <ul className="space-y-1 text-zinc-300">
                  {walkthroughData.edgeCases.map((ec, i) => (
                    <li key={i}>• {ec}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </div>
      </Drawer>
    </div>
  );
}
