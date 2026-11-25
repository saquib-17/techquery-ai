import * as React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  GitCompare,
  Sparkles,
  Code2,
  Bookmark,
  Gauge,
  UserCircle,
  Menu,
  X,
  Flame,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth.context";
import { useToast } from "@/components/ui/toast";
import { useProfileQuery } from "@/features/onboarding/useCandidateProfile";
import { useDashboardSummaryQuery } from "@/features/dashboard/useDashboardSummary";

export interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "Resumes & ATS", to: "/resumes", icon: FileText },
      { label: "Job Descriptions", to: "/job-descriptions", icon: Briefcase },
      { label: "Match Studio", to: "/matches", icon: GitCompare },
    ],
  },
  {
    title: "Practice",
    items: [
      { label: "Question Studio", to: "/questions", icon: Sparkles },
      { label: "Coding Arena", to: "/practice", icon: Code2 },
      { label: "Saved Library", to: "/library", icon: Bookmark },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Candidate Profile", to: "/profile", icon: UserCircle },
      { label: "Quotas & Plan", to: "/usage", icon: Gauge },
    ],
  },
];

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/resumes": "Resumes & ATS",
  "/job-descriptions": "Job Descriptions",
  "/matches": "Match Studio",
  "/questions": "Question Studio",
  "/practice": "Coding Arena",
  "/library": "Saved Library",
  "/profile": "Candidate Profile",
  "/usage": "Quotas & Plan",
};

export interface AppLayoutProps {
  headerAction?: React.ReactNode;
  streakDays?: number;
  candidateName?: string;
  candidateTier?: "FREE" | "PRO";
}

export function AppLayout({
  headerAction,
  streakDays,
  candidateName,
  candidateTier,
}: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: profile } = useProfileQuery(isAuthenticated);
  const { data: dashboardSummary } = useDashboardSummaryQuery(isAuthenticated);
  const { toast } = useToast();

  const liveStreakDays = streakDays ?? dashboardSummary?.streak.currentStreak ?? 0;
  const displayName = candidateName || profile?.fullName || user?.name || "Candidate";
  const displayEmail = user?.email || "Active Session";
  const displayTier = candidateTier || dashboardSummary?.usage.tier || user?.tier || "FREE";

  const currentTitle = ROUTE_TITLES[location.pathname] ?? "Workbench";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      toast({
        title: "Signed out",
        description: "Your session has been securely closed.",
        variant: "info",
      });
      navigate("/login", { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  const renderSidebarContent = (isMobile: boolean) => (
    <div className="flex h-full flex-col bg-[#0B0B0D]">
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-[#242429] px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/35 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <path d="M5 6h14M12 6v12M8 14l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-bold tracking-tight text-white">
              TechQuery AI
            </span>
            <span className="block text-[10px] font-mono uppercase tracking-wider text-[#10B981]">
              INTERVIEW STUDIO
            </span>
          </div>
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="rounded-md p-1 text-ink-subtle hover:bg-surface hover:text-ink cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav aria-label="Primary Navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-2.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150",
                          isActive
                            ? "bg-primary-soft text-primary border border-primary/25 shadow-[0_0_16px_rgba(16,185,129,0.14)]"
                            : "text-[#E4E4E7]/75 border border-transparent hover:bg-[#151518] hover:text-white"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span
                              aria-hidden="true"
                              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#10B981] shadow-[0_0_8px_#10B981]"
                            />
                          )}
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isActive
                                ? "text-[#10B981]"
                                : "text-ink-subtle group-hover:text-white"
                            )}
                          />
                          <span>{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom Candidate Card + Sign Out */}
      <div className="border-t border-border p-3 space-y-2">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          aria-label="Open candidate profile"
          className="w-full text-left flex items-center justify-between gap-2 rounded-lg border border-border bg-surface p-2.5 hover:border-border-strong hover:bg-surface-muted/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft border border-primary/20 text-xs font-semibold text-primary">
              {initials || "TQ"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-ink">{displayName}</p>
              <p className="truncate text-[11px] text-ink-subtle">{displayEmail}</p>
            </div>
          </div>
          <Badge variant={displayTier === "PRO" ? "emerald" : "neutral"}>
            {displayTier}
          </Badge>
        </button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          isLoading={isSigningOut}
          onClick={handleSignOut}
          className="w-full justify-start text-ink-muted hover:text-danger hover:bg-danger-soft/60"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink flex">
      {/* Desktop Slim Left Rail (232px) */}
      <aside className="hidden lg:block w-[232px] shrink-0 border-r border-border sticky top-0 h-screen">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Slide-Out Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-ink/25 backdrop-blur-[1px]"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 w-[232px] h-full border-r border-border bg-surface shadow-xl"
            >
              {renderSidebarContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Sticky Top Header (56px) */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#242429] bg-[#0F0F11]/85 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline text-ink-subtle">Workbench</span>
              <span className="hidden sm:inline text-ink-subtle">/</span>
              <h1 className="font-semibold text-ink tracking-tight">{currentTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={liveStreakDays > 0 ? "amber" : "neutral"} className="py-1 px-2.5">
              <Flame className="h-3.5 w-3.5" />
              <span>{liveStreakDays}d Streak</span>
            </Badge>
            {headerAction}
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
