import * as React from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, MailCheck, Send } from "lucide-react";
import { AuthSplitLayout } from "@/features/auth/components/AuthSplitLayout";
import { useAuth } from "@/features/auth/auth.context";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { verifyEmail, resendVerification } = useAuth();
  const { toast } = useToast();

  const tokenFromUrl = searchParams.get("token")?.trim() || "";
  const emailFromUrl = searchParams.get("email")?.trim() || "";
  const devTokenFromState =
    (location.state as { devToken?: string } | null)?.devToken || "";

  const [manualToken, setManualToken] = React.useState(
    tokenFromUrl || devTokenFromState
  );
  const [resendEmail, setResendEmail] = React.useState(emailFromUrl);
  const [status, setStatus] = React.useState<
    "idle" | "verifying" | "verified" | "error"
  >(tokenFromUrl ? "verifying" : "idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isResending, setIsResending] = React.useState(false);

  const runVerification = React.useCallback(
    async (tokenToVerify: string) => {
      if (!tokenToVerify) {
        setStatus("error");
        setErrorMessage("Please enter a 64-character verification token.");
        return;
      }

      setStatus("verifying");
      setErrorMessage(null);
      try {
        await verifyEmail(tokenToVerify);
        setStatus("verified");
        toast({
          title: "Email verified",
          description: "Your account is now active. You may sign in.",
          variant: "success",
        });
      } catch (err) {
        setStatus("error");
        if (err instanceof ApiClientError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage("Verification failed. The token may be invalid or expired.");
        }
      }
    },
    [verifyEmail, toast]
  );

  // Auto-verify if ?token=... is present in URL
  React.useEffect(() => {
    if (tokenFromUrl) {
      void runVerification(tokenFromUrl);
    }
  }, [tokenFromUrl, runVerification]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runVerification(manualToken.trim());
  };

  const handleResend = async () => {
    if (!resendEmail.trim()) {
      toast({
        title: "Email required",
        description: "Enter your email address to resend a verification token.",
        variant: "error",
      });
      return;
    }

    setIsResending(true);
    try {
      const res = await resendVerification(resendEmail.trim().toLowerCase());
      toast({
        title: "Verification email dispatched",
        description: res.message,
        variant: "info",
      });
    } catch (err) {
      toast({
        title: "Unable to resend",
        description:
          err instanceof ApiClientError
            ? err.message
            : "Please wait before requesting another link.",
        variant: "error",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Verify your email address"
      subtitle="Confirm your email to unlock your TechQuery AI candidate workspace."
    >
      {status === "verifying" ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
          <Spinner size="lg" className="text-primary" />
          <p className="text-sm font-medium text-ink">
            Verifying your token...
          </p>
        </div>
      ) : status === "verified" ? (
        <div className="space-y-5 text-center py-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft border border-primary/20 text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink">Email Verified</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Your candidate account is verified and ready for sign in.
            </p>
          </div>
          <Link to="/login" className="block">
            <Button className="w-full">Continue to Sign In</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {emailFromUrl && (
            <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary-soft p-3 text-xs text-primary">
              <MailCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                We generated a verification link for <strong>{emailFromUrl}</strong>.
                In local dev mode, check the API terminal log or paste the token below.
              </span>
            </div>
          )}

          {status === "error" && errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger-soft p-3 text-xs text-danger"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="verify-token">Verification Token</Label>
              <Input
                id="verify-token"
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste 64-character hex verification token"
                className="font-mono text-xs"
              />
            </div>
            <Button type="submit" className="w-full">
              Verify Email
            </Button>
          </form>

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-medium text-ink-muted">
              Didn&apos;t receive a token? Request a fresh one:
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                aria-label="Email for resending verification"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="candidate@example.com"
              />
              <Button
                type="button"
                variant="outline"
                isLoading={isResending}
                onClick={handleResend}
                className="shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
                Resend
              </Button>
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-ink-muted border-t border-border">
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      )}
    </AuthSplitLayout>
  );
}
