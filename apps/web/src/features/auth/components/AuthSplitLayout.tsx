import * as React from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  FileCheck2,
  ArrowLeft,
  Code2,
  BookOpen,
  Bot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface AuthSplitLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthSplitLayout({ title, subtitle, children }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink grid grid-cols-1 lg:grid-cols-12">
      {/* Left Form Column */}
      <div className="lg:col-span-6 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md space-y-6">
          {/* Back to Overview Link & Brand Wordmark */}
          <div className="space-y-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-muted hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Overview</span>
            </Link>

            <Link to="/" className="group flex items-center gap-2.5 w-fit">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-xs group-hover:bg-primary-hover transition-colors">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden="true"
                >
                  <path
                    d="M5 6h14M12 6v12M8 14l4 4 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <span className="block text-sm font-bold tracking-tight text-ink group-hover:text-primary transition-colors">
                  TechQuery AI
                </span>
                <span className="block text-[10px] font-mono uppercase tracking-wider text-ink-subtle">
                  Editorial Engineering Workbench
                </span>
              </div>
            </Link>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
            <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>
          </div>

          {/* Hairline Form Card */}
          <div className="rounded-xl border border-border bg-surface p-6 sm:p-7 shadow-[0_1px_2px_rgba(24,24,27,0.04)]">
            {children}
          </div>
        </div>
      </div>

      {/* Right Editorial Showcase Column */}
      <aside className="hidden lg:flex lg:col-span-6 flex-col justify-between border-l border-border bg-surface-muted/75 p-12 xl:p-16">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="emerald">V2.9 Studio</Badge>
            <Badge variant="mono">Placement Ready</Badge>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-ink leading-snug max-w-lg">
            Master DSA, Coding Arenas, CS &amp; HR from Day 1 to Offer.
          </h2>
          <p className="text-sm text-ink-muted max-w-md leading-relaxed">
            A complete, distraction-free placement engineering workbench combining 520 curated
            pattern problems, 102 runnable coding challenges, 210 CS &amp; HR topics, and
            context-locked AI mentoring.
          </p>
        </div>

        <div className="space-y-3.5 my-8">
          <div className="rounded-xl border border-border bg-surface p-3.5 flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary border border-primary/20">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">
                520 Master DSA &amp; 102 Runnable Coding Challenges
              </h3>
              <p className="mt-0.5 text-xs text-ink-muted">
                Pattern-grouped progression from Two Pointers to DP with 2,040 test cases and timed OA simulations.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3.5 flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-soft text-amber border border-amber/20">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">
                210 A-to-Z CS &amp; HR Topics Across 8 Subjects
              </h3>
              <p className="mt-0.5 text-xs text-ink-muted">
                Step-by-step beginner-to-interview curriculum across OS, DBMS, SQL, Networks, OOP, SE, System Design &amp; HR.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3.5 flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary border border-primary/20">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">
                Context-Locked 1-on-1 AI Mentor
              </h3>
              <p className="mt-0.5 text-xs text-ink-muted">
                Ask doubts directly inside any problem, topic, or analysis with zero hallucinations and real-life analogies.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3.5 flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink border border-border">
              <FileCheck2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">
                Deterministic ATS Resume &amp; JD Match Scoring
              </h3>
              <p className="mt-0.5 text-xs text-ink-muted">
                50% must-have skills, 20% nice-to-have, 20% experience alignment, and 10% domain overlap.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-6 text-xs text-ink-subtle font-mono">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            520 Master DSA Problems • 102 Runnable Coding Arenas
          </span>
          <span>210 CS Topics • 24/7 AI Mentor</span>
        </div>
      </aside>
    </div>
  );
}
