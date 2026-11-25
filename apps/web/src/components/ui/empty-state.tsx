import * as React from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary-soft text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-ink-muted">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
