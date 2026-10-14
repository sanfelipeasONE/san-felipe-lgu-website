"use client";

import * as React from "react";
import { Eye, X, Shield, Clock, User, Building, Globe, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuditDetailProps {
  log: {
    id: string;
    action: string;
    createdAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    details: unknown;
    user?: {
      id: string;
      name: string;
      email: string;
    } | null;
    office?: {
      id: string;
      name: string;
      shortName: string | null;
      slug: string;
    } | null;
  };
}

export function AuditDetailModal({ log }: AuditDetailProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs h-7 px-2 text-burgundy-700 hover:text-burgundy-900 hover:bg-burgundy-50"
      >
        <Eye className="h-3.5 w-3.5 mr-1" />
        Details
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xs border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-burgundy-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Audit Log Event Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-700"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Event & Action */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xs border border-slate-200">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Event Action
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                    {log.action}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Timestamp
                  </span>
                  <span className="text-slate-700 text-xs mt-0.5 flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {new Date(log.createdAt).toLocaleString("en-PH", {
                      timeZone: "Asia/Manila",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Actor & Office */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 p-3 rounded-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <User className="h-3 w-3 text-slate-400" />
                    Actor / User
                  </span>
                  {log.user ? (
                    <div>
                      <div className="font-semibold text-slate-900">{log.user.name}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{log.user.email}</div>
                      <div className="text-slate-400 font-mono text-[10px] mt-1">ID: {log.user.id}</div>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">System / Unauthenticated</div>
                  )}
                </div>

                <div className="border border-slate-200 p-3 rounded-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Building className="h-3 w-3 text-slate-400" />
                    Municipal Office
                  </span>
                  {log.office ? (
                    <div>
                      <div className="font-semibold text-slate-900">
                        {log.office.name} {log.office.shortName ? `(${log.office.shortName})` : ""}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px]">{log.office.slug}</div>
                      <div className="text-slate-400 font-mono text-[10px] mt-1">ID: {log.office.id}</div>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">System-Wide / No Office</div>
                  )}
                </div>
              </div>

              {/* Network Context */}
              <div className="border border-slate-200 p-3 rounded-xs space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="h-3 w-3 text-slate-400" />
                  Network & Client Context
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <span className="text-slate-500 text-[11px] block">Client IP</span>
                    <span className="font-mono text-slate-900 font-semibold">{log.ipAddress || "Unknown"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 text-[11px] block">User Agent</span>
                    <span className="font-mono text-slate-700 text-[11px] truncate block" title={log.userAgent || ""}>
                      {log.userAgent || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Event Metadata (Redacted) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Terminal className="h-3 w-3 text-slate-400" />
                  Event Metadata Payload (Redacted)
                </span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xs font-mono text-xs overflow-x-auto max-h-56 leading-relaxed select-all">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
