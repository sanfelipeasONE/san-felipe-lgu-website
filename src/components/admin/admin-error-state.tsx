import * as React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AdminErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function AdminErrorState({
  title = "An administrative error occurred",
  message = "The system was unable to load or process this administrative resource. Please verify your connection or contact the ICT Office.",
  onRetry,
  className,
}: AdminErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xs border border-rose-200 bg-rose-50/50 p-6 sm:p-8 text-center flex flex-col items-center justify-center",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shadow-2xs mb-3">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>

      <h3 className="text-sm font-bold text-rose-950 tracking-tight">
        {title}
      </h3>

      <p className="mt-1 text-xs text-rose-800/90 max-w-md leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <div className="mt-4">
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="border-rose-300 text-rose-900 hover:bg-rose-100/60 font-medium text-xs shadow-2xs"
          >
            <RotateCcw className="h-3 w-3 mr-1.5" />
            <span>Try Again</span>
          </Button>
        </div>
      )}
    </div>
  );
}
