import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
  useProfileQuery,
  useSaveProfileMutation,
} from "@/features/onboarding/useCandidateProfile";
import {
  SkillTagInput,
  parseSkillsFromSummary,
  serializeSkillsToSummary,
} from "@/features/onboarding/components/SkillTagInput";
import { ApiClientError } from "@/lib/api";

export interface ProfileSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileSettingsDialog({ open, onClose }: ProfileSettingsDialogProps) {
  const { data: profile } = useProfileQuery(open);
  const saveProfileMutation = useSaveProfileMutation();
  const { toast } = useToast();

  const [fullName, setFullName] = React.useState("");
  const [currentRole, setCurrentRole] = React.useState("");
  const [headline, setHeadline] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [highestEducation, setHighestEducation] = React.useState("");
  const [university, setUniversity] = React.useState("");
  const [yearsOfExperience, setYearsOfExperience] = React.useState("0");
  const [skills, setSkills] = React.useState<string[]>([]);
  const [githubUrl, setGithubUrl] = React.useState("");
  const [linkedinUrl, setLinkedinUrl] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!profile || !open) return;
    setFullName(profile.fullName || "");
    setCurrentRole(profile.currentRole || "");
    setHeadline(profile.headline || "");
    setLocation(profile.location || "");
    setHighestEducation(profile.highestEducation || "");
    setUniversity(profile.university || "");
    setYearsOfExperience(
      profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined
        ? String(profile.yearsOfExperience)
        : "0"
    );
    const parsed = parseSkillsFromSummary(profile.summary);
    setSkills(parsed.skills);
    setGithubUrl(profile.githubUrl || "");
    setLinkedinUrl(profile.linkedinUrl || "");
    setError(null);
  }, [profile, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }

    try {
      await saveProfileMutation.mutateAsync({
        isUpdate: Boolean(profile),
        payload: {
          fullName: fullName.trim(),
          currentRole: currentRole.trim() || null,
          headline: headline.trim() || null,
          location: location.trim() || null,
          highestEducation: highestEducation.trim() || null,
          university: university.trim() || null,
          yearsOfExperience: yearsOfExperience !== "" ? Number(yearsOfExperience) : null,
          summary: serializeSkillsToSummary(skills),
          githubUrl: githubUrl.trim() || null,
          linkedinUrl: linkedinUrl.trim() || null,
        },
      });

      toast({
        title: "Profile updated",
        description: "Your candidate preferences have been saved.",
        variant: "success",
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to save profile changes."
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Candidate Profile Settings"
      description="Update your target role, academic details, and core technical stack."
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft p-3 text-xs text-danger"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="prof-fullname">Full Name *</Label>
            <Input
              id="prof-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prof-role">Target Role</Label>
            <Input
              id="prof-role"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prof-headline">Headline</Label>
          <Input
            id="prof-headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="prof-exp">Experience (yrs)</Label>
            <Input
              id="prof-exp"
              type="number"
              min={0}
              max={60}
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prof-loc">Location</Label>
            <Input
              id="prof-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prof-edu">Degree</Label>
            <Input
              id="prof-edu"
              value={highestEducation}
              onChange={(e) => setHighestEducation(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prof-univ">University</Label>
          <Input
            id="prof-univ"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="skill-tag-input">Core Technical Skills</Label>
          <SkillTagInput skills={skills} onChange={setSkills} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="prof-github">GitHub URL</Label>
            <Input
              id="prof-github"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prof-linkedin">LinkedIn URL</Label>
            <Input
              id="prof-linkedin"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saveProfileMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
