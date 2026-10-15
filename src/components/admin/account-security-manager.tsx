"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Laptop,
  Trash2,
  Loader2,
  Shield,
  Clock,
  Globe,
} from "lucide-react";
import {
  revokeOtherSessionAction,
  revokeAllOtherSessionsAction,
} from "@/app/(cms)/admin/account/security/actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

interface SessionItem {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  isCurrent: boolean;
}

interface AccountSecurityProps {
  userEmail: string;
  sessions: SessionItem[];
}

export function AccountSecurityManager({
  userEmail,
  sessions,
}: AccountSecurityProps) {
  const router = useRouter();
  const [sessionList, setSessionList] = React.useState(sessions);
  const [isRevokingAll, setIsRevokingAll] = React.useState(false);
  const [revokingId, setRevokingId] = React.useState<string | null>(null);

  const handleRevokeSession = async (id: string) => {
    setRevokingId(id);
    try {
      const res = await revokeOtherSessionAction(id);
      if (res.success) {
        setSessionList((prev) => prev.filter((s) => s.id !== id));
        toast.success("Session revoked.");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to revoke session.");
      }
    } catch {
      toast.error("An unexpected error occurred while revoking session.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOther = async () => {
    setIsRevokingAll(true);
    try {
      const res = await revokeAllOtherSessionsAction();
      if (res.success) {
        setSessionList((prev) => prev.filter((s) => s.isCurrent));
        toast.success("All other sessions revoked.");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to revoke sessions.");
      }
    } catch {
      toast.error("An unexpected error occurred while revoking sessions.");
    } finally {
      setIsRevokingAll(false);
    }
  };

  const parseBrowser = (ua: string | null) => {
    if (!ua) return "Unknown Device";
    if (ua.includes("Firefox")) return "Mozilla Firefox";
    if (ua.includes("Edg")) return "Microsoft Edge";
    if (ua.includes("Chrome")) return "Google Chrome";
    if (ua.includes("Safari")) return "Apple Safari";
    return "Web Browser";
  };

  const parseOS = (ua: string | null) => {
    if (!ua) return "Unknown OS";
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac OS")) return "macOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
    return "Operating System";
  };

  const otherSessionsCount = sessionList.filter((s) => !s.isCurrent).length;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Account Info Card */}
      <div className="bg-white border border-slate-200 rounded-xs shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-burgundy-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Account Security Overview
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {userEmail}
          </span>
        </div>
        <div className="p-6 text-xs text-slate-700 space-y-2">
          <p className="leading-relaxed">
            Your municipal administrative account is protected by Argon2id cryptographic hashing, continuous session verification, and strict rate limiting.
          </p>
          <p className="text-slate-500 text-[11px]">
            Review your active sessions below. If you notice an unfamiliar device or location, revoke the session immediately.
          </p>
        </div>
      </div>

      {/* Active Sessions Card */}
      <div className="bg-white border border-slate-200 rounded-xs shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-burgundy-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Active Sessions ({sessionList.length})
            </h3>
          </div>
          {otherSessionsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeAllOther}
              disabled={isRevokingAll}
              className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              {isRevokingAll ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Revoking...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Revoke All Other Sessions ({otherSessionsCount})
                </>
              )}
            </Button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {sessionList.map((session) => (
            <div
              key={session.id}
              className={`p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors ${
                session.isCurrent ? "bg-emerald-50/30" : "hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2 rounded-xs mt-0.5 shrink-0 ${
                    session.isCurrent
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Laptop className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-slate-900">
                      {parseBrowser(session.userAgent)} on {parseOS(session.userAgent)}
                    </span>
                    {session.isCurrent && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Current Session
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 font-mono">
                      <Globe className="h-3 w-3 text-slate-400" />
                      {session.ipAddress || "127.0.0.1"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      Created {new Date(session.createdAt).toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {!session.isCurrent && (
                <div className="sm:self-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={revokingId === session.id}
                    className="text-xs text-slate-600 hover:text-red-600 hover:bg-red-50"
                  >
                    {revokingId === session.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Revoke
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}

          {sessionList.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              No active sessions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
