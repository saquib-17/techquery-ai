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
  Flame,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth.context";

type PreviewTab = "ats" | "roadmap" | "coding" | "cs" | "mentor";
type CodeLanguage = "Java" | "Python" | "C++" | "JavaScript";

const CODE_SNIPPETS: Record<CodeLanguage, string> = {
  Java: `class Solution {
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
}`,
  Python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []`,
  "C++": `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int comp = target - nums[i];
            if (seen.count(comp)) return {seen[comp], i};
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
  JavaScript: `var twoSum = function(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) return [map.get(comp), i];
        map.set(nums[i], i);
    }
    return [];
};`,
};

interface MentorQA {
  question: string;
  badge: string;
  title: string;
  content: string[];
  callout: string;
}

const MENTOR_PREVIEWS: Record<string, MentorQA> = {
  deadlock: {
    question: "Explain Deadlock with an analogy",
    badge: "OS • Coffman Conditions",
    title: "Everyday Analogy: The Single-Lane Bridge",
    content: [
      "Think of two cars meeting in the middle of a 1-lane narrow mountain bridge:",
      "• Mutual Exclusion: Only one vehicle fits on the crossing at once.",
      "• Hold & Wait: Car A holds its bridge segment while waiting for Car B to reverse.",
      "• No Preemption: Neither driver can forcibly tow the other car away.",
      "• Circular Wait: Car A waits for Car B; Car B stubbornly waits for Car A.",
    ],
    callout: "💡 Prevent ANY ONE condition (e.g. timeout or reverse protocol) and deadlock is broken.",
  },
  binarySearch: {
    question: "Why did my binary search loop fail?",
    badge: "DSA • Edge Cases",
    title: "Classic Bug: Integer Overflow & Midpoint Update",
    content: [
      "Two most common reasons binary search loops fail or freeze:",
      "1. Off-by-one pointer jump: Always use `left = mid + 1` or `right = mid - 1`. Setting `left = mid` causes infinite loops on 2-element arrays.",
      "2. Integer overflow: Use `mid = left + (right - left) / 2` instead of `(left + right) / 2` to avoid 32-bit integer overflow.",
      "3. Loop condition: Use `while (left <= right)` when searching for an exact value, or `while (left < right)` for lower-bound/upper-bound bisect.",
    ],
    callout: "🔍 Quick fix: Trace an array of length 2 ([1, 3], target 3) to verify termination.",
  },
  behavioral: {
    question: "How to answer 'Tell me about yourself'?",
    badge: "HR & Behavioral • STAR Framework",
    title: "The Present-Past-Future Structure",
    content: [
      "Deliver a 90-second structured pitch in three distinct acts:",
      "1. Present: Who you are right now (degree, primary tech stack like Java/React, and recent production-grade project).",
      "2. Past: 1 concrete story where you solved a real engineering constraint (e.g. reduced API response latency by 40% with caching).",
      "3. Future: Why this exact company and role align with where you want to deepen your distributed systems skills.",
    ],
    callout: "🎯 Pro-tip: Never recite your resume line-by-line; highlight impact and metrics.",
  },
};

const CS_TOPICS: Record<
  string,
  { subject: string; title: string; badge: string; concept: string; trap: string; interviewQ: string }
> = {
  OS: {
    subject: "OPERATING SYSTEMS",
    title: "Topic #04: Process vs Thread & Context Switching",
    badge: "MUST_KNOW • Zero-Background",
    concept:
      "A Process is an isolated running program with its own virtual address space (PCB, stack, heap, code). A Thread is a lightweight execution unit sharing the process heap and file descriptors.",
    trap: "Thread switching is orders-of-magnitude faster because it does NOT invalidate CPU TLB caches. Process switching forces full MMU page table cache invalidation.",
    interviewQ:
      "Q: Why can race conditions occur between threads but not between independent processes without IPC?",
  },
  DBMS: {
    subject: "DATABASE MANAGEMENT SYSTEMS",
    title: "Topic #05: ACID Properties & Transaction Isolation Levels",
    badge: "CORE • Placement Essential",
    concept:
      "Atomicity (all or nothing), Consistency (preserves schema invariants), Isolation (concurrent transactions execute without interfering), Durability (committed writes survive system crashes via WAL).",
    trap: "Read Committed prevents Dirty Reads, but allows Non-Repeatable Reads. Repeatable Read prevents Non-Repeatable Reads, but allows Phantom Reads in standard SQL.",
    interviewQ:
      "Q: How does Write-Ahead Logging (WAL) guarantee Durability during sudden power loss?",
  },
  "System Design": {
    subject: "HIGH-LEVEL SYSTEM DESIGN",
    title: "Topic #03: Scalable Caching & Cache Invalidation",
    badge: "HLD • SDE-1 Ready",
    concept:
      "Caches (Redis / Memcached) sit between API servers and databases to serve hot data at sub-millisecond latencies. Cache patterns: Cache-Aside, Write-Through, Write-Back.",
    trap: "Cache Stampede / Thundering Herd occurs when a hot cache key expires and thousands of concurrent requests slam the primary database simultaneously. Mitigate with distributed mutexes.",
    interviewQ:
      "Q: How would you design cache invalidation for a high-traffic e-commerce product inventory page?",
  },
  HR: {
    subject: "BEHAVIORAL & HR PREPARATION",
    title: "Topic #01: Tell Me About Yourself & Project Defense",
    badge: "MUST_KNOW • STAR Framework",
    concept:
      "Situation (context and scale), Task (your specific engineering responsibility), Action (technical decisions and trade-offs you made), Result (measurable business or performance metrics).",
    trap: "Focusing solely on team accomplishments ('we built') without clearly defining your individual technical contributions ('I architected the database schema and indexing strategy').",
    interviewQ:
      "Q: Tell me about a time you had a technical disagreement with a teammate. How did you resolve it?",
  },
};

