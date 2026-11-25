import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { AuthSplitLayout } from "@/features/auth/components/AuthSplitLayout";
import { useAuth } from "@/features/auth/auth.context";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const registerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email cannot exceed 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const passwordValue = watch("password") || "";

  const passwordRules = [
    { label: "At least 8 characters", met: passwordValue.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(passwordValue) },
    { label: "One lowercase letter", met: /[a-z]/.test(passwordValue) },
    { label: "One number", met: /[0-9]/.test(passwordValue) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(passwordValue) },
  ];

  const onSubmit = async (values: RegisterFormValues) => {
    setApiError(null);
    try {
      const normalizedEmail = values.email.trim().toLowerCase();
      const result = await registerAccount({
        name: values.name.trim(),
        email: normalizedEmail,
        password: values.password,
      });

      let devToken: string | undefined;
      if (result.verificationUrl) {
        try {
          devToken = new URL(result.verificationUrl).searchParams.get("token") ?? undefined;
        } catch {
          devToken = undefined;
        }
      }

      toast({
        title: "Account created",
        description: "Please verify your email address to sign in.",
        variant: "success",
      });

      navigate(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`, {
        replace: true,
        state: devToken ? { devToken } : undefined,
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setApiError(err.message);
      } else {
        setApiError("Unable to create account. Please try again.");
      }
    }
  };

  return (
    <AuthSplitLayout
      title="Create your candidate account"
      subtitle="Start preparing with ₹0 local-first ATS diagnostics and tailored mock interviews."
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
          <Label htmlFor="register-name">Full Name</Label>
          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="Jane Candidate"
            error={errors.name?.message}
            {...register("name")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-email">Email Address</Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="jane@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
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

          {/* Live Password Requirements Checklist */}
          <ul
            aria-label="Password requirements"
            className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 rounded-lg border border-border bg-surface-muted/60 p-3"
          >
            {passwordRules.map((rule) => (
              <li
                key={rule.label}
                className={cn(
                  "flex items-center gap-1.5 text-[11px] transition-colors",
                  rule.met ? "text-primary font-medium" : "text-ink-subtle"
                )}
              >
                <Check
                  className={cn(
                    "h-3 w-3 shrink-0",
                    rule.met ? "text-primary" : "text-ink-subtle/50"
                  )}
                />
                <span>{rule.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Create Account
        </Button>

        <div className="pt-2 text-center text-xs text-ink-muted border-t border-border">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
}
