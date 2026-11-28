import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/features/auth/auth.context";
import { LandingPage } from "@/features/landing/LandingPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import * as authApi from "@/features/auth/auth.api";

vi.mock("@/features/auth/auth.api", async () => {
  const actual = await vi.importActual<typeof import("@/features/auth/auth.api")>(
    "@/features/auth/auth.api"
  );
  return {
    ...actual,
    refreshApi: vi.fn(),
    loginApi: vi.fn(),
  };
});

describe("V2.9 LandingPage & Auth Routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authApi.refreshApi).mockRejectedValue(new Error("No active session"));
  });

  it("renders the redesigned public landing page with ATS positioning, spotlight, and CTAs when logged out", async () => {
    render(
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={["/"]}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<div>Sign In Page</div>} />
              <Route path="/register" element={<div>Register Page</div>} />
              <Route path="/dashboard" element={<div>Dashboard Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    );

    // Headline and subheadline
    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: /From ATS Resume Match to Offer Letter/i,
        })
      ).toBeInTheDocument();
    });

    // Pill badge
    expect(screen.getByText("End-to-End Career & Interview Engineering Studio")).toBeInTheDocument();

    // Brand and Navigation links
    expect(screen.getAllByText("TechQuery AI")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Platform Modules")[0]).toBeInTheDocument();
    expect(screen.getAllByText("ATS & Roadmap")[0]).toBeInTheDocument();
    expect(screen.getAllByText("AI Mentor")[0]).toBeInTheDocument();
    expect(screen.getAllByText("How It Works")[0]).toBeInTheDocument();

    // Primary & Secondary CTAs
    const startPrepLinks = screen.getAllByRole("link", {
      name: /Start Free Prep|Launch Free Workbench|Create Free Account/i,
    });
    expect(startPrepLinks.length).toBeGreaterThanOrEqual(2);
    expect(startPrepLinks[0]).toHaveAttribute("href", "/register");

    const signInLinks = screen.getAllByRole("link", { name: /Sign In/i });
    expect(signInLinks.length).toBeGreaterThanOrEqual(2);
    expect(signInLinks[0]).toHaveAttribute("href", "/login");

    // Key metrics strip
    expect(screen.getByText("520+")).toBeInTheDocument();
    expect(screen.getByText("Curated DSA Master Problems")).toBeInTheDocument();
    expect(screen.getByText("102")).toBeInTheDocument();
    expect(screen.getByText("Runnable Coding Arenas")).toBeInTheDocument();
    expect(screen.getByText("210")).toBeInTheDocument();
    expect(screen.getByText("A-to-Z CS & HR Topics")).toBeInTheDocument();
    expect(screen.getByText("24/7")).toBeInTheDocument();

    // Dedicated Spotlight section
    expect(screen.getByText("Know Exactly What's Missing Before You Apply")).toBeInTheDocument();
    expect(screen.getByText("Raw Unaudited Resume")).toBeInTheDocument();
    expect(screen.getByText("TechQuery Optimized Profile")).toBeInTheDocument();

    // Core module titles in Bento
    expect(screen.getAllByText("Deterministic ATS Resume & JD Matcher")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Personalized AI Study Roadmaps")[0]).toBeInTheDocument();
    expect(screen.getByText("Master DSA Sheet (520 Problems)")).toBeInTheDocument();
    expect(screen.getByText("Coding Arena & Timed OAs")).toBeInTheDocument();
    expect(screen.getByText("A-to-Z CS & HR Prep Studio")).toBeInTheDocument();
    expect(screen.getByText("Context-Locked Global AI Mentor")).toBeInTheDocument();
  });

  it("supports interactive tab switching across all 5 live workbench tabs with state updates", async () => {
    render(
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={["/"]}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    );

    // 1. Default Tab: ATS & JD Skill Match
    await waitFor(() => {
      expect(screen.getByText(/✓ 88% Match Score \(HIGH\)/i)).toBeInTheDocument();
    });
    expect(screen.getByText("+ Add System Design Caching & Redis")).toBeInTheDocument();
    expect(screen.getAllByText(/Must-Have \(50%\)/i)[0]).toBeInTheDocument();

    // 2. Switch to AI Study Roadmap Tab
    const roadmapTab = screen.getByRole("button", { name: /AI Study Roadmap/i });
    fireEvent.click(roadmapTab);
    expect(screen.getAllByText(/14-Day Streak/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Interactive Checklist Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Week 1: Master Two Pointers/i)).toBeInTheDocument();

    // Toggle interactive checkbox in Roadmap
    const task4 = screen.getByText(/Solve 3 Timed Medium Problems/i);
    fireEvent.click(task4);
    // Verified checkbox clicked without error

    // 3. Switch to Coding Arena Tab & test multi-language switcher
    const codingTab = screen.getByRole("button", { name: /Coding Arena/i });
    fireEvent.click(codingTab);
    expect(screen.getAllByText(/20\/20 Test Cases Passed/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/class Solution {/i)).toBeInTheDocument();

    // Click Python button
    const pythonBtn = screen.getByRole("button", { name: "Python" });
    fireEvent.click(pythonBtn);
    expect(screen.getByText(/def twoSum/i)).toBeInTheDocument();

    // 4. Switch to A-to-Z CS & HR Studio Tab & test subject selector
    const csTab = screen.getByRole("button", { name: /A-to-Z CS & HR Studio/i });
    fireEvent.click(csTab);
    expect(screen.getByText(/Topic #04: Process vs Thread/i)).toBeInTheDocument();

    // Click System Design subject pill
    const sdBtn = screen.getByRole("button", { name: /HIGH-LEVEL SYSTEM DESIGN/i });
    fireEvent.click(sdBtn);
    expect(screen.getByText(/Topic #03: Scalable Caching/i)).toBeInTheDocument();

    // 5. Switch to Context-Locked AI Mentor Tab & test doubt chip switcher
    const mentorTab = screen.getByRole("button", { name: /Context-Locked AI Mentor/i });
    fireEvent.click(mentorTab);
    expect(screen.getByText(/AI Mentor • Context: OS • Coffman Conditions/i)).toBeInTheDocument();
    expect(screen.getByText(/The Single-Lane Bridge/i)).toBeInTheDocument();

    // Click binary search doubt chip
    const bsChip = screen.getByRole("button", { name: /Why did my binary search loop fail\?/i });
    fireEvent.click(bsChip);
    expect(screen.getByText(/Classic Bug: Integer Overflow & Midpoint Update/i)).toBeInTheDocument();

    // 6. Switch back to ATS & JD Skill Match
    const atsTab = screen.getByRole("button", { name: /ATS & JD Skill Match/i });
    fireEvent.click(atsTab);
    expect(screen.getByText(/✓ 88% Match Score \(HIGH\)/i)).toBeInTheDocument();
  });

  it("automatically redirects authenticated users from / to /dashboard", async () => {
    const payloadB64 = btoa(
      JSON.stringify({
        sub: "candidate-123",
        name: "Alex Engineer",
        email: "alex@techquery.ai",
        role: "CANDIDATE",
        tier: "FREE",
      })
    );
    vi.mocked(authApi.refreshApi).mockResolvedValueOnce({
      accessToken: `mock.${payloadB64}.sig`,
    });

    render(
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={["/"]}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/dashboard"
                element={<div data-testid="dashboard-screen">Protected Workbench Dashboard</div>}
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/End-to-End Career & Interview Engineering Studio/i)
    ).not.toBeInTheDocument();
  });

  it("renders 'Back to Overview' link and updated V2.9 highlights on /login page", async () => {
    render(
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={["/login"]}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<div>Overview Landing Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    );

    // Link back to overview
    const backLink = screen.getByRole("link", { name: /Back to Overview/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");

    // Updated highlights in right showcase
    expect(screen.getByText("V2.9 Studio")).toBeInTheDocument();
    expect(screen.getByText(/520 Master DSA & 102 Runnable Coding Challenges/i)).toBeInTheDocument();
    expect(screen.getByText(/210 A-to-Z CS & HR Topics Across 8 Subjects/i)).toBeInTheDocument();
  });
});
