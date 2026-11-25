import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  Briefcase,
  Check,
  Code2,
  Copy,
  ExternalLink,
  Globe,
  GraduationCap,
  Link2,
  LogOut,
  MapPin,
  Pencil,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/auth.context";
import {
  SkillTagInput,
  parseSkillsFromSummary,
  serializeSkillsToSummary,
} from "@/features/onboarding/components/SkillTagInput";
import {
  useProfileQuery,
  useSaveProfileMutation,
} from "@/features/onboarding/useCandidateProfile";
import { ApiClientError } from "@/lib/api";

const optionalUrlSchema = z
  .string()
  .trim()
  .refine(
    (val) =>
      val === "" || val.startsWith("https://") || val.startsWith("http://"),
    "Must be a valid http(s) URL",
  );

const profileFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(150, "Full name cannot exceed 150 characters"),
  currentRole: z.string().trim().max(150).optional(),
  headline: z.string().trim().max(250).optional(),
  yearsOfExperience: z
    .string()
    .trim()
    .refine(
      (val) =>
        val === "" ||
        (!Number.isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 60),
      "Enter a valid number of years (0–60)",
    ),
  location: z.string().trim().max(150).optional(),
  highestEducation: z.string().trim().max(150).optional(),
  university: z.string().trim().max(150).optional(),
  graduationYear: z
    .string()
    .trim()
    .refine(
      (val) =>
        val === "" ||
        (!Number.isNaN(Number(val)) &&
          Number(val) >= 1950 &&
          Number(val) <= 2040),
      "Enter a valid graduation year (1950–2040)",
    ),
  githubUrl: optionalUrlSchema,
  linkedinUrl: optionalUrlSchema,
  portfolioUrl: optionalUrlSchema,
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logoutAll } = useAuth();
  const profileQuery = useProfileQuery(true);
  const saveProfileMutation = useSaveProfileMutation();

  const [isEditing, setIsEditing] = React.useState(false);
  const [skills, setSkills] = React.useState<string[]>([]);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isLoggingOutAll, setIsLoggingOutAll] = React.useState(false);
  const [copiedUrlKey, setCopiedUrlKey] = React.useState<string | null>(null);

  const profile = profileQuery.data;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: "",
      currentRole: "",
      headline: "",
      yearsOfExperience: "0",
      location: "",
      highestEducation: "",
      university: "",
      graduationYear: "",
      githubUrl: "",
      linkedinUrl: "",
      portfolioUrl: "",
    },
  });

  const syncFormFromProfile = React.useCallback(() => {
    if (!profile) return;
    reset({
      fullName: profile.fullName || "",
      currentRole: profile.currentRole || "",
      headline: profile.headline || "",
      yearsOfExperience:
        profile.yearsOfExperience !== null &&
        profile.yearsOfExperience !== undefined
          ? String(profile.yearsOfExperience)
          : "0",
      location: profile.location || "",
      highestEducation: profile.highestEducation || "",
      university: profile.university || "",
      graduationYear:
        profile.graduationYear !== null &&
        profile.graduationYear !== undefined
          ? String(profile.graduationYear)
          : "",
      githubUrl: profile.githubUrl || "",
      linkedinUrl: profile.linkedinUrl || "",
      portfolioUrl: profile.portfolioUrl || "",
    });
    const parsed = parseSkillsFromSummary(profile.summary);
    setSkills(parsed.skills);
    setApiError(null);
  }, [profile, reset]);

  React.useEffect(() => {
    syncFormFromProfile();
  }, [syncFormFromProfile]);

  const watched = watch();

  const completeness = React.useMemo(() => {
    const checks: Array<{ label: string; filled: boolean }> = [
      { label: "Full Name", filled: Boolean(watched.fullName?.trim()) },
      { label: "Target Role", filled: Boolean(watched.currentRole?.trim()) },
      { label: "Headline", filled: Boolean(watched.headline?.trim()) },
      { label: "Location", filled: Boolean(watched.location?.trim()) },
      {
        label: "Degree / Program",
        filled: Boolean(watched.highestEducation?.trim()),
      },
      { label: "University", filled: Boolean(watched.university?.trim()) },
      { label: "Core Technical Skills", filled: skills.length > 0 },
      { label: "GitHub URL", filled: Boolean(watched.githubUrl?.trim()) },
      { label: "LinkedIn URL", filled: Boolean(watched.linkedinUrl?.trim()) },
    ];
    const completedCount = checks.filter((c) => c.filled).length;
    const pct = Math.round((completedCount / checks.length) * 100);
    const missing = checks.filter((c) => !c.filled).map((c) => c.label);
    return { pct, missing };
  }, [watched, skills]);

  const displayName =
    watched.fullName?.trim() || profile?.fullName || user?.name || "Candidate";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "TQ";

  const handleCancelEdit = () => {
    syncFormFromProfile();
    setIsEditing(false);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setApiError(null);
    try {
      await saveProfileMutation.mutateAsync({
        isUpdate: Boolean(profile),
        payload: {
          fullName: values.fullName.trim(),
          currentRole: values.currentRole?.trim() || null,
          headline: values.headline?.trim() || null,
          yearsOfExperience:
            values.yearsOfExperience !== ""
              ? Number(values.yearsOfExperience)
              : null,
          location: values.location?.trim() || null,
          highestEducation: values.highestEducation?.trim() || null,
          university: values.university?.trim() || null,
          graduationYear:
            values.graduationYear !== "" ? Number(values.graduationYear) : null,
          summary: serializeSkillsToSummary(skills),
          githubUrl: values.githubUrl.trim() || null,
          linkedinUrl: values.linkedinUrl.trim() || null,
          portfolioUrl: values.portfolioUrl.trim() || null,
        },
      });

      toast({
        variant: "success",
        title: "Profile updated",
        description: "Your candidate profile has been saved.",
      });
      setIsEditing(false);
    } catch (err) {
      setApiError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to save profile changes.",
      );
    }
  };

  const handleSignOutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      await logoutAll();
      toast({
        variant: "info",
        title: "Signed out of all devices",
        description: "All active refresh sessions have been revoked.",
      });
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const handleCopyUrl = async (key: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrlKey(key);
      toast({
        variant: "success",
        title: "Link copied",
      });
      window.setTimeout(() => setCopiedUrlKey(null), 2000);
    } catch {
      toast({
        variant: "error",
        title: "Copy failed",
        description: "Clipboard access was blocked by the browser.",
      });
    }
  };

  if (profileQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Skeleton className="h-96 rounded-xl lg:col-span-4" />
        <Skeleton className="h-[520px] rounded-xl lg:col-span-8" />
      </div>
    );
  }

  const externalLinks = [
    { key: "github", label: "GitHub", url: watched.githubUrl?.trim(), icon: Code2 },
    { key: "linkedin", label: "LinkedIn", url: watched.linkedinUrl?.trim(), icon: Briefcase },
    { key: "portfolio", label: "Portfolio", url: watched.portfolioUrl?.trim(), icon: Globe },
  ].filter(
    (item): item is { key: string; label: string; url: string; icon: typeof Globe } =>
      Boolean(item.url),
  );

  const educationSummary = [
    watched.highestEducation?.trim(),
    watched.university?.trim(),
    watched.graduationYear?.trim(),
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Candidate Profile
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Manage your engineering identity, academic background, core stack, and
            account session security.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isEditing ? (
            <Button type="button" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <Badge variant="amber" className="px-3 py-1 text-xs">
              Editing Mode
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): Sticky Identity Summary & Session Security */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 self-start space-y-5">
          <Card className="border-border bg-surface">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-start gap-3.5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary-soft font-mono text-lg font-bold text-primary shadow-[0_0_16px_rgba(16,185,129,0.18)]">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-ink">
                      {displayName}
                    </h3>
                    <Badge
                      variant={user?.tier === "PRO" ? "emerald" : "neutral"}
                    >
                      {user?.tier ?? "FREE"}
                    </Badge>
                  </div>
                  {user?.email && (
                    <p className="truncate text-xs text-ink-muted mt-0.5">
                      {user.email}
                    </p>
                  )}
                  {watched.currentRole && (
                    <p className="mt-1.5 text-xs font-medium text-primary">
                      {watched.currentRole}
                    </p>
                  )}
                  {watched.headline && (
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                      {watched.headline}
                    </p>
                  )}
                </div>
              </div>

              {/* Profile Completeness Bar (hidden once 100% complete) */}
              {completeness.pct < 100 && (
                <div className="space-y-2 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink">
                      Profile Completeness
                    </span>
                    <span className="font-mono font-semibold text-primary tabular-nums">
                      {completeness.pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all shadow-[0_0_8px_rgba(16,185,129,0.45)]"
                      style={{ width: `${completeness.pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] leading-relaxed text-ink-muted">
                    Next to add: {completeness.missing.slice(0, 2).join(", ")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Security Card */}
          <Card className="border-border bg-surface">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Session Security
              </CardTitle>
              <CardDescription>
                Protected by HttpOnly rotating refresh cookies and in-memory
                access tokens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Session Status</span>
                <Badge variant="emerald">Active &amp; Verified</Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isLoggingOutAll}
                onClick={() => void handleSignOutAll()}
                className="w-full text-danger hover:border-danger/40 hover:bg-danger-soft/60"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out All Devices
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (8 cols): View Mode Showcase or Unified Edit Form */}
        <div className="lg:col-span-8 space-y-5">
          {!isEditing ? (
            <>
              {/* Career & Academic Overview Card */}
              <Card className="border-border bg-surface">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">
                    Career &amp; Academic Overview
                  </CardTitle>
                  <CardDescription>
                    Used to calibrate interview difficulty, role framing, and ATS
                    feedback.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 border-t border-border pt-5">
                  <div className="rounded-lg border border-border bg-canvas px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                      Headline
                    </p>
                    {watched.headline?.trim() ? (
                      <p className="mt-1 text-sm font-medium text-ink">
                        {watched.headline}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm italic text-ink-muted">
                        Add a headline to personalize your AI interview framing
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border bg-surface p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                        Target Role
                      </p>
                      <p className="mt-1 text-sm font-medium text-ink">
                        {watched.currentRole?.trim() || "Not specified"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border bg-surface p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                        Experience
                      </p>
                      <p className="mt-1 font-mono text-sm font-medium text-ink">
                        {watched.yearsOfExperience !== ""
                          ? `${watched.yearsOfExperience} years`
                          : "Not specified"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border bg-surface p-3.5">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                        <MapPin className="h-3 w-3" />
                        Location
                      </p>
                      <p className="mt-1 text-sm font-medium text-ink">
                        {watched.location?.trim() || "Not specified"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border bg-surface p-3.5">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
                        <GraduationCap className="h-3 w-3" />
                        Education
                      </p>
                      <p className="mt-1 text-sm font-medium text-ink">
                        {educationSummary || "Not specified"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Core Technical Stack Card */}
              <Card className="border-border bg-surface">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        Core Technical Stack
                      </CardTitle>
                      <CardDescription>
                        Active skills used to personalize question generation.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      + Manage Skills
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="border-t border-border pt-4">
                  {skills.length === 0 ? (
                    <p className="text-sm text-ink-muted">
                      No technical skills added yet. Click &ldquo;+ Manage
                      Skills&rdquo; to tag your stack.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill} variant="emerald" className="px-2.5 py-1">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Developer & Social Links Card */}
              <Card className="border-border bg-surface">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">
                    Developer &amp; Social Links
                  </CardTitle>
                  <CardDescription>
                    Full profile URLs for portfolio and engineering verification.
                  </CardDescription>
                </CardHeader>
                <CardContent className="border-t border-border pt-4">
                  {externalLinks.length === 0 ? (
                    <p className="text-sm text-ink-muted">
                      No external developer links added yet. Click &ldquo;Edit
                      Profile&rdquo; to add GitHub, LinkedIn, or Portfolio URLs.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {externalLinks.map((item) => {
                        const Icon = item.icon;
                        const isCopied = copiedUrlKey === item.key;
                        return (
                          <div
                            key={item.key}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border bg-canvas px-3.5 py-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className="h-4 w-4 shrink-0 text-primary" />
                              <span className="text-xs font-semibold text-ink shrink-0">
                                {item.label}
                              </span>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate font-mono text-xs text-primary hover:underline"
                              >
                                {item.url}
                              </a>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  void handleCopyUrl(item.key, item.url)
                                }
                                aria-label={`Copy ${item.label} URL`}
                              >
                                {isCopied ? (
                                  <Check className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open ${item.label}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface hover:text-ink transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <form
              id="candidate-profile-form"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <Card className="border-border bg-surface">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">
                    Edit Candidate Profile
                  </CardTitle>
                  <CardDescription>
                    Update your career identity, academic credentials, skills,
                    and developer links.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 border-t border-border pt-5">
                  {apiError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-xs text-danger"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{apiError}</span>
                    </div>
                  )}

                  {/* Section 1: Career Identity */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                      Career Identity
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-fullname">Full Name *</Label>
                        <Input
                          id="profile-fullname"
                          error={errors.fullName?.message}
                          {...register("fullName")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-role">Target Role</Label>
                        <Input
                          id="profile-role"
                          placeholder="Senior Backend Engineer"
                          error={errors.currentRole?.message}
                          {...register("currentRole")}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="profile-headline">Headline</Label>
                      <Input
                        id="profile-headline"
                        placeholder="Distributed Systems & TypeScript Engineer"
                        error={errors.headline?.message}
                        {...register("headline")}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-yoe">Years of Experience</Label>
                        <Input
                          id="profile-yoe"
                          type="number"
                          min={0}
                          max={60}
                          error={errors.yearsOfExperience?.message}
                          {...register("yearsOfExperience")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-location">Location</Label>
                        <Input
                          id="profile-location"
                          placeholder="Bengaluru, India"
                          error={errors.location?.message}
                          {...register("location")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Academic Background */}
                  <div className="space-y-4 border-t border-border pt-5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                      Academic Background
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-degree">Degree / Program</Label>
                        <Input
                          id="profile-degree"
                          placeholder="B.Tech / MCA"
                          error={errors.highestEducation?.message}
                          {...register("highestEducation")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-university">
                          University / Institution
                        </Label>
                        <Input
                          id="profile-university"
                          placeholder="NIT"
                          error={errors.university?.message}
                          {...register("university")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-gradyear">
                          Graduation Year
                        </Label>
                        <Input
                          id="profile-gradyear"
                          type="number"
                          min={1950}
                          max={2040}
                          placeholder="2026"
                          error={errors.graduationYear?.message}
                          {...register("graduationYear")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Core Technical Stack */}
                  <div className="space-y-3 border-t border-border pt-5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                      Core Technical Stack
                    </h4>
                    <SkillTagInput skills={skills} onChange={setSkills} />
                  </div>

                  {/* Section 4: Developer & Social Links (Full-Width) */}
                  <div className="space-y-4 border-t border-border pt-5">
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                      <Link2 className="h-3.5 w-3.5" />
                      Developer &amp; Social Links
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-github">GitHub URL</Label>
                        <Input
                          id="profile-github"
                          placeholder="https://github.com/username"
                          error={errors.githubUrl?.message}
                          {...register("githubUrl")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-linkedin">LinkedIn URL</Label>
                        <Input
                          id="profile-linkedin"
                          placeholder="https://linkedin.com/in/username"
                          error={errors.linkedinUrl?.message}
                          {...register("linkedinUrl")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="profile-portfolio">Portfolio URL</Label>
                        <Input
                          id="profile-portfolio"
                          placeholder="https://example.dev"
                          error={errors.portfolioUrl?.message}
                          {...register("portfolioUrl")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Form Action Bar */}
                  <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={saveProfileMutation.isPending}
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      isLoading={saveProfileMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                      Save Profile Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
