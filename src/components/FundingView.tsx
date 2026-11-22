import React, { useMemo } from 'react';
import {
  FeeWaiverStatus,
  PhdApplication,
  WAIVER_OPTIONS,
} from '../types/application';
import { formatCurrency, parseCurrency } from '../utils/csv';
import { getDocTone } from '../utils/statusStyles';

interface FundingViewProps {
  applications: PhdApplication[];
  onUpdate: (id: string, patch: Partial<PhdApplication>) => void;
  onSelectProgram: (id: string) => void;
}

export const FundingView: React.FC<FundingViewProps> = ({
  applications,
  onUpdate,
  onSelectProgram,
}) => {
  const summary = useMemo(() => {
    const grossFees = applications.reduce((sum, a) => sum + a.applicationFee, 0);
    const waivedFees = applications.reduce(
      (sum, a) => sum + (a.feeWaiver === 'Granted' ? a.applicationFee : 0),
      0
    );
    const netFees = grossFees - waivedFees;
    const freeSchools = applications.filter((a) => a.applicationFee === 0).length;
    const grantedWaivers = applications.filter((a) => a.feeWaiver === 'Granted').length;
    const requestedWaivers = applications.filter((a) => a.feeWaiver === 'Requested').length;

    const stipends = applications.map((a) => a.stipendAnnual).filter((s) => s > 0);
    const avgStipend =
      stipends.length > 0
        ? Math.round(stipends.reduce((sum, s) => sum + s, 0) / stipends.length)
        : 0;
    const maxStipend = stipends.length > 0 ? Math.max(...stipends) : 50000;

    return {
      grossFees,
      waivedFees,
      netFees,
      freeSchools,
      grantedWaivers,
      requestedWaivers,
      avgStipend,
      maxStipend,
    };
  }, [applications]);

  const sorted = useMemo(
    () => [...applications].sort((a, b) => b.stipendAnnual - a.stipendAnnual),
    [applications]
  );

  const inlineInput =
    'w-full bg-transparent text-[13px] px-2 py-1 rounded border border-transparent hover:border-[#CBD5E1] focus:bg-white focus:border-[#1D4ED8] focus:outline-none transition-colors';

  return (
    <div className="space-y-5">
      {/* Financial Breakdown Strip */}
      <section className="bg-white border border-[#E2E6EC] rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E6EC]">
        <div className="px-5 py-4">
          <p className="text-[12px] font-medium text-[#64748B]">Gross Application Fees</p>
          <p className="mt-1 font-mono text-xl font-semibold text-[#0F172A] tabular-nums">
            {formatCurrency(summary.grossFees)}
          </p>
          <p className="mt-1 text-[12px] text-[#64748B] tabular-nums">
            {summary.freeSchools} programs with $0 fee
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-[12px] font-medium text-[#64748B]">Approved Waivers Saved</p>
          <p className="mt-1 font-mono text-xl font-semibold text-[#15803D] tabular-nums">
            {formatCurrency(summary.waivedFees)}
          </p>
          <p className="mt-1 text-[12px] text-[#64748B] tabular-nums">
            {summary.grantedWaivers} granted · {summary.requestedWaivers} requested
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-[12px] font-medium text-[#64748B]">Net Out-of-Pocket</p>
          <p className="mt-1 font-mono text-xl font-semibold text-[#0F172A] tabular-nums">
            {formatCurrency(summary.netFees)}
          </p>
          <p className="mt-1 text-[12px] text-[#64748B]">
            Estimated cost after waivers
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-[12px] font-medium text-[#64748B]">Average Listed Stipend</p>
          <p className="mt-1 font-mono text-xl font-semibold text-[#0F172A] tabular-nums">
            {summary.avgStipend > 0 ? formatCurrency(summary.avgStipend) : '—'}
          </p>
          <p className="mt-1 text-[12px] text-[#64748B]">Annual graduate support</p>
        </div>
      </section>

      {/* Fees & Stipend Ledger */}
      <section className="bg-white border border-[#E2E6EC] rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E2E6EC] bg-[#F8F9FB] flex items-center justify-between">
          <h2 className="font-display text-[13.5px] font-semibold text-[#0F172A]">
            Application Fee & Stipend Comparison
          </h2>
          <span className="text-[12px] text-[#64748B]">
            Verify stipend figures for each department directly inline
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E2E6EC] bg-[#F8F9FB] text-[11.5px] font-semibold text-[#475569]">
                <th className="py-2.5 pl-5 pr-3 min-w-[225px] whitespace-nowrap">University</th>
                <th className="py-2.5 px-3 w-[95px] text-right whitespace-nowrap">Fee</th>
                <th className="py-2.5 px-3 w-[125px] whitespace-nowrap">Fee Waiver</th>
                <th className="py-2.5 px-3 w-[95px] text-right whitespace-nowrap">Net Cost</th>
                <th className="py-2.5 px-3 min-w-[220px] whitespace-nowrap">Funding Model</th>
                <th className="py-2.5 px-3 w-[115px] text-right whitespace-nowrap">
                  Stipend / Yr
                </th>
                <th className="py-2.5 pr-5 pl-3 min-w-[150px] whitespace-nowrap">Relative Scale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E6EC] text-[13px]">
              {sorted.map((app) => {
                const netCost = app.feeWaiver === 'Granted' ? 0 : app.applicationFee;
                const barWidth =
                  summary.maxStipend > 0
                    ? Math.min(100, Math.round((app.stipendAnnual / summary.maxStipend) * 100))
                    : 0;

                return (
                  <tr key={app.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5 pl-5 pr-3">
                      <button
                        type="button"
                        onClick={() => onSelectProgram(app.id)}
                        className="text-left font-medium text-[#0F172A] hover:text-[#1D4ED8] transition-colors"
                      >
                        {app.university}
                      </button>
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      <input
                        type="text"
                        defaultValue={formatCurrency(app.applicationFee)}
                        key={`${app.id}-f-${app.applicationFee}`}
                        onBlur={(e) =>
                          onUpdate(app.id, { applicationFee: parseCurrency(e.target.value) })
                        }
                        aria-label={`Fee for ${app.university}`}
                        className={`${inlineInput} text-right font-mono text-[12.5px] tabular-nums text-[#334155]`}
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <select
                        value={app.feeWaiver}
                        onChange={(e) =>
                          onUpdate(app.id, { feeWaiver: e.target.value as FeeWaiverStatus })
                        }
                        className={`w-full bg-transparent text-[12.5px] py-1 px-1.5 rounded border border-transparent hover:border-[#CBD5E1] focus:bg-white focus:border-[#1D4ED8] focus:outline-none cursor-pointer ${getDocTone(
                          app.feeWaiver
                        )}`}
                      >
                        {WAIVER_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className="text-[#0F172A] font-normal">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[12.5px] font-medium tabular-nums text-[#0F172A]">
                      {netCost === 0 ? (
                        <span className="text-[#15803D]">$0</span>
                      ) : (
                        formatCurrency(netCost)
                      )}
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={app.fundingModel}
                        onChange={(e) => onUpdate(app.id, { fundingModel: e.target.value })}
                        placeholder="e.g., Fully Funded (GRA / TA)"
                        className={`${inlineInput} text-[#334155]`}
                      />
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      <input
                        type="text"
                        defaultValue={app.stipendAnnual > 0 ? formatCurrency(app.stipendAnnual) : ''}
                        key={`${app.id}-s-${app.stipendAnnual}`}
                        onBlur={(e) =>
                          onUpdate(app.id, { stipendAnnual: parseCurrency(e.target.value) })
                        }
                        placeholder="$0"
                        aria-label={`Annual stipend for ${app.university}`}
                        className={`${inlineInput} text-right font-mono text-[12.5px] tabular-nums text-[#0F172A]`}
                      />
                    </td>
                    <td className="py-2.5 pr-5 pl-3">
                      <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1D4ED8]/80 rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
