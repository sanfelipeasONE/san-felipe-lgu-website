import * as React from "react";
import { Info, ExternalLink } from "lucide-react";
import type { MunicipalOffice } from "@/config/offices-data";

export interface OfficeDirectoryProps {
  offices: MunicipalOffice[];
}

export function OfficeDirectory({ offices }: OfficeDirectoryProps) {
  return (
    <div>
      {/* Restrained Directory Summary Header */}
      <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 pb-3 border-b border-gray-200">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base sm:text-lg font-bold text-gov-charcoal tracking-tight">
            Municipal Office Directory
          </h2>
          <span className="text-xs font-normal text-slate-500">
            ({offices.length} municipal offices)
          </span>
        </div>
        <p className="text-xs text-gov-muted">
          Verified executive, legislative, administrative, and frontline departments of San Felipe, Zambales.
        </p>
      </div>

      {/* Unified Modern Directory Surface (Row-and-Column) */}
      <div className="bg-white border border-gray-200 rounded-xs shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="hidden md:table-header-group bg-burgundy-900 text-white border-b-2 border-gold-500">
            <tr>
              <th
                scope="col"
                className="py-2.5 px-5 sm:px-6 text-[11px] font-semibold uppercase tracking-wider text-white w-[40%]"
              >
                Office / Department
              </th>
              <th
                scope="col"
                className="py-2.5 px-5 sm:px-6 text-[11px] font-semibold uppercase tracking-wider text-white w-[40%]"
              >
                Office Head / OIC
              </th>
              <th
                scope="col"
                className="py-2.5 px-5 sm:px-6 text-[11px] font-semibold uppercase tracking-wider text-white w-[20%]"
              >
                Official Facebook
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 md:divide-gray-100">
            {offices.map((office) => {
              const formattedNumber = String(office.displayOrder).padStart(2, "0");

              return (
                <tr
                  key={office.id}
                  className="block md:table-row p-4 md:p-0 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Column 1: Office / Department */}
                  <td className="block md:table-cell py-1.5 md:py-3 px-0 md:px-6 align-top">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-xs text-slate-400 select-none shrink-0 mt-0.5 font-normal">
                        #{formattedNumber}
                      </span>
                      <span className="font-medium text-gov-charcoal text-xs sm:text-sm leading-snug block">
                        {office.name}
                      </span>
                    </div>
                  </td>

                  {/* Column 2: Office Head / OIC */}
                  <td className="block md:table-cell py-1.5 md:py-3 px-0 md:px-6 align-top">
                    {office.head ? (
                      <div>
                        <span className="md:hidden text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                          Office Head / OIC
                        </span>
                        <span className="font-medium text-gov-charcoal text-xs sm:text-[13px] block leading-snug">
                          {office.head}
                        </span>
                        {office.headTitle && (
                          <span className="text-[11px] text-gov-muted font-normal block mt-0.5">
                            {office.headTitle}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs font-normal">Not available</span>
                    )}
                  </td>

                  {/* Column 3: Official Facebook */}
                  <td className="block md:table-cell py-1.5 md:py-3 px-0 md:px-6 align-top">
                    {office.facebookUrl ? (
                      <a
                        href={office.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs sm:text-sm font-normal text-slate-600 hover:text-burgundy-800 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-burgundy-700 rounded-2xs"
                        aria-label={`Visit ${office.name} Facebook page`}
                      >
                        <span>Facebook Page</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      </a>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
