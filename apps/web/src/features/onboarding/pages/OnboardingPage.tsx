import * as React from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LogOut,
  Briefcase,
  GraduationCap,
  Code2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth.context";
import {
  useProfileQuery,
  useSaveProfileMutation,
  useUpdateOnboardingMutation,
} from "@/features/onboarding/useCandidateProfile";
import {
  SkillTagInput,
  parseSkillsFromSummary,
  serializeSkillsToSummary,
} from "@/features/onboarding/components/SkillTagInput";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const STEPS = [
  { id: 1, title: "Career Target", icon: Briefcase },
  { id: 2, title: "Education", icon: GraduationCap },
  { id: 3, title: "Skills & Links", icon: Code2 },
];

const optionalUrlSchema = z
  .string()
  .trim()
  .refine((val) => val === "" || /^https?:\/\/.+/.test(val), {
    message: "Must be a valid URL starting with http:// or https://",
  });

export function OnboardingPage() {
  const { user, logout } = useAuth();
  const { data: existingProfile } = useProfileQuery();
  const saveProfileMutation = useSaveProfileMutation();
  const updateOnboardingMutation = useUpdateOnboardingMutation();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = React.useState(1);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Step 1 state
  const [fullName, setFullName] = React.useState(user?.name || "");
  const [currentRole, setCurrentRole] = React.useState("");
  const [headline, setHeadline] = React.useState("");
  const [yearsOfExperience, setYearsOfExperience] = React.useState("0");
  const [location, setLocation] = React.useState("");

  // Step 2 state
  const [highestEducation, setHighestEducation] = React.useState("");
  const [university, setUniversity] = React.useState("");
  const [graduationYear, setGraduationYear] = React.useState("");

  // Step 3 state
  const [skills, setSkills] = React.useState<string[]>([]);
  const [githubUrl, setGithubUrl] = React.useState("");
  const [linkedinUrl, setLinkedinUrl] = React.useState("");
  const [portfolioUrl, setPortfolioUrl] = React.useState("");

  // Hydrate if profile already partially exists
  React.useEffect(() => {
    if (!existingProfile) return;
    setFullName(existingProfile.fullName || user?.name || "");
    setCurrentRole(existingProfile.currentRole || "");
    setHeadline(existingProfile.headline || "");
    setYearsOfExperience(
      existingProfile.yearsOfExperience !== null &&
        existingProfile.yearsOfExperience !== undefined
        ? String(existingProfile.yearsOfExperience)
        : "0"
    );
    setLocation(existingProfile.location || "");
    setHighestEducation(existingProfile.highestEducation || "");
    setUniversity(existingProfile.university || "");
    setGraduationYear(
      existingProfile.graduationYear ? String(existingProfile.graduationYear) : ""
    );
    const parsed = parseSkillsFromSummary(existingProfile.summary);
    setSkills(parsed.skills);
    setGithubUrl(existingProfile.githubUrl || "");
    setLinkedinUrl(existingProfile.linkedinUrl || "");
    setPortfolioUrl(existingProfile.portfolioUrl || "");
  }, [existingProfile, user?.name]);

  const validateStep = (targetStep: number): boolean => {
    const nextErrors: Record<string, string> = {};

    if (targetStep === 1) {
      if (fullName.trim().length < 2) {
        nextErrors.fullName = "Full name must be at least 2 characters";
      }
      if (!currentRole.trim()) {
        nextErrors.currentRole = "Target role is required";
      }
      const exp = Number(yearsOfExperience);
      if (Number.isNaN(exp) || exp < 0 || exp > 60) {
        nextErrors.yearsOfExperience = "Experience must be between 0 and 60 years";
      }
    }

    if (targetStep === 2) {
      if (!highestEducation.trim()) {
        nextErrors.highestEducation = "Degree or academic program is required";
      }
      if (graduationYear.trim() !== "") {
        const yr = Number(graduationYear);
        const maxYr = new Date().getFullYear() + 10;
        if (Number.isNaN(yr) || yr < 1950 || yr > maxYr) {
          nextErrors.graduationYear = `Graduation year must be between 1950 and ${maxYr}`;
        }
      }
    }

    if (targetStep === 3) {
      const gh = optionalUrlSchema.safeParse(githubUrl);
      if (!gh.success) nextErrors.githubUrl = gh.error.issues[0]?.message || "Invalid URL";

      const li = optionalUrlSchema.safeParse(linkedinUrl);
      if (!li.success) nextErrors.linkedinUrl = li.error.issues[0]?.message || "Invalid URL";

      const pf = optionalUrlSchema.safeParse(portfolioUrl);
      if (!pf.success) nextErrors.portfolioUrl = pf.error.issues[0]?.message || "Invalid URL";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(3, s + 1));
    }
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateStep(3)) return;

    try {
      const summary = serializeSkillsToSummary(skills);
      await saveProfileMutation.mutateAsync({
        isUpdate: Boolean(existingProfile),
        payload: {
          fullName: fullName.trim(),
          currentRole: currentRole.trim() || null,
          headline: headline.trim() || null,
          yearsOfExperience: yearsOfExperience !== "" ? Number(yearsOfExperience) : null,
          location: location.trim() || null,
          highestEducation: highestEducation.trim() || null,
          university: university.trim() || null,
          graduationYear: graduationYear.trim() ? Number(graduationYear) : null,
          summary,
          githubUrl: githubUrl.trim() || null,
          linkedinUrl: linkedinUrl.trim() || null,
          portfolioUrl: portfolioUrl.trim() || null,
        },
      });

      await updateOnboardingMutation.mutateAsync({
        onboardingStep: "COMPLETED",
        markCompleted: true,
      });

      toast({
        title: "Workbench Ready",
        description: "Your candidate profile has been saved.",
        variant: "success",
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setSubmitError(
        err instanceof ApiClientError
          ? err.message
          : "Failed to save onboarding profile. Please try again."
      );
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const isSaving = saveProfileMutation.isPending || updateOnboardingMutation.isPending;

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Top Bar */}
      <header className="h-14 border-b border-border bg-surface/90 backdrop-blur-sm px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
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
          <span className="text-sm font-bold tracking-tight text-ink">TechQuery AI</span>
        </div>

        <Button type="button" variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </header>

      {/* Centered Workbench Wizard */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[720px] space-y-6">
          {/* Header & Step Counter */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
                Candidate Setup
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
                Calibrate your interview workbench
              </h1>
            </div>
            <span className="font-mono text-sm font-semibold text-ink-muted tabular-nums">
              0{step} / 03
            </span>
          </div>

          {/* Horizontal 3-Step Progress Stepper */}
          <nav aria-label="Onboarding steps" className="grid grid-cols-3 gap-3">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isCompleted = step > s.id;
              const isActive = step === s.id;
              return (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-colors",
                    isActive
                      ? "border-primary bg-primary-soft/70 text-primary"
                      : isCompleted
                        ? "border-primary/30 bg-surface text-ink"
                        : "border-border bg-surface-muted/60 text-ink-subtle"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      isActive
                        ? "bg-primary text-white"
                        : isCompleted
                          ? "bg-primary-soft text-primary border border-primary/30"
                          : "bg-surface text-ink-subtle border border-border"
                    )}
                  >
                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-xs font-semibold truncate">{s.title}</span>
                </div>
              );
            })}
          </nav>

          {/* Main Hairline Form Card */}
          <form
            onSubmit={handleComplete}
            noValidate
            className="rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-[0_1px_2px_rgba(24,24,27,0.04)]"
          >
            {submitError && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger-soft p-3 text-xs text-danger"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-ink">
                      Career Target &amp; Headline
                    </h2>
                    <p className="text-sm text-ink-muted">
                      Used to calibrate question difficulty and role expectations.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="ob-fullname">Full Name *</Label>
                      <Input
                        id="ob-fullname"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Candidate"
                        error={errors.fullName}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ob-role">Target Role *</Label>
                      <Input
                        id="ob-role"
                        value={currentRole}
                        onChange={(e) => setCurrentRole(e.target.value)}
                        placeholder="Software Development Engineer (SDE-1)"
                        error={errors.currentRole}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ob-headline">Professional Headline</Label>
                    <Input
                      id="ob-headline"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Backend Engineer specializing in TypeScript & PostgreSQL"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="ob-exp">Years of Experience</Label>
                      <Input
                        id="ob-exp"
                        type="number"
                        min={0}
                        max={60}
                        value={yearsOfExperience}
                        onChange={(e) => setYearsOfExperience(e.target.value)}
                        error={errors.yearsOfExperience}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ob-location">Location</Label>
                      <Input
                        id="ob-location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Bengaluru, India"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-ink">
                      Education &amp; Academic Credentials
                    </h2>
                    <p className="text-sm text-ink-muted">
                      Helps tailor placement readiness and campus vs. industry benchmarks.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <Label htmlFor="ob-education">Degree / Program *</Label>
                    <Input
                      id="ob-education"
                      value={highestEducation}
                      onChange={(e) => setHighestEducation(e.target.value)}
                      placeholder="Master of Computer Applications (MCA)"
                      error={errors.highestEducation}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="ob-university">Institution / University</Label>
                      <Input
                        id="ob-university"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        placeholder="National Institute of Technology"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ob-gradyear">Graduation Year</Label>
                      <Input
                        id="ob-gradyear"
                        type="number"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        placeholder="2026"
                        error={errors.graduationYear}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-ink">
                      Core Technical Skills &amp; Links
                    </h2>
                    <p className="text-sm text-ink-muted">
                      Select your primary stack and optionally link your engineering profiles.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="skill-tag-input">Core Technical Skills</Label>
                    <SkillTagInput skills={skills} onChange={setSkills} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
                    <div className="space-y-1.5">
                      <Label htmlFor="ob-github">GitHub URL</Label>
                      <Input
                        id="ob-github"
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        error={errors.githubUrl}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ob-linkedin">LinkedIn URL</Label>
                      <Input
                        id="ob-linkedin"
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        error={errors.linkedinUrl}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ob-portfolio">Portfolio URL</Label>
                      <Input
                        id="ob-portfolio"
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://yoursite.dev"
                        error={errors.portfolioUrl}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Controls */}
            <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <span />
              )}

              {step < 3 ? (
                <Button type="button" onClick={handleNext}>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" isLoading={isSaving}>
                  Complete Setup
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
