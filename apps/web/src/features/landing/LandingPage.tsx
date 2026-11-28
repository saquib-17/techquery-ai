import * as React from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Code2,
  Terminal,
  BookOpen,
  Bot,
  FileCheck2,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Zap,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth.context";

export function LandingPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const [activePreviewTab, setActivePreviewTab] = React.useState<"coding" | "cs" | "mentor">("coding");
  const [copiedCode, setCopiedCode] = React.useState(false);

  // If user is already authenticated, redirect to /dashboard
  if (!isInitializing && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCopyCode = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0F0F11] text-[#E4E4E7] font-sans selection:bg-[#10B981]/20 selection:text-[#10B981]">
      {/* 1. Sticky Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-[#242429] bg-[#0F0F11]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Wordmark */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10B981] text-[#0F0F11] shadow-xs group-hover:bg-[#059669] transition-colors">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path
                  d="M5 6h14M12 6v12M8 14l4 4 4-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white group-hover:text-[#10B981] transition-colors">
                TechQuery AI
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                Engineering Studio
              </span>
            </div>
          </Link>

          {/* Desktop Center Links */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#platform-modules"
              className="text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors"
            >
              Platform Modules
            </a>
            <a
              href="#ai-mentor"
              className="text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors"
            >
              AI Mentor
            </a>
            <a
              href="#how-it-works"
              className="text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors"
            >
              How It Works
            </a>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-medium text-[#D4D4D8] hover:text-white px-3.5 py-1.5 rounded-md hover:bg-[#151518] border border-transparent hover:border-[#242429] transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-[#0F0F11] px-3.5 py-1.5 rounded-lg transition-all shadow-xs"
            >
              Start Free Prep
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-[#242429]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#242429] bg-[#151518] text-[#10B981] text-xs font-mono mb-6 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>A-to-Z Placement Engineering Studio</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15]">
              Master DSA, CS Fundamentals &amp; System Design From{" "}
              <span className="text-[#10B981]">Day 1 to Offer</span>.
            </h1>

            {/* Subheadline */}
            <p className="mt-5 text-sm sm:text-base lg:text-lg text-[#A1A1AA] max-w-2xl leading-relaxed">
              A complete, distraction-free interview workbench combining a 520-problem pattern
              sheet, a 102-problem runnable code arena, 210 beginner-to-interview CS &amp; HR
              lessons, and a context-locked 1-on-1 AI Mentor.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#0F0F11] font-semibold text-sm transition-all shadow-md hover:shadow-[#10B981]/20"
              >
                Launch Free Workbench
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#151518] hover:bg-[#1E1E22] text-[#E4E4E7] border border-[#242429] hover:border-[#3F3F46] font-medium text-sm transition-all"
              >
                Sign In to Account
              </Link>
            </div>

            {/* Live Trust Indicators */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-[#71717A]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
                Zero-Cost Local Dev Ready
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
                No Credit Card Required
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
                Multi-Turn Groq Cloud AI
              </span>
            </div>
          </div>

          {/* Interactive Workbench Mockup */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-[#242429] bg-[#151518] shadow-2xl overflow-hidden">
            {/* Window Top Bar & Interactive Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#242429] bg-[#121215] px-4 py-2.5 gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#10B981]/70" />
                </div>
                <span className="ml-2 text-[11px] font-mono text-[#71717A]">
                  workbench-preview.techquery.ai
                </span>
              </div>

              {/* Tab Selector Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("coding")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-colors shrink-0 ${
                    activePreviewTab === "coding"
                      ? "bg-[#242429] text-[#10B981] font-semibold border border-[#3F3F46]"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1E]"
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  Coding Arena (20/20)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("cs")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-colors shrink-0 ${
                    activePreviewTab === "cs"
                      ? "bg-[#242429] text-[#10B981] font-semibold border border-[#3F3F46]"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1E]"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  CS &amp; HR Studio (A-Z)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("mentor")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-colors shrink-0 ${
                    activePreviewTab === "mentor"
                      ? "bg-[#242429] text-[#10B981] font-semibold border border-[#3F3F46]"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1E]"
                  }`}
                >
                  <Bot className="h-3.5 w-3.5" />
                  Ask AI Mentor
                </button>
              </div>
            </div>

            {/* Tab 1: Coding Arena Mockup */}
            {activePreviewTab === "coding" && (
              <div className="p-4 sm:p-6 bg-[#0F0F11]">
                {/* Problem Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242429] pb-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] font-semibold">
                      EASY
                    </span>
                    <span className="text-white font-semibold">#01. Two Sum</span>
                    <span className="text-[#71717A]">• Array, Hash Table</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#A1A1AA]">
                    <span>Language: Java 21</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyCode(
                          `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[] {};\n    }\n}`
                        )
                      }
                      className="inline-flex items-center gap-1 hover:text-white text-[11px]"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="h-3 w-3 text-[#10B981]" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Code Window */}
                <pre className="mt-3 overflow-x-auto rounded-lg border border-[#242429] bg-[#121215] p-4 font-mono text-xs sm:text-sm text-[#E4E4E7] leading-relaxed">
                  <code>{`class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}`}</code>
                </pre>

                {/* Execution Results Footer */}
                <div className="mt-4 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" />
                    <span className="font-bold text-[#10B981]">
                      ✓ 20/20 Test Cases Passed (ACCEPTED)
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[#A1A1AA]">
                    <span>
                      Runtime: <strong className="text-white">1.4 ms</strong> (Beats 98.4%)
                    </span>
                    <span>
                      Memory: <strong className="text-white">42.1 MB</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: CS & HR A-to-Z Studio Mockup */}
            {activePreviewTab === "cs" && (
              <div className="p-4 sm:p-6 bg-[#0F0F11] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242429] pb-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#3B82F6]/20 text-[#60A5FA] font-semibold">
                      OPERATING SYSTEMS
                    </span>
                    <span className="text-white font-semibold">
                      Topic #04: Process vs Thread &amp; Context Switching
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-semibold text-[11px]">
                    MUST_KNOW • Zero-Background
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="rounded-lg border border-[#242429] bg-[#151518] p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                      Day 1 Core Concept
                    </h4>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">
                      A <strong className="text-white">Process</strong> is an isolated running program
                      with its own memory space (PCB, stack, heap, code). A{" "}
                      <strong className="text-white">Thread</strong> is a lightweight execution unit
                      sharing the process address space.
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#242429] bg-[#151518] p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                      Interview Trap &amp; Optimization
                    </h4>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">
                      Thread context switching is fast because it does not invalidate CPU Translation
                      Lookaside Buffer (TLB) caches. Process switching requires flushing the MMU page
                      table cache.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-[#242429] bg-[#121215] p-3.5 text-xs">
                  <span className="text-[10px] font-mono uppercase text-[#10B981] font-bold block mb-1">
                    Classic Placement Interview Question
                  </span>
                  <p className="font-semibold text-white">
                    &ldquo;Why can race conditions occur between threads but not between independent
                    processes?&rdquo;
                  </p>
                  <p className="text-[#A1A1AA] mt-1 text-[11px]">
                    Threads share the same heap memory and data segment, allowing concurrent writes
                    without mutual exclusion (mutex/semaphores).
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Ask AI Mentor Mockup */}
            {activePreviewTab === "mentor" && (
              <div className="p-4 sm:p-6 bg-[#0F0F11] space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#242429] pb-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
                    <span className="font-semibold text-white">AI Mentor • Context: Deadlock &amp; Coffman Conditions</span>
                  </div>
                  <span className="text-[#71717A] text-[11px]">Groq Waterfall • Free-Tier Fast</span>
                </div>

                {/* Candidate Message */}
                <div className="flex justify-end">
                  <div className="max-w-md rounded-xl bg-[#242429] px-4 py-2.5 text-xs text-white">
                    Can you explain Coffman conditions with an everyday real-life analogy?
                  </div>
                </div>

                {/* Mentor Reply */}
                <div className="flex justify-start">
                  <div className="max-w-xl rounded-xl border border-[#242429] bg-[#151518] px-4 py-3 text-xs text-[#E4E4E7] space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#10B981] font-bold">
                      <Sparkles className="h-3.5 w-3.5" />
                      Everyday Analogy: The Single-Lane Bridge
                    </div>
                    <p className="text-[#A1A1AA] leading-relaxed">
                      Think of two cars meeting in the middle of a 1-lane narrow mountain bridge:
                    </p>
                    <ul className="space-y-1 text-[#D4D4D8] pl-2 text-[11px]">
                      <li>• <strong>Mutual Exclusion:</strong> Only one car fits on the section.</li>
                      <li>• <strong>Hold &amp; Wait:</strong> Car A holds its spot while waiting for Car B to reverse.</li>
                      <li>• <strong>No Preemption:</strong> Neither driver can forcibly tow the other car.</li>
                      <li>• <strong>Circular Wait:</strong> Both drivers stubbornly wait on each other.</li>
                    </ul>
                    <p className="text-[11px] text-[#10B981] font-mono">
                      💡 Prevent ANY ONE condition (e.g. timeout or yield right-of-way) and deadlock is broken.
                    </p>
                  </div>
                </div>

                {/* Quick Action Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                  <span className="text-[#71717A]">Quick doubts:</span>
                  <span className="rounded-md border border-[#242429] bg-[#121215] px-2.5 py-1 text-[#A1A1AA]">
                    Explain simpler
                  </span>
                  <span className="rounded-md border border-[#242429] bg-[#121215] px-2.5 py-1 text-[#A1A1AA]">
                    Show Banker&apos;s Algorithm
                  </span>
                  <span className="rounded-md border border-[#242429] bg-[#121215] px-2.5 py-1 text-[#A1A1AA]">
                    Quiz me on this
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Key Platform Metrics Strip */}
      <section className="py-12 border-b border-[#242429] bg-[#121215]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1 */}
            <div className="rounded-xl border border-[#242429] bg-[#151518] p-5 shadow-xs hover:border-[#10B981]/50 transition-colors">
              <div className="text-3xl font-extrabold text-[#10B981] font-mono">520+</div>
              <h3 className="mt-1 text-sm font-semibold text-white">
                Curated DSA Master Problems
              </h3>
              <p className="mt-1 text-xs text-[#A1A1AA] leading-relaxed">
                Pattern &amp; company tagged with brute-to-optimal intuition, dry runs, and visual code.
              </p>
            </div>

            {/* Stat 2 */}
            <div className="rounded-xl border border-[#242429] bg-[#151518] p-5 shadow-xs hover:border-[#10B981]/50 transition-colors">
              <div className="text-3xl font-extrabold text-[#10B981] font-mono">102</div>
              <h3 className="mt-1 text-sm font-semibold text-white">
                Runnable Coding Arenas
              </h3>
              <p className="mt-1 text-xs text-[#A1A1AA] leading-relaxed">
                2,040 hidden and sample test cases with instant diffs &amp; realistic 60-min timed OAs.
              </p>
            </div>

            {/* Stat 3 */}
            <div className="rounded-xl border border-[#242429] bg-[#151518] p-5 shadow-xs hover:border-[#10B981]/50 transition-colors">
              <div className="text-3xl font-extrabold text-[#10B981] font-mono">210</div>
              <h3 className="mt-1 text-sm font-semibold text-white">
                A-to-Z CS &amp; HR Topics
              </h3>
              <p className="mt-1 text-xs text-[#A1A1AA] leading-relaxed">
                Zero-background beginner progression across 8 core technical and behavioral subjects.
              </p>
            </div>

            {/* Stat 4 */}
            <div className="rounded-xl border border-[#242429] bg-[#151518] p-5 shadow-xs hover:border-[#10B981]/50 transition-colors">
              <div className="text-3xl font-extrabold text-[#10B981] font-mono">24/7</div>
              <h3 className="mt-1 text-sm font-semibold text-white">
                Context-Locked AI Mentor
              </h3>
              <p className="mt-1 text-xs text-[#A1A1AA] leading-relaxed">
                1-on-1 instant doubt resolution locked directly to your current problem, topic, or roadmap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Capabilities Grid */}
      <section id="platform-modules" className="py-16 sm:py-24 border-b border-[#242429]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-[#10B981] font-semibold">
              End-to-End Preparation Engine
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Six Interconnected Modules. One Unified Engineering Studio.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#A1A1AA]">
              Everything you need for tech placements in one distraction-free obsidian workbench.
              No random spreadsheets, no expired pastebins, no fragmented subscriptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module 1 */}
            <div className="rounded-xl border border-[#242429] bg-[#151518] p-6 hover:border-[#10B981]/50 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10B981]/15 text-[#10B981] mb-4 group-hover:scale-105 transition-transform">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#10B981] transition-colors">
                Master DSA Sheet (520 Problems)
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Structured pattern progression from Arrays and Two Pointers to Dynamic Programming
                and Graphs. Every problem includes intuition, dry runs, and time/space complexity.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-mono text-[#71717A]">
                <span className="px-2 py-0.5 rounded bg-[#242429] text-[#D4D4D8]">Brute-to-Optimal</span>
                <span className="px-2 py-0.5 rounded bg-[#242429] text-[#D4D4D8]">Company Tags</span>
              </div>
            </div>

            {/* Module 2 */}
            <div className="rounded-xl border border-[#242429] bg-[#151518] p-6 hover:border-[#10B981]/50 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10B981]/15 text-[#10B981] mb-4 group-hover:scale-105 transition-transform">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#10B981] transition-colors">
                Coding Arena &amp; Timed OAs
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Run Java, Python, C++, or JavaScript against 20 test cases with instant diffs.
                Simulate realistic 60-minute Online Assessments with refresh-safe autosave.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-mono text-[#71717A]">
                <span className="px-2 py-0.5 rounded bg-[#242429] text-[#D4D4D8]">20 Test Cases</span>
                <span className="px-2 py-0.5 rounded bg-[#242429] text-[#D4D4D8]">Timed OA Mode</span>
              </div>
            </div>

            {/* Module 3 */}
            <div className="rounded-xl border border-[#242429] bg-[#151518] p-6 hover:border-[#10B981]/50 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10B981]/15 text-[#10B981] mb-4 group-hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#10B981] transition-colors">
                A-to-Z CS &amp; HR Prep Studio
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                210 beginner-friendly topics across Operating Systems, DBMS, SQL Queries, Computer
                Networks, OOP, Software Engineering, System Design, and HR Behavioral.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-mono text-[#71717A]">
                <span className="px-2 py-0.5 rounded bg-[#242429] text-[#D4D4D8]">8 Subjects</span>
                <span className="px-2 py-0.5 rounded bg-[#242429] text-[#D4D4D8]">Day 1 to SDE-1</span>
              </div>
            </div>

            {/* Module 4 */}
            <div id="ai-mentor" className="rounded-xl border border-[#242429] bg-[#151518] p-6 hover:border-[#10B981]/50 transition-all group scroll-mt-20">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10B981]/15 text-[#10B981] mb-4 group-hover:scale-105 transition-transform">
                <Bot className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#10B981] transition-colors">
                Context-Locked Global AI Mentor
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Ask follow-up questions directly inside any problem, topic, or analysis. The mentor
                knows exactly what code or concept you are looking at and answers with precision.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-mono text-[#71717A]">
                <span className="px-2 py-0.5 rounded bg-[#242429] text-[#D4D4D8]">Groq Waterfall</span>
                <span className="px-2 py-0.5 rounded bg-[#242429] text-[#D4D4D8]">Zero Hallucinations</span>
              </div>
            </div>

            {/* Module 5 */}
            <div className="rounded-xl border border-[#242429] bg-[#151518] p-6 hover:border-[#10B981]/50 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10B981]/15 text-[#10B981] mb-4 group-hover:scale-105 transition-transform">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#10B981] transition-colors">
                Deterministic ATS &amp; JD Matcher
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Mathematical skill-gap audit: 50% must-have skills, 20% nice-to-have, 20% experience,
                and 10% domain overlap. Generates concrete recommendations to fix resume gaps.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-mono text-[#71717A]">
                <span className="px-2 py-0.5 rounded bg-[#242429] text-[#D4D4D8]">Weighted Math</span>
                <span className="px-2 py-0.5 rounded bg-[#242429] text-[#D4D4D8]">PDF Streaming</span>
              </div>
            </div>

            {/* Module 6 */}
            <div className="rounded-xl border border-[#242429] bg-[#151518] p-6 hover:border-[#10B981]/50 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10B981]/15 text-[#10B981] mb-4 group-hover:scale-105 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#10B981] transition-colors">
                Personalized AI Study Roadmaps
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Generate an 8-week structured study roadmap customized to your target company, role,
                and interview timeline. Track daily progress with streaks and task checkboxes.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-mono text-[#71717A]">
                <span className="px-2 py-0.5 rounded bg-[#242429] text-[#D4D4D8]">Adaptive Weeks</span>
                <span className="px-2 py-0.5 rounded bg-[#242429] text-[#D4D4D8]">Streak Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 3-Step Workflow Strip */}
      <section id="how-it-works" className="py-16 sm:py-24 border-b border-[#242429] bg-[#121215]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-[#10B981] font-semibold">
              Structured Methodology
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              How TechQuery AI Takes You From Zero to Hired
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="rounded-xl border border-[#242429] bg-[#151518] p-6 relative">
              <span className="text-2xl font-mono font-bold text-[#10B981] block mb-3">01.</span>
              <h3 className="text-base font-bold text-white mb-2">Diagnose &amp; Plan</h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Upload your resume, analyze your target job description, identify critical skill gaps,
                and generate a personalized day-by-day roadmap tailored to your target company.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-[#242429] bg-[#151518] p-6 relative">
              <span className="text-2xl font-mono font-bold text-[#10B981] block mb-3">02.</span>
              <h3 className="text-base font-bold text-white mb-2">Learn &amp; Code Daily</h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Work through pattern-curated DSA problems, run code against 20 edge-case tests in the
                coding arena, and master zero-background CS fundamentals step-by-step.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-[#242429] bg-[#151518] p-6 relative">
              <span className="text-2xl font-mono font-bold text-[#10B981] block mb-3">03.</span>
              <h3 className="text-base font-bold text-white mb-2">Simulate &amp; Ace Interviews</h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Take realistic 60-minute timed OA sessions, practice behavioral HR prompts with the
                STAR method, and resolve lingering doubts with your context-locked AI Mentor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Bottom Conversion Banner */}
      <section className="py-16 sm:py-20 border-b border-[#242429]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#10B981]/30 bg-gradient-to-b from-[#151518] to-[#121215] p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981] text-xs font-mono mb-4">
              <Zap className="h-3.5 w-3.5" />
              <span>Placement Season 2026 Ready</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight max-w-2xl mx-auto">
              Ready to start your placement prep?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#A1A1AA] max-w-xl mx-auto leading-relaxed">
              Join candidates mastering DSA patterns, CS fundamentals, and live coding with TechQuery AI&apos;s
              distraction-free studio.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#0F0F11] font-semibold text-sm transition-all shadow-md hover:shadow-[#10B981]/20"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#151518] hover:bg-[#1E1E22] text-[#E4E4E7] border border-[#242429] hover:border-[#3F3F46] font-medium text-sm transition-all"
              >
                Sign In to Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Minimal Clean Footer */}
      <footer className="py-8 bg-[#0F0F11] text-xs text-[#71717A]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#10B981] text-[#0F0F11] font-bold text-xs">
              TQ
            </div>
            <span className="font-semibold text-[#D4D4D8]">TechQuery AI</span>
            <span>—</span>
            <span>Built for Software Engineering Placements</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <a href="#platform-modules" className="hover:text-white transition-colors">
              Modules
            </a>
            <a href="#ai-mentor" className="hover:text-white transition-colors">
              AI Mentor
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              Workflow
            </a>
            <Link to="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="text-[#10B981] hover:underline">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
