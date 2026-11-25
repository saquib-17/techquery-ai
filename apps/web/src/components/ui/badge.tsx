import * as React from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "emerald" | "amber" | "neutral" | "danger" | "mono";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  emerald:
    "bg-[#10B981]/12 text-[#34D399] border-[#10B981]/30 shadow-[0_0_10px_rgba(16,185,129,0.12)]",
  amber:
    "bg-[#F59E0B]/12 text-[#FBBF24] border-[#F59E0B]/30",
  neutral:
    "bg-surface-muted text-ink-muted border-border",
  danger:
    "bg-[#EF4444]/12 text-[#F87171] border-[#EF4444]/30",
  mono:
    "bg-surface-muted text-[#E4E4E7] border-border font-mono",
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
