import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/features/auth/auth.context";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";

describe("Editorial Engineering Design System & AppLayout (Phase F1)", () => {
  it("1. renders AppLayout navigation items, active route highlight, and mobile drawer toggle", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={["/resumes"]}>
              <Routes>
                <Route element={<AppLayout streakDays={7} candidateTier="PRO" />}>
                  <Route path="/resumes" element={<div>Resumes Content</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    );

    // Brand & streak pill
    expect(screen.getByText("TechQuery AI")).toBeInTheDocument();
    expect(screen.getByText("7d Streak")).toBeInTheDocument();
    expect(screen.getByText("PRO")).toBeInTheDocument();

    // Navigation items
    const expectedLinks = [
      "Dashboard",
      "Resumes & ATS",
      "Job Descriptions",
      "Match Studio",
      "Question Studio",
      "Saved Library",
      "Quotas & Plan",
    ];
    for (const label of expectedLinks) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }

    // Active route highlighting on /resumes
    const activeLink = screen.getByRole("link", { name: "Resumes & ATS" });
    expect(activeLink.className).toContain("bg-primary-soft");
    expect(activeLink.className).toContain("text-primary");

    // Mobile drawer toggle opens mobile sidebar
    const menuBtn = screen.getByRole("button", { name: "Open navigation menu" });
    fireEvent.click(menuBtn);
    expect(
      screen.getByRole("button", { name: "Close navigation menu" })
    ).toBeInTheDocument();
  });

  it("2. renders Button loading state with spinner and disabled attribute", () => {
    render(
      <Button isLoading type="button">
        Submitting
      </Button>
    );

    const btn = screen.getByRole("button", { name: /submitting/i });
    expect(btn).toBeDisabled();
    expect(btn.querySelector("svg.animate-spin")).toBeInTheDocument();
  });

  it("3. handles Dialog open and close interactions cleanly", () => {
    const onClose = vi.fn();
    render(
      <Dialog open={true} onClose={onClose} title="Confirm Export">
        <p>Dialog Body Content</p>
      </Dialog>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Confirm Export")).toBeInTheDocument();
    expect(screen.getByText("Dialog Body Content")).toBeInTheDocument();

    // Close via button
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    // Close via Escape key
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("4. displays ToastProvider notifications when triggered via useToast", () => {
    function ToastTrigger() {
      const { toast } = useToast();
      return (
        <Button
          type="button"
          onClick={() =>
            toast({
              title: "Resume Uploaded",
              description: "ATS audit completed cleanly.",
              variant: "success",
            })
          }
        >
          Show Toast
        </Button>
      );
    }

    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show Toast" }));
    expect(screen.getByText("Resume Uploaded")).toBeInTheDocument();
    expect(screen.getByText("ATS audit completed cleanly.")).toBeInTheDocument();
  });
});
