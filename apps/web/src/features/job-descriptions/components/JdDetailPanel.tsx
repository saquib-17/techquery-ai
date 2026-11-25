import * as React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  GitCompare,
  Sparkles,
  CheckCircle2,
  PlusCircle,
  Layers,
  ListChecks,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobDescriptionDetailQuery } from "@/features/job-descriptions/useJobDescriptions";
import type { JobDescriptionItem } from "@/features/job-descriptions/jd.api";

export interface JdDetailPanelProps {
  jd: JobDescriptionItem;
}

function formatExperienceRange(min: number, max: number | null): string {
  if (max !== null && max > min) {
    return `${min}–${max} yrs`;
  }
  return `${min}+ yrs`;
}

export function JdDetailPanel({ jd }: JdDetailPanelProps) {
  const [showRawText, setShowRawText] = React.useState(false);
  const needsRawFetch = showRawText && !jd.rawText?.trim();
  const detailQuery = useJobDescriptionDetailQuery(jd.id, needsRawFetch);
  const resolvedRawText = jd.rawText?.trim() || detailQuery.data?.rawText?.trim() || "";
  const parsed = jd.structuredJson;
  const techBuckets = [
    { label: "Languages", items: parsed.techStackCategories.languages },
    { label: "Frameworks", items: parsed.techStackCategories.frameworks },
    { label: "Databases", items: parsed.techStackCategories.databases },
    { label: "Cloud & DevOps", items: parsed.techStackCategories.cloudAndDevops },
    { label: "Tools & Other", items: parsed.techStackCategories.toolsAndOther },
  ].filter((b) => b.items.length > 0);

  return (
    <div className="space-y-5">
      {/* Header Summary Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="emerald">{parsed.seniority}</Badge>
                <Badge variant="mono">
                  {formatExperienceRange(
                    parsed.experienceYears.min,
                    parsed.experienceYears.max
                  )}
                </Badge>
              </div>
              <CardTitle className="mt-2.5 text-xl">{parsed.roleTitle}</CardTitle>
              {jd.company && (
                <CardDescription className="mt-1 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-ink-subtle" />
                  <span>{jd.company}</span>
                </CardDescription>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link to={`/matches?jdId=${jd.id}`}>
                <Button size="sm">
                  <GitCompare className="h-3.5 w-3.5" />
                  Run Resume Match
                </Button>
              </Link>
              <Link to={`/questions?jdId=${jd.id}`}>
                <Button size="sm" variant="outline">
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate Questions
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-border pt-5">
          {/* Must-Have Skills */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
              Must-Have Skills ({parsed.mustHaveSkills.length})
            </h4>
            <ul className="space-y-1.5">
              {parsed.mustHaveSkills.map((skill) => (
                <li
                  key={skill}
                  className="flex items-start gap-2 rounded-lg border border-border bg-canvas px-3 py-2 text-[13.5px] leading-snug text-ink"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Nice-to-Have Skills */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
              Nice-to-Have Skills ({parsed.niceToHaveSkills.length})
            </h4>
            {parsed.niceToHaveSkills.length === 0 ? (
              <p className="text-xs text-ink-subtle">None specified</p>
            ) : (
              <ul className="space-y-1.5">
                {parsed.niceToHaveSkills.map((skill) => (
                  <li
                    key={skill}
                    className="flex items-start gap-2 rounded-lg border border-border bg-canvas px-3 py-2 text-[13.5px] leading-snug text-ink-muted"
                  >
                    <PlusCircle className="h-4 w-4 shrink-0 text-ink-subtle mt-0.5" />
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categorized Tech Stack */}
      {techBuckets.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Categorized Tech Stack
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {techBuckets.map((bucket) => (
              <div key={bucket.label} className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-ink-subtle">
                  {bucket.label}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {bucket.items.map((item) => (
                    <Badge key={item} variant="mono">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Responsibilities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Key Responsibilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {parsed.responsibilities.map((resp, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-ink-muted">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>{resp}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Original Job Posting Collapsible */}
      <Card>
        <CardContent className="p-4">
          <button
            type="button"
            onClick={() => setShowRawText((prev) => !prev)}
            className="flex w-full items-center justify-between text-xs font-semibold text-ink hover:text-primary transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-ink-subtle" />
              {showRawText ? "Hide Original Job Posting" : "Show Original Job Posting"}
            </span>
            {showRawText ? (
              <ChevronUp className="h-4 w-4 text-ink-subtle" />
            ) : (
              <ChevronDown className="h-4 w-4 text-ink-subtle" />
            )}
          </button>

          {showRawText && (
            <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-border bg-canvas p-4 font-mono text-xs leading-relaxed text-ink-muted whitespace-pre-wrap">
              {detailQuery.isLoading ? (
                <Skeleton className="h-24 w-full rounded-md" />
              ) : resolvedRawText ? (
                resolvedRawText
              ) : (
                "No raw posting text recorded for this entry."
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
