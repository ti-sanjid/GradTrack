import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Trash2,
  X,
} from 'lucide-react';
import {
  APP_STATUS_OPTIONS,
  ApplicationStatus,
  CATEGORY_OPTIONS,
  CV_OPTIONS,
  CvStatus,
  FacultyOutreachStatus,
  FeeWaiverStatus,
  LOR_OPTIONS,
  LorStatus,
  OUTREACH_OPTIONS,
  PhdApplication,
  SOP_OPTIONS,
  SopStatus,
  TRANSCRIPT_OPTIONS,
  TierCategory,
  TranscriptStatus,
  WAIVER_OPTIONS,
} from '../types/application';
import {
  computeDaysLeft,
  extractSafeUrl,
  formatDeadlineShort,
  getApplicationIssues,
  getCompletenessScore,
  isMismatchedTemplatePortal,
  isPlaceholderDepartment,
  isPlaceholderIelts,
  isPlaceholderProfessor,
  isTemplateLink,
  isTemplateNote,
} from '../utils/csv';
import { getDaysLeftTone } from '../utils/statusStyles';

interface ProgramDrawerProps {
  program: PhdApplication | null;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onUpdate: (id: string, patch: Partial<PhdApplication>) => void;
  onDelete: (id: string) => void;
}

export const ProgramDrawer: React.FC<ProgramDrawerProps> = ({
  program,
  currentIndex,
  totalCount,
  onClose,
  onNavigate,
  onUpdate,
  onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!program) return null;

  const daysLeft = computeDaysLeft(program.appDeadline);
  const issues = getApplicationIssues(program);
  const completeness = getCompletenessScore(program);
  const safeUrl = extractSafeUrl(program.links);

  const hasTemplateValues =
    isPlaceholderDepartment(program.department) ||
    isPlaceholderProfessor(program.researchAreaAndProf) ||
    isPlaceholderIelts(program.ieltsScore) ||
    isTemplateLink(program.links) ||
    isMismatchedTemplatePortal(program.applicationPortal, program.university) ||
    isTemplateNote(program.notes, program.university);

  const handleClearThisProgramTemplates = () => {
    const patch: Partial<PhdApplication> = {};
    if (isPlaceholderDepartment(program.department)) patch.department = '';
    if (isPlaceholderProfessor(program.researchAreaAndProf)) patch.researchAreaAndProf = '';
    if (isPlaceholderIelts(program.ieltsScore)) patch.ieltsScore = '';
    if (isTemplateLink(program.links)) patch.links = '';
    if (isMismatchedTemplatePortal(program.applicationPortal, program.university)) {
      patch.applicationPortal = '';
    }
    if (isTemplateNote(program.notes, program.university)) patch.notes = '';
    onUpdate(program.id, patch);
  };

  const fieldInput =
    'w-full px-3 py-2 text-[13.5px] bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-[#0F172A]/30 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${program.university}`}
        className="relative z-10 w-full max-w-[560px] bg-white h-full border-l border-[#E2E6EC] shadow-2xl flex flex-col"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-[#E2E6EC] flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[12px] text-[#64748B] tabular-nums">
              <span>
                Program {currentIndex + 1} of {totalCount}
              </span>
              <span aria-hidden="true">·</span>
              <span>{completeness}% info filled</span>
              {daysLeft !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className={`font-mono ${getDaysLeftTone(daysLeft)}`}>
                    {daysLeft < 0 ? `${Math.abs(daysLeft)}d past` : `${daysLeft} d left`}
                  </span>
                </>
              )}
            </div>
            <h2 className="mt-1 font-display text-lg font-bold text-[#0F172A] leading-snug truncate">
              {program.university}
            </h2>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(false);
                onNavigate('prev');
              }}
              aria-label="Previous university"
              className="p-1.5 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-md transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(false);
                onNavigate('next');
              }}
              aria-label="Next university"
              className="p-1.5 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-md transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close program editor"
              className="p-1.5 ml-1 text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Missing / Template Alert Banner */}
          {issues.length > 0 && (
            <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-md space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12.5px] font-semibold text-[#92400E]">
                  {issues.length} field{issues.length > 1 ? 's' : ''} need real details
                </p>
                {hasTemplateValues && (
                  <button
                    type="button"
                    onClick={handleClearThisProgramTemplates}
                    className="text-[12px] font-medium text-[#1D4ED8] hover:underline whitespace-nowrap"
                  >
                    Clear placeholders
                  </button>
                )}
              </div>
              <p className="text-[12px] text-[#B45309] leading-relaxed">
                {issues.map((i) => `${i.label} (${i.reason})`).join(' · ')}
              </p>
            </div>
          )}

          {/* Section 1: Program Identity & Requirements */}
          <section className="space-y-4">
            <h3 className="font-display text-[13px] font-semibold text-[#0F172A]">
              Program & Admission Requirements
            </h3>
            <div className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  University
                </label>
                <input
                  type="text"
                  value={program.university}
                  onChange={(e) => onUpdate(program.id, { university: e.target.value })}
                  className={fieldInput}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  Department / School
                </label>
                <input
                  type="text"
                  value={program.department}
                  onChange={(e) => onUpdate(program.id, { department: e.target.value })}
                  placeholder="e.g., Department of Atmospheric and Oceanic Sciences"
                  className={fieldInput}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">
                    App Deadline
                  </label>
                  <input
                    type="date"
                    value={
                      /^\d{4}-\d{2}-\d{2}$/.test(program.appDeadline) ? program.appDeadline : ''
                    }
                    onChange={(e) => onUpdate(program.id, { appDeadline: e.target.value })}
                    className={`${fieldInput} font-mono text-[13px]`}
                  />
                  {program.appDeadline && (
                    <p className="mt-1 text-[11px] text-[#64748B]">
                      {formatDeadlineShort(program.appDeadline)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">
                    IELTS / English Min.
                  </label>
                  <input
                    type="text"
                    value={program.ieltsScore}
                    onChange={(e) => onUpdate(program.id, { ieltsScore: e.target.value })}
                    placeholder="e.g., 6.5 overall"
                    className={fieldInput}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">
                    Target Tier
                  </label>
                  <select
                    value={program.category}
                    onChange={(e) =>
                      onUpdate(program.id, { category: e.target.value as TierCategory })
                    }
                    className={fieldInput}
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-[#E2E6EC]" />

          {/* Section 2: Faculty & Outreach */}
          <section className="space-y-4">
            <h3 className="font-display text-[13px] font-semibold text-[#0F172A]">
              Faculty & Research Fit
            </h3>
            <div className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  Research Area & Target Professors
                </label>
                <input
                  type="text"
                  value={program.researchAreaAndProf}
                  onChange={(e) =>
                    onUpdate(program.id, { researchAreaAndProf: e.target.value })
                  }
                  placeholder="e.g., Synoptic Meteorology — Prof. Andrea Lopez Lang"
                  className={fieldInput}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">
                    Faculty Outreach Stage
                  </label>
                  <select
                    value={program.facultyOutreach}
                    onChange={(e) =>
                      onUpdate(program.id, {
                        facultyOutreach: e.target.value as FacultyOutreachStatus,
                      })
                    }
                    className={fieldInput}
                  >
                    {OUTREACH_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#475569] mb-1">
                    Application Status
                  </label>
                  <select
                    value={program.applicationStatus}
                    onChange={(e) =>
                      onUpdate(program.id, {
                        applicationStatus: e.target.value as ApplicationStatus,
                      })
                    }
                    className={fieldInput}
                  >
                    {APP_STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-[#E2E6EC]" />

          {/* Section 3: Documents & Recommenders */}
          <section className="space-y-4">
            <h3 className="font-display text-[13px] font-semibold text-[#0F172A]">
              Documents & Letters of Recommendation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  SOP Status
                </label>
                <select
                  value={program.sopStatus}
                  onChange={(e) =>
                    onUpdate(program.id, { sopStatus: e.target.value as SopStatus })
                  }
                  className={fieldInput}
                >
                  {SOP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  CV / Resume
                </label>
                <select
                  value={program.cvStatus}
                  onChange={(e) =>
                    onUpdate(program.id, { cvStatus: e.target.value as CvStatus })
                  }
                  className={fieldInput}
                >
                  {CV_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  Transcripts
                </label>
                <select
                  value={program.transcripts}
                  onChange={(e) =>
                    onUpdate(program.id, { transcripts: e.target.value as TranscriptStatus })
                  }
                  className={fieldInput}
                >
                  {TRANSCRIPT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  LOR Status
                </label>
                <select
                  value={program.lorStatus}
                  onChange={(e) =>
                    onUpdate(program.id, { lorStatus: e.target.value as LorStatus })
                  }
                  className={`${fieldInput} font-mono text-[13px]`}
                >
                  {LOR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <hr className="border-[#E2E6EC]" />

          {/* Section 4: Funding & Fees */}
          <section className="space-y-4">
            <h3 className="font-display text-[13px] font-semibold text-[#0F172A]">
              Fees, Waivers & Funding
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  Application Fee (USD)
                </label>
                <input
                  type="number"
                  min={0}
                  value={program.applicationFee}
                  onChange={(e) =>
                    onUpdate(program.id, {
                      applicationFee: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className={`${fieldInput} font-mono text-[13px]`}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  Fee Waiver
                </label>
                <select
                  value={program.feeWaiver}
                  onChange={(e) =>
                    onUpdate(program.id, { feeWaiver: e.target.value as FeeWaiverStatus })
                  }
                  className={fieldInput}
                >
                  {WAIVER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  Annual Stipend (USD)
                </label>
                <input
                  type="number"
                  min={0}
                  value={program.stipendAnnual}
                  onChange={(e) =>
                    onUpdate(program.id, {
                      stipendAnnual: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className={`${fieldInput} font-mono text-[13px]`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#475569] mb-1">
                Funding Offer / Model
              </label>
              <input
                type="text"
                value={program.fundingModel}
                onChange={(e) => onUpdate(program.id, { fundingModel: e.target.value })}
                placeholder="e.g., Fully Funded (GRA / TA + Tuition Remission)"
                className={fieldInput}
              />
            </div>
          </section>

          <hr className="border-[#E2E6EC]" />

          {/* Section 5: Portal, Links & Action Items */}
          <section className="space-y-4">
            <h3 className="font-display text-[13px] font-semibold text-[#0F172A]">
              Portal, Links & Notes
            </h3>
            <div className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  Application Portal
                </label>
                <input
                  type="text"
                  value={program.applicationPortal}
                  onChange={(e) => onUpdate(program.id, { applicationPortal: e.target.value })}
                  placeholder="e.g., Slate Graduate Admissions Portal"
                  className={fieldInput}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[12px] font-medium text-[#475569]">
                    Program / Faculty Links
                  </label>
                  {safeUrl && (
                    <a
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1D4ED8] hover:underline"
                    >
                      <span>Open link</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  value={program.links}
                  onChange={(e) => onUpdate(program.id, { links: e.target.value })}
                  placeholder="Paste program or faculty page URL..."
                  className={fieldInput}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#475569] mb-1">
                  Notes & Action Items
                </label>
                <textarea
                  rows={4}
                  value={program.notes}
                  onChange={(e) => onUpdate(program.id, { notes: e.target.value })}
                  placeholder="Track advisor reply dates, GRE waiver policy, specific essay prompts..."
                  className={`${fieldInput} resize-y`}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-[#E2E6EC] bg-[#F8F9FB] flex items-center justify-between shrink-0">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#64748B] hover:text-[#B91C1C] transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove Program</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] text-[#B91C1C] font-medium">Delete this row?</span>
              <button
                type="button"
                onClick={() => {
                  onDelete(program.id);
                  setConfirmDelete(false);
                }}
                className="px-2.5 py-1 text-[12px] font-medium text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-[12px] font-medium text-[#475569] hover:text-[#0F172A]"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-[13px] font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md transition-colors whitespace-nowrap"
          >
            Done
          </button>
        </div>
      </aside>
    </div>
  );
};
