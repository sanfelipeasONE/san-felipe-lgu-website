"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, AlertCircle, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { authenticateStaff } from "@/app/(auth)/staff/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginInput) => {
    setIsPending(true);
    setServerError(null);

    try {
      const response = await authenticateStaff(values);
      if (!response.success) {
        setServerError(response.message || "Invalid credentials.");
        setIsPending(false);
      } else {
        router.push(response.redirectTo || "/admin");
        router.refresh();
      }
    } catch {
      setServerError("An unexpected error occurred while communicating with the server.");
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 bg-red-50 border border-red-200 rounded-xs flex items-start gap-2.5 text-xs sm:text-sm text-red-800"
        >
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1.5">
        <Label htmlFor="email" required>
          Municipal Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="employee@sanfelipe.gov.ph"
          error={!!errors.email}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-red-600 mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Input with Show/Hide toggle */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" required>
            Password
          </Label>
          <span className="text-[11px] text-gov-muted" title="Password assistance must be coordinated directly with the ICT Office">
            Contact ICTO for resets
          </span>
        </div>

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••••"
            className="pr-10"
            error={!!errors.password}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gov-muted hover:text-gov-charcoal p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700 rounded-xs"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-xs text-red-600 mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isPending}
        className="w-full font-semibold shadow-xs mt-2"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Verifying Credentials...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            Sign in to Staff CMS
          </>
        )}
      </Button>
    </form>
  );
}
