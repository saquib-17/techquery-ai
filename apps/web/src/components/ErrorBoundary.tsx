import * as React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || "Unexpected rendering error",
    };
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorMessage: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-xl border border-[#242429] bg-[#151518] p-8 text-center max-w-lg mx-auto my-8 space-y-4"
        >
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-white">
              {this.props.fallbackTitle ??
                "Something went wrong loading this view"}
            </h2>
            <p className="text-xs text-zinc-400">
              Your progress and saved code are safe. Reload the practice session
              to continue.
            </p>
          </div>
          <Button
            type="button"
            onClick={this.handleReload}
            className="bg-[#10B981] text-black hover:bg-[#0ea572]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reload Practice Session
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
