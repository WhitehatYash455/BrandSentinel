-- Brand Sentinel Relational Database Schema
PRAGMA foreign_keys = ON;

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('CONTENT_CREATOR', 'HUMAN_REVIEWER', 'BRAND_ADMIN')),
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Brands
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Brand Members
CREATE TABLE IF NOT EXISTS brand_members (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('CONTENT_CREATOR', 'HUMAN_REVIEWER', 'BRAND_ADMIN')),
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(brand_id, user_id)
);

-- 4. Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  target_audience TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Brand Guidelines
CREATE TABLE IF NOT EXISTS brand_guidelines (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('VOICE_TONE', 'VISUAL', 'EDITORIAL', 'LEGAL_COMPLIANCE', 'CAMPAIGN')),
  status TEXT NOT NULL DEFAULT 'APPROVED' CHECK(status IN ('DRAFT', 'REVIEW', 'APPROVED', 'RETIRED')),
  current_version TEXT NOT NULL DEFAULT '1.0',
  effective_date DATE NOT NULL,
  expiry_date DATE,
  owner_id TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Guideline Versions
CREATE TABLE IF NOT EXISTS guideline_versions (
  id TEXT PRIMARY KEY,
  guideline_id TEXT NOT NULL REFERENCES brand_guidelines(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  content TEXT NOT NULL,
  changelog TEXT,
  created_by TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Voice and Tone Rules
CREATE TABLE IF NOT EXISTS voice_tone_rules (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  trait_name TEXT NOT NULL,
  do_guideline TEXT NOT NULL,
  dont_guideline TEXT NOT NULL,
  example_good TEXT,
  example_bad TEXT,
  severity TEXT NOT NULL DEFAULT 'HIGH' CHECK(severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  status TEXT NOT NULL DEFAULT 'APPROVED' CHECK(status IN ('DRAFT', 'APPROVED', 'RETIRED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Terminology Rules (Preferred & Prohibited Terminology)
CREATE TABLE IF NOT EXISTS terminology_rules (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  prohibited_term TEXT NOT NULL,
  preferred_term TEXT,
  context_explanation TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'BRAND_IDENTITY' CHECK(category IN ('BRAND_IDENTITY', 'PRODUCT_NAMING', 'LEGAL_RISK', 'INCLUSIVE_LANGUAGE', 'HYPERBOLE')),
  severity TEXT NOT NULL DEFAULT 'HIGH' CHECK(severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Approved Facts & Knowledge Base
CREATE TABLE IF NOT EXISTS approved_facts (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK(category IN ('PRODUCT_SPECS', 'FINANCIAL', 'SECURITY', 'COMPANY_HISTORY', 'AWARDS', 'ESG')),
  claim_text TEXT NOT NULL,
  context_notes TEXT,
  source_name TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_version TEXT NOT NULL DEFAULT '1.0',
  effective_date DATE NOT NULL,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'APPROVED' CHECK(status IN ('DRAFT', 'APPROVED', 'RETIRED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Approved Claims & Disclaimers
CREATE TABLE IF NOT EXISTS approved_claims (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(id),
  claim_statement TEXT NOT NULL,
  required_disclaimer TEXT,
  proof_doc_ref TEXT,
  status TEXT NOT NULL DEFAULT 'APPROVED' CHECK(status IN ('APPROVED', 'EXPIRED', 'REJECTED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Brand Assets & Usage Restrictions
CREATE TABLE IF NOT EXISTS brand_assets (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK(asset_type IN ('LOGO', 'ICON', 'TYPOGRAPHY', 'COLOR_PALETTE', 'BOILERPLATE', 'BADGE')),
  file_url TEXT,
  usage_guidelines TEXT NOT NULL,
  restrictions TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'APPROVED' CHECK(status IN ('APPROVED', 'DEPRECATED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Content Submissions
CREATE TABLE IF NOT EXISTS content_submissions (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(id),
  creator_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  channel TEXT NOT NULL CHECK(channel IN ('WEBSITE', 'EMAIL', 'LINKEDIN', 'TWITTER', 'PRESS_RELEASE', 'INTERNAL', 'PRINT')),
  target_audience TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK(content_type IN ('SOCIAL_COPY', 'MARKETING_BLOG', 'ADVERTISEMENT', 'PRESS_RELEASE', 'GENERAL_DOC')),
  current_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(current_status IN ('DRAFT', 'SUBMITTED', 'IN_SCAN', 'SCANNED', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'ESCALATED')),
  current_version INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. Content Versions
CREATE TABLE IF NOT EXISTS content_versions (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  body_text TEXT NOT NULL,
  document_id TEXT REFERENCES document_uploads(id),
  word_count INTEGER NOT NULL DEFAULT 0,
  change_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(submission_id, version_number)
);

-- 14. Document Uploads
CREATE TABLE IF NOT EXISTS document_uploads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  extracted_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. Scan Jobs
CREATE TABLE IF NOT EXISTS scan_jobs (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
  version_id TEXT NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
  findings_count INTEGER DEFAULT 0,
  score INTEGER DEFAULT 100,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- 16. Findings
CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK(category IN ('BRAND_VOICE', 'TERMINOLOGY', 'UNSUPPORTED_CLAIM', 'OUTDATED_CLAIM', 'ASSET_USAGE', 'CAMPAIGN_INCONSISTENCY', 'ACCESSIBILITY')),
  severity TEXT NOT NULL CHECK(severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL')),
  problematic_text TEXT NOT NULL,
  start_index INTEGER NOT NULL DEFAULT 0,
  end_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'ACCEPTED', 'DISMISSED', 'RESOLVED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 17. Evidence References (Source Grounding)
CREATE TABLE IF NOT EXISTS evidence_references (
  id TEXT PRIMARY KEY,
  finding_id TEXT NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('BRAND_GUIDELINE', 'TERMINOLOGY_RULE', 'VOICE_TONE', 'APPROVED_FACT', 'APPROVED_CLAIM', 'BRAND_ASSET', 'UNVERIFIED')),
  source_version TEXT NOT NULL DEFAULT '1.0',
  source_excerpt TEXT NOT NULL,
  confidence_level TEXT NOT NULL CHECK(confidence_level IN ('HIGH', 'MEDIUM', 'LOW', 'UNVERIFIED_GAP')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 18. Correction Suggestions
CREATE TABLE IF NOT EXISTS correction_suggestions (
  id TEXT PRIMARY KEY,
  finding_id TEXT NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  suggested_text TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACCEPTED', 'EDITED', 'DISMISSED')),
  creator_feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 19. Review Assignments
CREATE TABLE IF NOT EXISTS review_assignments (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL REFERENCES users(id),
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'ASSIGNED' CHECK(status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED'))
);

-- 20. Review Comments
CREATE TABLE IF NOT EXISTS review_comments (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  comment_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 21. Review Decisions
CREATE TABLE IF NOT EXISTS review_decisions (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES content_submissions(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL REFERENCES users(id),
  decision TEXT NOT NULL CHECK(decision IN ('APPROVED', 'REJECTED', 'REQUEST_CHANGES', 'ESCALATED')),
  reason TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  decided_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 22. Audit Logs (Immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  content_id TEXT,
  previous_status TEXT,
  new_status TEXT,
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 23. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_brand_status ON content_submissions(brand_id, current_status);
CREATE INDEX IF NOT EXISTS idx_submissions_creator ON content_submissions(creator_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_submission ON content_versions(submission_id);
CREATE INDEX IF NOT EXISTS idx_findings_scan ON findings(scan_id);
CREATE INDEX IF NOT EXISTS idx_evidence_finding ON evidence_references(finding_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_finding ON correction_suggestions(finding_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_content ON audit_logs(content_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_term_rules_brand ON terminology_rules(brand_id, is_active);
CREATE INDEX IF NOT EXISTS idx_approved_facts_brand ON approved_facts(brand_id, status);
