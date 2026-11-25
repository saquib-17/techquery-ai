import * as React from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary/40 border border-emerald-400/20 shadow-[0_0_18px_rgba(16,185,129,0.28)]",
  secondary:
    "bg-surface-muted text-ink border border-border hover:bg-border/60 focus-visible:ring-primary/30",
  outline:
    "bg-surface text-ink border border-border hover:border-border-strong hover:bg-surface-muted/80 focus-visible:ring-primary/30",
  ghost:
    "bg-transparent text-ink-muted hover:text-ink hover:bg-surface-muted border border-transparent",
  danger:
    "bg-danger text-white hover:bg-red-600 focus-visible:ring-danger/40 border border-red-400/20",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-11 px-5 text-sm rounded-lg",
  icon: "h-9 w-9 p-0 rounded-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 ease-out active:scale-[0.98] cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-canvas",
          "disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && <Spinner size="sm" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
