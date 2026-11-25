import { useState } from "react";
import {
  FileText,
  Briefcase,
  GitCompare,
  Sparkles,
  BookOpenCheck,
  Bookmark,
  FileDown,
  Crown,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ActivityType, UserActivityItem } from "@/features/dashboard/dashboard.api";

export interface ActivityFeedProps {
  activities: UserActivityItem[];
}

const ACTIVITY_META: Record<
  ActivityType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accentClass: string;
  }
> = {
  RESUME_UPLOADED: {
    label: "Uploaded & parsed resume",
    icon: FileText,
    accentClass: "bg-primary-soft text-primary border-primary/20",
  },
  JD_ANALYZED: {
    label: "Analyzed target job description",
    icon: Briefcase,
    accentClass: "bg-primary-soft text-primary border-primary/20",
  },
  MATCH_EVALUATED: {
    label: "Evaluated resume-to-JD match",
    icon: GitCompare,
    accentClass: "bg-amber-soft text-amber border-amber/20",
  },
  QUESTIONS_GENERATED: {
    label: "Generated interview question set",
    icon: Sparkles,
    accentClass: "bg-primary-soft text-primary border-primary/20",
  },
  ANSWER_GENERATED: {
    label: "Generated tailored model answer",
    icon: BookOpenCheck,
    accentClass: "bg-primary-soft text-primary border-primary/20",
  },
  COLLECTION_CREATED: {
    label: "Created saved question collection",
    icon: Bookmark,
    accentClass: "bg-surface-muted text-ink border-border",
  },
  PDF_EXPORTED: {
    label: "Exported PDF study sheet",
    icon: FileDown,
    accentClass: "bg-surface-muted text-ink border-border",
  },
  TIER_CHANGED: {
    label: "Updated workspace plan tier",
    icon: Crown,
    accentClass: "bg-amber-soft text-amber border-amber/20",
  },
};

function formatMetadataDetail(item: UserActivityItem): string | null {
  const m = item.metadata || {};

  if (item.activityType === "ANSWER_GENERATED") {
    const parts: string[] = [];
    if (typeof m.style === "string" && m.style) {
      parts.push(`Style: ${m.style}`);
    }
    if (typeof m.category === "string" && m.category) {
      parts.push(m.category.replace(/_/g, " "));
    }
    if (typeof m.questionText === "string" && m.questionText) {
      const snippet =
        m.questionText.length > 60
          ? `${m.questionText.slice(0, 57)}...`
          : m.questionText;
      parts.push(snippet);
    } else if (typeof m.topicFocus === "string" && m.topicFocus) {
      parts.push(m.topicFocus);
    }
    return parts.length > 0 ? parts.join(" • ") : "Model answer ready for review";
  }

  if (typeof m.fileName === "string") return m.fileName;
  if (typeof m.title === "string") {
    return typeof m.company === "string" && m.company ? `${m.title} • ${m.company}` : m.title;
  }
  if (typeof m.overallScore === "number") return `Match Score: ${m.overallScore}%`;
  if (typeof m.topicFocus === "string") {
    return `${m.topicFocus}${typeof m.difficulty === "string" ? ` (${m.difficulty})` : ""}`;
  }
  if (typeof m.name === "string") return m.name;
  if (typeof m.newTier === "string") return `Switched to ${m.newTier} plan`;
  if (typeof m.exportType === "string") return `Export: ${m.exportType.replace("_", " ")}`;
  return null;
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleActivities = isExpanded ? activities : activities.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Your latest interview preparation milestones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <EmptyState
            icon={<Activity className="h-5 w-5" />}
            title="No preparation activity yet"
            description="Upload a resume, decompose a job description, or generate your first question set to start your streak."
            className="py-8"
          />
        ) : (
          <div className="space-y-3">
            <ul className="divide-y divide-border">
              {visibleActivities.map((item) => {
                const meta = ACTIVITY_META[item.activityType] ?? {
                  label: item.activityType,
                  icon: Activity,
                  accentClass: "bg-surface-muted text-ink-muted border-border",
                };
                const Icon = meta.icon;
                const detail = formatMetadataDetail(item);
                const timestamp = new Date(item.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                });

                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.accentClass}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{meta.label}</p>
                        {detail && (
                          <p className="text-xs text-ink-muted truncate">{detail}</p>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-mono text-ink-subtle tabular-nums">
                      {timestamp}
                    </span>
                  </li>
                );
              })}
            </ul>

            {activities.length > 5 && (
              <div className="border-t border-border pt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-soft transition-colors cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      <span>Show less</span>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Show all ({activities.length})</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
