import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/features/auth/auth.context";
import { PublicRoute, ProtectedRoute, OnboardingGuard } from "@/app/guards";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";
import { OnboardingPage } from "@/features/onboarding/pages/OnboardingPage";
import { ProfilePage } from "@/features/onboarding/pages/ProfilePage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { ResumesPage } from "@/features/resumes/pages/ResumesPage";
import { JobDescriptionsPage } from "@/features/job-descriptions/pages/JobDescriptionsPage";
import { MatchesPage } from "@/features/matching/pages/MatchesPage";
import { QuestionsPage } from "@/features/questions/pages/QuestionsPage";
import { CodingArenaPage } from "@/features/coding/pages/CodingArenaPage";
import { CsFundamentalsPage } from "@/features/cs-fundamentals/CsFundamentalsPage";
import { RoadmapPage } from "@/features/roadmap/RoadmapPage";
import { LibraryPage } from "@/features/library/pages/LibraryPage";
import { UsagePage } from "@/features/usage/pages/UsagePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Guest-Only Authentication Routes */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
              </Route>

              {/* Protected Candidate Workspace Routes */}
              <Route element={<ProtectedRoute />}>
                {/* Onboarding Wizard (only accessible while onboarding is incomplete) */}
                <Route element={<OnboardingGuard requireCompleted={false} />}>
                  <Route path="/onboarding" element={<OnboardingPage />} />
                </Route>

                {/* Onboarded AppLayout Workspace */}
                <Route element={<OnboardingGuard requireCompleted={true} />}>
                  <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/resumes" element={<ResumesPage />} />
                  <Route path="/job-descriptions" element={<JobDescriptionsPage />} />
                  <Route path="/matches" element={<MatchesPage />} />
                  <Route path="/questions" element={<QuestionsPage />} />
                  <Route path="/practice" element={<CodingArenaPage />} />
                  <Route path="/cs-fundamentals" element={<CsFundamentalsPage />} />
                  <Route path="/roadmap" element={<RoadmapPage />} />
                  <Route path="/library" element={<LibraryPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/usage" element={<UsagePage />} />
                  </Route>
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
