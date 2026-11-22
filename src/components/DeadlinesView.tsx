import React, { useMemo } from 'react';
import { PanelRightOpen } from 'lucide-react';
import { APP_STATUS_OPTIONS, ApplicationStatus, PhdApplication } from '../types/application';
import { computeDaysLeft, formatCurrency, formatDeadlineShort } from '../utils/csv';
import { getAppStatusTone, getDaysLeftTone, getDocTone } from '../utils/statusStyles';

interface DeadlinesViewProps {
  applications: PhdApplication[];
  onUpdate: (id: string, patch: Partial<PhdApplication>) => void;
  onSelectProgram: (id: string) => void;
}

interface DeadlineGroup {
  id: string;
  title: string;
  subtitle: string;
  items: { app: PhdApplication; daysLeft: number | null }[];
}

export const DeadlinesView: React.FC<DeadlinesViewProps> = ({
  applications,
  onUpdate,
  onSelectProgram,
}) => {
  const groups = useMemo<DeadlineGroup[]>(() => {
    const enriched = applications
      .map((app) => ({ app, daysLeft: computeDaysLeft(app.appDeadline) }))
      .sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999));

    const urgent = enriched.filter((e) => e.daysLeft !== null && e.daysLeft >= 0 && e.daysLeft <= 14);
    const medium = enriched.filter((e) => e.daysLeft !== null && e.daysLeft > 14 && e.daysLeft <= 35);
    const later = enriched.filter((e) => e.daysLeft !== null && e.daysLeft > 35);
    const pastOrTbd = enriched.filter((e) => e.daysLeft === null || e.daysLeft < 0);

    return [
      {
        id: 'urgent',
        title: 'Next 14 Days',
        subtitle: 'Immediate submission window — finalize SOP, portal upload, and recommender reminders.',
        items: urgent,
      },
      {
        id: 'medium',
        title: '15 to 35 Days Out',
        subtitle: 'Mid-December to late-December deadlines.',
        items: medium,
      },
      {
        id: 'later',
        title: 'More Than 35 Days Out',
        subtitle: 'January 2027 deadlines — ideal time for faculty outreach and fee waiver requests.',
        items: later,
      },
      {
        id: 'past',
        title: 'Passed or Unscheduled',
        subtitle: 'Deadlines already passed or missing a valid date.',
        items: pastOrTbd,
      },
    ].filter((g) => g.items.length > 0);
  }, [applications]);

  if (applications.length === 0) {
    return (
      <div className="bg-white border border-[#E2E6EC] rounded-lg p-12 text-center">
        <p className="font-display text-sm font-semibold text-[#0F172A]">No deadlines scheduled</p>
        <p className="mt-1 text-[13px] text-[#64748B]">
          Add universities with application dates to see your chronological schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section
          key={group.id}
          className="bg-white border border-[#E2E6EC] rounded-lg overflow-hidden"
        >
          <div className="px-5 py-3.5 border-b border-[#E2E6EC] bg-[#F8F9FB] flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-[14px] font-semibold text-[#0F172A]">
                {group.title}{' '}
                <span className="font-mono text-[12px] font-normal text-[#64748B] tabular-nums ml-1">
                  ({group.items.length})
                </span>
              </h2>
              <p className="text-[12px] text-[#64748B] mt-0.5">{group.subtitle}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E2E6EC] text-[11.5px] font-semibold text-[#64748B]">
                  <th className="py-2.5 pl-5 pr-3 w-[128px] whitespace-nowrap">Deadline</th>
                  <th className="py-2.5 px-3 w-[84px] text-right whitespace-nowrap">Countdown</th>
                  <th className="py-2.5 px-3 min-w-[220px] whitespace-nowrap">University & Dept.</th>
                  <th className="py-2.5 px-3 min-w-[220px] whitespace-nowrap">Materials Readiness</th>
                  <th className="py-2.5 px-3 w-[88px] text-right whitespace-nowrap">Fee</th>
                  <th className="py-2.5 px-3 w-[132px] whitespace-nowrap">Status</th>
                  <th className="py-2.5 pr-5 pl-3 w-[76px] text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E6EC] text-[13px]">
                {group.items.map(({ app, daysLeft }) => (
                  <tr key={app.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 pl-5 pr-3 font-mono text-[12.5px] text-[#0F172A] tabular-nums whitespace-nowrap">
                      {formatDeadlineShort(app.appDeadline)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono text-[12.5px] tabular-nums whitespace-nowrap ${getDaysLeftTone(
                        daysLeft
                      )}`}
                    >
                      {daysLeft === null
                        ? 'TBD'
                        : daysLeft < 0
                        ? `${Math.abs(daysLeft)}d ago`
                        : `${daysLeft} d`}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => onSelectProgram(app.id)}
                        className="text-left hover:text-[#1D4ED8] font-medium text-[#0F172A] transition-colors"
                      >
                        {app.university}
                      </button>
                      <div className="text-[12px] text-[#64748B] truncate max-w-[300px]">
                        {app.department && app.department !== 'a' ? app.department : 'Department pending'} ·{' '}
                        {app.category}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[12px] whitespace-nowrap">
                      <span className={getDocTone(app.sopStatus)}>SOP: {app.sopStatus}</span>
                      <span className="mx-1.5 text-[#CBD5E1]">·</span>
                      <span className={`font-mono tabular-nums ${getDocTone(app.lorStatus)}`}>
                        LOR: {app.lorStatus.replace(' Submitted', '')}
                      </span>
                      <span className="mx-1.5 text-[#CBD5E1]">·</span>
                      <span className={getDocTone(app.transcripts)}>
                        Trans: {app.transcripts}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[12.5px] tabular-nums whitespace-nowrap text-[#334155]">
                      {app.feeWaiver === 'Granted' ? (
                        <span className="text-[#15803D]">Waived</span>
                      ) : (
                        formatCurrency(app.applicationFee)
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={app.applicationStatus}
                        onChange={(e) =>
                          onUpdate(app.id, {
                            applicationStatus: e.target.value as ApplicationStatus,
                          })
                        }
                        className={`bg-transparent text-[12.5px] py-1 pr-4 pl-1 rounded border border-transparent hover:border-[#CBD5E1] focus:bg-white focus:border-[#1D4ED8] focus:outline-none cursor-pointer ${getAppStatusTone(
                          app.applicationStatus
                        )}`}
                      >
                        {APP_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className="text-[#0F172A] font-normal">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-5 pl-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectProgram(app.id)}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-[#475569] hover:text-[#1D4ED8] whitespace-nowrap"
                      >
                        <PanelRightOpen className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
};
