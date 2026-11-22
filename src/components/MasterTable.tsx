import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  PanelRightOpen,
  Search,
  X,
} from 'lucide-react';
import {
  APP_STATUS_OPTIONS,
  ApplicationStatus,
  CATEGORY_OPTIONS,
  CV_OPTIONS,
  ColumnPreset,
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
  formatCurrency,
  formatDeadlineShort,
  getApplicationIssues,
  isMismatchedTemplatePortal,
  isPlaceholderDepartment,
  isPlaceholderIelts,
  isPlaceholderProfessor,
  isTemplateLink,
  parseCurrency,
} from '../utils/csv';
import {
  getAppStatusTone,
  getCategoryTone,
  getDaysLeftTone,
  getDocTone,
  getOutreachTone,
} from '../utils/statusStyles';

interface MasterTableProps {
  applications: PhdApplication[];
  onUpdate: (id: string, patch: Partial<PhdApplication>) => void;
  onSelectProgram: (id: string) => void;
  onOpenAddModal: () => void;
}

type SortKey = 'university' | 'daysLeft' | 'applicationFee' | 'stipendAnnual' | 'category' | 'applicationStatus';

const PRESETS: { id: ColumnPreset; label: string }[] = [
  { id: 'essential', label: 'Essential' },
  { id: 'documents', label: 'Documents' },
  { id: 'outreach', label: 'Outreach & Funding' },
  { id: 'all', label: 'All Columns' },
];

