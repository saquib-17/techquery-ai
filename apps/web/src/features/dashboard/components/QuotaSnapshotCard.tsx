import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ResourceQuotaStatus, UserQuotasResponse } from "@/features/dashboard/dashboard.api";

export interface QuotaSnapshotCardProps {
  usage: UserQuotasResponse;
}

export function QuotaSnapshotCard({ usage }: QuotaSnapshotCardProps) {
  const rows: Array<{ label: string; status: ResourceQuotaStatus }> = [
    { label: "Resumes Stored", status: usage.quotas.resumes },
    { label: "Saved Job Descriptions", status: usage.quotas.jobDescriptions },
    { label: "Monthly Question Sets", status: usage.quotas.questionSetsMonthly },
    { label: "Monthly Model Answers", status: usage.quotas.answersMonthly },
  ];

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Plan &amp; Quotas</CardTitle>
          <Badge variant={usage.tier === "PRO" ? "emerald" : "neutral"}>
            {usage.tier} TIER
          </Badge>
        </div>
        <CardDescription>
          Live PostgreSQL allowance tracking (₹0 local-first).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {rows.map((row) => {
            const { used, limit, isUnlimited } = row.status;
            const pct =
              !isUnlimited && limit && limit > 0
                ? Math.min(100, Math.round((used / limit) * 100))
                : 15;
            const isNearLimit = !isUnlimited && limit !== null && used >= limit;

            return (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-muted">{row.label}</span>
                  <span className="font-mono font-semibold text-ink tabular-nums">
                    {isUnlimited ? `${used} / Unlimited` : `${used} / ${limit}`}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted border border-border/60">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isNearLimit ? "bg-amber" : "bg-primary"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Link to="/usage" className="block pt-2">
          <Button variant="outline" size="sm" className="w-full justify-between">
            <span>Manage Plan &amp; Quotas</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
