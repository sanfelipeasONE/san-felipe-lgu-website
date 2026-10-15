"use client";

import * as React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConcurrencyConflictBannerProps {
  message?: string;
  onReload?: () => void;
  className?: string;
}

export function ConcurrencyConflictBanner({
  message = "This content was updated in another session. Reload the latest version before saving your changes.",
  onReload,
  className,
}: ConcurrencyConflictBannerProps) {
  const handleReload = () => {
    if (onReload) {
      onReload();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div
      role="alert"
      className={`p-4 rounded-xs border border-amber-300 bg-amber-50 text-amber-900 flex items-start gap-3 shadow-2xs ${className || ""}`}
    >
      <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 text-amber-700 mt-0.5">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-xs sm:text-sm font-bold text-amber-950">
          Concurrent Modification Detected
        </h4>
        <p className="mt-1 text-xs text-amber-800 leading-relaxed">
          {message}
        </p>
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReload}
            className="border-amber-400 bg-white text-amber-900 hover:bg-amber-100 hover:text-amber-950 text-xs shadow-2xs font-medium cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reload Latest Version
          </Button>
        </div>
      </div>
    </div>
  );
}
