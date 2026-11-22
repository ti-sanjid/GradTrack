export type TierCategory = 'Reach' | 'Target' | 'Safety' | 'Unassigned';

export type FacultyOutreachStatus =
  | 'Not Contacted'
  | 'Reached Out'
  | 'No Response'
  | 'Positive Response'
  | 'Interviewing';

export type SopStatus = 'Not Started' | 'Drafting' | 'In Review' | 'Completed';

export type CvStatus = 'Not Started' | 'Tailoring' | 'Ready';

export type TranscriptStatus = 'Not Requested' | 'In Transit' | 'Uploaded';

export type LorStatus = '0/3 Submitted' | '1/3 Submitted' | '2/3 Submitted' | '3/3 Submitted';

export type FeeWaiverStatus = 'None' | 'Eligible' | 'Requested' | 'Granted' | 'Denied';

export type ApplicationStatus =
  | 'Researching'
  | 'In Progress'
  | 'Submitted'
  | 'Interview'
  | 'Admitted'
  | 'Waitlisted'
  | 'Rejected';

export interface PhdApplication {
  id: string;
  university: string;
  department: string;
  researchAreaAndProf: string;
  ieltsScore: string;
  applicationFee: number;
  appDeadline: string; // YYYY-MM-DD or free text if TBD
  links: string;
  category: TierCategory;
  facultyOutreach: FacultyOutreachStatus;
  sopStatus: SopStatus;
  cvStatus: CvStatus;
  transcripts: TranscriptStatus;
  lorStatus: LorStatus;
  feeWaiver: FeeWaiverStatus;
  fundingModel: string;
  stipendAnnual: number;
  applicationPortal: string;
  applicationStatus: ApplicationStatus;
  notes: string;
}

export type WorkspaceView =
  | 'master'
  | 'deadlines'
  | 'materials'
  | 'outreach'
  | 'funding'
  | 'audit';

export type ColumnPreset = 'essential' | 'documents' | 'outreach' | 'all';

export interface FieldIssue {
  field: keyof PhdApplication;
  label: string;
  kind: 'missing' | 'template';
  reason: string;
}

export const CATEGORY_OPTIONS: TierCategory[] = ['Reach', 'Target', 'Safety', 'Unassigned'];

export const OUTREACH_OPTIONS: FacultyOutreachStatus[] = [
  'Not Contacted',
  'Reached Out',
  'No Response',
  'Positive Response',
  'Interviewing',
];

export const SOP_OPTIONS: SopStatus[] = ['Not Started', 'Drafting', 'In Review', 'Completed'];

export const CV_OPTIONS: CvStatus[] = ['Not Started', 'Tailoring', 'Ready'];

export const TRANSCRIPT_OPTIONS: TranscriptStatus[] = ['Not Requested', 'In Transit', 'Uploaded'];

export const LOR_OPTIONS: LorStatus[] = [
  '0/3 Submitted',
  '1/3 Submitted',
  '2/3 Submitted',
  '3/3 Submitted',
];

export const WAIVER_OPTIONS: FeeWaiverStatus[] = [
  'None',
  'Eligible',
  'Requested',
  'Granted',
  'Denied',
];

export const APP_STATUS_OPTIONS: ApplicationStatus[] = [
  'Researching',
  'In Progress',
  'Submitted',
  'Interview',
  'Admitted',
  'Waitlisted',
  'Rejected',
];
