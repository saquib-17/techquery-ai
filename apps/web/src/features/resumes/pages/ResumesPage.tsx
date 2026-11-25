import * as React from "react";
import { FileText, Sparkles, Code2 } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  useResumesQuery,
  useResumeAnalysisQuery,
  useParsedResumeQuery,
  useAnalyzeResumeMutation,
} from "@/features/resumes/useResumes";
import { ResumeUploadDropzone } from "@/features/resumes/components/ResumeUploadDropzone";
import { ResumePortfolioSidebar } from "@/features/resumes/components/ResumePortfolioSidebar";
import { AtsAnalysisPanel } from "@/features/resumes/components/AtsAnalysisPanel";
import { ParsedResumeViewer } from "@/features/resumes/components/ParsedResumeViewer";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api";

type WorkbenchTab = "audit" | "parsed";

export function ResumesPage() {
  const { data: resumes = [], isLoading: isLoadingResumes } = useResumesQuery();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<WorkbenchTab>("audit");

  const { toast } = useToast();
  const analyzeMutation = useAnalyzeResumeMutation();

  // Default selection to primary or most recent resume
  React.useEffect(() => {
    if (resumes.length === 0) {
      setSelectedId(null);
      return;
    }
    const stillExists = resumes.some((r) => r.id === selectedId);
    if (!stillExists) {
      const primary = resumes.find((r) => r.isPrimary) ?? resumes[0];
      setSelectedId(primary.id);
    }
  }, [resumes, selectedId]);

  const selectedResume = resumes.find((r) => r.id === selectedId) ?? null;

  const {
    data: analysis,
    isLoading: isLoadingAnalysis,
  } = useResumeAnalysisQuery(selectedResume?.id ?? null);

  const {
    data: parsedData,
    isLoading: isLoadingParsed,
  } = useParsedResumeQuery(selectedResume?.id ?? null);

  const handleRunAudit = async () => {
    if (!selectedResume) return;
    try {
      const result = await analyzeMutation.mutateAsync(selectedResume.id);
      toast({
        title: "AI ATS Audit complete",
        description: `Scored ${result.analysis.atsScore}/100 for ${selectedResume.originalFileName}.`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "ATS Audit failed",
        description:
          err instanceof ApiClientError
            ? err.message
            : "Unable to analyze resume right now.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          Resumes &amp; ATS Intelligence
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Upload PDF or DOCX resumes, run deterministic + AI ATS audits, and inspect your parsed career graph.
        </p>
      </div>

      {/* Asymmetric Split Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): Upload & Portfolio */}
        <div className="lg:col-span-4 space-y-5">
          <ResumeUploadDropzone onUploaded={(id) => setSelectedId(id)} />

          {isLoadingResumes ? (
            <div className="space-y-2.5">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : (
            <ResumePortfolioSidebar
              resumes={resumes}
              selectedId={selectedResume?.id ?? null}
              onSelect={(id) => setSelectedId(id)}
            />
          )}
        </div>

        {/* Right Column (8 cols): Tabbed Workbench */}
        <div className="lg:col-span-8">
          {isLoadingResumes ? (
            <Skeleton className="h-80 w-full rounded-xl" />
          ) : !selectedResume ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No resumes uploaded yet"
              description="Upload your PDF or DOCX resume on the left to unlock automated ATS scoring, section critiques, and skill extraction."
            />
          ) : (
            <div className="space-y-4">
              {/* Tab Bar */}
              <div
                role="tablist"
                aria-label="Resume workbench tabs"
                className="inline-flex rounded-xl border border-border bg-surface-muted/70 p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "audit"}
                  onClick={() => setActiveTab("audit")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer",
                    activeTab === "audit"
                      ? "bg-surface text-ink shadow-xs border border-border"
                      : "text-ink-muted hover:text-ink"
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  ATS Audit Report
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "parsed"}
                  onClick={() => setActiveTab("parsed")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer",
                    activeTab === "parsed"
                      ? "bg-surface text-ink shadow-xs border border-border"
                      : "text-ink-muted hover:text-ink"
                  )}
                >
                  <Code2 className="h-3.5 w-3.5 text-primary" />
                  Parsed Resume Data
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "audit" ? (
                <AtsAnalysisPanel
                  analysis={analysis}
                  isLoading={isLoadingAnalysis}
                  isAnalyzing={analyzeMutation.isPending}
                  onRunAudit={() => void handleRunAudit()}
                />
              ) : (
                <ParsedResumeViewer
                  parsedData={parsedData}
                  isLoading={isLoadingParsed}
                  isAnalyzing={analyzeMutation.isPending}
                  onRunAudit={() => void handleRunAudit()}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
