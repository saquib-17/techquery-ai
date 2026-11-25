import * as React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowUpRight, Sparkles } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api";
import { useCreateJobDescriptionMutation } from "@/features/job-descriptions/useJobDescriptions";
import { cn } from "@/lib/cn";

const jdFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Job title must be at least 2 characters")
    .max(150, "Job title cannot exceed 150 characters"),
  company: z
    .string()
    .trim()
    .max(150, "Company name cannot exceed 150 characters")
    .optional(),
  rawText: z
    .string()
    .trim()
    .min(100, "Job description must be at least 100 characters")
    .max(25000, "Job description cannot exceed 25,000 characters"),
});

type JdFormValues = z.infer<typeof jdFormSchema>;

export interface JdSubmissionDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (jdId: string) => void;
}

export function JdSubmissionDialog({
  open,
  onClose,
  onCreated,
}: JdSubmissionDialogProps) {
  const createMutation = useCreateJobDescriptionMutation();
  const { toast } = useToast();
  const [apiError, setApiError] = React.useState<{
    message: string;
    isQuotaExceeded: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<JdFormValues>({
    resolver: zodResolver(jdFormSchema),
    defaultValues: {
      title: "",
      company: "",
      rawText: "",
    },
  });

  const rawTextValue = watch("rawText") || "";
  const charCount = rawTextValue.trim().length;

  React.useEffect(() => {
    if (!open) {
      setApiError(null);
    }
  }, [open]);

  const onSubmit = async (values: JdFormValues) => {
    setApiError(null);
    try {
      const created = await createMutation.mutateAsync({
        title: values.title.trim(),
        company: values.company?.trim() || undefined,
        rawText: values.rawText.trim(),
      });
      toast({
        title: "Job description decomposed",
        description: `${created.structuredJson.roleTitle} skills & requirements extracted.`,
        variant: "success",
      });
      reset();
      onCreated?.(created.id);
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setApiError({
          message: err.message,
          isQuotaExceeded: err.status === 429 || err.code === "QUOTA_EXCEEDED",
        });
      } else {
        setApiError({
          message: "Unable to analyze job description. Please try again.",
          isQuotaExceeded: false,
        });
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Analyze Target Job Description"
      description="Paste a job posting to decompose must-have skills, seniority, and core responsibilities."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {apiError && (
          <div
            role="alert"
            className={cn(
              "rounded-lg border p-3 text-xs space-y-2",
              apiError.isQuotaExceeded
                ? "border-amber/30 bg-amber-soft text-ink"
                : "border-danger/30 bg-danger-soft text-danger"
            )}
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                className={cn(
                  "h-4 w-4 shrink-0 mt-0.5",
                  apiError.isQuotaExceeded ? "text-amber" : "text-danger"
                )}
              />
              <span>{apiError.message}</span>
            </div>
            {apiError.isQuotaExceeded && (
              <Link to="/usage" className="block">
                <Button size="sm" variant="outline" className="w-full justify-between">
                  <span>Upgrade Plan / Manage Quotas</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="jd-title">Role Title *</Label>
            <Input
              id="jd-title"
              placeholder="Senior Backend Engineer"
              error={errors.title?.message}
              {...register("title")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jd-company">Company</Label>
            <Input
              id="jd-company"
              placeholder="Stripe"
              error={errors.company?.message}
              {...register("company")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="jd-rawtext">Job Description Text *</Label>
            <span
              className={cn(
                "text-[11px] font-mono tabular-nums",
                charCount < 100 ? "text-amber" : "text-primary"
              )}
            >
              {charCount} / 100 min chars
            </span>
          </div>
          <Textarea
            id="jd-rawtext"
            rows={7}
            placeholder="Paste the full job description including responsibilities, required skills, and preferred qualifications (minimum 100 characters)..."
            error={errors.rawText?.message}
            {...register("rawText")}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            <Sparkles className="h-4 w-4" />
            Decompose Job Description
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
