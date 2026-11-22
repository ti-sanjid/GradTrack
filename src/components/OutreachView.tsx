import React, { useMemo, useState } from 'react';
import { ExternalLink, PanelRightOpen } from 'lucide-react';
import {
  FacultyOutreachStatus,
  OUTREACH_OPTIONS,
  PhdApplication,
} from '../types/application';
import {
  extractSafeUrl,
  isPlaceholderProfessor,
  isTemplateLink,
} from '../utils/csv';
import { getOutreachTone } from '../utils/statusStyles';

interface OutreachViewProps {
  applications: PhdApplication[];
  onUpdate: (id: string, patch: Partial<PhdApplication>) => void;
  onSelectProgram: (id: string) => void;
}

export const OutreachView: React.FC<OutreachViewProps> = ({
  applications,
  onUpdate,
  onSelectProgram,
}) => {
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: applications.length };
    for (const opt of OUTREACH_OPTIONS) {
      map[opt] = applications.filter((a) => a.facultyOutreach === opt).length;
    }
    return map;
  }, [applications]);

  const filtered = useMemo(() => {
    if (stageFilter === 'ALL') return applications;
    return applications.filter((a) => a.facultyOutreach === stageFilter);
  }, [applications, stageFilter]);

  const inputClass =
    'w-full bg-transparent text-[13px] px-2 py-1.5 rounded border border-transparent hover:border-[#CBD5E1] focus:bg-white focus:border-[#1D4ED8] focus:outline-none transition-colors';

  return (
    <div className="bg-white border border-[#E2E6EC] rounded-lg overflow-hidden">
      {/* Outreach Stage Filter Bar */}
      <div className="px-4 py-3 border-b border-[#E2E6EC] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F1F5F9] rounded-md">
          {(['ALL', ...OUTREACH_OPTIONS] as const).map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setStageFilter(stage)}
              className={`px-2.5 py-1 text-[12px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                stageFilter === stage
                  ? 'bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {stage === 'ALL' ? 'All Programs' : stage}{' '}
              <span className="font-mono text-[11px] tabular-nums ml-1 text-[#64748B]">
                {counts[stage] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Outreach Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#E2E6EC] bg-[#F8F9FB] text-[11.5px] font-semibold text-[#475569]">
              <th className="py-2.5 pl-4 pr-3 min-w-[215px] whitespace-nowrap">University</th>
              <th className="py-2.5 px-3 min-w-[220px] whitespace-nowrap">
                Research Area & Target Faculty
              </th>
              <th className="py-2.5 px-3 min-w-[155px] whitespace-nowrap">Outreach Stage</th>
              <th className="py-2.5 px-3 min-w-[200px] whitespace-nowrap">Lab / Faculty Link</th>
              <th className="py-2.5 px-3 min-w-[230px] whitespace-nowrap">Follow-Up Notes</th>
              <th className="py-2.5 pr-4 pl-3 w-[72px] text-right whitespace-nowrap">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E6EC] text-[13px]">
            {filtered.map((app) => {
              const profMissing = isPlaceholderProfessor(app.researchAreaAndProf);
              const linkTemplate = isTemplateLink(app.links);
              const safeUrl = extractSafeUrl(app.links);

              return (
                <tr key={app.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-2.5 pl-4 pr-3">
                    <button
                      type="button"
                      onClick={() => onSelectProgram(app.id)}
                      className="text-left font-medium text-[#0F172A] hover:text-[#1D4ED8] transition-colors"
                    >
                      {app.university}
                    </button>
                    <div className="text-[11.5px] text-[#64748B] truncate max-w-[220px]">
                      {app.department && app.department !== 'a' ? app.department : 'Department pending'}
                    </div>
                  </td>

                  <td className="py-1.5 px-2">
                    <input
                      type="text"
                      value={app.researchAreaAndProf}
                      onChange={(e) =>
                        onUpdate(app.id, { researchAreaAndProf: e.target.value })
                      }
                      placeholder="List target PIs and research group..."
                      className={`${inputClass} ${
                        profMissing ? 'text-[#B45309] italic' : 'text-[#0F172A]'
                      }`}
                    />
                  </td>

                  <td className="py-1.5 px-2">
                    <select
                      value={app.facultyOutreach}
                      onChange={(e) =>
                        onUpdate(app.id, {
                          facultyOutreach: e.target.value as FacultyOutreachStatus,
                        })
                      }
                      className={`w-full bg-transparent text-[12.5px] py-1.5 px-1.5 rounded border border-transparent hover:border-[#CBD5E1] focus:bg-white focus:border-[#1D4ED8] focus:outline-none cursor-pointer ${getOutreachTone(
                        app.facultyOutreach
                      )}`}
                    >
                      {OUTREACH_OPTIONS.map((opt) => (
                        <option key={opt} value={opt} className="text-[#0F172A] font-normal">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={app.links}
                        onChange={(e) => onUpdate(app.id, { links: e.target.value })}
                        placeholder="https://..."
                        className={`${inputClass} ${
                          linkTemplate ? 'text-[#B45309] italic' : 'text-[#334155]'
                        }`}
                      />
                      {safeUrl && (
                        <a
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open link for ${app.university}`}
                          className="p-1 text-[#1D4ED8] hover:text-[#1E3A8A] shrink-0"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </td>

                  <td className="py-1.5 px-2">
                    <input
                      type="text"
                      value={app.notes}
                      onChange={(e) => onUpdate(app.id, { notes: e.target.value })}
                      placeholder="Email sent date, papers read, next step..."
                      className={`${inputClass} text-[#475569]`}
                    />
                  </td>

                  <td className="py-2 pr-4 pl-3 text-right">
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
