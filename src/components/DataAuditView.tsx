import React, { useMemo, useState } from 'react';
import { CheckCircle2, Eraser, PanelRightOpen } from 'lucide-react';
import { PhdApplication } from '../types/application';
import {
  getApplicationIssues,
  getCompletenessScore,
  isMismatchedTemplatePortal,
  isPlaceholderDepartment,
  isPlaceholderIelts,
  isPlaceholderProfessor,
  isTemplateLink,
  isTemplateNote,
} from '../utils/csv';

interface DataAuditViewProps {
  applications: PhdApplication[];
  onUpdate: (id: string, patch: Partial<PhdApplication>) => void;
  onCleanAllTemplates: () => void;
  onSelectProgram: (id: string) => void;
}

type AuditFilter = 'all_incomplete' | 'department' | 'faculty' | 'ielts' | 'template';

export const DataAuditView: React.FC<DataAuditViewProps> = ({
  applications,
  onUpdate,
  onCleanAllTemplates,
  onSelectProgram,
}) => {
  const [filter, setFilter] = useState<AuditFilter>('all_incomplete');

  const stats = useMemo(() => {
    let missingDept = 0;
    let missingProf = 0;
    let missingIelts = 0;
    let templateLeftovers = 0;

    for (const app of applications) {
      if (isPlaceholderDepartment(app.department)) missingDept++;
      if (isPlaceholderProfessor(app.researchAreaAndProf)) missingProf++;
      if (isPlaceholderIelts(app.ieltsScore)) missingIelts++;
      if (
        isTemplateLink(app.links) ||
        isMismatchedTemplatePortal(app.applicationPortal, app.university) ||
        isTemplateNote(app.notes, app.university) ||
        app.department.trim().toLowerCase() === 'a' ||
        app.researchAreaAndProf.trim().toLowerCase() === 'tba' ||
        app.ieltsScore.trim() === '0'
      ) {
        templateLeftovers++;
      }
    }

    return { missingDept, missingProf, missingIelts, templateLeftovers };
  }, [applications]);

  const rows = useMemo(() => {
    return applications.filter((app) => {
      const issues = getApplicationIssues(app);
      if (filter === 'all_incomplete') return issues.length > 0;
      if (filter === 'department') return isPlaceholderDepartment(app.department);
      if (filter === 'faculty') return isPlaceholderProfessor(app.researchAreaAndProf);
      if (filter === 'ielts') return isPlaceholderIelts(app.ieltsScore);
      if (filter === 'template') {
        return (
          isTemplateLink(app.links) ||
          isMismatchedTemplatePortal(app.applicationPortal, app.university) ||
          isTemplateNote(app.notes, app.university) ||
          app.department.trim().toLowerCase() === 'a' ||
          app.researchAreaAndProf.trim().toLowerCase() === 'tba' ||
          app.ieltsScore.trim() === '0'
        );
      }
      return true;
    });
  }, [applications, filter]);

  const inputClass =
    'w-full px-2.5 py-1.5 text-[13px] bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15';

  return (
    <div className="space-y-5">
      {/* Header Action Strip */}
      <div className="bg-white border border-[#E2E6EC] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h2 className="font-display text-base font-semibold text-[#0F172A]">
            Spreadsheet Cleanup & Missing Info Workbench
          </h2>
          <p className="text-[13px] text-[#475569] leading-relaxed">
            Fill in placeholder fields from your uploaded file (<span className="font-mono text-[12px]">a</span>,{' '}
            <span className="font-mono text-[12px]">TBA</span>, <span className="font-mono text-[12px]">0</span>) and
            replace copied template portals or faculty links. Clearing placeholders preserves all university names,
            real departments, deadlines, fees, IELTS scores, and professors you already entered.
          </p>
        </div>

        {stats.templateLeftovers > 0 && (
          <button
            type="button"
            onClick={onCleanAllTemplates}
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md transition-colors whitespace-nowrap shrink-0 self-start md:self-center"
          >
            <Eraser className="h-4 w-4" />
            <span>Clear Template Leftovers ({stats.templateLeftovers})</span>
          </button>
        )}
      </div>

      {/* Category Filter Strip */}
      <div className="bg-white border border-[#E2E6EC] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E2E6EC] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F1F5F9] rounded-md">
            {(
              [
                { id: 'all_incomplete', label: 'All Incomplete', count: applications.filter((a) => getApplicationIssues(a).length > 0).length },
                { id: 'department', label: 'Department', count: stats.missingDept },
                { id: 'faculty', label: 'Faculty / Research', count: stats.missingProf },
                { id: 'ielts', label: 'IELTS Score', count: stats.missingIelts },
                { id: 'template', label: 'Template Leftovers', count: stats.templateLeftovers },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-[12px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  filter === tab.id
                    ? 'bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {tab.label}{' '}
                <span className="font-mono text-[11px] tabular-nums ml-1 text-[#64748B]">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <span className="text-[12px] text-[#64748B] tabular-nums">
            {rows.length} program{rows.length === 1 ? '' : 's'} shown
          </span>
        </div>

        {/* Rapid Quick-Fill Rows */}
        {rows.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <CheckCircle2 className="h-7 w-7 text-[#15803D] mx-auto" />
            <p className="mt-2 font-display text-sm font-semibold text-[#0F172A]">
              No pending items in this category
            </p>
            <p className="mt-1 text-[13px] text-[#64748B]">
              Every university in this filter has verified information filled in.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E6EC]">
            {rows.map((app) => {
              const issues = getApplicationIssues(app);
              const pct = getCompletenessScore(app);
              const deptWarn = isPlaceholderDepartment(app.department);
              const profWarn = isPlaceholderProfessor(app.researchAreaAndProf);
              const ieltsWarn = isPlaceholderIelts(app.ieltsScore);
              const portalWarn = isMismatchedTemplatePortal(app.applicationPortal, app.university);
              const linkWarn = isTemplateLink(app.links);

              return (
                <div key={app.id} className="p-4 sm:px-5 space-y-3 hover:bg-[#FAFBFD] transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <h3 className="font-display text-[14px] font-semibold text-[#0F172A]">
                        {app.university}
                      </h3>
                      <span className="text-[12px] text-[#64748B] tabular-nums">
                        · {pct}% complete · {issues.length} item{issues.length > 1 ? 's' : ''} remaining
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectProgram(app.id)}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1D4ED8] hover:underline whitespace-nowrap"
                    >
                      <PanelRightOpen className="h-3.5 w-3.5" />
                      <span>Full Editor</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[#475569] mb-1">
                        Department {deptWarn && <span className="text-[#B45309]">· Needs real name</span>}
                      </label>
                      <input
                        type="text"
                        value={app.department}
                        onChange={(e) => onUpdate(app.id, { department: e.target.value })}
                        placeholder="Official department name..."
                        className={`${inputClass} ${deptWarn ? 'border-[#F59E0B] bg-[#FFFDF5]' : ''}`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[#475569] mb-1">
                        Research Area & Prof. {profWarn && <span className="text-[#B45309]">· TBA</span>}
                      </label>
                      <input
                        type="text"
                        value={app.researchAreaAndProf}
                        onChange={(e) =>
                          onUpdate(app.id, { researchAreaAndProf: e.target.value })
                        }
                        placeholder="Target PI & topic..."
                        className={`${inputClass} ${profWarn ? 'border-[#F59E0B] bg-[#FFFDF5]' : ''}`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[#475569] mb-1">
                        IELTS / English {ieltsWarn && <span className="text-[#B45309]">· Unverified</span>}
                      </label>
                      <input
                        type="text"
                        value={app.ieltsScore}
                        onChange={(e) => onUpdate(app.id, { ieltsScore: e.target.value })}
                        placeholder="e.g., 6.5 overall / 7.0 TA"
                        className={`${inputClass} ${ieltsWarn ? 'border-[#F59E0B] bg-[#FFFDF5]' : ''}`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[#475569] mb-1">
                        Application Portal {portalWarn && <span className="text-[#B45309]">· Template</span>}
                      </label>
                      <input
                        type="text"
                        value={app.applicationPortal}
                        onChange={(e) =>
                          onUpdate(app.id, { applicationPortal: e.target.value })
                        }
                        placeholder="Official grad portal..."
                        className={`${inputClass} ${
                          portalWarn || !app.applicationPortal.trim()
                            ? 'border-[#F59E0B] bg-[#FFFDF5]'
                            : ''
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-medium text-[#475569] mb-1">
                        Program / Faculty Link {linkWarn && <span className="text-[#B45309]">· Template</span>}
                      </label>
                      <input
                        type="text"
                        value={app.links}
                        onChange={(e) => onUpdate(app.id, { links: e.target.value })}
                        placeholder="https://..."
                        className={`${inputClass} ${
                          linkWarn || !app.links.trim()
                            ? 'border-[#F59E0B] bg-[#FFFDF5]'
                            : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
