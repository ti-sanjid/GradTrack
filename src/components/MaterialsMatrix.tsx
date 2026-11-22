import React from 'react';
import {
  CV_OPTIONS,
  CvStatus,
  FeeWaiverStatus,
  LOR_OPTIONS,
  LorStatus,
  PhdApplication,
  SOP_OPTIONS,
  SopStatus,
  TRANSCRIPT_OPTIONS,
  TranscriptStatus,
  WAIVER_OPTIONS,
} from '../types/application';
import { computeDaysLeft, isPlaceholderIelts } from '../utils/csv';
import { getDaysLeftTone, getDocTone } from '../utils/statusStyles';

interface MaterialsMatrixProps {
  applications: PhdApplication[];
  onUpdate: (id: string, patch: Partial<PhdApplication>) => void;
  onSelectProgram: (id: string) => void;
}

export const MaterialsMatrix: React.FC<MaterialsMatrixProps> = ({
  applications,
  onUpdate,
  onSelectProgram,
}) => {
  const total = applications.length || 1;
  const sopDone = applications.filter((a) => a.sopStatus === 'Completed').length;
  const cvDone = applications.filter((a) => a.cvStatus === 'Ready').length;
  const transcriptsDone = applications.filter((a) => a.transcripts === 'Uploaded').length;
  const lorDone = applications.filter((a) => a.lorStatus === '3/3 Submitted').length;
  const ieltsDone = applications.filter((a) => !isPlaceholderIelts(a.ieltsScore)).length;

  const progressBars = [
    { label: 'SOP Completed', count: sopDone },
    { label: 'CV Ready', count: cvDone },
    { label: 'Transcripts Uploaded', count: transcriptsDone },
    { label: '3/3 LORs Submitted', count: lorDone },
    { label: 'IELTS Req. Verified', count: ieltsDone },
  ];

  const selectClass =
    'w-full bg-transparent text-[12.5px] py-1.5 px-1.5 rounded border border-transparent hover:border-[#CBD5E1] focus:bg-white focus:border-[#1D4ED8] focus:outline-none cursor-pointer transition-colors';

  const sorted = [...applications].sort(
    (a, b) => (computeDaysLeft(a.appDeadline) ?? 9999) - (computeDaysLeft(b.appDeadline) ?? 9999)
  );

  return (
    <div className="space-y-5">
      {/* Cohort Document Readiness Bars */}
      <section className="bg-white border border-[#E2E6EC] rounded-lg p-5">
        <h2 className="font-display text-[14px] font-semibold text-[#0F172A] mb-4">
          Document & Recommender Progress Across All Programs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {progressBars.map((item) => {
            const pct = Math.round((item.count / total) * 100);
            return (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-[12px]">
                  <span className="text-[#475569] font-medium truncate">{item.label}</span>
                  <span className="font-mono text-[#0F172A] font-medium tabular-nums shrink-0">
                    {item.count}/{applications.length}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#E2E6EC] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1D4ED8] rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Document Matrix */}
      <section className="bg-white border border-[#E2E6EC] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E2E6EC] bg-[#F8F9FB] text-[11.5px] font-semibold text-[#475569]">
                <th className="sticky left-0 z-10 bg-[#F8F9FB] py-2.5 pl-4 pr-3 min-w-[230px] border-r border-[#E2E6EC]">
                  University
                </th>
                <th className="py-2.5 px-3 w-[82px] text-right whitespace-nowrap">Due In</th>
                <th className="py-2.5 px-3 min-w-[132px] whitespace-nowrap">SOP Status</th>
                <th className="py-2.5 px-3 min-w-[120px] whitespace-nowrap">CV / Resume</th>
                <th className="py-2.5 px-3 min-w-[132px] whitespace-nowrap">Transcripts</th>
                <th className="py-2.5 px-3 min-w-[140px] whitespace-nowrap">LOR Status</th>
                <th className="py-2.5 px-3 min-w-[145px] whitespace-nowrap">IELTS Req.</th>
                <th className="py-2.5 px-3 min-w-[120px] whitespace-nowrap">Fee Waiver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E6EC] text-[13px]">
              {sorted.map((app) => {
                const days = computeDaysLeft(app.appDeadline);
                const ieltsMissing = isPlaceholderIelts(app.ieltsScore);
                return (
                  <tr key={app.id} className="group hover:bg-[#F8FAFC] transition-colors">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-[#F8FAFC] py-2.5 pl-4 pr-3 border-r border-[#E2E6EC]">
                      <button
                        type="button"
                        onClick={() => onSelectProgram(app.id)}
                        className="text-left font-medium text-[#0F172A] hover:text-[#1D4ED8] transition-colors"
                      >
                        {app.university}
                      </button>
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-mono text-[12px] tabular-nums whitespace-nowrap ${getDaysLeftTone(
                        days
                      )}`}
                    >
                      {days === null ? '—' : days < 0 ? `${Math.abs(days)}d ago` : `${days} d`}
                    </td>
                    <td className="py-1.5 px-2">
                      <select
                        value={app.sopStatus}
                        onChange={(e) =>
                          onUpdate(app.id, { sopStatus: e.target.value as SopStatus })
                        }
                        className={`${selectClass} ${getDocTone(app.sopStatus)}`}
                      >
                        {SOP_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className="text-[#0F172A] font-normal">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 px-2">
                      <select
                        value={app.cvStatus}
                        onChange={(e) =>
                          onUpdate(app.id, { cvStatus: e.target.value as CvStatus })
                        }
                        className={`${selectClass} ${getDocTone(app.cvStatus)}`}
                      >
                        {CV_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className="text-[#0F172A] font-normal">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 px-2">
                      <select
                        value={app.transcripts}
                        onChange={(e) =>
                          onUpdate(app.id, { transcripts: e.target.value as TranscriptStatus })
                        }
                        className={`${selectClass} ${getDocTone(app.transcripts)}`}
                      >
                        {TRANSCRIPT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className="text-[#0F172A] font-normal">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 px-2">
                      <select
                        value={app.lorStatus}
                        onChange={(e) =>
                          onUpdate(app.id, { lorStatus: e.target.value as LorStatus })
                        }
                        className={`${selectClass} font-mono text-[12px] tabular-nums ${getDocTone(
                          app.lorStatus
                        )}`}
                      >
                        {LOR_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className="text-[#0F172A] font-normal">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={app.ieltsScore}
                        onChange={(e) => onUpdate(app.id, { ieltsScore: e.target.value })}
                        placeholder="e.g., 6.5 overall"
                        className={`w-full bg-transparent text-[12.5px] font-mono px-2 py-1 rounded border border-transparent hover:border-[#CBD5E1] focus:bg-white focus:border-[#1D4ED8] focus:outline-none ${
                          ieltsMissing ? 'text-[#B45309] italic' : 'text-[#334155]'
                        }`}
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <select
                        value={app.feeWaiver}
                        onChange={(e) =>
                          onUpdate(app.id, { feeWaiver: e.target.value as FeeWaiverStatus })
                        }
                        className={`${selectClass} ${getDocTone(app.feeWaiver)}`}
                      >
                        {WAIVER_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className="text-[#0F172A] font-normal">
                            {opt}
                          </option>
                        ))}
                      </select>
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
