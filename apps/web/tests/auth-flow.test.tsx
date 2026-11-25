import { StrictMode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider, useAuth } from "@/features/auth/auth.context";
import { PublicRoute, ProtectedRoute } from "@/app/guards";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";
import * as authApi from "@/features/auth/auth.api";

vi.mock("@/features/auth/auth.api", async () => {
  const actual = await vi.importActual<typeof import("@/features/auth/auth.api")>(
    "@/features/auth/auth.api"
  );
  return {
    ...actual,
    refreshApi: vi.fn(),
    loginApi: vi.fn(),
    registerApi: vi.fn(),
    verifyEmailApi: vi.fn(),
    resendVerificationApi: vi.fn(),
    logoutApi: vi.fn(),
  };
});

describe("Authentication Pages & Route Guards (Phase F2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no existing cookie session on mount
    vi.mocked(authApi.refreshApi).mockRejectedValue(new Error("No session"));
  });

  it("1. LoginPage validates empty fields and submits valid credentials to redirect to /dashboard", async () => {
    vi.mocked(authApi.loginApi).mockResolvedValue({
      user: {
        id: "user-1",
        name: "Jane Candidate",
        email: "jane@example.com",
        role: "CANDIDATE",
        tier: "FREE",
        isVerified: true,
      },
      accessToken: "mock.jwt.token",
    });

    render(
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={["/login"]}>
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<div>Dashboard Page</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    );

    // Wait for initial silent refresh check to settle
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    });

    // Submit empty form -> validation errors
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });

    // Fill valid credentials
    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "ValidPassword123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(authApi.loginApi).toHaveBeenCalledWith({
        email: "jane@example.com",
        password: "ValidPassword123!",
      });
      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    });
  });

  it("2. RegisterPage updates live password checklist and navigates to /verify-email on success", async () => {
    vi.mocked(authApi.registerApi).mockResolvedValue({
      user: {
        id: "user-2",
        name: "Alex Dev",
        email: "alex@example.com",
        role: "CANDIDATE",
        tier: "FREE",
        isVerified: false,
      },
      message: "Account created successfully.",
    });

    render(
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={["/register"]}>
            <Routes>
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText("Password");
    fireEvent.change(passwordInput, { target: { value: "Strong1!" } });

    // All 5 checklist items should be marked met (text-primary)
    const checklist = screen.getByRole("list", { name: "Password requirements" });
    expect(checklist.querySelectorAll("li.text-primary")).toHaveLength(5);

    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "Alex Dev" },
    });
    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "alex@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(authApi.registerApi).toHaveBeenCalledWith({
        name: "Alex Dev",
        email: "alex@example.com",
        password: "Strong1!",
      });
      expect(screen.getByText("Verify your email address")).toBeInTheDocument();
    });
  });

  it("3. VerifyEmailPage auto-verifies via ?token= query param and supports manual token submission", async () => {
    const validHexToken = "a".repeat(64);
    vi.mocked(authApi.verifyEmailApi).mockResolvedValue({
      user: {
        id: "user-3",
        name: "Verified User",
        email: "verified@example.com",
        role: "CANDIDATE",
        tier: "FREE",
        isVerified: true,
      },
      message: "Email verified successfully.",
    });

    // Part A: Auto-verification via ?token=
    const { unmount } = render(
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[`/verify-email?token=${validHexToken}`]}>
            <Routes>
              <Route path="/verify-email" element={<VerifyEmailPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(authApi.verifyEmailApi).toHaveBeenCalledWith({ token: validHexToken });
      expect(screen.getByText("Email Verified")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Continue to Sign In" })).toBeInTheDocument();
    });

    unmount();
    vi.clearAllMocks();

    // Part B: Manual token submission
    const manualToken = "b".repeat(64);
    render(
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={["/verify-email"]}>
            <Routes>
              <Route path="/verify-email" element={<VerifyEmailPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    );

    fireEvent.change(screen.getByLabelText("Verification Token"), {
      target: { value: manualToken },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify Email" }));

    await waitFor(() => {
      expect(authApi.verifyEmailApi).toHaveBeenCalledWith({ token: manualToken });
      expect(screen.getByText("Email Verified")).toBeInTheDocument();
    });
  });

  it("4. ProtectedRoute redirects unauthenticated users to /login and PublicRoute redirects authenticated users to /dashboard", async () => {
    // Unauthenticated -> ProtectedRoute redirects to /login
    const { unmount } = render(
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={["/dashboard"]}>
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<div>Login Screen</div>} />
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<div>Protected Dashboard</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Login Screen")).toBeInTheDocument();
    });
    unmount();

    // Authenticated via silent refresh -> PublicRoute redirects /login to /dashboard
    const payloadB64 = btoa(
      JSON.stringify({ sub: "user-1", role: "CANDIDATE", tier: "PRO" })
    );
    vi.mocked(authApi.refreshApi).mockResolvedValue({
      accessToken: `header.${payloadB64}.sig`,
    });

    render(
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={["/login"]}>
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<div>Login Screen</div>} />
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<div>Protected Dashboard</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Protected Dashboard")).toBeInTheDocument();
    });
  });

  it("5. deduplicates POST /auth/refresh under React.StrictMode and restores session on reload", async () => {
    const payloadB64 = btoa(
      JSON.stringify({ sub: "user-strict-1", role: "CANDIDATE", tier: "PRO" })
    );
    vi.mocked(authApi.refreshApi).mockResolvedValue({
      accessToken: `header.${payloadB64}.sig`,
    });

    function SessionProbe() {
      const { isAuthenticated, user } = useAuth();
      return (
        <div>
          <span>{isAuthenticated ? "AUTH_OK" : "AUTH_NONE"}</span>
          <span>{user?.id}</span>
          <span>{user?.tier}</span>
        </div>
      );
    }

    render(
      <StrictMode>
        <ToastProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={["/dashboard"]}>
              <Routes>
                <Route element={<PublicRoute />}>
                  <Route path="/login" element={<div>Login Screen</div>} />
                </Route>
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<SessionProbe />} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </ToastProvider>
      </StrictMode>
    );

    await waitFor(() => {
      expect(screen.getByText("AUTH_OK")).toBeInTheDocument();
      expect(screen.getByText("user-strict-1")).toBeInTheDocument();
      expect(screen.getByText("PRO")).toBeInTheDocument();
    });

    expect(authApi.refreshApi).toHaveBeenCalledTimes(1);
  });
});
