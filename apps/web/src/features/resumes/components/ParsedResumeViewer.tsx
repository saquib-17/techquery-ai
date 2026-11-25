import { Briefcase, GraduationCap, FolderGit2, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ParsedResumeData } from "@/features/resumes/resumes.api";

export interface ParsedResumeViewerProps {
  parsedData: ParsedResumeData | null | undefined;
  isLoading: boolean;
  isAnalyzing: boolean;
  onRunAudit: () => void;
}

export function ParsedResumeViewer({
  parsedData,
  isLoading,
  isAnalyzing,
  onRunAudit,
}: ParsedResumeViewerProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!parsedData) {
    return (
      <Card>
        <CardContent className="py-12 px-6 flex flex-col items-center text-center">
          <p className="text-sm font-medium text-ink">
            Structured career graph not extracted yet.
          </p>
          <p className="mt-1 text-xs text-ink-muted max-w-md">
            Run the AI ATS Audit to parse skills, experience timeline, projects, and education.
          </p>
          <Button onClick={onRunAudit} isLoading={isAnalyzing} className="mt-4" size="sm">
            <Sparkles className="h-3.5 w-3.5" />
            Run AI ATS Audit
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Executive Summary */}
      {parsedData.summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Extracted Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-muted leading-relaxed">{parsedData.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Skills Matrix */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Extracted Skills</CardTitle>
          <CardDescription>Skills recognized by the TechQuery parser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {parsedData.skills.technical.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-subtle">
                Technical
              </span>
              <div className="flex flex-wrap gap-1.5">
                {parsedData.skills.technical.map((skill) => (
                  <Badge key={skill} variant="emerald">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {parsedData.skills.tools.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-subtle">
                Tools &amp; Platforms
              </span>
              <div className="flex flex-wrap gap-1.5">
                {parsedData.skills.tools.map((tool) => (
                  <Badge key={tool} variant="mono">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {parsedData.skills.soft.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-subtle">
                Soft Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {parsedData.skills.soft.map((soft) => (
                  <Badge key={soft} variant="neutral">
                    {soft}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Experience Timeline */}
      {parsedData.experience.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Experience Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedData.experience.map((exp, idx) => (
              <div key={idx} className="border-l-2 border-primary/30 pl-4 space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-sm font-semibold text-ink">
                    {exp.role} <span className="text-ink-muted font-normal">@ {exp.company}</span>
                  </h4>
                  <span className="text-xs font-mono text-ink-subtle">{exp.duration}</span>
                </div>
                {exp.highlights.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-xs text-ink-muted">
                    {exp.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Projects & Education */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {parsedData.projects.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-primary" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {parsedData.projects.map((proj, idx) => (
                <div key={idx} className="rounded-lg border border-border p-3 space-y-1.5">
                  <h4 className="text-xs font-semibold text-ink">{proj.name}</h4>
                  <p className="text-xs text-ink-muted">{proj.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {proj.techStack.map((tech) => (
                      <Badge key={tech} variant="mono" className="text-[10px]">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {parsedData.education.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {parsedData.education.map((edu, idx) => (
                <div key={idx} className="rounded-lg border border-border p-3">
                  <h4 className="text-xs font-semibold text-ink">{edu.degree}</h4>
                  <p className="text-xs text-ink-muted">{edu.institution}</p>
                  <span className="mt-1 inline-block text-[11px] font-mono text-ink-subtle">
                    {edu.year}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
