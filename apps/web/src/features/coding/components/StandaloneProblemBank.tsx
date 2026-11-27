import * as React from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  Code2,
  Filter,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  DSA_SHEET_CATEGORIES,
  DSA_SHEET_PROBLEMS,
  type CodingProblemDto,
  type ProblemDifficulty,
} from "@techquery/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useDsaSheetQuery } from "@/features/dsa-sheet/dsaSheetApi";

export interface StandaloneProblemBankProps {
  problems: CodingProblemDto[];
  isLoading?: boolean;
  onSelectProblem: (problem: CodingProblemDto) => void;
  onGenerateProblem: () => void;
  isGenerating?: boolean;
}

// Clean pattern lookup helper
const SLUG_TO_CATEGORY_MAP = new Map<string, string>();
for (const p of DSA_SHEET_PROBLEMS) {
  SLUG_TO_CATEGORY_MAP.set(p.slug, p.category.replace(/^\d+\.\s*/, ""));
}

const FALLBACK_PATTERN_LABELS: Record<string, string> = {
  ALL_PATTERNS: "General Practice",
  ARRAYS_TWO_POINTERS: "Arrays & Two Pointers",
  SLIDING_WINDOW: "Sliding Window",
  BINARY_SEARCH: "Binary Search",
  TREES_GRAPHS: "Trees & Graphs",
  DYNAMIC_PROGRAMMING: "Dynamic Programming",
  STACK_HEAP: "Stack & Heap",
};

const CATEGORY_ORDER: string[] = DSA_SHEET_CATEGORIES.map((cat) =>
  cat.replace(/^\d+\.\s*/, "")
);

function getProblemCategory(problem: CodingProblemDto): string {
  const mapped = SLUG_TO_CATEGORY_MAP.get(problem.slug);
  if (mapped) return mapped;
  return FALLBACK_PATTERN_LABELS[problem.pattern] ?? "General Practice";
}

