import { Check, Gauge, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api";
import { cn } from "@/lib/cn";
import type {
  ResourceQuotaStatus,
  UserTier,
} from "@/features/usage/usage.api";
import {
  useUpdateTierMutation,
  useUsageQuotasQuery,
} from "@/features/usage/useUsage";

interface QuotaMeterItem {
  key: string;
  label: string;
  status: ResourceQuotaStatus;
}

function getProgressBarClass(used: number, limit: number | null): string {
  if (limit === null || limit <= 0) return "bg-primary";
  const pct = (used / limit) * 100;
  if (pct >= 100) return "bg-danger";
  if (pct >= 80) return "bg-amber";
  return "bg-primary";
}

export function UsagePage() {
  const { toast } = useToast();
  const quotasQuery = useUsageQuotasQuery();
  const updateTierMutation = useUpdateTierMutation();

  const data = quotasQuery.data;
  const activeTier: UserTier = data?.tier ?? "FREE";

  const handleSwitchTier = async (targetTier: UserTier) => {
    try {
      const updated = await updateTierMutation.mutateAsync(targetTier);
      toast({
        variant: "success",
        title: `Switched to ${updated.tier} plan`,
        description: updated.message,
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Plan switch failed",
        description:
          err instanceof ApiClientError
            ? err.message
            : "Could not update your plan tier.",
      });
    }
  };

  const meters: QuotaMeterItem[] = data
    ? [
        {
          key: "resumes",
          label: "Resumes Stored",
          status: data.quotas.resumes,
        },
        {
          key: "jobDescriptions",
          label: "Job Descriptions",
          status: data.quotas.jobDescriptions,
        },
        {
          key: "questionSetsMonthly",
          label: "Monthly Question Sets",
          status: data.quotas.questionSetsMonthly,
        },
        {
          key: "answersMonthly",
          label: "Monthly Model Answers",
          status: data.quotas.answersMonthly,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Quotas &amp; Plan Tier
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Monitor monthly AI generation limits and switch between Free
            Explorer and Pro Ascend in ₹0 demo mode.
          </p>
        </div>

        {data && (
          <Badge variant="emerald" className="self-start px-3 py-1 text-xs">
            <Gauge className="h-3.5 w-3.5" />
            Active Tier: {activeTier}
          </Badge>
        )}
      </div>

      {/* Current Usage Breakdown */}
      <Card className="border-border bg-surface">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Current Usage Breakdown</CardTitle>
          <CardDescription>
            Live consumption across your stored artifacts and monthly AI
            credits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotasQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {meters.map(({ key, label, status }) => {
                const pct =
                  status.isUnlimited || !status.limit
                    ? 100
                    : Math.min(100, Math.round((status.used / status.limit) * 100));
                const barClass = getProgressBarClass(status.used, status.limit);

                return (
                  <div
                    key={key}
                    className="rounded-xl border border-border bg-canvas p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink">
                        {label}
                      </span>
                      {status.isUnlimited ? (
                        <Badge variant="emerald">Unlimited</Badge>
                      ) : (
                        <span className="font-mono text-xs font-semibold text-ink tabular-nums">
                          {status.used} / {status.limit}
                        </span>
                      )}
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className={cn("h-full rounded-full transition-all", barClass)}
                        style={{
                          width: status.isUnlimited ? "100%" : `${pct}%`,
                        }}
                      />
                    </div>

                    <p className="text-xs text-ink-muted">
                      {status.isUnlimited
                        ? `${status.used} generated this month — no cap on Pro`
                        : `${status.remaining ?? 0} remaining`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Comparison & 1-Click Demo Switcher */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* FREE Tier */}
        <Card
          className={cn(
            "border-border bg-surface",
            activeTier === "FREE" && "border-primary ring-1 ring-primary/20",
          )}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Free &ldquo;Explorer&rdquo;</CardTitle>
                <CardDescription className="mt-0.5 font-mono text-xs">
                  ₹0 / month
                </CardDescription>
              </div>
              {activeTier === "FREE" && (
                <Badge variant="emerald">Current Plan</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 border-t border-border pt-4">
            <ul className="space-y-2 text-sm text-ink">
              {[
                "3 Resumes stored",
                "5 Job Descriptions",
                "5 Monthly Question Sets (up to 15 Qs/set)",
                "20 Monthly Model Answers",
                "PDF Export",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={activeTier === "FREE" || updateTierMutation.isPending}
              isLoading={
                updateTierMutation.isPending &&
                updateTierMutation.variables === "FREE"
              }
              onClick={() => void handleSwitchTier("FREE")}
            >
              {activeTier === "FREE" ? "Active Plan" : "Switch to Free"}
            </Button>
          </CardContent>
        </Card>

        {/* PRO Tier */}
        <Card
          className={cn(
            "border-border bg-surface",
            activeTier === "PRO" && "border-primary ring-1 ring-primary/20",
          )}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Pro &ldquo;Ascend&rdquo;
                </CardTitle>
                <CardDescription className="mt-0.5 font-mono text-xs">
                  ₹0 Demo Mode
                </CardDescription>
              </div>
              {activeTier === "PRO" && (
                <Badge variant="emerald">Current Plan</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 border-t border-border pt-4">
            <ul className="space-y-2 text-sm text-ink">
              {[
                "10 Resumes stored",
                "50 Job Descriptions",
                "50 Monthly Question Sets (up to 25 Qs/set)",
                "Unlimited Monthly Model Answers",
                "Clean Branded PDF Export",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              type="button"
              variant="primary"
              className="w-full"
              disabled={activeTier === "PRO" || updateTierMutation.isPending}
              isLoading={
                updateTierMutation.isPending &&
                updateTierMutation.variables === "PRO"
              }
              onClick={() => void handleSwitchTier("PRO")}
            >
              {activeTier === "PRO"
                ? "Active Plan"
                : "Switch to Pro (₹0 Demo)"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
