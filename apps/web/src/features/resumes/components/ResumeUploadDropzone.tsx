import * as React from "react";
import { Link } from "react-router-dom";
import { UploadCloud, AlertCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { ApiClientError } from "@/lib/api";
import { useUploadResumeMutation } from "@/features/resumes/useResumes";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface ResumeUploadDropzoneProps {
  onUploaded?: (resumeId: string) => void;
}

export function ResumeUploadDropzone({ onUploaded }: ResumeUploadDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<{
    message: string;
    isQuotaExceeded: boolean;
  } | null>(null);

  const uploadMutation = useUploadResumeMutation();
  const { toast } = useToast();

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    setUploadError(null);

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".docx")) {
      setUploadError({
        message: "Unsupported file format. Please upload a .pdf or .docx resume.",
        isQuotaExceeded: false,
      });
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setUploadError({
        message: "File exceeds the 5MB upload limit.",
        isQuotaExceeded: false,
      });
      return;
    }

    try {
      const created = await uploadMutation.mutateAsync(file);
      toast({
        title: "Resume uploaded",
        description: `${created.originalFileName} is ready for AI ATS analysis.`,
        variant: "success",
      });
      onUploaded?.(created.id);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setUploadError({
          message: err.message,
          isQuotaExceeded: err.status === 429 || err.code === "QUOTA_EXCEEDED",
        });
      } else {
        setUploadError({
          message: "Failed to upload resume. Please try again.",
          isQuotaExceeded: false,
        });
      }
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    void handleFile(file);
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary-soft/60"
            : "border-border-strong bg-surface hover:border-primary/50 hover:bg-surface-muted/40"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          aria-label="Upload resume file"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />

        {uploadMutation.isPending ? (
          <div className="py-2 flex flex-col items-center gap-2 text-primary">
            <Spinner size="md" />
            <p className="text-xs font-medium text-ink">Extracting &amp; validating document...</p>
          </div>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary border border-primary/20">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">
              Drop resume here or click to browse
            </p>
            <p className="mt-1 text-xs text-ink-subtle">
              PDF or DOCX up to 5MB
            </p>
          </>
        )}
      </div>

      {uploadError && (
        <div
          role="alert"
          className={cn(
            "rounded-lg border p-3 text-xs space-y-2",
            uploadError.isQuotaExceeded
              ? "border-amber/30 bg-amber-soft text-ink"
              : "border-danger/30 bg-danger-soft text-danger"
          )}
        >
          <div className="flex items-start gap-2">
            <AlertCircle
              className={cn(
                "h-4 w-4 shrink-0 mt-0.5",
                uploadError.isQuotaExceeded ? "text-amber" : "text-danger"
              )}
            />
            <span>{uploadError.message}</span>
          </div>
          {uploadError.isQuotaExceeded && (
            <Link to="/usage" className="block">
              <Button size="sm" variant="outline" className="w-full justify-between">
                <span>Upgrade Plan / Manage Quotas</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
