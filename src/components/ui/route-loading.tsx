import * as React from "react";

export interface RouteLoadingProps {
  variant?: "public" | "admin";
  message?: string;
}

/**
 * RouteLoading
 * Restrained municipal navigation loading component for Next.js App Router loading boundaries.
 * Fully accessible with status semantics and reduced-motion support.
 * Zero external dependencies, zero artificial latency.
 */
export function RouteLoading({
  variant = "public",
  message = "Loading...",
}: RouteLoadingProps) {
  if (variant === "admin") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex-1 flex flex-col items-center justify-center min-h-[380px] p-8 bg-slate-50/50"
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-burgundy-700 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-slate-500 tracking-wide mt-3">
          {message}
        </span>
        <span className="sr-only">Loading management portal content, please wait...</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[50vh] flex flex-col items-center justify-center p-8 bg-transparent"
    >
      <div
        className="w-10 h-10 rounded-full border-3 border-burgundy-100 border-t-burgundy-700 border-r-gold-500 animate-spin motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span className="text-sm font-medium text-slate-600 tracking-wide mt-3.5">
        {message}
      </span>
      <span className="sr-only">Loading page content, please wait...</span>
    </div>
  );
}
