import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Filter,
  Layers,
  Lightbulb,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  CS_SUBJECTS,
  type CsSubject,
  type CsTopicPriority,
  type CsTopicStatus,
  type CsTopicWithProgress,
  type CsWalkthroughDto,
} from "@techquery/shared";
import {
  fetchCsFundamentalsApi,
  generateCsWalkthroughApi,
  updateCsProgressApi,
} from "./csFundamentalsApi";
import { CodeSyntaxBlock } from "@/components/ui/CodeSyntaxBlock";
import { useToast } from "@/components/ui/toast";

const COMPANIES = [
  "Amazon",
  "Google",
  "Meta",
  "Microsoft",
  "Oracle",
  "Uber",
  "Stripe",
  "Cisco",
  "Flipkart",
  "Cloudflare",
];

const PRIORITY_STYLE: Record<
  CsTopicPriority,
  { label: string; className: string }
> = {
  MUST_KNOW: {
    label: "Must Know",
    className: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30",
  },
  IMPORTANT: {
    label: "Important",
    className: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30",
  },
  ADVANCED: {
    label: "Advanced",
    className: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  },
};

function nextStatus(curr: CsTopicStatus): CsTopicStatus {
  if (curr === "UNSTUDIED") return "LEARNED";
  if (curr === "LEARNED") return "REVISION";
  return "UNSTUDIED";
}

function StatusButton({
  status,
  onClick,
  disabled,
}: {
  status: CsTopicStatus;
  onClick: () => void;
  disabled?: boolean;
}) {
  if (status === "LEARNED") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title="Learned — click to mark for Revision"
        className="inline-flex items-center gap-1.5 rounded-md border border-[#10B981]/40 bg-[#10B981]/15 px-2.5 py-1 font-mono text-[11px] font-medium text-[#10B981] hover:bg-[#10B981]/25 transition-colors cursor-pointer"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Learned
      </button>
    );
  }
  if (status === "REVISION") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title="Marked for Revision — click to reset"
        className="inline-flex items-center gap-1.5 rounded-md border border-[#F59E0B]/40 bg-[#F59E0B]/15 px-2.5 py-1 font-mono text-[11px] font-medium text-[#F59E0B] hover:bg-[#F59E0B]/25 transition-colors cursor-pointer"
      >
        <Clock className="h-3.5 w-3.5" />
        Revision
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title="Unstudied — click to mark Learned"
      className="inline-flex items-center gap-1.5 rounded-md border border-[#242429] bg-[#0F0F11] px-2.5 py-1 font-mono text-[11px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
    >
      <Circle className="h-3.5 w-3.5" />
      Unstudied
    </button>
  );
}

