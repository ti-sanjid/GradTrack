import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  CATEGORY_OPTIONS,
  PhdApplication,
  TierCategory,
} from '../types/application';

interface AddProgramModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (program: PhdApplication) => void;
}

export const AddProgramModal: React.FC<AddProgramModalProps> = ({ open, onClose, onAdd }) => {
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [researchAreaAndProf, setResearchAreaAndProf] = useState('');
  const [appDeadline, setAppDeadline] = useState('2026-12-15');
  const [applicationFee, setApplicationFee] = useState('75');
  const [ieltsScore, setIeltsScore] = useState('');
  const [category, setCategory] = useState<TierCategory>('Target');
  const [applicationPortal, setApplicationPortal] = useState('');
  const [links, setLinks] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUni = university.trim();
    if (!trimmedUni) return;

    const newProgram: PhdApplication = {
      id: `prog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      university: trimmedUni,
      department: department.trim(),
      researchAreaAndProf: researchAreaAndProf.trim(),
      ieltsScore: ieltsScore.trim(),
      applicationFee: Math.max(0, Number(applicationFee) || 0),
      appDeadline: appDeadline.trim(),
      links: links.trim(),
      category,
      facultyOutreach: 'Not Contacted',
      sopStatus: 'Not Started',
      cvStatus: 'Not Started',
      transcripts: 'Not Requested',
      lorStatus: '0/3 Submitted',
      feeWaiver: 'None',
      fundingModel: '',
      stipendAnnual: 0,
      applicationPortal: applicationPortal.trim(),
      applicationStatus: 'Researching',
      notes: '',
    };

    onAdd(newProgram);
    setUniversity('');
    setDepartment('');
    setResearchAreaAndProf('');
    setAppDeadline('2026-12-15');
    setApplicationFee('75');
    setIeltsScore('');
    setCategory('Target');
    setApplicationPortal('');
    setLinks('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#0F172A]/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-program-title"
        className="relative z-10 w-full max-w-lg bg-white border border-[#E2E6EC] rounded-lg shadow-xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E6EC]">
          <h2 id="add-program-title" className="font-display text-base font-semibold text-[#0F172A]">
            Add PhD Program
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#334155] mb-1">
              University Name <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="e.g., University of Washington"
              className="w-full px-3 py-2 text-[13.5px] bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#334155] mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Atmospheric Sciences"
                className="w-full px-3 py-2 text-[13.5px] bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#334155] mb-1">
                Target Tier
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TierCategory)}
                className="w-full px-3 py-2 text-[13.5px] bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#334155] mb-1">
              Research Area & Target Faculty
            </label>
            <input
              type="text"
              value={researchAreaAndProf}
              onChange={(e) => setResearchAreaAndProf(e.target.value)}
              placeholder="e.g., Climate Dynamics — Prof. Jane Doe"
              className="w-full px-3 py-2 text-[13.5px] bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#334155] mb-1">
                App Deadline
              </label>
              <input
                type="date"
                value={appDeadline}
                onChange={(e) => setAppDeadline(e.target.value)}
                className="w-full px-3 py-2 text-[13px] font-mono bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#334155] mb-1">
                Fee (USD)
              </label>
              <input
                type="number"
                min={0}
                value={applicationFee}
                onChange={(e) => setApplicationFee(e.target.value)}
                className="w-full px-3 py-2 text-[13px] font-mono bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#334155] mb-1">
                IELTS Min.
              </label>
              <input
                type="text"
                value={ieltsScore}
                onChange={(e) => setIeltsScore(e.target.value)}
                placeholder="e.g., 7.0 overall"
                className="w-full px-3 py-2 text-[13px] bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#334155] mb-1">
                Application Portal
              </label>
              <input
                type="text"
                value={applicationPortal}
                onChange={(e) => setApplicationPortal(e.target.value)}
                placeholder="e.g., Slate Graduate Portal"
                className="w-full px-3 py-2 text-[13.5px] bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#334155] mb-1">
                Department / Portal URL
              </label>
              <input
                type="text"
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-[13.5px] bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/15"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E6EC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-[#475569] hover:text-[#0F172A] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-[13px] font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md transition-colors whitespace-nowrap"
            >
              Add Program
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
