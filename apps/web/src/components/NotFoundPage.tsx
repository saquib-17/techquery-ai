import { Link } from "react-router-dom";
import { Code2, Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface NotFoundPageProps {
  title?: string;
  description?: string;
}

export function NotFoundPage({
  title = "Page Not Found",
  description = "We couldn't find that page or coding problem. It may have moved or the link may be incorrect.",
}: NotFoundPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-[#242429] bg-[#151518] p-8 text-center space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#242429] bg-[#0F0F11] text-[#10B981]">
          <SearchX className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">
            404
          </p>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Link to="/practice">
            <Button
              type="button"
              size="sm"
              className="bg-[#10B981] text-black hover:bg-[#0ea572]"
            >
              <Code2 className="h-3.5 w-3.5" />
              Back to Coding Practice
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button type="button" size="sm" variant="outline">
              <Home className="h-3.5 w-3.5" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
