"use client";

import * as React from "react";
import { AlertTriangle, AlertCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const confirmBtnRef = React.useRef<HTMLButtonElement>(null);

  // Keyboard navigation: Escape key closes modal
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  // Focus trap: auto focus confirm button on open
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const isDanger = variant === "danger";

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        onClick={isLoading ? undefined : onCancel}
        className="fixed inset-0 bg-gov-charcoal/60 backdrop-blur-2xs transition-opacity animate-in fade-in"
      />

      {/* Modal Surface */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-md bg-white rounded-xs border border-gray-200 shadow-xl overflow-hidden z-10 animate-in zoom-in-95 duration-150"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-2xs border",
                isDanger
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              )}
            >
              {isDanger ? (
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3
                id="confirm-dialog-title"
                className="text-base font-bold text-gov-charcoal tracking-tight"
              >
                {title}
              </h3>
              <p
                id="confirm-dialog-desc"
                className="mt-1.5 text-xs sm:text-sm text-gov-muted leading-relaxed"
              >
                {description}
              </p>
            </div>

            <button
              onClick={onCancel}
              disabled={isLoading}
              className="text-gray-400 hover:text-gov-charcoal transition-colors p-1 rounded-xs -mr-1 -mt-1 focus:outline-hidden focus:ring-2 focus:ring-burgundy-700"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-gray-200 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            className="text-xs font-semibold border-gray-300"
          >
            {cancelLabel}
          </Button>

          <Button
            ref={confirmBtnRef}
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "text-xs font-semibold text-white shadow-2xs",
              isDanger
                ? "bg-rose-700 hover:bg-rose-800"
                : "bg-burgundy-700 hover:bg-burgundy-800"
            )}
          >
            {isLoading && (
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" aria-hidden="true" />
            )}
            <span>{confirmLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
