import {
  APP_STATUS_OPTIONS,
  ApplicationStatus,
  CATEGORY_OPTIONS,
  CV_OPTIONS,
  CvStatus,
  FacultyOutreachStatus,
  FeeWaiverStatus,
  FieldIssue,
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

export const ORIGINAL_CSV_URL = `${import.meta.env.BASE_URL}assets/aistudio/Untitled_spreadsheet_0d12dc02`;

/**
 * RFC-4180 compliant CSV parser supporting quoted fields, embedded commas,
 * escaped quotes (""), and CRLF / LF line endings.
 */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\r' && next === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function parseCurrency(value: string): number {
  const cleaned = (value || '').replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function matchOption<T extends string>(value: string, options: readonly T[], fallback: T): T {
  const trimmed = (value || '').trim().toLowerCase();
  const exact = options.find((opt) => opt.toLowerCase() === trimmed);
  return exact ?? fallback;
}

/**
 * Computes integer days remaining from local today until YYYY-MM-DD deadline.
 * Returns null if deadline is empty or unparseable.
 */
export function computeDaysLeft(deadline: string): number | null {
  const trimmed = (deadline || '').trim();
  if (!trimmed) return null;
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  let target: Date;
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    target = new Date(Number(y), Number(m) - 1, Number(d));
  } else {
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDeadlineShort(deadline: string): string {
  const trimmed = (deadline || '').trim();
  if (!trimmed) return 'TBD';
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (!isoMatch) return trimmed;
  const [, y, m, d] = isoMatch;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Parses either the user's original spreadsheet (which has a leading blank column A
 * and 7 summary header rows before the column header row) OR a standard flat CSV.
 */
export function parsePhdCsv(csvText: string): PhdApplication[] {
  const rows = parseCsvRows(csvText);
  if (rows.length === 0) return [];

  // Locate the header row containing "University"
  let headerRowIdx = -1;
  let universityColIdx = -1;

  for (let r = 0; r < Math.min(rows.length, 25); r++) {
    const idx = rows[r].findIndex((cell) => cell.trim().toLowerCase() === 'university');
    if (idx !== -1) {
      headerRowIdx = r;
      universityColIdx = idx;
      break;
    }
  }

  if (headerRowIdx === -1 || universityColIdx === -1) {
    return [];
  }

  const headerRow = rows[headerRowIdx].map((h) => h.trim().toLowerCase());

  const findCol = (candidates: string[], fallbackOffset: number): number => {
    for (const candidate of candidates) {
      const idx = headerRow.findIndex((h) => h === candidate || h.includes(candidate));
      if (idx !== -1) return idx;
    }
    return universityColIdx + fallbackOffset;
  };

  const col = {
    university: universityColIdx,
    department: findCol(['department'], 1),
    researchAreaAndProf: findCol(['research area', 'prof'], 3),
    ieltsScore: findCol(['ielts'], 4),
    applicationFee: findCol(['application fee', 'fee'], 5),
    appDeadline: findCol(['app deadline', 'deadline'], 6),
    links: findCol(['links', 'url'], 7),
    category: findCol(['category', 'tier'], 8),
    facultyOutreach: findCol(['faculty outreach', 'outreach'], 9),
    sopStatus: findCol(['sop status', 'sop'], 10),
    cvStatus: findCol(['cv / resume', 'cv'], 11),
    transcripts: findCol(['transcripts'], 12),
    lorStatus: findCol(['lor status', 'lor'], 13),
    feeWaiver: findCol(['fee waiver', 'waiver'], 14),
    fundingModel: findCol(['funding offer', 'funding'], 15),
    stipendAnnual: findCol(['stipend'], 16),
    applicationPortal: findCol(['application portal', 'portal'], 17),
    applicationStatus: findCol(['application status', 'status'], 18),
    notes: findCol(['notes & action items', 'notes'], 19),
  };

  const results: PhdApplication[] = [];

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    const university = (row[col.university] ?? '').trim();
    if (!university) continue;

    const getCell = (idx: number) => (idx >= 0 && idx < row.length ? row[idx].trim() : '');

    results.push({
      id: `prog-${r}-${university.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
      university,
      department: getCell(col.department),
      researchAreaAndProf: getCell(col.researchAreaAndProf),
      ieltsScore: getCell(col.ieltsScore),
      applicationFee: parseCurrency(getCell(col.applicationFee)),
      appDeadline: getCell(col.appDeadline),
      links: getCell(col.links),
      category: matchOption<TierCategory>(getCell(col.category), CATEGORY_OPTIONS, 'Target'),
      facultyOutreach: matchOption<FacultyOutreachStatus>(
        getCell(col.facultyOutreach),
        OUTREACH_OPTIONS,
        'Not Contacted'
      ),
      sopStatus: matchOption<SopStatus>(getCell(col.sopStatus), SOP_OPTIONS, 'Not Started'),
      cvStatus: matchOption<CvStatus>(getCell(col.cvStatus), CV_OPTIONS, 'Not Started'),
      transcripts: matchOption<TranscriptStatus>(
        getCell(col.transcripts),
        TRANSCRIPT_OPTIONS,
        'Not Requested'
      ),
      lorStatus: matchOption<LorStatus>(getCell(col.lorStatus), LOR_OPTIONS, '0/3 Submitted'),
      feeWaiver: matchOption<FeeWaiverStatus>(getCell(col.feeWaiver), WAIVER_OPTIONS, 'None'),
      fundingModel: getCell(col.fundingModel),
      stipendAnnual: parseCurrency(getCell(col.stipendAnnual)),
      applicationPortal: getCell(col.applicationPortal),
      applicationStatus: matchOption<ApplicationStatus>(
        getCell(col.applicationStatus),
        APP_STATUS_OPTIONS,
        'Researching'
      ),
      notes: getCell(col.notes),
    });
  }

  return results;
}

// Known template values copied from the starter spreadsheet
const TEMPLATE_LINKS = new Set([
  'prof. jeffrey grossman',
  'prof. sayeef salahuddin',
  'prof. mete atatüre',
  'prof. neil dasgupta',
  'prof. ryan lively',
  'prof. zhi zhou',
  'prof. larry cheng',
  'prof. vlad pribiag',
]);

const TEMPLATE_PORTAL_OWNERS: Record<string, string> = {
  'mit gradapply': 'mit',
  'uc berkeley graduate portal': 'berkeley',
  'cambridge applicant portal': 'cambridge',
  'rackham applyweb': 'michigan',
  'georgia tech gradapp': 'georgia tech',
  'purdue slate': 'purdue',
  'penn state grad school portal': 'pennsylvania state',
  'umn graduate admissions': 'minnesota',
};

const TEMPLATE_NOTES = new Set([
  'review recent ieee papers before emailing pi',
  'ta offer guaranteed upon admission; prepare statement',
  'gates cambridge scholarship essay submitted',
  'follow up with prof. dasgupta next tuesday',
  'interview scheduled for mid-january',
  'need 3rd recommender submission confirmation',
  'refine sop research section to match lab papers',
  'advisor invited formal application; submit early',
]);

export function isPlaceholderDepartment(value: string): boolean {
  const v = (value || '').trim().toLowerCase();
  return !v || v === 'a' || v === 'tba' || v === 'tbd' || v === '-';
}

export function isPlaceholderProfessor(value: string): boolean {
  const v = (value || '').trim().toLowerCase();
  return !v || v === 'tba' || v === 'tbd' || v === 'none' || v === '-';
}

export function isPlaceholderIelts(value: string): boolean {
  const v = (value || '').trim().toLowerCase();
  return !v || v === '0' || v === 'tba' || v === 'tbd' || v === '-';
}

export function isTemplateLink(value: string): boolean {
  const v = (value || '').trim().toLowerCase();
  return TEMPLATE_LINKS.has(v);
}

export function isMismatchedTemplatePortal(portal: string, university: string): boolean {
  const p = (portal || '').trim().toLowerCase();
  const u = (university || '').trim().toLowerCase();
  if (!p) return false;
  const owner = TEMPLATE_PORTAL_OWNERS[p];
  if (!owner) return false;
  return !u.includes(owner);
}

export function isTemplateNote(note: string, university: string): boolean {
  const n = (note || '').trim().toLowerCase();
  const u = (university || '').trim().toLowerCase();
  if (!n) return false;
  if (n.includes('gates cambridge') && !u.includes('cambridge')) return true;
  if (n.includes('prof. dasgupta') && !u.includes('michigan')) return true;
  return TEMPLATE_NOTES.has(n);
}

export function getApplicationIssues(app: PhdApplication): FieldIssue[] {
  const issues: FieldIssue[] = [];

  if (isPlaceholderDepartment(app.department)) {
    issues.push({
      field: 'department',
      label: 'Department',
      kind: 'missing',
      reason: app.department.trim() ? `Placeholder "${app.department}"` : 'Missing department name',
    });
  }

  if (isPlaceholderProfessor(app.researchAreaAndProf)) {
    issues.push({
      field: 'researchAreaAndProf',
      label: 'Research Area & Prof.',
      kind: 'missing',
      reason: app.researchAreaAndProf.trim() ? 'Marked TBA' : 'No target faculty listed',
    });
  }

  if (isPlaceholderIelts(app.ieltsScore)) {
    issues.push({
      field: 'ieltsScore',
      label: 'IELTS / English Req.',
      kind: 'missing',
      reason: app.ieltsScore.trim() === '0' ? 'Placeholder "0"' : 'Requirement not verified',
    });
  }

  if (!app.appDeadline.trim()) {
    issues.push({
      field: 'appDeadline',
      label: 'App Deadline',
      kind: 'missing',
      reason: 'Deadline not set',
    });
  }

  if (!app.links.trim()) {
    issues.push({
      field: 'links',
      label: 'Program / Portal Links',
      kind: 'missing',
      reason: 'No department or portal link saved',
    });
  } else if (isTemplateLink(app.links)) {
    issues.push({
      field: 'links',
      label: 'Links',
      kind: 'template',
      reason: `Template PI leftover (${app.links})`,
    });
  }

  if (!app.applicationPortal.trim()) {
    issues.push({
      field: 'applicationPortal',
      label: 'Application Portal',
      kind: 'missing',
      reason: 'Portal not specified',
    });
  } else if (isMismatchedTemplatePortal(app.applicationPortal, app.university)) {
    issues.push({
      field: 'applicationPortal',
      label: 'Application Portal',
      kind: 'template',
      reason: `Mismatched template portal (${app.applicationPortal})`,
    });
  }

  if (isTemplateNote(app.notes, app.university)) {
    issues.push({
      field: 'notes',
      label: 'Notes & Action Items',
      kind: 'template',
      reason: 'Copied template note',
    });
  }

  return issues;
}

/**
 * Computes profile completeness percentage (0–100) for a university across 7 core info fields.
 */
export function getCompletenessScore(app: PhdApplication): number {
  const checks = [
    !isPlaceholderDepartment(app.department),
    !isPlaceholderProfessor(app.researchAreaAndProf),
    !isPlaceholderIelts(app.ieltsScore),
    Boolean(app.appDeadline.trim()),
    Boolean(app.links.trim()) && !isTemplateLink(app.links),
    Boolean(app.applicationPortal.trim()) &&
      !isMismatchedTemplatePortal(app.applicationPortal, app.university),
    Boolean(app.fundingModel.trim()),
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

/**
 * Cleans obvious placeholder & template-leftover values across all rows while
 * preserving all real university names, departments, deadlines, fees, IELTS scores,
 * and real target professors.
 */
export function cleanTemplatePlaceholders(apps: PhdApplication[]): PhdApplication[] {
  return apps.map((app) => {
    const hasTemplatePortal = isMismatchedTemplatePortal(app.applicationPortal, app.university);
    const hasTemplateNote = isTemplateNote(app.notes, app.university);
    const hasTemplateLink = isTemplateLink(app.links);

    return {
      ...app,
      department: isPlaceholderDepartment(app.department) ? '' : app.department,
      researchAreaAndProf: isPlaceholderProfessor(app.researchAreaAndProf)
        ? ''
        : app.researchAreaAndProf,
      ieltsScore: isPlaceholderIelts(app.ieltsScore) ? '' : app.ieltsScore,
      links: hasTemplateLink ? '' : app.links,
      applicationPortal: hasTemplatePortal ? '' : app.applicationPortal,
      notes: hasTemplateNote ? '' : app.notes,
      // If portal and link were both template leftovers, reset copied funding/status noise cleanly only on portal/notes/links
      // while leaving statuses intact unless user prefers to reset statuses separately
    };
  });
}

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports the full dataset back into the exact spreadsheet format (including updated
 * summary metrics in rows 2–6 and all 20 columns starting at column B).
 */
export function exportPhdCsv(apps: PhdApplication[]): string {
  const totalCount = apps.length;
  const netFees = apps.reduce(
    (sum, a) => sum + (a.feeWaiver === 'Granted' ? 0 : a.applicationFee),
    0
  );
  const inProgressCount = apps.filter((a) => a.applicationStatus === 'In Progress').length;
  const submittedCount = apps.filter(
    (a) =>
      a.applicationStatus === 'Submitted' ||
      a.applicationStatus === 'Interview' ||
      a.applicationStatus === 'Admitted'
  ).length;

  const lines: string[][] = [
    Array(21).fill(''),
    ['', 'Engineering & Physical Sciences PhD Application Tracker', ...Array(19).fill('')],
    [
      '',
      'Academic Year 2026–2027 • Faculty Outreach, Admission Requirements, Milestones & Funding',
      ...Array(19).fill(''),
    ],
    [
      '',
      'TOTAL UNIVERSITIES',
      'TOTAL APPLICATION FEES',
      '',
      'IN PROGRESS',
      '',
      '',
      'SUBMITTED',
      ...Array(13).fill(''),
    ],
    [
      '',
      String(totalCount),
      formatCurrency(netFees),
      '',
      String(inProgressCount),
      '',
      '',
      String(submittedCount),
      ...Array(13).fill(''),
    ],
    [
      '',
      'Programs Across Target Tiers',
      'Excluding Approved Waivers',
      '',
      'Drafting, Outreach & Docs',
      '',
      '',
      'Completed Applications',
      ...Array(13).fill(''),
    ],
    Array(21).fill(''),
    [
      '',
      'University',
      'Department',
      'Days Left',
      'Research Area & Prof.',
      'IELTS (Score)',
      'Application Fee',
      'App Deadline',
      'Links',
      'Category',
      'Faculty Outreach',
      'SOP Status',
      'CV / Resume',
      'Transcripts',
      'LOR Status',
      'Fee Waiver',
      'Funding Offer / Model',
      'Stipend (Annual)',
      'Application Portal',
      'Application Status',
      'Notes & Action Items',
    ],
  ];

  for (const app of apps) {
    const days = computeDaysLeft(app.appDeadline);
    const daysText = days === null ? '' : `${days} d`;
    lines.push([
      '',
      app.university,
      app.department,
      daysText,
      app.researchAreaAndProf,
      app.ieltsScore,
      formatCurrency(app.applicationFee),
      app.appDeadline,
      app.links,
      app.category,
      app.facultyOutreach,
      app.sopStatus,
      app.cvStatus,
      app.transcripts,
      app.lorStatus,
      app.feeWaiver,
      app.fundingModel,
      app.stipendAnnual > 0 ? formatCurrency(app.stipendAnnual) : '',
      app.applicationPortal,
      app.applicationStatus,
      app.notes,
    ]);
  }

  return lines.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
}

export function extractSafeUrl(text: string): string | null {
  const match = /(https?:\/\/[^\s]+)/i.exec(text || '');
  if (!match) return null;
  try {
    const parsed = new URL(match[1]);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}
