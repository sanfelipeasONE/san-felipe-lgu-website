import * as React from "react";
import { Info } from "lucide-react";
import type { MunicipalOffice } from "@/config/offices-data";

export interface OfficeDirectoryProps {
  offices: MunicipalOffice[];
}

export function OfficeDirectory({ offices }: OfficeDirectoryProps) {
  return (
    <div>
      {/* Directory Count Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-2 border-b border-gray-200">
        <span>
          Showing{" "}
          <strong className="text-gov-charcoal font-bold">
            {offices.length}
          </strong>{" "}
          municipal offices
        </span>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-gray-300 rounded-xs shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left border-collapse">
            <thead>
              <tr className="bg-burgundy-900 text-white border-b-2 border-gold-500 divide-x divide-burgundy-800/80">
                <th
                  scope="col"
                  className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-white w-[40%]"
                >
                  Office / Department
                </th>
                <th
                  scope="col"
                  className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-white w-[30%]"
                >
                  Office Head / OIC
                </th>
                <th
                  scope="col"
                  className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-white w-[30%]"
                >
                  Facebook Page
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {offices.map((office) => {
                const formattedNumber = String(office.displayOrder).padStart(2, "0");

                return (
                  <tr
                    key={office.id}
                    className="odd:bg-white even:bg-slate-50/60 hover:bg-burgundy-50/30 transition-colors divide-x divide-gray-200"
                  >
                    {/* 1. Office / Department */}
                    <td className="py-3.5 px-5 align-top">
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0 mt-0.5">
                          #{formattedNumber}
                        </span>
                        <span className="font-bold text-gov-charcoal text-xs sm:text-sm leading-snug">
                          {office.name}
                        </span>
                      </div>
                    </td>

                    {/* 2. Office Head / OIC */}
                    <td className="py-3.5 px-5 align-top">
                      {office.head ? (
                        <div>
                          <span className="font-bold text-gov-charcoal text-xs sm:text-[13px] block leading-snug">
                            {office.head}
                          </span>
                          {office.headTitle && (
                            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                              {office.headTitle}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs select-none">
                          —
                        </span>
                      )}
                    </td>

                    {/* 3. Facebook Page */}
                    <td className="py-3.5 px-5 align-top">
                      {office.facebookUrl ? (
                        <a
                          href={office.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-burgundy-800 hover:underline text-xs text-burgundy-700 font-semibold"
                        >
                          Visit Facebook Page
                        </a>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs select-none">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Directory Notes Card */}
      <div className="mt-8 bg-white border border-gray-200 rounded-xs p-4 sm:p-5 text-xs text-slate-600 leading-relaxed shadow-2xs">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-burgundy-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <strong className="font-bold text-gov-charcoal block">
              Official Municipal Directory Note
            </strong>
            <p className="text-slate-500">
              This directory reflects the verified municipal offices of the Local Government Unit of San Felipe, Zambales. Official designations are updated continuously upon formal municipal administrative issuance. For public inquiries, please visit the Municipal Hall Complex during official business hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
