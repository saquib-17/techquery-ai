import * as React from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export const SUGGESTED_SKILLS = [
  "TypeScript",
  "Java",
  "Python",
  "Node.js",
  "React",
  "PostgreSQL",
  "System Design",
  "DSA",
];

const SKILLS_PREFIX = "Core Skills:";

export function serializeSkillsToSummary(skills: string[], bio?: string | null): string | null {
  const cleanSkills = skills.map((s) => s.trim()).filter(Boolean);
  const cleanBio = bio?.trim() || "";

  if (cleanSkills.length === 0 && !cleanBio) {
    return null;
  }

  const skillsLine = cleanSkills.length > 0 ? `${SKILLS_PREFIX} ${cleanSkills.join(", ")}` : "";
  if (skillsLine && cleanBio) {
    return `${skillsLine}\n\n${cleanBio}`;
  }
  return skillsLine || cleanBio;
}

export function parseSkillsFromSummary(summary?: string | null): {
  skills: string[];
  bio: string;
} {
  if (!summary) return { skills: [], bio: "" };

  const lines = summary.split("\n");
  const firstLine = lines[0]?.trim() || "";
  if (firstLine.startsWith(SKILLS_PREFIX)) {
    const rawSkills = firstLine.slice(SKILLS_PREFIX.length);
    const skills = rawSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const bio = lines.slice(1).join("\n").trim();
    return { skills, bio };
  }

  return { skills: [], bio: summary.trim() };
}

export interface SkillTagInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export function SkillTagInput({ skills, onChange }: SkillTagInputProps) {
  const [draft, setDraft] = React.useState("");

  const addSkill = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...skills, trimmed]);
    setDraft("");
  };

  const removeSkill = (target: string) => {
    onChange(skills.filter((s) => s !== target));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(draft);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          id="skill-tag-input"
          aria-label="Add technical skill"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a skill (e.g. Docker, Redis) and press Enter"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => addSkill(draft)}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Selected Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Selected skills">
          {skills.map((skill) => (
            <Badge key={skill} variant="emerald" className="pr-1.5 py-1 text-xs">
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                aria-label={`Remove ${skill}`}
                className="ml-0.5 rounded-sm p-0.5 hover:bg-primary/15 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Quick-Select Suggestions */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-ink-subtle">Suggested skills:</p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_SKILLS.map((suggestion) => {
            const isSelected = skills.some(
              (s) => s.toLowerCase() === suggestion.toLowerCase()
            );
            return (
              <button
                key={suggestion}
                type="button"
                disabled={isSelected}
                onClick={() => addSkill(suggestion)}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs font-medium transition-colors cursor-pointer",
                  isSelected
                    ? "border-primary/20 bg-primary-soft/60 text-primary/60 cursor-default"
                    : "border-border bg-surface-muted/60 text-ink-muted hover:border-border-strong hover:text-ink"
                )}
              >
                + {suggestion}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
