import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { AuthSplitLayout } from "@/features/auth/components/AuthSplitLayout";
import { useAuth } from "@/features/auth/auth.context";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  const fromPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ||
    "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null);
    try {
      const loggedInUser = await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      toast({
        title: `Welcome back, ${loggedInUser.name}`,
        description: "Session authenticated.",
        variant: "success",
      });
      navigate(fromPath, { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setApiError(err.message);
      } else {
        setApiError("Unable to sign in. Please verify your credentials.");
      }
    }
  };

  return (
    <AuthSplitLayout
      title="Sign in to your workbench"
      subtitle="Enter your candidate credentials to resume your interview preparation."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {apiError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger-soft p-3 text-xs text-danger"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email Address</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="candidate@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              error={errors.password?.message}
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-2.5 text-ink-subtle hover:text-ink cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Sign In
        </Button>

        <div className="pt-2 flex flex-col gap-2 text-center text-xs text-ink-muted border-t border-border">
          <p>
            New to TechQuery AI?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create candidate account
            </Link>
          </p>
          <p>
            Need to verify your email?{" "}
            <Link to="/verify-email" className="font-medium text-ink hover:underline">
              Enter verification token
            </Link>
          </p>
        </div>
      </form>
    </AuthSplitLayout>
  );
}