export const MasterTable: React.FC<MasterTableProps> = ({
  applications,
  onUpdate,
  onSelectProgram,
  onOpenAddModal,
}) => {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [needsInfoOnly, setNeedsInfoOnly] = useState(false);
  const [preset, setPreset] = useState<ColumnPreset>('essential');
  const [sortKey, setSortKey] = useState<SortKey>('daysLeft');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications
      .filter((app) => {
        if (tierFilter !== 'ALL' && app.category !== tierFilter) return false;
        if (statusFilter !== 'ALL' && app.applicationStatus !== statusFilter) return false;
        if (needsInfoOnly && getApplicationIssues(app).length === 0) return false;
        if (q) {
          const hay = [
            app.university,
            app.department,
            app.researchAreaAndProf,
            app.applicationPortal,
            app.notes,
            app.ieltsScore,
          ]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        switch (sortKey) {
          case 'university':
            return a.university.localeCompare(b.university) * dir;
          case 'daysLeft': {
            const da = computeDaysLeft(a.appDeadline) ?? 9999;
            const db = computeDaysLeft(b.appDeadline) ?? 9999;
            return (da - db) * dir;
          }
          case 'applicationFee':
            return (a.applicationFee - b.applicationFee) * dir;
          case 'stipendAnnual':
            return (a.stipendAnnual - b.stipendAnnual) * dir;
          case 'category':
            return a.category.localeCompare(b.category) * dir;
          case 'applicationStatus':
            return a.applicationStatus.localeCompare(b.applicationStatus) * dir;
          default:
            return 0;
        }
      });
  }, [applications, search, tierFilter, statusFilter, needsInfoOnly, sortKey, sortDir]);

  const hasActiveFilters =
    search.trim() !== '' || tierFilter !== 'ALL' || statusFilter !== 'ALL' || needsInfoOnly;

  const clearFilters = () => {
    setSearch('');
    setTierFilter('ALL');
    setStatusFilter('ALL');
    setNeedsInfoOnly(false);
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3 w-3 text-[#94A3B8]" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-[#1D4ED8]" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#1D4ED8]" />
    );
  };

  const showCol = (col: string): boolean => {
    if (preset === 'all') return true;
    if (preset === 'essential') {
      return [
        'department',
        'daysLeft',
        'appDeadline',
        'researchAreaAndProf',
        'ieltsScore',
        'applicationFee',
        'category',
        'applicationStatus',
      ].includes(col);
    }
    if (preset === 'documents') {
      return [
        'daysLeft',
        'ieltsScore',
        'sopStatus',
        'cvStatus',
        'transcripts',
        'lorStatus',
        'feeWaiver',
        'applicationStatus',
      ].includes(col);
    }
    if (preset === 'outreach') {
      return [
        'department',
        'researchAreaAndProf',
        'facultyOutreach',
        'links',
        'fundingModel',
        'stipendAnnual',
        'applicationPortal',
        'notes',
      ].includes(col);
    }
    return true;
  };

  const inlineInputClass =
    'w-full bg-transparent text-[13px] px-1.5 py-1 rounded border border-transparent hover:border-[#CBD5E1] focus:bg-white focus:border-[#1D4ED8] focus:outline-none transition-colors';

  const inlineSelectClass =
    'bg-transparent text-[12.5px] py-1 pr-5 pl-1 rounded border border-transparent hover:border-[#CBD5E1] focus:bg-white focus:border-[#1D4ED8] focus:outline-none cursor-pointer transition-colors';

  return (
    <div className="bg-white border border-[#E2E6EC] rounded-lg overflow-hidden">
      {/* Workspace Filter & Column Preset Bar */}
      <div className="px-4 py-3 border-b border-[#E2E6EC] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-xs min-w-[200px]">
            <Search className="h-3.5 w-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search university, dept, faculty..."
              aria-label="Search programs"
              className="w-full pl-8 pr-7 py-1.5 text-[13px] bg-[#F8F9FB] border border-[#E2E6EC] rounded-md text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#1D4ED8]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            aria-label="Filter by target tier"
            className="px-2.5 py-1.5 text-[12.5px] font-medium bg-white border border-[#E2E6EC] rounded-md text-[#334155] focus:outline-none focus:border-[#1D4ED8]"
          >
            <option value="ALL">All Tiers</option>
            {CATEGORY_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by application status"
            className="px-2.5 py-1.5 text-[12.5px] font-medium bg-white border border-[#E2E6EC] rounded-md text-[#334155] focus:outline-none focus:border-[#1D4ED8]"
          >
            <option value="ALL">All Statuses</option>
            {APP_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setNeedsInfoOnly((v) => !v)}
            className={`px-3 py-1.5 text-[12.5px] font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              needsInfoOnly
                ? 'bg-[#FFFBEB] border-[#F59E0B] text-[#B45309]'
                : 'bg-white border-[#E2E6EC] text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            Needs Info Only
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[12.5px] font-medium text-[#1D4ED8] hover:underline whitespace-nowrap shrink-0"
            >
              Reset
            </button>
          )}
        </div>

        {/* Column Group Segmented Control */}
        <div
          role="tablist"
          aria-label="Column visibility presets"
          className="flex items-center gap-0.5 p-0.5 bg-[#F1F5F9] rounded-md shrink-0"
        >
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={preset === p.id}
              onClick={() => setPreset(p.id)}
              className={`px-2.5 py-1 text-[12px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                preset === p.id
                  ? 'bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count Bar */}
      <div className="px-4 py-2 bg-[#F8F9FB] border-b border-[#E2E6EC] flex items-center justify-between text-[12px] text-[#64748B]">
        <span className="tabular-nums">
          Showing <strong className="font-semibold text-[#0F172A]">{filtered.length}</strong> of{' '}
          {applications.length} programs · Click any cell to edit inline or open Details
        </span>
        <span className="hidden sm:inline text-[#64748B]">
          Amber italic cells mark missing or template placeholder values
        </span>
      </div>

      {/* High-Density Data Grid */}
      {applications.length === 0 ? (
        <div className="py-16 px-6 text-center">
          <p className="font-display text-base font-semibold text-[#0F172A]">
            No PhD programs loaded yet
          </p>
          <p className="mt-1 text-[13.5px] text-[#64748B]">
            Add your first target university or import a CSV spreadsheet to begin tracking.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="mt-4 px-4 py-2 text-[13px] font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md transition-colors"
          >
            Add University
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-14 px-6 text-center">
          <p className="font-display text-sm font-semibold text-[#0F172A]">
            No matching universities
          </p>
          <p className="mt-1 text-[13px] text-[#64748B]">
            Adjust your search term or active filters to see your programs.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 px-3.5 py-1.5 text-[12.5px] font-medium text-[#1D4ED8] border border-[#CBD5E1] hover:bg-[#F8F9FB] rounded-md transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E2E6EC] bg-[#F8F9FB] text-[11.5px] font-semibold text-[#475569]">
                <th className="sticky left-0 z-20 bg-[#F8F9FB] py-2.5 pl-4 pr-3 min-w-[235px] border-r border-[#E2E6EC]">
                  <button
                    type="button"
                    onClick={() => toggleSort('university')}
                    className="inline-flex items-center gap-1.5 hover:text-[#0F172A] whitespace-nowrap"
                  >
                    <span>University</span>
                    {renderSortIcon('university')}
                  </button>
                </th>

                {showCol('department') && (
                  <th className="py-2.5 px-3 min-w-[210px] whitespace-nowrap">Department</th>
                )}

                {showCol('daysLeft') && (
                  <th className="py-2.5 px-3 min-w-[88px] text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('daysLeft')}
                      className="inline-flex items-center gap-1 hover:text-[#0F172A] whitespace-nowrap ml-auto"
                    >
                      <span>Days Left</span>
                      {renderSortIcon('daysLeft')}
                    </button>
                  </th>
                )}

                {showCol('appDeadline') && (
                  <th className="py-2.5 px-3 min-w-[132px] whitespace-nowrap">App Deadline</th>
                )}

                {showCol('researchAreaAndProf') && (
                  <th className="py-2.5 px-3 min-w-[200px] whitespace-nowrap">
                    Research Area & Prof.
                  </th>
                )}

                {showCol('ieltsScore') && (
                  <th className="py-2.5 px-3 min-w-[125px] whitespace-nowrap">IELTS Req.</th>
                )}

                {showCol('applicationFee') && (
                  <th className="py-2.5 px-3 min-w-[92px] text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('applicationFee')}
                      className="inline-flex items-center gap-1 hover:text-[#0F172A] whitespace-nowrap ml-auto"
                    >
                      <span>Fee</span>
                      {renderSortIcon('applicationFee')}
                    </button>
                  </th>
                )}

                {showCol('category') && (
                  <th className="py-2.5 px-3 min-w-[96px] whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('category')}
                      className="inline-flex items-center gap-1 hover:text-[#0F172A] whitespace-nowrap"
                    >
                      <span>Tier</span>
                      {renderSortIcon('category')}
                    </button>
                  </th>
                )}

                {showCol('facultyOutreach') && (
                  <th className="py-2.5 px-3 min-w-[148px] whitespace-nowrap">
                    Faculty Outreach
                  </th>
                )}

                {showCol('sopStatus') && (
                  <th className="py-2.5 px-3 min-w-[124px] whitespace-nowrap">SOP Status</th>
                )}

                {showCol('cvStatus') && (
                  <th className="py-2.5 px-3 min-w-[116px] whitespace-nowrap">CV / Resume</th>
                )}

                {showCol('transcripts') && (
                  <th className="py-2.5 px-3 min-w-[126px] whitespace-nowrap">Transcripts</th>
                )}

                {showCol('lorStatus') && (
                  <th className="py-2.5 px-3 min-w-[132px] whitespace-nowrap">LOR Status</th>
                )}

                {showCol('feeWaiver') && (
                  <th className="py-2.5 px-3 min-w-[112px] whitespace-nowrap">Fee Waiver</th>
                )}

                {showCol('links') && (
                  <th className="py-2.5 px-3 min-w-[190px] whitespace-nowrap">Links</th>
                )}

                {showCol('fundingModel') && (
                  <th className="py-2.5 px-3 min-w-[190px] whitespace-nowrap">Funding Model</th>
                )}

                {showCol('stipendAnnual') && (
                  <th className="py-2.5 px-3 min-w-[110px] text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('stipendAnnual')}
                      className="inline-flex items-center gap-1 hover:text-[#0F172A] whitespace-nowrap ml-auto"
                    >
                      <span>Stipend</span>
                      {renderSortIcon('stipendAnnual')}
                    </button>
                  </th>
                )}

                {showCol('applicationPortal') && (
                  <th className="py-2.5 px-3 min-w-[180px] whitespace-nowrap">Portal</th>
                )}

                {showCol('applicationStatus') && (
                  <th className="py-2.5 px-3 min-w-[132px] whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort('applicationStatus')}
                      className="inline-flex items-center gap-1 hover:text-[#0F172A] whitespace-nowrap"
                    >
                      <span>Status</span>
                      {renderSortIcon('applicationStatus')}
                    </button>
                  </th>
                )}

                {showCol('notes') && (
                  <th className="py-2.5 px-3 min-w-[230px] whitespace-nowrap">
                    Notes & Action Items
                  </th>
                )}

                <th className="py-2.5 px-3 w-[84px] text-right whitespace-nowrap">Inspect</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E2E6EC] text-[13px]">
              {filtered.map((app) => {
                const daysLeft = computeDaysLeft(app.appDeadline);
                const issues = getApplicationIssues(app);
                const deptPlaceholder = isPlaceholderDepartment(app.department);
                const profPlaceholder = isPlaceholderProfessor(app.researchAreaAndProf);
                const ieltsPlaceholder = isPlaceholderIelts(app.ieltsScore);
                const linkTemplate = isTemplateLink(app.links);
                const portalMismatch = isMismatchedTemplatePortal(
                  app.applicationPortal,
                  app.university
                );
                const safeUrl = extractSafeUrl(app.links);

                return (
                  <tr
                    key={app.id}
                    className="group hover:bg-[#F8FAFC] transition-colors"
                  >
                    {/* Sticky University Cell */}
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-[#F8FAFC] py-2 pl-4 pr-3 border-r border-[#E2E6EC] transition-colors">
                      <button
                        type="button"
                        onClick={() => onSelectProgram(app.id)}
                        className="text-left block w-full focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded"
                      >
                        <div className="font-medium text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors leading-snug">
                          {app.university}
                        </div>
                        {issues.length > 0 && (
                          <div className="text-[11px] text-[#B45309] mt-0.5 tabular-nums">
                            {issues.length} field{issues.length > 1 ? 's' : ''} to verify
                          </div>
                        )}
                      </button>
                    </td>

                    {showCol('department') && (
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={app.department}
                          onChange={(e) => onUpdate(app.id, { department: e.target.value })}
                          placeholder="Add department..."
                          title={deptPlaceholder ? 'Placeholder value — enter official department name' : app.department}
                          className={`${inlineInputClass} ${
                            deptPlaceholder
                              ? 'text-[#B45309] italic placeholder:text-[#D97706]/70'
                              : 'text-[#334155]'
                          }`}
                        />
                      </td>
                    )}

                    {showCol('daysLeft') && (
                      <td
                        className={`py-2 px-3 text-right font-mono text-[12.5px] tabular-nums whitespace-nowrap ${getDaysLeftTone(
                          daysLeft
                        )}`}
                      >
                        {daysLeft === null
                          ? '—'
                          : daysLeft < 0
                          ? `${Math.abs(daysLeft)}d ago`
                          : `${daysLeft} d`}
                      </td>
                    )}

                    {showCol('appDeadline') && (
                      <td className="py-1.5 px-2">
                        <input
                          type="date"
                          value={/^\d{4}-\d{2}-\d{2}$/.test(app.appDeadline) ? app.appDeadline : ''}
                          onChange={(e) => onUpdate(app.id, { appDeadline: e.target.value })}
                          title={formatDeadlineShort(app.appDeadline)}
                          className={`${inlineInputClass} font-mono text-[12px] text-[#334155] tabular-nums`}
                        />
                      </td>
                    )}

                    {showCol('researchAreaAndProf') && (
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={app.researchAreaAndProf}
                          onChange={(e) =>
                            onUpdate(app.id, { researchAreaAndProf: e.target.value })
                          }
                          placeholder="Target PI / research area..."
                          title={
                            profPlaceholder
                              ? 'Add target professors and lab research area'
                              : app.researchAreaAndProf
                          }
                          className={`${inlineInputClass} ${
                            profPlaceholder
                              ? 'text-[#B45309] italic placeholder:text-[#D97706]/70'
                              : 'text-[#0F172A]'
                          }`}
                        />
                      </td>
                    )}

                    {showCol('ieltsScore') && (
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={app.ieltsScore}
                          onChange={(e) => onUpdate(app.id, { ieltsScore: e.target.value })}
                          placeholder="e.g., 7.0 overall"
                          title={
                            ieltsPlaceholder
                              ? 'Placeholder score — verify minimum IELTS / English requirement'
                              : app.ieltsScore
                          }
                          className={`${inlineInputClass} font-mono text-[12px] ${
                            ieltsPlaceholder
                              ? 'text-[#B45309] italic placeholder:text-[#D97706]/70'
                              : 'text-[#334155]'
                          }`}
                        />
                      </td>
                    )}

                    {showCol('applicationFee') && (
                      <td className="py-1.5 px-2 text-right">
                        <input
                          type="text"
                          defaultValue={formatCurrency(app.applicationFee)}
                          key={`${app.id}-fee-${app.applicationFee}`}
                          onBlur={(e) =>
                            onUpdate(app.id, { applicationFee: parseCurrency(e.target.value) })
                          }
                          aria-label={`Application fee for ${app.university}`}
                          className={`${inlineInputClass} text-right font-mono text-[12.5px] tabular-nums ${
                            app.feeWaiver === 'Granted'
                              ? 'line-through text-[#94A3B8]'
                              : 'text-[#0F172A]'
                          }`}
                        />
                      </td>
                    )}

                    {showCol('category') && (
                      <td className="py-1.5 px-2">
                        <select
                          value={app.category}
                          onChange={(e) =>
                            onUpdate(app.id, { category: e.target.value as TierCategory })
                          }
                          className={`${inlineSelectClass} ${getCategoryTone(app.category)}`}
                        >
                          {CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="text-[#0F172A] font-normal">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}

                    {showCol('facultyOutreach') && (
                      <td className="py-1.5 px-2">
                        <select
                          value={app.facultyOutreach}
                          onChange={(e) =>
                            onUpdate(app.id, {
                              facultyOutreach: e.target.value as FacultyOutreachStatus,
                            })
                          }
                          className={`${inlineSelectClass} ${getOutreachTone(app.facultyOutreach)}`}
                        >
                          {OUTREACH_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="text-[#0F172A] font-normal">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}

                    {showCol('sopStatus') && (
                      <td className="py-1.5 px-2">
                        <select
                          value={app.sopStatus}
                          onChange={(e) =>
                            onUpdate(app.id, { sopStatus: e.target.value as SopStatus })
                          }
                          className={`${inlineSelectClass} ${getDocTone(app.sopStatus)}`}
                        >
                          {SOP_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="text-[#0F172A] font-normal">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}

                    {showCol('cvStatus') && (
                      <td className="py-1.5 px-2">
                        <select
                          value={app.cvStatus}
                          onChange={(e) =>
                            onUpdate(app.id, { cvStatus: e.target.value as CvStatus })
                          }
                          className={`${inlineSelectClass} ${getDocTone(app.cvStatus)}`}
                        >
                          {CV_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="text-[#0F172A] font-normal">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}

                    {showCol('transcripts') && (
                      <td className="py-1.5 px-2">
                        <select
                          value={app.transcripts}
                          onChange={(e) =>
                            onUpdate(app.id, { transcripts: e.target.value as TranscriptStatus })
                          }
                          className={`${inlineSelectClass} ${getDocTone(app.transcripts)}`}
                        >
                          {TRANSCRIPT_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="text-[#0F172A] font-normal">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}

                    {showCol('lorStatus') && (
                      <td className="py-1.5 px-2">
                        <select
                          value={app.lorStatus}
                          onChange={(e) =>
                            onUpdate(app.id, { lorStatus: e.target.value as LorStatus })
                          }
                          className={`${inlineSelectClass} font-mono text-[12px] tabular-nums ${getDocTone(
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
                    )}

                    {showCol('feeWaiver') && (
                      <td className="py-1.5 px-2">
                        <select
                          value={app.feeWaiver}
                          onChange={(e) =>
                            onUpdate(app.id, { feeWaiver: e.target.value as FeeWaiverStatus })
                          }
                          className={`${inlineSelectClass} ${getDocTone(app.feeWaiver)}`}
                        >
                          {WAIVER_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="text-[#0F172A] font-normal">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}

                    {showCol('links') && (
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={app.links}
                            onChange={(e) => onUpdate(app.id, { links: e.target.value })}
                            placeholder="https://..."
                            title={
                              linkTemplate
                                ? 'Template leftover — replace with department or faculty URL'
                                : app.links
                            }
                            className={`${inlineInputClass} ${
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
                    )}

                    {showCol('fundingModel') && (
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={app.fundingModel}
                          onChange={(e) => onUpdate(app.id, { fundingModel: e.target.value })}
                          placeholder="e.g., Fully Funded (GRA / TA)"
                          className={`${inlineInputClass} text-[#334155]`}
                        />
                      </td>
                    )}

                    {showCol('stipendAnnual') && (
                      <td className="py-1.5 px-2 text-right">
                        <input
                          type="text"
                          defaultValue={app.stipendAnnual > 0 ? formatCurrency(app.stipendAnnual) : ''}
                          key={`${app.id}-stipend-${app.stipendAnnual}`}
                          onBlur={(e) =>
                            onUpdate(app.id, { stipendAnnual: parseCurrency(e.target.value) })
                          }
                          placeholder="$0"
                          aria-label={`Annual stipend for ${app.university}`}
                          className={`${inlineInputClass} text-right font-mono text-[12.5px] tabular-nums text-[#0F172A]`}
                        />
                      </td>
                    )}

                    {showCol('applicationPortal') && (
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={app.applicationPortal}
                          onChange={(e) =>
                            onUpdate(app.id, { applicationPortal: e.target.value })
                          }
                          placeholder="Portal name..."
                          title={
                            portalMismatch
                              ? `Suspected template portal (${app.applicationPortal}) — verify for ${app.university}`
                              : app.applicationPortal
                          }
                          className={`${inlineInputClass} ${
                            portalMismatch ? 'text-[#B45309] italic' : 'text-[#334155]'
                          }`}
                        />
                      </td>
                    )}

                    {showCol('applicationStatus') && (
                      <td className="py-1.5 px-2">
                        <select
                          value={app.applicationStatus}
                          onChange={(e) =>
                            onUpdate(app.id, {
                              applicationStatus: e.target.value as ApplicationStatus,
                            })
                          }
                          className={`${inlineSelectClass} ${getAppStatusTone(
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
                    )}

                    {showCol('notes') && (
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={app.notes}
                          onChange={(e) => onUpdate(app.id, { notes: e.target.value })}
                          placeholder="Add action items..."
                          className={`${inlineInputClass} text-[#475569]`}
                        />
                      </td>
                    )}

                    <td className="py-1.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectProgram(app.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium text-[#475569] hover:text-[#1D4ED8] hover:bg-[#EFF6FF] rounded transition-colors whitespace-nowrap"
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
      )}
    </div>
  );
};
