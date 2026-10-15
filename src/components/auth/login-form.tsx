"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Lock, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { authenticateStaff } from "@/app/(auth)/staff/login/actions";

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
        setServerError(response.message || "Unable to sign in. Please check your email and password.");
        setIsPending(false);
      } else {
        router.push(response.redirectTo || "/admin");
        router.refresh();
      }
    } catch {
      setServerError("Unable to sign in. Please check your email and password.");
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800"
        >
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Email Address */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-xs font-medium text-slate-700"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="name@municipality.gov.ph"
          disabled={isPending}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-burgundy-700 focus:bg-white transition-colors disabled:opacity-60"
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-red-600 mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password with Show/Hide Text Toggle */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-xs font-medium text-slate-700"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••••"
            disabled={isPending}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="w-full px-3.5 py-2.5 pr-14 bg-slate-50 border border-slate-200/90 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-burgundy-700 focus:bg-white transition-colors disabled:opacity-60"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded focus-visible:outline-2 focus-visible:outline-burgundy-700 cursor-pointer select-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-xs text-red-600 mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Sign In Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-3 py-2.5 px-4 bg-[#6b0f1a] hover:bg-[#520b14] text-white font-medium text-sm rounded-lg transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-burgundy-700 focus-visible:outline-offset-2 disabled:opacity-60 cursor-pointer flex items-center justify-center min-h-[42px]"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Signing in…</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </button>

      {/* Internal Card Divider */}
      <div className="pt-4 border-t border-slate-100 mt-5">
        <div className="flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
          <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong className="font-semibold text-slate-700">Authorized personnel only.</strong> Access to this system is restricted to authorized Municipality of San Felipe personnel.
          </p>
        </div>
      </div>
    </form>
  );
}