export function StandaloneProblemBank({
  problems,
  isLoading = false,
  onSelectProblem,
  onGenerateProblem,
  isGenerating = false,
}: StandaloneProblemBankProps) {
  const dsaSheetQuery = useDsaSheetQuery();

  // Solved & Attempted problems sets from database telemetry
  const { solvedSlugs, attemptedSlugs } = React.useMemo(() => {
    const solved = new Set<string>();
    const attempted = new Set<string>();
    const dsaProblems = dsaSheetQuery.data?.problems ?? [];
    for (const p of dsaProblems) {
      if (p.status === "SOLVED") {
        solved.add(p.slug);
      }
    }
    for (const p of problems) {
      if (p.userStatus === "SOLVED") {
        solved.add(p.slug);
      } else if (p.userStatus === "ATTEMPTED" && !solved.has(p.slug)) {
        attempted.add(p.slug);
      }
    }
    return { solvedSlugs: solved, attemptedSlugs: attempted };
  }, [dsaSheetQuery.data, problems]);

  // Filters state
  const [search, setSearch] = React.useState("");
  const [difficultyFilter, setDifficultyFilter] = React.useState<
    ProblemDifficulty | "ALL"
  >("ALL");
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "UNSOLVED" | "SOLVED"
  >("ALL");
  const [patternFilter, setPatternFilter] = React.useState<string>("ALL");

  // Track expanded category groups
  const [expandedCategories, setExpandedCategories] = React.useState<
    Set<string>
  >(() => {
    // Default: first 3 categories expanded
    return new Set(CATEGORY_ORDER.slice(0, 3));
  });

  // Calculate pattern groups
  const { patternGroups, totalFilteredCount, allPatternNames } = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    // Group all problems by clean category
    const map = new Map<string, CodingProblemDto[]>();

    for (const p of problems) {
      // 1. Search text filter
      if (q) {
        const titleMatch = p.title.toLowerCase().includes(q);
        const slugMatch = p.slug.toLowerCase().includes(q);
        const categoryMatch = getProblemCategory(p).toLowerCase().includes(q);
        if (!titleMatch && !slugMatch && !categoryMatch) continue;
      }

      // 2. Difficulty filter
      if (difficultyFilter !== "ALL" && p.difficulty !== difficultyFilter) {
        continue;
      }

      // 3. Status filter
      const isSolved = solvedSlugs.has(p.slug);
      if (statusFilter === "SOLVED" && !isSolved) continue;
      if (statusFilter === "UNSOLVED" && isSolved) continue;

      // 4. Pattern filter
      const cat = getProblemCategory(p);
      if (patternFilter !== "ALL" && cat !== patternFilter) {
        continue;
      }

      const list = map.get(cat) ?? [];
      list.push(p);
      map.set(cat, list);
    }

    // Sort categories according to the canonical DSA sheet order
    const sortedGroups: Array<{
      category: string;
      problems: CodingProblemDto[];
      solvedCount: number;
    }> = [];

    const seenCategories = new Set<string>();

    for (const cat of CATEGORY_ORDER) {
      const items = map.get(cat);
      if (items && items.length > 0) {
        seenCategories.add(cat);
        const solvedCount = items.filter((item) =>
          solvedSlugs.has(item.slug)
        ).length;
        sortedGroups.push({
          category: cat,
          problems: items,
          solvedCount,
        });
      }
    }

    // Add any non-standard categories that had matching problems
    for (const [cat, items] of map.entries()) {
      if (!seenCategories.has(cat) && items.length > 0) {
        const solvedCount = items.filter((item) =>
          solvedSlugs.has(item.slug)
        ).length;
        sortedGroups.push({
          category: cat,
          problems: items,
          solvedCount,
        });
      }
    }

    // List of all present categories across the entire problem set
    const allNamesSet = new Set<string>();
    for (const p of problems) {
      allNamesSet.add(getProblemCategory(p));
    }
    const allNames = CATEGORY_ORDER.filter((cat) => allNamesSet.has(cat));

    let filteredTotal = 0;
    for (const g of sortedGroups) {
      filteredTotal += g.problems.length;
    }

    return {
      patternGroups: sortedGroups,
      totalFilteredCount: filteredTotal,
      allPatternNames: allNames,
    };
  }, [
    problems,
    search,
    difficultyFilter,
    statusFilter,
    patternFilter,
    solvedSlugs,
  ]);

  // When searching or filtering, auto-expand matching categories
  React.useEffect(() => {
    if (
      search.trim() ||
      difficultyFilter !== "ALL" ||
      statusFilter !== "ALL" ||
      patternFilter !== "ALL"
    ) {
      setExpandedCategories(new Set(patternGroups.map((g) => g.category)));
    }
  }, [search, difficultyFilter, statusFilter, patternFilter, patternGroups]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedCategories(new Set(patternGroups.map((g) => g.category)));
  };

  const handleCollapseAll = () => {
    setExpandedCategories(new Set());
  };

  const isAllExpanded =
    patternGroups.length > 0 &&
    patternGroups.every((g) => expandedCategories.has(g.category));

  const totalSolvedAcrossBank = React.useMemo(() => {
    return problems.filter((p) => solvedSlugs.has(p.slug)).length;
  }, [problems, solvedSlugs]);

  const hasActiveFilters =
    Boolean(search) ||
    difficultyFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    patternFilter !== "ALL";

  const handleClearFilters = () => {
    setSearch("");
    setDifficultyFilter("ALL");
    setStatusFilter("ALL");
    setPatternFilter("ALL");
  };

  return (
    <div className="space-y-3.5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242429] pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]">
            <Code2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">
                Standalone Problem Bank
              </h2>
              <span className="font-mono text-xs text-zinc-400">
                ({problems.length} runnable problems)
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {totalSolvedAcrossBank} of {problems.length} solved · Single-batch 20-testcase runner
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={isAllExpanded ? handleCollapseAll : handleExpandAll}
            className="h-8 border-[#242429] bg-[#151518] text-xs text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            {isAllExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                Expand All
              </>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onGenerateProblem}
            isLoading={isGenerating}
            className="h-8 border-[#10B981]/40 bg-[#10B981]/10 text-xs text-[#10B981] hover:bg-[#10B981]/20 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate AI DSA Problem
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#242429] bg-[#151518] p-2.5">
        <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${problems.length} runnable problems...`}
              className="h-8 w-full rounded-lg border border-[#242429] bg-[#0F0F11] pl-8 pr-7 text-xs text-white placeholder-zinc-500 focus:border-[#10B981] focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Difficulty Pills */}
          <div className="flex items-center gap-1 rounded-lg border border-[#242429] bg-[#0F0F11] p-0.5">
            {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((diff) => {
              const isActive = difficultyFilter === diff;
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficultyFilter(diff)}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-mono text-[11px] font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-[#242429] text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {diff === "ALL" ? "All" : diff.charAt(0) + diff.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 rounded-lg border border-[#242429] bg-[#0F0F11] p-0.5">
            {(["ALL", "UNSOLVED", "SOLVED"] as const).map((st) => {
              const isActive = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-mono text-[11px] font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-[#242429] text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {st === "ALL" ? "All Status" : st === "SOLVED" ? "Solved" : "Unsolved"}
                </button>
              );
            })}
          </div>

          {/* Pattern Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Filter by DSA pattern"
              value={patternFilter}
              onChange={(e) => setPatternFilter(e.target.value)}
              className="h-8 rounded-lg border border-[#242429] bg-[#0F0F11] px-2.5 font-mono text-xs text-zinc-300 focus:border-[#10B981] focus:outline-none"
            >
              <option value="ALL">All Patterns</option>
              {allPatternNames.map((pat) => (
                <option key={pat} value={pat}>
                  {pat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters (if active) */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            <X className="h-3 w-3" />
            Reset ({totalFilteredCount} match)
          </button>
        )}
      </div>

      {/* Accordion Pattern Sections */}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-[#242429] bg-[#151518] py-16">
          <div className="text-center space-y-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#10B981] border-t-transparent mx-auto" />
            <p className="font-mono text-xs text-zinc-400">Loading problem bank...</p>
          </div>
        </div>
      ) : patternGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#242429] bg-[#151518] p-8 text-center space-y-3">
          <Filter className="h-8 w-8 text-zinc-600" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">No problems found</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              No runnable problems match your current search and filter combination.
            </p>
          </div>
          {hasActiveFilters && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleClearFilters}
              className="border-[#242429] text-xs"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {patternGroups.map((group) => {
            const isExpanded = expandedCategories.has(group.category);
            const totalInGroup = group.problems.length;
            const solvedInGroup = group.solvedCount;
            const pct = totalInGroup > 0 ? Math.round((solvedInGroup / totalInGroup) * 100) : 0;

            return (
              <div
                key={group.category}
                className="rounded-xl border border-[#242429] bg-[#151518] overflow-hidden transition-colors hover:border-[#2f2f36]"
              >
                {/* Pattern Header Bar */}
                <button
                  type="button"
                  onClick={() => toggleCategory(group.category)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left bg-[#151518] hover:bg-[#1B1B20] transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-white truncate">
                      {group.category}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400 shrink-0">
                      ({totalInGroup} {totalInGroup === 1 ? "problem" : "problems"})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Mini Progress Bar */}
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-20 md:w-28 h-1.5 bg-[#242429] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#10B981] transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <span
                      className={cn(
                        "font-mono text-xs px-2 py-0.5 rounded border",
                        solvedInGroup === totalInGroup && totalInGroup > 0
                          ? "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30 font-semibold"
                          : solvedInGroup > 0
                            ? "text-zinc-300 bg-[#242429] border-[#2f2f36]"
                            : "text-zinc-500 bg-[#1A1A1E] border-[#242429]"
                      )}
                    >
                      {solvedInGroup} / {totalInGroup} Solved
                    </span>
                  </div>
                </button>

                {/* Problems Table Inside Pattern */}
                {isExpanded && (
                  <div className="divide-y divide-[#242429] border-t border-[#242429]">
                    {group.problems.map((p) => {
                      const isSolved = solvedSlugs.has(p.slug);
                      const isAttempted = !isSolved && attemptedSlugs.has(p.slug);

                      return (
                        <div
                          key={p.id}
                          onClick={() => onSelectProblem(p)}
                          className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[#1A1A20] transition-colors cursor-pointer group"
                        >
                          {/* Left: Status + Title */}
                          <div className="flex items-center gap-3 min-w-0">
                            {isSolved ? (
                              <span title="Solved" className="shrink-0">
                                <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                              </span>
                            ) : isAttempted ? (
                              <span
                                title="Attempted"
                                aria-label="Attempted"
                                className="shrink-0 text-sm leading-none text-amber-400 font-semibold w-4 text-center"
                              >
                                ◐
                              </span>
                            ) : (
                              <span title="Unsolved" className="shrink-0">
                                <Circle className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                              </span>
                            )}

                            <span className="text-sm font-medium text-white group-hover:text-[#10B981] transition-colors truncate">
                              {p.title}
                            </span>
                          </div>

                          {/* Right: Difficulty + Tests Badge + Action */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            {/* Difficulty */}
                            <Badge
                              variant={
                                p.difficulty === "EASY"
                                  ? "emerald"
                                  : p.difficulty === "MEDIUM"
                                    ? "amber"
                                    : "danger"
                              }
                              className="text-[10px] px-2 py-0.5"
                            >
                              {p.difficulty}
                            </Badge>

                            {/* Test Suite Badge */}
                            <span className="hidden sm:inline-flex items-center font-mono text-[10px] text-zinc-400 bg-[#151518] border border-[#242429] px-2 py-0.5 rounded">
                              20 tests
                            </span>

                            {/* Action Button */}
                            <Button
                              type="button"
                              size="sm"
                              variant={isSolved ? "ghost" : "outline"}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectProblem(p);
                              }}
                              className={cn(
                                "h-7 text-xs px-2.5 font-medium shrink-0 cursor-pointer",
                                isSolved
                                  ? "text-[#10B981] hover:bg-[#10B981]/10 hover:text-[#10B981]"
                                  : "border-[#242429] text-zinc-200 hover:border-[#10B981] hover:text-[#10B981]"
                              )}
                            >
                              {isSolved ? "Solved · Review →" : "Solve →"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
