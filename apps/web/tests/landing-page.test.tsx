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

  it("renders the public landing page with obsidian precision sections and CTAs when logged out", async () => {
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
          name: /Master DSA, CS Fundamentals & System Design From Day 1 to Offer/i,
        })
      ).toBeInTheDocument();
    });

    // Brand and Navigation links
    expect(screen.getAllByText("TechQuery AI")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Platform Modules")[0]).toBeInTheDocument();
    expect(screen.getAllByText("AI Mentor")[0]).toBeInTheDocument();
    expect(screen.getAllByText("How It Works")[0]).toBeInTheDocument();

    // Primary & Secondary CTAs
    const startPrepLinks = screen.getAllByRole("link", { name: /Start Free Prep|Launch Free Workbench|Create Free Account/i });
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

    // Core module titles
    expect(screen.getByText("Master DSA Sheet (520 Problems)")).toBeInTheDocument();
    expect(screen.getByText("Coding Arena & Timed OAs")).toBeInTheDocument();
    expect(screen.getByText("A-to-Z CS & HR Prep Studio")).toBeInTheDocument();
    expect(screen.getByText("Context-Locked Global AI Mentor")).toBeInTheDocument();
    expect(screen.getByText("Deterministic ATS & JD Matcher")).toBeInTheDocument();
    expect(screen.getByText("Personalized AI Study Roadmaps")).toBeInTheDocument();
  });

  it("supports interactive tab switching inside the workbench mockup", async () => {
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

    await waitFor(() => {
      expect(screen.getByText(/20\/20 Test Cases Passed/i)).toBeInTheDocument();
    });

    // Switch to CS & HR Studio tab
    const csTab = screen.getByRole("button", { name: /CS & HR Studio/i });
    fireEvent.click(csTab);
    expect(screen.getByText(/Topic #04: Process vs Thread/i)).toBeInTheDocument();
    expect(screen.getByText(/Day 1 Core Concept/i)).toBeInTheDocument();

    // Switch to Ask AI Mentor tab
    const mentorTab = screen.getByRole("button", { name: /Ask AI Mentor/i });
    fireEvent.click(mentorTab);
    expect(screen.getByText(/AI Mentor • Context: Deadlock/i)).toBeInTheDocument();
    expect(screen.getByText(/Everyday Analogy: The Single-Lane Bridge/i)).toBeInTheDocument();

    // Switch back to Coding Arena tab
    const codingTab = screen.getByRole("button", { name: /Coding Arena/i });
    fireEvent.click(codingTab);
    expect(screen.getByText(/#01\. Two Sum/i)).toBeInTheDocument();
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
              <Route path="/dashboard" element={<div data-testid="dashboard-screen">Protected Workbench Dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument();
    });
    expect(screen.queryByText(/A-to-Z Placement Engineering Studio/i)).not.toBeInTheDocument();
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