export function CsFundamentalsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchAllSubjects, setSearchAllSubjects] = React.useState(false);
  const [selectedSubject, setSelectedSubject] = React.useState<CsSubject>(
    CS_SUBJECTS[0]
  );
  const [selectedPriority, setSelectedPriority] = React.useState<
    CsTopicPriority | "ALL"
  >("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<
    CsTopicStatus | "ALL"
  >("ALL");
  const [selectedCompany, setSelectedCompany] = React.useState<string>("ALL");

  const [notesTarget, setNotesTarget] =
    React.useState<CsTopicWithProgress | null>(null);
  const [notesDraft, setNotesDraft] = React.useState("");

  const [walkthroughTarget, setWalkthroughTarget] =
    React.useState<CsTopicWithProgress | null>(null);
  const [walkthroughData, setWalkthroughData] =
    React.useState<CsWalkthroughDto | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["cs-fundamentals"],
    queryFn: fetchCsFundamentalsApi,
  });

  const progressMutation = useMutation({
    mutationFn: ({
      topicSlug,
      status,
      notes,
    }: {
      topicSlug: string;
      status?: CsTopicStatus;
      notes?: string | null;
    }) => updateCsProgressApi(topicSlug, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cs-fundamentals"] });
    },
    onError: () => {
      toast({
        variant: "error",
        title: "Save Failed",
        description: "Could not save CS Fundamentals progress.",
      });
    },
  });

  const walkthroughMutation = useMutation({
    mutationFn: (topicSlug: string) => generateCsWalkthroughApi(topicSlug),
    onSuccess: (dto) => {
      setWalkthroughData(dto);
    },
    onError: () => {
      toast({
        variant: "error",
        title: "AI Guide Error",
        description: "Could not generate CS topic walkthrough.",
      });
    },
  });

  const summary = data?.summary;
  const topics = data?.topics ?? [];

  const filteredTopics = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const isGlobalSearch = Boolean(q && searchAllSubjects);
    return topics.filter((item) => {
      if (!isGlobalSearch && item.subject !== selectedSubject) {
        return false;
      }
      if (selectedPriority !== "ALL" && item.priority !== selectedPriority) {
        return false;
      }
      if (selectedStatus !== "ALL" && item.status !== selectedStatus) {
        return false;
      }
      if (
        selectedCompany !== "ALL" &&
        !item.companies.includes(selectedCompany)
      ) {
        return false;
      }
      if (q) {
        const hay =
          `${item.title} ${item.subTopic} ${item.oneLineHook} ${item.companies.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    topics,
    searchQuery,
    searchAllSubjects,
    selectedSubject,
    selectedPriority,
    selectedStatus,
    selectedCompany,
  ]);

  const groupedTopics = React.useMemo(() => {
    const map = new Map<CsSubject, CsTopicWithProgress[]>();
    for (const s of CS_SUBJECTS) {
      map.set(s, []);
    }
    for (const item of filteredTopics) {
      map.get(item.subject)?.push(item);
    }
    return CS_SUBJECTS.map((s) => ({
      subject: s,
      items: map.get(s) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [filteredTopics]);

  const handleOpenNotes = (item: CsTopicWithProgress) => {
    setNotesTarget(item);
    setNotesDraft(item.notes ?? "");
  };

  const handleSaveNotes = () => {
    if (!notesTarget) return;
    progressMutation.mutate(
      {
        topicSlug: notesTarget.slug,
        notes: notesDraft.trim() ? notesDraft.trim() : null,
      },
      {
        onSuccess: () => {
          toast({
            variant: "success",
            title: "Notes Saved",
            description: `Updated notes for ${notesTarget.title}.`,
          });
          setNotesTarget(null);
        },
      }
    );
  };

  const handleOpenWalkthrough = (item: CsTopicWithProgress) => {
    setWalkthroughTarget(item);
    setWalkthroughData(null);
    walkthroughMutation.mutate(item.slug);
  };

  const hasActiveFilters =
    selectedPriority !== "ALL" ||
    selectedStatus !== "ALL" ||
    selectedCompany !== "ALL" ||
    searchQuery.trim() !== "";

  const resetFilters = () => {
    setSearchQuery("");
    setSearchAllSubjects(false);
    setSelectedPriority("ALL");
    setSelectedStatus("ALL");
    setSelectedCompany("ALL");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#242429] bg-[#151518] py-16 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin text-[#10B981] mb-3" />
        <p className="font-mono text-xs">
          Loading CS Core &amp; System Design Mastery Sheet...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-300">
        Failed to load CS Fundamentals Sheet. Please refresh and try again.
      </div>
    );
  }

  const totalCount = summary?.total ?? 0;
  const learnedCount = summary?.learned ?? 0;

  return (
    <div className="space-y-4">
      {/* ── Compact Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#10B981]" />
          <h1 className="text-lg font-bold text-white">
            CS Core &amp; System Design
          </h1>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded-full border border-[#242429] bg-[#151518] px-3 py-1 text-zinc-300">
            <span className="font-semibold text-[#10B981]">
              {learnedCount} / {totalCount}
            </span>{" "}
            Learned
          </span>
          {(summary?.revision ?? 0) > 0 && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-300">
              {summary?.revision} Revision
            </span>
          )}
        </div>
      </div>

      {/* ── 6 Exclusive Subject Tabs ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {(summary?.subjects ?? []).map((sub) => {
          const active = selectedSubject === sub.subject;
          const pct =
            sub.total > 0 ? Math.round((sub.learned / sub.total) * 100) : 0;
          return (
            <button
              key={sub.subject}
              type="button"
              onClick={() => setSelectedSubject(sub.subject)}
              className={`rounded-lg border p-3 text-left transition-all cursor-pointer ${
                active
                  ? "border-emerald-500/60 bg-emerald-500/10"
                  : "border-[#242429] bg-[#151518] hover:border-zinc-600"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-zinc-200 truncate">
                  {sub.subject}
                </span>
                <span className="font-mono text-[10px] text-[#10B981] shrink-0">
                  {sub.learned}/{sub.total}
                </span>
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#0F0F11]">
                <div
                  className="h-full bg-[#10B981]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[#242429] bg-[#151518] p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search CS topics, sub-topics, keywords, or companies..."
            className="w-full rounded-lg border border-[#242429] bg-[#0F0F11] pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-[#10B981] focus:outline-none"
          />
        </div>

        <select
          aria-label="Filter by priority"
          value={selectedPriority}
          onChange={(e) =>
            setSelectedPriority(e.target.value as CsTopicPriority | "ALL")
          }
          className="rounded-lg border border-[#242429] bg-[#0F0F11] px-2.5 py-1.5 font-mono text-xs text-zinc-200 focus:border-[#10B981] focus:outline-none"
        >
          <option value="ALL">All Priorities</option>
          <option value="MUST_KNOW">Must Know</option>
          <option value="IMPORTANT">Important</option>
          <option value="ADVANCED">Advanced</option>
        </select>

        <select
          aria-label="Filter by status"
          value={selectedStatus}
          onChange={(e) =>
            setSelectedStatus(e.target.value as CsTopicStatus | "ALL")
          }
          className="rounded-lg border border-[#242429] bg-[#0F0F11] px-2.5 py-1.5 font-mono text-xs text-zinc-200 focus:border-[#10B981] focus:outline-none"
        >
          <option value="ALL">All Status</option>
          <option value="UNSTUDIED">Unstudied</option>
          <option value="LEARNED">Learned</option>
          <option value="REVISION">Revision</option>
        </select>

        <select
          aria-label="Filter by company"
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="rounded-lg border border-[#242429] bg-[#0F0F11] px-2.5 py-1.5 font-mono text-xs text-zinc-200 focus:border-[#10B981] focus:outline-none"
        >
          <option value="ALL">All Companies</option>
          {COMPANIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 rounded-lg border border-[#242429] bg-[#0F0F11] px-2.5 py-1.5 font-mono text-xs text-zinc-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* ── Active Filter Count Banner ─────────────────────────────────────── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#242429] bg-[#151518] px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#10B981]/30 bg-[#10B981]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#10B981]">
              <Filter className="h-3 w-3" />
              Showing {filteredTopics.length}
              {filteredTopics.length === 1 ? " topic" : " topics"}
            </span>
            <span className="text-zinc-500 font-mono text-[11px]">
              {searchQuery.trim() && searchAllSubjects
                ? `across all ${CS_SUBJECTS.length} subjects`
                : `in ${selectedSubject}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {searchQuery.trim() !== "" && (
              <button
                type="button"
                onClick={() => setSearchAllSubjects((prev) => !prev)}
                className="font-mono text-[11px] text-zinc-300 hover:text-white underline-offset-2 hover:underline cursor-pointer"
              >
                {searchAllSubjects
                  ? `Restrict to ${selectedSubject}`
                  : `Search all ${CS_SUBJECTS.length} subjects`}
              </button>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="font-mono text-[11px] text-[#10B981] hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* ── Subject Accordion / Topic Table ────────────────────────────────── */}
      <div className="space-y-5">
        {groupedTopics.map((group) => {
          const subjectSummary = summary?.subjects.find(
            (s) => s.subject === group.subject
          );
          return (
            <div
              key={group.subject}
              className="rounded-xl border border-[#242429] bg-[#151518] overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[#242429] bg-[#121215] px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="h-4 w-4 text-[#10B981]" />
                  <h2 className="text-sm font-bold text-white">
                    {group.subject}
                  </h2>
                  <span className="rounded bg-[#0F0F11] border border-[#242429] px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                    {group.items.length} topics
                  </span>
                </div>
                {subjectSummary && (
                  <span className="font-mono text-xs text-[#10B981]">
                    {subjectSummary.learned}/{subjectSummary.total} learned
                  </span>
                )}
              </div>

              <div className="divide-y divide-[#242429]/70">
                {group.items.map((item) => {
                  const priorityMeta = PRIORITY_STYLE[item.priority];
                  return (
                    <div
                      key={item.slug}
                      className="flex flex-col gap-3 px-4 py-3 hover:bg-[#1A1A1F] transition-colors lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="font-mono text-xs text-zinc-500 w-7 shrink-0 pt-0.5">
                          #{item.order}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-100">
                              {item.title}
                            </span>
                            <span
                              className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium ${priorityMeta.className}`}
                            >
                              {priorityMeta.label}
                            </span>
                            <span className="rounded bg-[#0F0F11] border border-[#242429] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                              {item.subTopic}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-400 mt-1">
                            {item.oneLineHook}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {item.companies.slice(0, 3).map((comp) => (
                              <span
                                key={comp}
                                className="inline-flex items-center gap-1 rounded bg-[#0F0F11] border border-[#242429] px-1.5 py-0.5 text-[10px] text-zinc-400"
                              >
                                <Building2 className="h-2.5 w-2.5 text-zinc-500" />
                                {comp}
                              </span>
                            ))}
                            {item.notes && (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[10px] text-amber-300">
                                <FileText className="h-2.5 w-2.5" />
                                Has Notes
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 pl-10 lg:pl-0">
                        <StatusButton
                          status={item.status}
                          disabled={progressMutation.isPending}
                          onClick={() =>
                            progressMutation.mutate({
                              topicSlug: item.slug,
                              status: nextStatus(item.status),
                            })
                          }
                        />

                        <button
                          type="button"
                          onClick={() => handleOpenNotes(item)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#242429] bg-[#0F0F11] px-2.5 py-1 font-mono text-[11px] text-zinc-300 hover:border-zinc-500 cursor-pointer"
                        >
                          <FileText className="h-3 w-3" />
                          Notes
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenWalkthrough(item)}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] text-[#10B981] hover:bg-emerald-500/20 cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3" />
                          AI Guide
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {groupedTopics.length === 0 && (
          <div className="rounded-xl border border-[#242429] bg-[#151518] p-10 text-center text-sm text-zinc-400">
            No CS topics match your current filters.
          </div>
        )}
      </div>

      {/* ── Notes Modal ────────────────────────────────────────────────────── */}
      {notesTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#242429] bg-[#151518] p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">
                Notes — {notesTarget.title}
              </h3>
              <button
                type="button"
                onClick={() => setNotesTarget(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              rows={6}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Write your revision notes, key formulas, SQL tricks, or trade-offs..."
              className="w-full rounded-lg border border-[#242429] bg-[#0F0F11] p-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-[#10B981] focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNotesTarget(null)}
                className="rounded-lg border border-[#242429] px-3 py-1.5 font-mono text-xs text-zinc-300 hover:bg-[#1E1E24] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={progressMutation.isPending}
                className="rounded-lg bg-[#10B981] px-4 py-1.5 font-mono text-xs font-semibold text-black hover:bg-[#0ea572] cursor-pointer"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Guide Slide-Over Drawer ─────────────────────────────────────── */}
      {walkthroughTarget && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70">
          <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-[#242429] bg-[#151518] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#242429] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#10B981]" />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#10B981]">
                    CS Deep-Dive AI Guide
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {walkthroughTarget.title}
                </h3>
                <p className="font-mono text-xs text-zinc-400">
                  {walkthroughTarget.subject} · {walkthroughTarget.subTopic}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close AI Guide"
                onClick={() => setWalkthroughTarget(null)}
                className="rounded-lg border border-[#242429] p-1.5 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {walkthroughMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                <Loader2 className="h-6 w-6 animate-spin text-[#10B981] mb-3" />
                <p className="font-mono text-xs">
                  Generating deep-dive breakdown, example &amp; interview
                  Q&amp;As...
                </p>
              </div>
            )}

            {walkthroughData && (
              <div className="mt-5 space-y-5 text-xs leading-relaxed">
                <div className="rounded-lg border border-[#242429] bg-[#0F0F11] p-4">
                  <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#10B981] mb-1.5">
                    Concept Breakdown
                  </h4>
                  <p className="text-zinc-200 whitespace-pre-line">
                    {walkthroughData.conceptBreakdown}
                  </p>
                </div>

                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#F59E0B] mb-1.5">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Real-World Analogy
                  </div>
                  <p className="text-zinc-300">
                    {walkthroughData.realWorldAnalogy}
                  </p>
                </div>

                {walkthroughData.visualType === "CODE" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                        {walkthroughData.visualTitle} (
                        {walkthroughData.exampleLanguage.toUpperCase()})
                      </h4>
                    </div>
                    <CodeSyntaxBlock
                      code={walkthroughData.codeOrQueryExample}
                      language={walkthroughData.exampleLanguage}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#242429] bg-[#0D0E12] p-4 space-y-3">
                    <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#10B981]">
                      {walkthroughData.visualTitle}
                    </h4>
                    <pre className="whitespace-pre overflow-x-auto font-mono text-xs text-emerald-300/90 leading-relaxed">
                      {walkthroughData.diagramFlow
                        .replace(/\\r\\n/g, "\n")
                        .replace(/\\n/g, "\n")
                        .replace(/\\t/g, "    ")
                        .replace(/\r\n/g, "\n")}
                    </pre>
                    {walkthroughData.comparisonPoints.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#242429]">
                        {walkthroughData.comparisonPoints.map((pt, pIdx) => (
                          <div
                            key={pIdx}
                            className="rounded-lg border border-[#242429] bg-[#151518] p-2.5"
                          >
                            <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                              {pt.aspect}
                            </div>
                            <p className="text-xs text-zinc-200 mt-0.5">
                              {pt.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-lg border border-[#242429] bg-[#0F0F11] p-4 space-y-3">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    Top Interview Q&amp;As
                  </div>
                  {walkthroughData.interviewQuestions.map((qa, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-[#242429] bg-[#151518] p-3"
                    >
                      <p className="font-semibold text-zinc-100">
                        Q{idx + 1}. {qa.question}
                      </p>
                      <p className="mt-1 text-zinc-300">{qa.answer}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-rose-400 mb-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Common Follow-Up Traps
                  </div>
                  <ul className="space-y-1.5 text-zinc-300">
                    {walkthroughData.commonTraps.map((trap, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-400">•</span>
                        <span>{trap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
