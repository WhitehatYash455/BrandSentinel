import { Response } from 'express';
import db from '../db/connection.js';
import { AuthRequest } from '../middleware/auth.js';

export function getOverviewAnalytics(req: AuthRequest, res: Response): void {
  // 1. Overall Status Counts
  const statusCounts = db.prepare(`
    SELECT current_status, COUNT(*) as count
    FROM content_submissions
    GROUP BY current_status
  `).all() as Array<{ current_status: string; count: number }>;

  const countsMap: Record<string, number> = {
    TOTAL: 0,
    DRAFT: 0,
    SCANNED: 0,
    IN_REVIEW: 0,
    CHANGES_REQUESTED: 0,
    APPROVED: 0,
    REJECTED: 0,
    ESCALATED: 0
  };

  let total = 0;
  for (const row of statusCounts) {
    countsMap[row.current_status] = row.count;
    total += row.count;
  }
  countsMap.TOTAL = total;

  // 2. Critical Findings Count
  const criticalFindings = db.prepare(`
    SELECT COUNT(*) as count FROM findings WHERE severity = 'CRITICAL' AND status = 'OPEN'
  `).get() as { count: number };

  // 3. Violation Category Breakdown
  const categories = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM findings
    GROUP BY category
    ORDER BY count DESC
  `).all();

  // 4. Severity Distribution
  const severities = db.prepare(`
    SELECT severity, COUNT(*) as count
    FROM findings
    GROUP BY severity
    ORDER BY
      CASE severity
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
        ELSE 5
      END
  `).all();

  // 5. Repeated Terminology / Prohibited Words Violations
  const repeatedViolations = db.prepare(`
    SELECT problematic_text, category, severity, COUNT(*) as occurrence_count
    FROM findings
    GROUP BY problematic_text, category, severity
    HAVING occurrence_count > 0
    ORDER BY occurrence_count DESC
    LIMIT 8
  `).all();

  // 6. Creator Revision Frequency (Average versions per submission)
  const revisionStats = db.prepare(`
    SELECT
      AVG(current_version) as avg_versions,
      MAX(current_version) as max_versions,
      COUNT(CASE WHEN current_version > 1 THEN 1 END) as revised_submissions_count
    FROM content_submissions
  `).get() as any;

  // 7. Reviewer Decisions Breakdown
  const reviewerActivity = db.prepare(`
    SELECT u.full_name as reviewer_name, rd.decision, COUNT(*) as decision_count
    FROM review_decisions rd
    JOIN users u ON rd.reviewer_id = u.id
    GROUP BY rd.reviewer_id, rd.decision
  `).all();

  // 8. Guideline Gaps (Unverified Claims)
  const guidelineGaps = db.prepare(`
    SELECT f.problematic_text, f.explanation, er.confidence_level, COUNT(*) as gap_count
    FROM findings f
    JOIN evidence_references er ON f.id = er.finding_id
    WHERE er.confidence_level = 'UNVERIFIED_GAP'
    GROUP BY f.problematic_text
  `).all();

  // 9. Recent Submissions
  const recentSubmissions = db.prepare(`
    SELECT s.id, s.title, s.channel, s.current_status, s.current_version, s.updated_at,
           u.full_name as creator_name
    FROM content_submissions s
    LEFT JOIN users u ON s.creator_id = u.id
    ORDER BY s.updated_at DESC
    LIMIT 5
  `).all();

  res.json({
    counts: countsMap,
    criticalFindingsCount: criticalFindings.count,
    categories,
    severities,
    repeatedViolations,
    revisionStats: {
      avgVersions: revisionStats.avg_versions ? Number(revisionStats.avg_versions.toFixed(1)) : 1,
      maxVersions: revisionStats.max_versions || 1,
      revisedSubmissionsCount: revisionStats.revised_submissions_count || 0
    },
    reviewerActivity,
    guidelineGaps,
    recentSubmissions
  });
}
