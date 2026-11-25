import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/features/auth/auth.context";
import { OnboardingGuard } from "@/app/guards";
import { OnboardingPage } from "@/features/onboarding/pages/OnboardingPage";
import { ProfilePage } from "@/features/onboarding/pages/ProfilePage";
import { ProfileSettingsDialog } from "@/features/onboarding/components/ProfileSettingsDialog";
import * as authApi from "@/features/auth/auth.api";
import * as candidateApi from "@/features/onboarding/candidate.api";

vi.mock("@/features/auth/auth.api", async () => {
  const actual = await vi.importActual<typeof import("@/features/auth/auth.api")>(
    "@/features/auth/auth.api"
  );
  return {
    ...actual,
    refreshApi: vi.fn(),
    logoutApi: vi.fn(),
  };
});

vi.mock("@/features/onboarding/candidate.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/onboarding/candidate.api")
  >("@/features/onboarding/candidate.api");
  return {
    ...actual,
    getProfileApi: vi.fn(),
    createProfileApi: vi.fn(),
    updateProfileApi: vi.fn(),
    getOnboardingApi: vi.fn(),
    updateOnboardingApi: vi.fn(),
  };
});

function createTestWrapper(initialEntries: string[], children: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe("Candidate Onboarding Wizard, OnboardingGuard & Profile Editor (Phase F3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const payloadB64 = btoa(
      JSON.stringify({ sub: "user-1", role: "CANDIDATE", tier: "FREE" })
    );
    vi.mocked(authApi.refreshApi).mockResolvedValue({
      accessToken: `header.${payloadB64}.sig`,
    });
  });

  it("1. OnboardingGuard redirects incomplete users from /dashboard to /onboarding and completed users from /onboarding to /dashboard", async () => {
    // Part A: Incomplete onboarding -> /dashboard redirects to /onboarding
    vi.mocked(candidateApi.getProfileApi).mockResolvedValue(null);
    vi.mocked(candidateApi.getOnboardingApi).mockResolvedValue({
      id: "ob-1",
      userId: "user-1",
      onboardingCompleted: false,
      onboardingStep: "PROFILE",
      onboardingCompletedAt: null,
      createdAt: "2026-11-25T00:00:00Z",
      updatedAt: "2026-11-25T00:00:00Z",
    });

    const { unmount } = render(
      createTestWrapper(
        ["/dashboard"],
        <Routes>
          <Route element={<OnboardingGuard requireCompleted={false} />}>
            <Route path="/onboarding" element={<div>Onboarding Wizard Screen</div>} />
          </Route>
          <Route element={<OnboardingGuard requireCompleted={true} />}>
            <Route path="/dashboard" element={<div>Dashboard Screen</div>} />
          </Route>
        </Routes>
      )
    );

    await waitFor(() => {
      expect(screen.getByText("Onboarding Wizard Screen")).toBeInTheDocument();
    });
    unmount();

    // Part B: Completed onboarding -> /onboarding redirects to /dashboard
    vi.mocked(candidateApi.getOnboardingApi).mockResolvedValue({
      id: "ob-1",
      userId: "user-1",
      onboardingCompleted: true,
      onboardingStep: "COMPLETED",
      onboardingCompletedAt: "2026-11-25T01:00:00Z",
      createdAt: "2026-11-25T00:00:00Z",
      updatedAt: "2026-11-25T01:00:00Z",
    });

    render(
      createTestWrapper(
        ["/onboarding"],
        <Routes>
          <Route element={<OnboardingGuard requireCompleted={false} />}>
            <Route path="/onboarding" element={<div>Onboarding Wizard Screen</div>} />
          </Route>
          <Route element={<OnboardingGuard requireCompleted={true} />}>
            <Route path="/dashboard" element={<div>Dashboard Screen</div>} />
          </Route>
        </Routes>
      )
    );

    await waitFor(() => {
      expect(screen.getByText("Dashboard Screen")).toBeInTheDocument();
    });
  });

  it("2. walks through all 3 steps of OnboardingPage, manages skill tags, saves profile & completes onboarding", async () => {
    vi.mocked(candidateApi.getProfileApi).mockResolvedValue(null);
    vi.mocked(candidateApi.getOnboardingApi).mockResolvedValue({
      id: "ob-1",
      userId: "user-1",
      onboardingCompleted: false,
      onboardingStep: "PROFILE",
      onboardingCompletedAt: null,
      createdAt: "2026-11-25T00:00:00Z",
      updatedAt: "2026-11-25T00:00:00Z",
    });

    vi.mocked(candidateApi.createProfileApi).mockResolvedValue({
      id: "prof-1",
      userId: "user-1",
      fullName: "Saquib Ansari",
      phoneNumber: null,
      location: "Bengaluru, India",
      headline: "Backend Engineer",
      summary: "Core Skills: TypeScript, Docker",
      currentRole: "SDE-1",
      yearsOfExperience: 2,
      highestEducation: "MCA",
      university: "NIT",
      graduationYear: 2026,
      linkedinUrl: null,
      githubUrl: "https://github.com/saquib",
      portfolioUrl: null,
      createdAt: "2026-11-25T00:00:00Z",
      updatedAt: "2026-11-25T00:00:00Z",
    });

    vi.mocked(candidateApi.updateOnboardingApi).mockResolvedValue({
      id: "ob-1",
      userId: "user-1",
      onboardingCompleted: true,
      onboardingStep: "COMPLETED",
      onboardingCompletedAt: "2026-11-25T01:00:00Z",
      createdAt: "2026-11-25T00:00:00Z",
      updatedAt: "2026-11-25T01:00:00Z",
    });

    render(
      createTestWrapper(
        ["/onboarding"],
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<div>Onboarded Dashboard</div>} />
        </Routes>
      )
    );

    // Wait for step 1 to render
    await waitFor(() => {
      expect(screen.getByLabelText("Full Name *")).toBeInTheDocument();
    });

    // Step 1 validation check when Target Role is empty
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    await waitFor(() => {
      expect(screen.getByText("Target role is required")).toBeInTheDocument();
    });

    // Fill Step 1
    fireEvent.change(screen.getByLabelText("Full Name *"), {
      target: { value: "Saquib Ansari" },
    });
    fireEvent.change(screen.getByLabelText("Target Role *"), {
      target: { value: "SDE-1" },
    });
    fireEvent.change(screen.getByLabelText("Years of Experience"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Bengaluru, India" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    // Step 2
    await waitFor(() => {
      expect(screen.getByLabelText("Degree / Program *")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText("Degree / Program *"), {
      target: { value: "MCA" },
    });
    fireEvent.change(screen.getByLabelText("Institution / University"), {
      target: { value: "NIT" },
    });
    fireEvent.change(screen.getByLabelText("Graduation Year"), {
      target: { value: "2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    // Step 3: Interactive skill tags + links
    await waitFor(() => {
      expect(screen.getByLabelText("Add technical skill")).toBeInTheDocument();
    });

    // Click suggested skill
    fireEvent.click(screen.getByRole("button", { name: "+ TypeScript" }));
    // Add custom skill via Enter
    const skillInput = screen.getByLabelText("Add technical skill");
    fireEvent.change(skillInput, { target: { value: "Docker" } });
    fireEvent.keyDown(skillInput, { key: "Enter" });
    // Add & remove another skill
    fireEvent.change(skillInput, { target: { value: "TempSkill" } });
    fireEvent.click(screen.getByRole("button", { name: /Add$/i }));
    fireEvent.click(screen.getByRole("button", { name: "Remove TempSkill" }));

    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
    expect(screen.queryByText("TempSkill")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("GitHub URL"), {
      target: { value: "https://github.com/saquib" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Complete Setup/i }));

    await waitFor(() => {
      expect(candidateApi.createProfileApi).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Saquib Ansari",
          currentRole: "SDE-1",
          highestEducation: "MCA",
          summary: "Core Skills: TypeScript, Docker",
          githubUrl: "https://github.com/saquib",
        })
      );
      expect(candidateApi.updateOnboardingApi).toHaveBeenCalledWith({
        onboardingStep: "COMPLETED",
        markCompleted: true,
      });
      expect(screen.getByText("Onboarded Dashboard")).toBeInTheDocument();
    });
  });

  it("3. ProfileSettingsDialog loads existing profile and saves updates via PATCH /profile", async () => {
    vi.mocked(candidateApi.getProfileApi).mockResolvedValue({
      id: "prof-1",
      userId: "user-1",
      fullName: "Saquib Ansari",
      phoneNumber: null,
      location: "Bengaluru, India",
      headline: "Backend Engineer",
      summary: "Core Skills: TypeScript",
      currentRole: "SDE-1",
      yearsOfExperience: 2,
      highestEducation: "MCA",
      university: "NIT",
      graduationYear: 2026,
      linkedinUrl: null,
      githubUrl: null,
      portfolioUrl: null,
      createdAt: "2026-11-25T00:00:00Z",
      updatedAt: "2026-11-25T00:00:00Z",
    });

    vi.mocked(candidateApi.updateProfileApi).mockResolvedValue({
      id: "prof-1",
      userId: "user-1",
      fullName: "Saquib Ansari",
      phoneNumber: null,
      location: "Pune, India",
      headline: "Backend Engineer",
      summary: "Core Skills: TypeScript",
      currentRole: "Senior Backend Engineer",
      yearsOfExperience: 2,
      highestEducation: "MCA",
      university: "NIT",
      graduationYear: 2026,
      linkedinUrl: null,
      githubUrl: null,
      portfolioUrl: null,
      createdAt: "2026-11-25T00:00:00Z",
      updatedAt: "2026-11-25T00:00:00Z",
    });

    const onClose = vi.fn();

    render(
      createTestWrapper(
        ["/dashboard"],
        <ProfileSettingsDialog open={true} onClose={onClose} />
      )
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("SDE-1")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Target Role"), {
      target: { value: "Senior Backend Engineer" },
    });
    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Pune, India" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(candidateApi.updateProfileApi).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRole: "Senior Backend Engineer",
          location: "Pune, India",
        })
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("4. ProfilePage renders identity summary, completeness bar, and saves edited fields via PATCH /profile", async () => {
    vi.mocked(candidateApi.getProfileApi).mockResolvedValue({
      id: "prof-1",
      userId: "user-1",
      fullName: "Saquib Ansari",
      phoneNumber: null,
      location: "Bengaluru, India",
      headline: "Backend Engineer",
      summary: "Core Skills: TypeScript, Node.js",
      currentRole: "SDE-1",
      yearsOfExperience: 2,
      highestEducation: "MCA",
      university: "NIT",
      graduationYear: 2026,
      linkedinUrl: null,
      githubUrl: null,
      portfolioUrl: null,
      createdAt: "2026-11-25T00:00:00Z",
      updatedAt: "2026-11-25T00:00:00Z",
    });

    vi.mocked(candidateApi.updateProfileApi).mockResolvedValue({
      id: "prof-1",
      userId: "user-1",
      fullName: "Saquib Ansari",
      phoneNumber: null,
      location: "Hyderabad, India",
      headline: "Backend Engineer",
      summary: "Core Skills: TypeScript, Node.js",
      currentRole: "Staff Backend Engineer",
      yearsOfExperience: 2,
      highestEducation: "MCA",
      university: "NIT",
      graduationYear: 2026,
      linkedinUrl: null,
      githubUrl: null,
      portfolioUrl: null,
      createdAt: "2026-11-25T00:00:00Z",
      updatedAt: "2026-11-25T00:00:00Z",
    });

    render(
      createTestWrapper(
        ["/profile"],
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      )
    );

    await waitFor(() => {
      expect(screen.getByText("Profile Completeness")).toBeInTheDocument();
      expect(screen.getByText("78%")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Sign Out All Devices/i })).toBeInTheDocument();
      expect(screen.getAllByText("SDE-1").length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getByRole("button", { name: /Edit Profile/i }));
    expect(screen.getByText("Editing Mode")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Target Role"), {
      target: { value: "Staff Backend Engineer" },
    });
    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Hyderabad, India" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Save Profile Changes/i }));

    await waitFor(() => {
      expect(candidateApi.updateProfileApi).toHaveBeenCalledWith(
        expect.objectContaining({
          currentRole: "Staff Backend Engineer",
          location: "Hyderabad, India",
        })
      );
      expect(screen.getByRole("button", { name: /Edit Profile/i })).toBeInTheDocument();
      expect(screen.getAllByText("Staff Backend Engineer").length).toBeGreaterThanOrEqual(1);
    });
  });
});
