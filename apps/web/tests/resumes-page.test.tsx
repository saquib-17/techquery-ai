import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/toast";
import { ResumesPage } from "@/features/resumes/pages/ResumesPage";
import { ApiClientError } from "@/lib/api";
import * as resumesApi from "@/features/resumes/resumes.api";

vi.mock("@/features/resumes/resumes.api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/resumes/resumes.api")
  >("@/features/resumes/resumes.api");
  return {
    ...actual,
    getResumesApi: vi.fn(),
    uploadResumeApi: vi.fn(),
    setPrimaryResumeApi: vi.fn(),
    deleteResumeApi: vi.fn(),
    analyzeResumeApi: vi.fn(),
    getResumeAnalysisApi: vi.fn(),
    getParsedResumeDataApi: vi.fn(),
    downloadResumeFile: vi.fn(),
  };
});

function renderResumesPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={["/resumes"]}>
          <ResumesPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe("Resumes & ATS Audit Studio (Phase F5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. renders empty state for 0 resumes and uploads a valid PDF file", async () => {
    vi.mocked(resumesApi.getResumesApi).mockResolvedValue([]);
    vi.mocked(resumesApi.uploadResumeApi).mockResolvedValue({
      id: "res-1",
      originalFileName: "saquib_resume.pdf",
      mimeType: "application/pdf",
      fileExtension: "pdf",
      fileSize: 120000,
      processingStatus: "PROCESSED",
      isPrimary: true,
      createdAt: "2026-11-25T08:00:00Z",
      updatedAt: "2026-11-25T08:00:00Z",
    });

    renderResumesPage();

    await waitFor(() => {
      expect(screen.getByText("No resumes uploaded yet")).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText("Upload resume file");
    const validFile = new File(["%PDF-1.4 content"], "saquib_resume.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(resumesApi.uploadResumeApi).toHaveBeenCalledWith(validFile);
      expect(screen.getByText("Resume uploaded")).toBeInTheDocument();
    });
  });

  it("2. displays ATS score, section breakdown, and actionable improvements when analysis exists", async () => {
    vi.mocked(resumesApi.getResumesApi).mockResolvedValue([
      {
        id: "res-1",
        originalFileName: "backend_cv.pdf",
        mimeType: "application/pdf",
        fileExtension: "pdf",
        fileSize: 95000,
        processingStatus: "PROCESSED",
        isPrimary: true,
        createdAt: "2026-11-25T08:00:00Z",
        updatedAt: "2026-11-25T08:00:00Z",
      },
    ]);

    vi.mocked(resumesApi.getResumeAnalysisApi).mockResolvedValue({
      id: "ana-1",
      resumeId: "res-1",
      atsScore: 86,
      sectionScores: {
        contact: 95,
        summary: 82,
        experience: 88,
        skills: 90,
        education: 85,
      },
      strengths: ["Quantified latency reductions in PostgreSQL queries"],
      issues: ["Missing GitHub link in contact header"],
      improvements: [
        {
          original: "Worked on backend APIs",
          suggested: "Engineered TypeScript REST APIs handling 10k RPM with <45ms p99 latency",
          reason: "Adds concrete throughput and latency metrics.",
        },
      ],
    });

    vi.mocked(resumesApi.getParsedResumeDataApi).mockResolvedValue(null);

    renderResumesPage();

    await waitFor(() => {
      expect(screen.getByText("86")).toBeInTheDocument();
    });

    expect(screen.getByText("ATS Strong")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(
      screen.getByText("Quantified latency reductions in PostgreSQL queries")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Missing GitHub link in contact header")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Engineered TypeScript REST APIs handling 10k RPM with <45ms p99 latency")
    ).toBeInTheDocument();
  });

  it("3. triggers Run AI ATS Audit on an unanalyzed resume and switches to Parsed Resume Data tab", async () => {
    vi.mocked(resumesApi.getResumesApi).mockResolvedValue([
      {
        id: "res-2",
        originalFileName: "fresh_cv.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileExtension: "docx",
        fileSize: 80000,
        processingStatus: "PROCESSED",
        isPrimary: true,
        createdAt: "2026-11-25T08:00:00Z",
        updatedAt: "2026-11-25T08:00:00Z",
      },
    ]);

    vi.mocked(resumesApi.getResumeAnalysisApi).mockResolvedValue(null);
    vi.mocked(resumesApi.getParsedResumeDataApi).mockResolvedValue(null);

    vi.mocked(resumesApi.analyzeResumeApi).mockResolvedValue({
      analysis: {
        id: "ana-2",
        resumeId: "res-2",
        atsScore: 78,
        sectionScores: {
          contact: 90,
          summary: 75,
          experience: 80,
          skills: 85,
          education: 80,
        },
        strengths: ["Clear technical stack section"],
        issues: [],
        improvements: [],
      },
      parsedData: {
        summary: "Full-stack engineer focused on TypeScript and PostgreSQL.",
        skills: {
          technical: ["TypeScript", "PostgreSQL"],
          tools: ["Docker", "Git"],
          soft: ["Mentorship"],
        },
        experience: [
          {
            role: "Software Engineer",
            company: "TechCorp",
            duration: "2024 - Present",
            highlights: ["Built REST APIs"],
          },
        ],
        education: [
          {
            degree: "MCA",
            institution: "NIT",
            year: "2024",
          },
        ],
        projects: [
          {
            name: "TechQuery AI",
            techStack: ["React", "Node.js"],
            description: "AI interview prep workbench",
          },
        ],
      },
    });

    renderResumesPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Run AI ATS Audit/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Run AI ATS Audit/i }));

    await waitFor(() => {
      expect(resumesApi.analyzeResumeApi).toHaveBeenCalledWith("res-2");
      expect(screen.getByText("78")).toBeInTheDocument();
    });

    // Switch to Parsed Resume Data tab
    fireEvent.click(screen.getByRole("tab", { name: /Parsed Resume Data/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Full-stack engineer focused on TypeScript and PostgreSQL.")
      ).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
      expect(screen.getByText(/TechCorp/)).toBeInTheDocument();
    });
  });

  it("4. displays upgrade prompt when upload fails with 429 QUOTA_EXCEEDED", async () => {
    vi.mocked(resumesApi.getResumesApi).mockResolvedValue([]);
    vi.mocked(resumesApi.uploadResumeApi).mockRejectedValue(
      new ApiClientError(
        "You have reached the maximum allowed resumes (3) for the FREE tier.",
        429,
        "QUOTA_EXCEEDED"
      )
    );

    renderResumesPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Upload resume file")).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText("Upload resume file");
    const validFile = new File(["%PDF-1.4"], "fourth_resume.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "You have reached the maximum allowed resumes (3) for the FREE tier."
      );
      expect(
        screen.getByRole("link", { name: /Upgrade Plan \/ Manage Quotas/i })
      ).toHaveAttribute("href", "/usage");
    });
  });
});
