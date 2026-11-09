export type UserRole = 'CONTENT_CREATOR' | 'HUMAN_REVIEWER' | 'BRAND_ADMIN';

export type SubmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_SCAN'
  | 'SCANNED'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ESCALATED';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export type FindingCategory =
  | 'BRAND_VOICE'
  | 'TERMINOLOGY'
  | 'UNSUPPORTED_CLAIM'
  | 'OUTDATED_CLAIM'
  | 'ASSET_USAGE'
  | 'CAMPAIGN_INCONSISTENCY'
  | 'ACCESSIBILITY';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  brand?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface Submission {
  id: string;
  brand_id: string;
  campaign_id?: string;
  campaign_name?: string;
  creator_id: string;
  creator_name?: string;
  title: string;
  channel: string;
  target_audience: string;
  content_type: string;
  current_status: SubmissionStatus;
  current_version: number;
  created_at: string;
  updated_at: string;
  open_findings_count?: number;
}

export interface ContentVersion {
  id: string;
  submission_id: string;
  version_number: number;
  body_text: string;
  document_id?: string;
  word_count: number;
  change_summary?: string;
  created_at: string;
}

export interface EvidenceReference {
  source_id: string;
  source_type: string;
  source_version: string;
  source_excerpt: string;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED_GAP';
}

export interface CorrectionSuggestion {
  id: string;
  finding_id: string;
  suggested_text: string;
  reason: string;
  status: 'PENDING' | 'ACCEPTED' | 'EDITED' | 'DISMISSED';
  creator_feedback?: string;
}

export interface Finding {
  id: string;
  scan_id: string;
  category: FindingCategory;
  severity: SeverityLevel;
  problematic_text: string;
  start_index: number;
  end_index: number;
  explanation: string;
  status: 'OPEN' | 'ACCEPTED' | 'DISMISSED' | 'RESOLVED';
  source_id?: string;
  source_type?: string;
  source_version?: string;
  source_excerpt?: string;
  confidence_level?: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED_GAP';
  suggestion_id?: string;
  suggested_text?: string;
  suggestion_reason?: string;
  suggestion_status?: string;
}

export interface ScanJob {
  id: string;
  submission_id: string;
  version_id: string;
  status: string;
  findings_count: number;
  score: number;
  started_at: string;
  completed_at: string;
}

export interface ReviewComment {
  id: string;
  submission_id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  author_avatar?: string;
  comment_text: string;
  created_at: string;
}

export interface ReviewDecision {
  id: string;
  submission_id: string;
  reviewer_id: string;
  reviewer_name: string;
  decision: 'APPROVED' | 'REJECTED' | 'REQUEST_CHANGES' | 'ESCALATED';
  reason: string;
  version_number: number;
  decided_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  user_role?: UserRole;
  action: string;
  content_id?: string;
  content_title?: string;
  previous_status?: string;
  new_status?: string;
  metadata_json?: string;
  created_at: string;
}

