"use client";

import * as React from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface DestructiveConfirmDialogProps {
  title?: string;
  description?: string;
  warningText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void | Promise<void>;
  triggerLabel?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export function DestructiveConfirmDialog({
  title = "Permanently delete this item?",
  description = "This action cannot be undone.",
  warningText,
  confirmLabel = "Permanently Delete",
  cancelLabel = "Cancel",
  isPending = false,
  onConfirm,
  triggerLabel = "Delete",
  triggerClassName,
  disabled = false,
}: DestructiveConfirmDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const cancelButtonRef = React.useRef<HTMLButtonElement>(null);

  // Close on Escape key
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen && !isPending) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      cancelButtonRef.current?.focus();
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending]);

  return (
    <>
      <button
        type="button"
        disabled={disabled || isPending}
        onClick={() => setIsOpen(true)}
        className={
          triggerClassName ||
          "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:text-rose-800 transition-colors disabled:opacity-50 cursor-pointer"
        }
        aria-haspopup="dialog"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>{triggerLabel}</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="destructive-dialog-title"
          aria-describedby="destructive-dialog-description"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            ref={dialogRef}
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all p-6 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-rose-100 text-rose-700 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  id="destructive-dialog-title"
                  className="text-base font-semibold text-slate-900 leading-tight"
                >
                  {title}
                </h3>
                <p
                  id="destructive-dialog-description"
                  className="text-xs text-slate-600 mt-1"
                >
                  {description}
                </p>
                {warningText && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                    {warningText}
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                ref={cancelButtonRef}
                type="button"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={async () => {
                  await onConfirm();
                  setIsOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg text-white bg-rose-700 hover:bg-rose-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{confirmLabel}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
