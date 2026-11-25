import * as React from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          aria-invalid={error ? "true" : undefined}
          className={cn(
            "flex min-h-[96px] w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink transition-colors",
            "placeholder:text-ink-subtle",
            "focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-danger focus:ring-danger/25 focus:border-danger" : "border-border",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-xs text-danger" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-ink-subtle">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
