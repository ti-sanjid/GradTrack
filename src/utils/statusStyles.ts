import {
  ApplicationStatus,
  CvStatus,
  FacultyOutreachStatus,
  FeeWaiverStatus,
  LorStatus,
  SopStatus,
  TierCategory,
  TranscriptStatus,
} from '../types/application';

/**
 * Zero-pill semantic typography helpers: status is communicated via clear
 * text labels with high-contrast semantic ink colors (never rounded candy pills).
 */
export function getAppStatusTone(status: ApplicationStatus): string {
  switch (status) {
    case 'Submitted':
    case 'Admitted':
      return 'text-[#15803D] font-medium';
    case 'Interview':
      return 'text-[#1D4ED8] font-medium';
    case 'In Progress':
    case 'Waitlisted':
      return 'text-[#B45309] font-medium';
    case 'Rejected':
      return 'text-[#B91C1C] font-medium';
    case 'Researching':
    default:
      return 'text-[#64748B]';
  }
}

export function getOutreachTone(status: FacultyOutreachStatus): string {
  switch (status) {
    case 'Positive Response':
    case 'Interviewing':
      return 'text-[#15803D] font-medium';
    case 'Reached Out':
      return 'text-[#1D4ED8] font-medium';
    case 'No Response':
      return 'text-[#B45309]';
    case 'Not Contacted':
    default:
      return 'text-[#64748B]';
  }
}

export function getDocTone(
  status: SopStatus | CvStatus | TranscriptStatus | LorStatus | FeeWaiverStatus
): string {
  switch (status) {
    case 'Completed':
    case 'Ready':
    case 'Uploaded':
    case '3/3 Submitted':
    case 'Granted':
      return 'text-[#15803D] font-medium';
    case 'In Review':
    case 'Drafting':
    case 'Tailoring':
    case 'In Transit':
    case '2/3 Submitted':
    case '1/3 Submitted':
    case 'Requested':
    case 'Eligible':
      return 'text-[#B45309] font-medium';
    case 'Denied':
      return 'text-[#B91C1C]';
    default:
      return 'text-[#64748B]';
  }
}

export function getCategoryTone(category: TierCategory): string {
  switch (category) {
    case 'Reach':
      return 'text-[#1E3A8A] font-semibold';
    case 'Target':
      return 'text-[#0F172A] font-medium';
    case 'Safety':
      return 'text-[#475569]';
    default:
      return 'text-[#94A3B8]';
  }
}

export function getDaysLeftTone(days: number | null): string {
  if (days === null) return 'text-[#94A3B8]';
  if (days < 0) return 'text-[#B91C1C] font-semibold';
  if (days <= 14) return 'text-[#B91C1C] font-semibold';
  if (days <= 30) return 'text-[#B45309] font-medium';
  return 'text-[#334155]';
}
