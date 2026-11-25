import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/auth.context";
import { useOnboardingQuery } from "@/features/onboarding/useCandidateProfile";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3 text-ink-muted">
      <Spinner size="lg" className="text-primary" />
      <p className="text-sm font-medium tracking-tight">Restoring workbench session...</p>
    </div>
  );
}

function OnboardingLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-xl border border-border bg-surface p-8 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <div className="flex justify-end gap-2 pt-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}

/**
 * Protects guest-only routes (/login, /register, /verify-email).
 * Redirects authenticated users directly to /dashboard.
 */
export function PublicRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

/**
 * Protects authenticated workspace routes.
 * Preserves attempted destination in router state before redirecting to /login.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/**
 * Guards routes based on candidate onboarding completion state.
 * - requireCompleted={true}: redirects incomplete users to /onboarding
 * - requireCompleted={false}: redirects completed users to /dashboard
 */
export function OnboardingGuard({ requireCompleted }: { requireCompleted: boolean }) {
  const { isAuthenticated } = useAuth();
  const { data: onboarding, isLoading } = useOnboardingQuery(isAuthenticated);

  if (isLoading) {
    return <OnboardingLoadingSkeleton />;
  }

  const isCompleted = Boolean(onboarding?.onboardingCompleted);

  if (requireCompleted && !isCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!requireCompleted && isCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
