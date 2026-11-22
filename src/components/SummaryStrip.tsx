import React from 'react';
import { PhdApplication } from '../types/application';
import {
  computeDaysLeft,
  formatCurrency,
  getApplicationIssues,
  getCompletenessScore,
} from '../utils/csv';

interface SummaryStripProps {
  applications: PhdApplication[];
  onOpenAudit: () => void;
  onOpenDeadlines: () => void;
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({
  applications,
  onOpenAudit,
  onOpenDeadlines,
}) => {
  const total = applications.length;
  const reachCount = applications.filter((a) => a.category === 'Reach').length;
  const targetCount = applications.filter((a) => a.category === 'Target').length;
  const safetyCount = applications.filter((a) => a.category === 'Safety').length;

  const grossFees = applications.reduce((sum, a) => sum + a.applicationFee, 0);
  const netFees = applications.reduce(
    (sum, a) => sum + (a.feeWaiver === 'Granted' ? 0 : a.applicationFee),
    0
  );
  const waivedFees = grossFees - netFees;

  const inProgressCount = applications.filter((a) => a.applicationStatus === 'In Progress').length;
  const submittedCount = applications.filter(
    (a) =>
      a.applicationStatus === 'Submitted' ||
      a.applicationStatus === 'Interview' ||
      a.applicationStatus === 'Admitted'
  ).length;

  const upcomingDays = applications
    .filter((a) => a.applicationStatus !== 'Submitted' && a.applicationStatus !== 'Admitted')
    .map((a) => computeDaysLeft(a.appDeadline))
    .filter((d): d is number => d !== null && d >= 0)
    .sort((a, b) => a - b);

  const nextDeadlineDays = upcomingDays.length > 0 ? upcomingDays[0] : null;

  const avgCompleteness =
    total > 0
      ? Math.round(
          applications.reduce((sum, app) => sum + getCompletenessScore(app), 0) / total
        )
      : 0;
  const programsWithIssues = applications.filter((a) => getApplicationIssues(a).length > 0).length;

  return (
    <section
      aria-label="Application overview metrics"
      className="bg-white border border-[#E2E6EC] rounded-lg grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E6EC]"
    >
      {/* Metric 1: Total Programs */}
      <div className="px-5 py-4">
        <p className="text-[12px] font-medium text-[#64748B]">Target Programs</p>
        <p className="mt-1 font-mono text-2xl font-semibold text-[#0F172A] tabular-nums">
          {total}
        </p>
        <p className="mt-1.5 text-[12px] text-[#64748B] tabular-nums">
          {reachCount} Reach · {targetCount} Target · {safetyCount} Safety
        </p>
      </div>

      {/* Metric 2: Net Fees */}
      <div className="px-5 py-4">
        <p className="text-[12px] font-medium text-[#64748B]">Net Application Fees</p>
        <p className="mt-1 font-mono text-2xl font-semibold text-[#0F172A] tabular-nums">
          {formatCurrency(netFees)}
        </p>
        <p className="mt-1.5 text-[12px] text-[#64748B] tabular-nums">
          {waivedFees > 0
            ? `${formatCurrency(waivedFees)} waived · ${formatCurrency(grossFees)} gross`
            : `${formatCurrency(grossFees)} total across ${total} schools`}
        </p>
      </div>

      {/* Metric 3: Application Progress */}
      <div className="px-5 py-4">
        <p className="text-[12px] font-medium text-[#64748B]">Submission Progress</p>
        <div className="mt-1 flex items-baseline gap-2.5">
          <span className="font-mono text-2xl font-semibold text-[#0F172A] tabular-nums">
            {submittedCount}
            <span className="text-[15px] font-normal text-[#64748B]">/{total}</span>
          </span>
          <span className="text-[12px] text-[#475569] tabular-nums">
            {inProgressCount} in progress
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenDeadlines}
          className="mt-1.5 text-[12px] text-[#1D4ED8] hover:underline font-medium tabular-nums text-left"
        >
          {nextDeadlineDays !== null
            ? `Next unsubmitted deadline in ${nextDeadlineDays} d`
            : 'View deadline schedule'}
        </button>
      </div>

      {/* Metric 4: Sheet Completeness */}
      <div className="px-5 py-4">
        <p className="text-[12px] font-medium text-[#64748B]">Sheet Info Completeness</p>
        <div className="mt-1 flex items-baseline gap-2.5">
          <span className="font-mono text-2xl font-semibold text-[#0F172A] tabular-nums">
            {avgCompleteness}%
          </span>
          <span
            className={`text-[12px] tabular-nums ${
              programsWithIssues > 0 ? 'text-[#B45309] font-medium' : 'text-[#15803D] font-medium'
            }`}
          >
            {programsWithIssues > 0 ? `${programsWithIssues} need info` : 'All fields verified'}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenAudit}
          className="mt-1.5 text-[12px] text-[#1D4ED8] hover:underline font-medium text-left"
        >
          {programsWithIssues > 0 ? 'Review missing & template fields' : 'Open field checklist'}
        </button>
      </div>
    </section>
  );
};
