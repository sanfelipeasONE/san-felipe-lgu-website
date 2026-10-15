"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

let toastState: ToastItem[] = [];
const listeners = new Set<ToastListener>();

function notifyListeners() {
  listeners.forEach((listener) => listener([...toastState]));
}

let toastCounter = 0;

export const toast = {
  success(message: string, options?: { title?: string; duration?: number }) {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    toastState = [
      ...toastState,
      { id, type: "success", message, title: options?.title, duration: options?.duration ?? 4000 },
    ];
    notifyListeners();
    return id;
  },
  error(message: string, options?: { title?: string; duration?: number }) {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    toastState = [
      ...toastState,
      { id, type: "error", message, title: options?.title, duration: options?.duration ?? 5000 },
    ];
    notifyListeners();
    return id;
  },
  info(message: string, options?: { title?: string; duration?: number }) {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    toastState = [
      ...toastState,
      { id, type: "info", message, title: options?.title, duration: options?.duration ?? 4000 },
    ];
    notifyListeners();
    return id;
  },
  dismiss(id: string) {
    toastState = toastState.filter((t) => t.id !== id);
    notifyListeners();
  },
  clear() {
    toastState = [];
    notifyListeners();
  },
};

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>(toastState);

  React.useEffect(() => {
    const listener: ToastListener = (updated) => setToasts(updated);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    toasts,
    dismiss: toast.dismiss,
    clear: toast.clear,
  };
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast: t,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  React.useEffect(() => {
    if (!t.duration || t.duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, t.duration);
    return () => clearTimeout(timer);
  }, [t.duration, onDismiss]);

  const isError = t.type === "error";
  const isSuccess = t.type === "success";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-md bg-white transition-all transform animate-in slide-in-from-bottom-2 fade-in duration-200",
        isSuccess && "border-emerald-200 bg-white",
        isError && "border-rose-200 bg-white",
        t.type === "info" && "border-slate-200 bg-white"
      )}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          isSuccess && "bg-emerald-50 text-emerald-700",
          isError && "bg-rose-50 text-rose-700",
          t.type === "info" && "bg-slate-100 text-slate-700"
        )}
      >
        {isSuccess && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
        {isError && <AlertCircle className="h-4 w-4" aria-hidden="true" />}
        {t.type === "info" && <Info className="h-4 w-4" aria-hidden="true" />}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        {t.title && (
          <p className="text-xs font-semibold text-slate-900 leading-tight mb-0.5">
            {t.title}
          </p>
        )}
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          {t.message}
        </p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