export function LandingPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const [activeTab, setActiveTab] = React.useState<PreviewTab>("ats");
  const [selectedLanguage, setSelectedLanguage] = React.useState<CodeLanguage>("Java");
  const [activeMentorChip, setActiveMentorChip] = React.useState<string>("deadlock");
  const [selectedCsSubject, setSelectedCsSubject] = React.useState<string>("OS");
  const [copiedCode, setCopiedCode] = React.useState(false);

  // Interactive roadmap checkboxes state
  const [roadmapTasks, setRoadmapTasks] = React.useState<Record<string, boolean>>({
    t1: true,
    t2: true,
    t3: true,
    t4: false,
    t5: false,
  });

  const toggleRoadmapTask = (id: string) => {
    setRoadmapTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // If user is already authenticated, redirect to /dashboard
  if (!isInitializing && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCopyCode = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const completedCount = Object.values(roadmapTasks).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / Object.keys(roadmapTasks).length) * 100);

  return (
    <div className="min-h-screen bg-[#0F0F11] text-[#E4E4E7] font-sans selection:bg-[#10B981]/20 selection:text-[#10B981] relative">
      {/* Subtle Background Radial Mesh & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(16,185,129,0.12),rgba(15,15,17,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2424290a_1px,transparent_1px),linear-gradient(to_bottom,#2424290a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

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
              href="#resume-and-roadmap"
              className="text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors"
            >
              ATS &amp; Roadmap
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

      {/* 2. Atmospheric Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-[#242429]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#242429] bg-[#151518] text-[#10B981] text-xs font-mono mb-6 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>End-to-End Career &amp; Interview Engineering Studio</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.12]">
              From ATS Resume Match to Offer Letter—
              <span className="text-[#10B981]">Every Step Engineered</span>.
            </h1>

            {/* Subheadline */}
            <p className="mt-5 text-sm sm:text-base lg:text-lg text-[#A1A1AA] max-w-3xl leading-relaxed">
              Audit your resume against real job descriptions with weighted skill-gap math, generate
              adaptive day-by-day study roadmaps, practice 520 DSA &amp; 102 runnable coding problems,
              master 210 CS/HR topics, and resolve doubts with a context-locked 1-on-1 AI Mentor.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#0F0F11] font-semibold text-sm transition-all shadow-md hover:shadow-[#10B981]/25"
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
                Deterministic 50/20/20/10 ATS Scoring
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
                Zero-Cost Local Dev Ready
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
                Multi-Model Groq Waterfall
              </span>
            </div>
          </div>

          {/* Interactive 5-Tab Live Workbench Mockup */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-[#242429] bg-[#151518] shadow-2xl overflow-hidden">
            {/* Window Top Bar & Tab Buttons */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[#242429] bg-[#121215] px-4 py-2.5 gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#10B981]/80" />
                </div>
                <span className="ml-2 text-[11px] font-mono text-[#71717A]">
                  workbench.techquery.ai
                </span>
              </div>

              {/* 5 Tabs: ATS Match (Default), AI Roadmap, Coding Arena, CS/HR Studio, AI Mentor */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveTab("ats")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-colors shrink-0 ${
                    activeTab === "ats"
                      ? "bg-[#242429] text-[#10B981] font-semibold border border-[#3F3F46]"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1E]"
                  }`}
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  ATS &amp; JD Skill Match
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("roadmap")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-colors shrink-0 ${
                    activeTab === "roadmap"
                      ? "bg-[#242429] text-[#10B981] font-semibold border border-[#3F3F46]"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1E]"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  AI Study Roadmap
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("coding")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-colors shrink-0 ${
                    activeTab === "coding"
                      ? "bg-[#242429] text-[#10B981] font-semibold border border-[#3F3F46]"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1E]"
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  Coding Arena (20/20)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("cs")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-colors shrink-0 ${
                    activeTab === "cs"
                      ? "bg-[#242429] text-[#10B981] font-semibold border border-[#3F3F46]"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1E]"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  A-to-Z CS &amp; HR Studio
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("mentor")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-colors shrink-0 ${
                    activeTab === "mentor"
                      ? "bg-[#242429] text-[#10B981] font-semibold border border-[#3F3F46]"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1E]"
                  }`}
                >
                  <Bot className="h-3.5 w-3.5" />
                  Context-Locked AI Mentor
                </button>
              </div>
            </div>

            {/* TAB 1: ATS & JD Skill Match (DEFAULT ACTIVE TAB) */}
            {activeTab === "ats" && (
              <div className="p-4 sm:p-6 bg-[#0F0F11] space-y-5">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242429] pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981] font-bold block">
                      Target Role Deconstructed
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Senior Backend Engineer (Distributed Systems) • Acme Cloud
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#10B981]/15 text-[#10B981] font-mono text-xs font-bold border border-[#10B981]/30">
                      ✓ 88% Match Score (HIGH)
                    </span>
                  </div>
                </div>

                {/* Score Breakdown Bar Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="rounded-lg border border-[#242429] bg-[#151518] p-3">
                    <div className="flex items-center justify-between text-[#A1A1AA] mb-1">
                      <span>Must-Have (50%)</span>
                      <strong className="text-white">92%</strong>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#242429] overflow-hidden">
                      <div className="h-full bg-[#10B981] rounded-full w-[92%]" />
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#242429] bg-[#151518] p-3">
                    <div className="flex items-center justify-between text-[#A1A1AA] mb-1">
                      <span>Nice-to-Have (20%)</span>
                      <strong className="text-white">80%</strong>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#242429] overflow-hidden">
                      <div className="h-full bg-[#10B981] rounded-full w-[80%]" />
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#242429] bg-[#151518] p-3">
                    <div className="flex items-center justify-between text-[#A1A1AA] mb-1">
                      <span>Experience (20%)</span>
                      <strong className="text-white">90%</strong>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#242429] overflow-hidden">
                      <div className="h-full bg-[#10B981] rounded-full w-[90%]" />
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#242429] bg-[#151518] p-3">
                    <div className="flex items-center justify-between text-[#A1A1AA] mb-1">
                      <span>Domain Fit (10%)</span>
                      <strong className="text-white">85%</strong>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#242429] overflow-hidden">
                      <div className="h-full bg-[#10B981] rounded-full w-[85%]" />
                    </div>
                  </div>
                </div>

                {/* Skills Detected & Missing Action Pill */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#A1A1AA]">Matched Skills (14 Detected):</span>
                    <span className="text-[#F59E0B]">1 Critical Skill Gap:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {["Java 21", "Node.js", "PostgreSQL", "REST APIs", "Docker", "Microservices", "Kafka"].map(
                      (skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25 text-xs font-mono"
                        >
                          <Check className="h-3 w-3" />
                          {skill}
                        </span>
                      )
                    )}
                    {/* Missing Highlight Action Pill */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/40 text-xs font-mono font-semibold animate-pulse">
                      <AlertTriangle className="h-3 w-3" />
                      + Add System Design Caching &amp; Redis
                    </span>
                  </div>
                </div>

                {/* Actionable Suggestion Callout */}
                <div className="rounded-xl border border-[#242429] bg-[#121215] p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-[#A1A1AA]">
                    <strong className="text-white">ATS Recommendation:</strong> Add 2 quantified bullet
                    points highlighting Redis caching latency improvements (e.g. &ldquo;Reduced DB load by
                    42% with read-through cache&rdquo;) to reach a 95% match.
                  </p>
                  <Link
                    to="/register"
                    className="shrink-0 text-xs font-mono font-semibold text-[#10B981] hover:underline inline-flex items-center gap-1"
                  >
                    View Full ATS Gap Breakdown <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 2: AI Study Roadmap */}
            {activeTab === "roadmap" && (
              <div className="p-4 sm:p-6 bg-[#0F0F11] space-y-5">
                {/* Header with Streak */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242429] pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981] font-bold block">
                      Target Role: SDE-1 (Backend &amp; Distributed Systems)
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      8-Week Tailored Preparation Roadmap • Day 14 of 56
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-mono text-xs font-bold">
                      <Flame className="h-3.5 w-3.5" />
                      14-Day Streak
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-[#A1A1AA]">
                    <span>Interactive Checklist Progress</span>
                    <strong className="text-[#10B981]">{progressPercent}% Completed</strong>
                  </div>
                  <div className="h-2 rounded-full bg-[#242429] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#10B981] to-[#059669] rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Interactive Task Checklist */}
                <div className="space-y-2 text-xs font-mono">
                  <div
                    onClick={() => toggleRoadmapTask("t1")}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      roadmapTasks.t1
                        ? "border-[#10B981]/30 bg-[#10B981]/5 text-white"
                        : "border-[#242429] bg-[#151518] text-[#A1A1AA]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={roadmapTasks.t1}
                      onChange={() => toggleRoadmapTask("t1")}
                      className="h-4 w-4 rounded border-[#242429] bg-[#121215] text-[#10B981] focus:ring-0"
                    />
                    <span className="flex-1">
                      Week 1: Master Two Pointers &amp; Binary Search Patterns (12 Problems)
                    </span>
                    <span className="text-[11px] text-[#10B981]">DSA Core</span>
                  </div>

                  <div
                    onClick={() => toggleRoadmapTask("t2")}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      roadmapTasks.t2
                        ? "border-[#10B981]/30 bg-[#10B981]/5 text-white"
                        : "border-[#242429] bg-[#151518] text-[#A1A1AA]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={roadmapTasks.t2}
                      onChange={() => toggleRoadmapTask("t2")}
                      className="h-4 w-4 rounded border-[#242429] bg-[#121215] text-[#10B981] focus:ring-0"
                    />
                    <span className="flex-1">
                      Week 1: SQL Multi-Table Joins, Group By &amp; Index Tuning (8 Queries)
                    </span>
                    <span className="text-[11px] text-[#3B82F6]">DBMS</span>
                  </div>

                  <div
                    onClick={() => toggleRoadmapTask("t3")}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      roadmapTasks.t3
                        ? "border-[#10B981]/30 bg-[#10B981]/5 text-white"
                        : "border-[#242429] bg-[#151518] text-[#A1A1AA]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={roadmapTasks.t3}
                      onChange={() => toggleRoadmapTask("t3")}
                      className="h-4 w-4 rounded border-[#242429] bg-[#121215] text-[#10B981] focus:ring-0"
                    />
                    <span className="flex-1">
                      Week 2: Process vs Thread &amp; OS Deadlocks (Coffman Conditions)
                    </span>
                    <span className="text-[11px] text-[#A855F7]">OS Core</span>
                  </div>

                  <div
                    onClick={() => toggleRoadmapTask("t4")}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      roadmapTasks.t4
                        ? "border-[#10B981]/30 bg-[#10B981]/5 text-white"
                        : "border-[#242429] bg-[#151518] text-[#A1A1AA]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={roadmapTasks.t4}
                      onChange={() => toggleRoadmapTask("t4")}
                      className="h-4 w-4 rounded border-[#242429] bg-[#121215] text-[#10B981] focus:ring-0"
                    />
                    <span className="flex-1">
                      Week 2: Solve 3 Timed Medium Problems (Sliding Window &amp; Stack)
                    </span>
                    <span className="text-[11px] text-[#F59E0B]">Timed Arena</span>
                  </div>

                  <div
                    onClick={() => toggleRoadmapTask("t5")}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      roadmapTasks.t5
                        ? "border-[#10B981]/30 bg-[#10B981]/5 text-white"
                        : "border-[#242429] bg-[#151518] text-[#A1A1AA]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={roadmapTasks.t5}
                      onChange={() => toggleRoadmapTask("t5")}
                      className="h-4 w-4 rounded border-[#242429] bg-[#121215] text-[#10B981] focus:ring-0"
                    />
                    <span className="flex-1">
                      Week 3: System Design Caching (Redis Eviction &amp; Invalidation)
                    </span>
                    <span className="text-[11px] text-[#EC4899]">System Design</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Coding Arena (20/20) */}
            {activeTab === "coding" && (
              <div className="p-4 sm:p-6 bg-[#0F0F11] space-y-4">
                {/* Meta Header & Language Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242429] pb-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] font-semibold">
                      EASY
                    </span>
                    <span className="text-white font-semibold">#01. Two Sum</span>
                    <span className="text-[#71717A]">• Array, Hash Table</span>
                  </div>

                  {/* Language Selector */}
                  <div className="flex items-center gap-1.5 bg-[#151518] p-1 rounded-lg border border-[#242429]">
                    {(["Java", "Python", "C++", "JavaScript"] as CodeLanguage[]).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                          selectedLanguage === lang
                            ? "bg-[#242429] text-[#10B981] font-semibold"
                            : "text-[#A1A1AA] hover:text-white"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleCopyCode(CODE_SNIPPETS[selectedLanguage])}
                      className="ml-2 inline-flex items-center gap-1 text-[#A1A1AA] hover:text-white text-[11px] px-1.5"
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
                <pre className="overflow-x-auto rounded-lg border border-[#242429] bg-[#121215] p-4 font-mono text-xs sm:text-sm text-[#E4E4E7] leading-relaxed">
                  <code>{CODE_SNIPPETS[selectedLanguage]}</code>
                </pre>

                {/* Telemetry Footer */}
                <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
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
                    <span className="text-[#10B981]">Hidden Cases: 18/18 ✓</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: A-to-Z CS & HR Studio */}
            {activeTab === "cs" && (
              <div className="p-4 sm:p-6 bg-[#0F0F11] space-y-4">
                {/* 8-Subject Selector Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#242429] pb-3">
                  {Object.keys(CS_TOPICS).map((subjKey) => (
                    <button
                      key={subjKey}
                      type="button"
                      onClick={() => setSelectedCsSubject(subjKey)}
                      className={`px-3 py-1 rounded-md text-xs font-mono transition-colors shrink-0 ${
                        selectedCsSubject === subjKey
                          ? "bg-[#242429] text-[#10B981] font-semibold border border-[#3F3F46]"
                          : "text-[#A1A1AA] hover:text-white hover:bg-[#151518]"
                      }`}
                    >
                      {CS_TOPICS[subjKey].subject}
                    </button>
                  ))}
                </div>

                {/* Topic Progression Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="text-white font-bold text-sm">
                    {CS_TOPICS[selectedCsSubject].title}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-semibold text-[11px]">
                    {CS_TOPICS[selectedCsSubject].badge}
                  </span>
                </div>

                {/* Concept and Trap Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="rounded-lg border border-[#242429] bg-[#151518] p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                      Day 1 Core Concept
                    </h4>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">
                      {CS_TOPICS[selectedCsSubject].concept}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#242429] bg-[#151518] p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                      Interview Trap &amp; Optimization
                    </h4>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">
                      {CS_TOPICS[selectedCsSubject].trap}
                    </p>
                  </div>
                </div>

                {/* Actual Interview Question */}
                <div className="rounded-lg border border-[#242429] bg-[#121215] p-3.5 text-xs">
                  <span className="text-[10px] font-mono uppercase text-[#10B981] font-bold block mb-1">
                    Classic Placement Interview Question
                  </span>
                  <p className="font-semibold text-white">
                    {CS_TOPICS[selectedCsSubject].interviewQ}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 5: Context-Locked AI Mentor */}
            {activeTab === "mentor" && (
              <div className="p-4 sm:p-6 bg-[#0F0F11] space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#242429] pb-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
                    <span className="font-semibold text-white">
                      AI Mentor • Context: {MENTOR_PREVIEWS[activeMentorChip].badge}
                    </span>
                  </div>
                  <span className="text-[#71717A] text-[11px]">Groq Waterfall • Free-Tier Fast</span>
                </div>

                {/* Candidate Message */}
                <div className="flex justify-end">
                  <div className="max-w-md rounded-xl bg-[#242429] px-4 py-2.5 text-xs text-white">
                    {MENTOR_PREVIEWS[activeMentorChip].question}
                  </div>
                </div>

                {/* Mentor Reply */}
                <div className="flex justify-start">
                  <div className="max-w-xl rounded-xl border border-[#242429] bg-[#151518] px-4 py-3 text-xs text-[#E4E4E7] space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#10B981] font-bold">
                      <Sparkles className="h-3.5 w-3.5" />
                      {MENTOR_PREVIEWS[activeMentorChip].title}
                    </div>
                    {MENTOR_PREVIEWS[activeMentorChip].content.map((p, idx) => (
                      <p key={idx} className="text-[#A1A1AA] leading-relaxed text-[11px]">
                        {p}
                      </p>
                    ))}
                    <p className="text-[11px] text-[#10B981] font-mono pt-1">
                      {MENTOR_PREVIEWS[activeMentorChip].callout}
                    </p>
                  </div>
                </div>

                {/* Interactive Sample Doubt Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono">
                  <span className="text-[#71717A]">Click to test doubts:</span>
                  {Object.entries(MENTOR_PREVIEWS).map(([key, item]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveMentorChip(key)}
                      className={`rounded-md border px-3 py-1 transition-colors ${
                        activeMentorChip === key
                          ? "border-[#10B981] bg-[#10B981]/15 text-[#10B981] font-bold"
                          : "border-[#242429] bg-[#121215] text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1E]"
                      }`}
                    >
                      &ldquo;{item.question}&rdquo;
                    </button>
                  ))}
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
            <div className="rounded-xl border border-[#242429] bg-[#151518] p-5 shadow-xs hover:border-[#10B981]/50 transition-colors">
              <div className="text-3xl font-extrabold text-[#10B981] font-mono">520+</div>
              <h3 className="mt-1 text-sm font-semibold text-white">
                Curated DSA Master Problems
              </h3>
              <p className="mt-1 text-xs text-[#A1A1AA] leading-relaxed">
                Pattern &amp; company tagged with brute-to-optimal intuition, dry runs, and visual code.
              </p>
            </div>

            <div className="rounded-xl border border-[#242429] bg-[#151518] p-5 shadow-xs hover:border-[#10B981]/50 transition-colors">
              <div className="text-3xl font-extrabold text-[#10B981] font-mono">102</div>
              <h3 className="mt-1 text-sm font-semibold text-white">
                Runnable Coding Arenas
              </h3>
              <p className="mt-1 text-xs text-[#A1A1AA] leading-relaxed">
                2,040 hidden and sample test cases with instant diffs &amp; realistic 60-min timed OAs.
              </p>
            </div>

            <div className="rounded-xl border border-[#242429] bg-[#151518] p-5 shadow-xs hover:border-[#10B981]/50 transition-colors">
              <div className="text-3xl font-extrabold text-[#10B981] font-mono">210</div>
              <h3 className="mt-1 text-sm font-semibold text-white">
                A-to-Z CS &amp; HR Topics
              </h3>
              <p className="mt-1 text-xs text-[#A1A1AA] leading-relaxed">
                Zero-background beginner progression across 8 core technical and behavioral subjects.
              </p>
            </div>

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

      {/* 4. Dedicated Spotlight Section: Resume ATS Diagnostics + Adaptive Roadmaps */}
      <section id="resume-and-roadmap" className="py-16 sm:py-24 border-b border-[#242429] bg-[#0F0F11]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-[#10B981] font-semibold">
              Precision Diagnostic Architecture
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Know Exactly What&apos;s Missing Before You Apply
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#A1A1AA]">
              Most candidates send resumes blind. TechQuery AI performs deterministic keyword decomposition
              against real job descriptions and generates a customized day-by-day plan to bridge the gaps.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Left Card: Before/After ATS Match Breakdown */}
            <div className="rounded-2xl border border-[#242429] bg-[#151518] p-6 sm:p-8 flex flex-col justify-between shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Deterministic ATS Resume &amp; JD Matcher
                    </h3>
                    <p className="text-xs text-[#A1A1AA] font-mono">
                      Mathematical 50/20/20/10 scoring engine
                    </p>
                  </div>
                </div>

                {/* Before / After Comparison Widget */}
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-red-400 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Raw Unaudited Resume
                      </span>
                      <span className="text-red-400 font-bold">54% Match (REJECT RISK)</span>
                    </div>
                    <p className="text-xs text-[#A1A1AA]">
                      Missing Redis caching keywords, generic action verbs (&ldquo;worked on backend&rdquo;),
                      and zero Big-O scalability indicators.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#10B981] font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        TechQuery Optimized Profile
                      </span>
                      <span className="text-[#10B981] font-bold">92% Match (INTERVIEW READY)</span>
                    </div>
                    <p className="text-xs text-[#A1A1AA]">
                      Quantified throughput metrics, exact keyword alignment for Redis &amp; Kafka,
                      and structured STAR project defense bullet points.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#242429] flex items-center justify-between">
                <span className="text-xs font-mono text-[#71717A]">Instant PDFKit Streaming Audit</span>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#10B981] hover:underline"
                >
                  Test Your Resume Free <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Card: Adaptive 8-Week Roadmap Integration */}
            <div className="rounded-2xl border border-[#242429] bg-[#151518] p-6 sm:p-8 flex flex-col justify-between shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Automated Bridge: Gaps Directly Become Roadmap Tasks
                    </h3>
                    <p className="text-xs text-[#A1A1AA] font-mono">
                      Tailored to your target company &amp; timeline
                    </p>
                  </div>
                </div>

                {/* Bridge Illustration */}
                <div className="space-y-3 pt-2 text-xs font-mono">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-[#242429] bg-[#121215]">
                    <div className="h-7 w-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <span className="text-white font-semibold block">Missing Skill: Redis &amp; Caching</span>
                      <span className="text-[#71717A] text-[11px]">
                        → Automatically mapped to Week 3 System Design Caching module
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl border border-[#242429] bg-[#121215]">
                    <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <span className="text-white font-semibold block">Missing Skill: SQL Query Optimization</span>
                      <span className="text-[#71717A] text-[11px]">
                        → Automatically mapped to Week 1 Indexing &amp; Query Tuning module
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl border border-[#242429] bg-[#121215]">
                    <div className="h-7 w-7 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <span className="text-white font-semibold block">Daily Consistency Engine</span>
                      <span className="text-[#71717A] text-[11px]">
                        → Automatic streaks, task checkboxes, and progress retention
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#242429] flex items-center justify-between">
                <span className="text-xs font-mono text-[#71717A]">Adaptive 8-Week Timeline</span>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#10B981] hover:underline"
                >
                  Generate Your Roadmap <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Asymmetric Bento Feature Showcase */}
      <section id="platform-modules" className="py-16 sm:py-24 border-b border-[#242429] bg-[#121215]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-[#10B981] font-semibold">
              Asymmetric Platform Architecture
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Six Interconnected Modules. One Unified Engineering Studio.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#A1A1AA]">
              No fragmented subscriptions, random spreadsheets, or chaotic bookmarked links.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Bento Card 1: Large Span (col-span-1 md:col-span-2) */}
            <div className="col-span-1 md:col-span-2 rounded-2xl border border-[#242429] bg-[#151518] p-6 sm:p-8 hover:border-[#10B981]/50 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10B981]/15 text-[#10B981] group-hover:scale-105 transition-transform">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25">
                    Weighted Mathematical Engine
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#10B981] transition-colors">
                  Deterministic ATS Resume &amp; JD Matcher
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] max-w-xl leading-relaxed">
                  Deconstruct any job description into 4 weighted buckets: 50% must-have skills, 20%
                  nice-to-have, 20% experience alignment, and 10% domain overlap. Generates pinpoint
                  actionable advice to eliminate rejection risks.
                </p>

                {/* Mini Visual UI Widget */}
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg border border-[#242429] bg-[#121215]">
                    <span className="text-[#71717A] text-[10px] block">Must-Have (50%)</span>
                    <strong className="text-white text-sm">92% Matched</strong>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#242429] bg-[#121215]">
                    <span className="text-[#71717A] text-[10px] block">Nice-to-Have (20%)</span>
                    <strong className="text-white text-sm">80% Matched</strong>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#242429] bg-[#121215]">
                    <span className="text-[#71717A] text-[10px] block">Experience (20%)</span>
                    <strong className="text-white text-sm">90% Matched</strong>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#242429] bg-[#121215]">
                    <span className="text-[#71717A] text-[10px] block">Domain (10%)</span>
                    <strong className="text-white text-sm">85% Matched</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 2: AI Roadmaps & Streaks */}
            <div className="rounded-2xl border border-[#242429] bg-[#151518] p-6 sm:p-8 hover:border-[#10B981]/50 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] group-hover:scale-105 transition-transform">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/25">
                    Consistency Engine
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#10B981] transition-colors">
                  Personalized AI Study Roadmaps
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  Generate adaptive day-by-day timelines tailored to your weak areas and target interview
                  dates. Track daily streaks and task completion checkmarks.
                </p>

                {/* Mini Progress Widget */}
                <div className="mt-5 p-3 rounded-xl border border-[#242429] bg-[#121215] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-semibold">Active Roadmap</span>
                    <span className="text-[#F59E0B] font-bold">🔥 14-Day Streak</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#242429] overflow-hidden">
                    <div className="h-full bg-[#10B981] rounded-full w-3/4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 3: 520 DSA Master Sheet */}
            <div className="rounded-2xl border border-[#242429] bg-[#151518] p-6 sm:p-8 hover:border-[#10B981]/50 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10B981]/15 text-[#10B981] group-hover:scale-105 transition-transform">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#242429] text-[#D4D4D8]">
                    Pattern-Curated
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#10B981] transition-colors">
                  Master DSA Sheet (520 Problems)
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  Progressive pattern sheet from Two Pointers to DP. Includes brute-to-optimal intuition,
                  visual code, and company frequency tags.
                </p>

                <div className="mt-5 flex flex-wrap gap-1.5 text-[11px] font-mono text-[#71717A]">
                  <span className="px-2 py-0.5 rounded bg-[#121215] text-[#D4D4D8] border border-[#242429]">
                    Sliding Window
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#121215] text-[#D4D4D8] border border-[#242429]">
                    Two Pointers
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#121215] text-[#D4D4D8] border border-[#242429]">
                    DP Patterns
                  </span>
                </div>
              </div>
            </div>

            {/* Bento Card 4: 102 Runnable Coding Arenas */}
            <div className="rounded-2xl border border-[#242429] bg-[#151518] p-6 sm:p-8 hover:border-[#10B981]/50 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10B981]/15 text-[#10B981] group-hover:scale-105 transition-transform">
                    <Terminal className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#242429] text-[#D4D4D8]">
                    2,040 Test Cases
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#10B981] transition-colors">
                  Coding Arena &amp; Timed OAs
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  Run Java, Python, C++, or JS against 20 edge-case test cases with instant diffs. Simulate
                  realistic 60-minute Online Assessments with draft autosave.
                </p>

                <div className="mt-5 p-2.5 rounded-lg border border-[#10B981]/30 bg-[#10B981]/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#10B981] font-semibold">✓ 20/20 Test Cases Passed</span>
                  <span className="text-[#71717A]">1.4 ms</span>
                </div>
              </div>
            </div>

            {/* Bento Card 5: 210 CS & HR Prep Studio */}
            <div className="rounded-2xl border border-[#242429] bg-[#151518] p-6 sm:p-8 hover:border-[#10B981]/50 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10B981]/15 text-[#10B981] group-hover:scale-105 transition-transform">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#242429] text-[#D4D4D8]">
                    8 Subjects
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#10B981] transition-colors">
                  A-to-Z CS &amp; HR Prep Studio
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                  210 beginner-friendly topics across Operating Systems, DBMS, SQL Queries, Computer
                  Networks, OOP, Software Engineering, System Design, and HR Behavioral.
                </p>

                <div className="mt-5 flex flex-wrap gap-1 text-[10px] font-mono text-[#A1A1AA]">
                  {["OS", "DBMS", "SQL", "Networks", "OOP", "SE", "System Design", "HR"].map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-[#121215] border border-[#242429]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bento Card 6: Global AI Mentor */}
            <div id="ai-mentor" className="col-span-1 md:col-span-2 lg:col-span-3 rounded-2xl border border-[#242429] bg-[#151518] p-6 sm:p-8 hover:border-[#10B981]/50 transition-all group scroll-mt-20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10B981]/15 text-[#10B981]">
                      <Bot className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25">
                      Multi-Model Groq Waterfall
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#10B981] transition-colors">
                    Context-Locked Global AI Mentor
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                    Embedded directly inside every problem, topic, roadmap task, and ATS audit. Ask
                    follow-up doubts (&ldquo;explain in simpler words&rdquo;, &ldquo;why did Case #4 fail?&rdquo;, &ldquo;trace with an
                    example&rdquo;) without losing your code or place.
                  </p>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    to="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#0F0F11] font-semibold text-xs transition-all shadow-xs"
                  >
                    Try AI Mentor Free <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. 3-Step Workflow Strip */}
      <section id="how-it-works" className="py-16 sm:py-24 border-b border-[#242429] bg-[#0F0F11]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-[#10B981] font-semibold">
              Structured Methodology
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              From First Audit to Final Offer: The 3-Step Engine
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-[#242429] bg-[#151518] p-6 relative">
              <span className="text-2xl font-mono font-bold text-[#10B981] block mb-3">01.</span>
              <h3 className="text-base font-bold text-white mb-2">Audit Resume &amp; Map Gaps</h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Upload your resume, analyze your target job description, identify critical skill gaps,
                and generate a personalized day-by-day roadmap tailored to your target company.
              </p>
            </div>

            <div className="rounded-xl border border-[#242429] bg-[#151518] p-6 relative">
              <span className="text-2xl font-mono font-bold text-[#10B981] block mb-3">02.</span>
              <h3 className="text-base font-bold text-white mb-2">Follow Your AI Roadmap</h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Work through pattern-curated DSA problems, run code against 20 edge-case tests in the
                coding arena, and master zero-background CS fundamentals step-by-step.
              </p>
            </div>

            <div className="rounded-xl border border-[#242429] bg-[#151518] p-6 relative">
              <span className="text-2xl font-mono font-bold text-[#10B981] block mb-3">03.</span>
              <h3 className="text-base font-bold text-white mb-2">Simulate OAs &amp; Ace Interviews</h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Take realistic 60-minute timed OA sessions, practice behavioral HR prompts with the
                STAR method, and resolve doubts instantly with your context-locked AI Mentor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Bottom Conversion Banner */}
      <section className="py-16 sm:py-20 border-b border-[#242429] bg-[#121215]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#10B981]/30 bg-gradient-to-b from-[#151518] to-[#121215] p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981] text-xs font-mono mb-4">
              <Zap className="h-3.5 w-3.5" />
              <span>Placement Season 2026 Ready</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight max-w-2xl mx-auto">
              Ready to engineer your placement prep?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#A1A1AA] max-w-xl mx-auto leading-relaxed">
              Join candidates mastering ATS resume matching, DSA patterns, CS fundamentals, and live coding
              with TechQuery AI&apos;s distraction-free studio.
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

      {/* 8. Minimal Clean Footer */}
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
            <a href="#resume-and-roadmap" className="hover:text-white transition-colors">
              ATS &amp; Roadmap
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
