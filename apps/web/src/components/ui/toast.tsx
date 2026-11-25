import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (item: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).slice(2, 10);
      setToasts((prev) => [...prev, { ...item, id }]);
      setTimeout(() => {
        dismiss(id);
      }, 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((item) => {
          const variant = item.variant ?? "info";
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border bg-surface p-4 shadow-md transition-all",
                variant === "success" && "border-primary/30",
                variant === "error" && "border-danger/30",
                variant === "info" && "border-border"
              )}
            >
              {variant === "success" && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              )}
              {variant === "error" && (
                <AlertCircle className="h-5 w-5 shrink-0 text-danger mt-0.5" />
              )}
              {variant === "info" && (
                <Info className="h-5 w-5 shrink-0 text-ink-muted mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-ink-muted">{item.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="text-ink-subtle hover:text-ink cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
