import * as React from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "emerald" | "amber" | "neutral" | "danger" | "mono";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  emerald: "bg-primary-soft text-primary border-primary/20",
  amber: "bg-amber-soft text-amber border-amber/25",
  neutral: "bg-surface-muted text-ink-muted border-border",
  danger: "bg-danger-soft text-danger border-danger/20",
  mono: "bg-surface-muted text-ink border-border font-mono",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium tracking-tight tabular-nums",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
