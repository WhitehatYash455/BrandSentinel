import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { AuthRequest } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

// Get Submissions list (with filters)
export function getSubmissions(req: AuthRequest, res: Response): void {
  const { status, channel, campaignId } = req.query;

  let query = `
    SELECT s.*, u.full_name as creator_name, c.name as campaign_name,
      (SELECT COUNT(*) FROM findings f JOIN scan_jobs sj ON f.scan_id = sj.id WHERE sj.submission_id = s.id AND f.status = 'OPEN') as open_findings_count
    FROM content_submissions s
    LEFT JOIN users u ON s.creator_id = u.id
    LEFT JOIN campaigns c ON s.campaign_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // If Creator, show only their content (or all if requested)
  if (req.user?.role === 'CONTENT_CREATOR') {
    query += ` AND s.creator_id = ?`;
    params.push(req.user.id);
  }

  if (status) {
    query += ` AND s.current_status = ?`;
    params.push(status);
  }

  if (channel) {
    query += ` AND s.channel = ?`;
    params.push(channel);
  }

  if (campaignId) {
    query += ` AND s.campaign_id = ?`;
    params.push(campaignId);
  }

  query += ` ORDER BY s.updated_at DESC`;

  const submissions = db.prepare(query).all(...params);
  res.json({ submissions });
}

// Get Single Submission Detail with complete Version History
export function getSubmissionDetail(req: AuthRequest, res: Response): void {
  const { id } = req.params;

  const submission = db.prepare(`
    SELECT s.*, u.full_name as creator_name, u.email as creator_email, c.name as campaign_name
    FROM content_submissions s
    LEFT JOIN users u ON s.creator_id = u.id
    LEFT JOIN campaigns c ON s.campaign_id = c.id
    WHERE s.id = ?
  `).get(id) as any;

  if (!submission) {
    res.status(404).json({ error: 'Content submission not found' });
    return;
  }

  // Fetch all versions
  const versions = db.prepare(`
    SELECT * FROM content_versions
    WHERE submission_id = ?
    ORDER BY version_number DESC
  `).all(id);

  // Fetch scans
  const scans = db.prepare(`
    SELECT * FROM scan_jobs
    WHERE submission_id = ?
    ORDER BY started_at DESC
  `).all(id);

  // Fetch latest scan findings if exists
  let latestFindings: any[] = [];
  if (scans.length > 0) {
    const latestScan = scans[0] as any;
    latestFindings = db.prepare(`
      SELECT f.*,
        er.source_id, er.source_type, er.source_version, er.source_excerpt, er.confidence_level,
        cs.id as suggestion_id, cs.suggested_text, cs.reason as suggestion_reason, cs.status as suggestion_status
      FROM findings f
      LEFT JOIN evidence_references er ON f.id = er.finding_id
      LEFT JOIN correction_suggestions cs ON f.id = cs.finding_id
      WHERE f.scan_id = ?
      ORDER BY
        CASE f.severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
          ELSE 5
        END
    `).all(latestScan.id);
  }

  // Fetch comments
  const comments = db.prepare(`
    SELECT rc.*, u.full_name as author_name, u.role as author_role, u.avatar_url as author_avatar
    FROM review_comments rc
    JOIN users u ON rc.author_id = u.id
    WHERE rc.submission_id = ?
    ORDER BY rc.created_at ASC
  `).all(id);

  // Fetch review decisions
  const decisions = db.prepare(`
    SELECT rd.*, u.full_name as reviewer_name
    FROM review_decisions rd
    JOIN users u ON rd.reviewer_id = u.id
    WHERE rd.submission_id = ?
    ORDER BY rd.decided_at DESC
  `).all(id);

  res.json({
    submission,
    versions,
    scans,
    latestFindings,
    comments,
    decisions
  });
}

// Create Content Draft
export function createSubmission(req: AuthRequest, res: Response): void {
  const { title, bodyText, channel, targetAudience, contentType, campaignId, documentId } = req.body;
  const brand = db.prepare(`SELECT id FROM brands LIMIT 1`).get() as any;

  if (!title || !bodyText) {
    res.status(400).json({ error: 'Title and content body are required' });
    return;
  }

  const submissionId = 'sub_' + uuidv4().slice(0, 16);
  const versionId = 'ver_' + uuidv4().slice(0, 16);
  const words = bodyText.trim().split(/\s+/).filter(Boolean).length;

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO content_submissions (id, brand_id, campaign_id, creator_id, title, channel, target_audience, content_type, current_status, current_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', 1)
    `).run(
      submissionId,
      brand.id,
      campaignId || null,
      req.user?.id,
      title,
      channel || 'WEBSITE',
      targetAudience || 'General Audience',
      contentType || 'SOCIAL_COPY'
    );

    db.prepare(`
      INSERT INTO content_versions (id, submission_id, version_number, body_text, document_id, word_count, change_summary)
      VALUES (?, ?, 1, ?, ?, ?, 'Initial creation draft')
    `).run(versionId, submissionId, bodyText, documentId || null, words);
  });

  tx();

  recordAuditLog({
    userId: req.user?.id,
    action: 'CONTENT_CREATED',
    contentId: submissionId,
    previousStatus: null,
    newStatus: 'DRAFT',
    metadata: { title, version: 1 }
  });

  res.status(201).json({
    message: 'Content draft created successfully',
    submissionId,
    versionId
  });
}

// Resubmit revised content (Version increment N+1)
export function resubmitRevised(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const { revisedBodyText, changeSummary } = req.body;

  if (!revisedBodyText) {
    res.status(400).json({ error: 'Revised body text is required' });
    return;
  }

  const sub = db.prepare(`SELECT * FROM content_submissions WHERE id = ?`).get(id) as any;
  if (!sub) {
    res.status(404).json({ error: 'Submission not found' });
    return;
  }

  const nextVersion = sub.current_version + 1;
  const versionId = 'ver_' + uuidv4().slice(0, 16);
  const words = revisedBodyText.trim().split(/\s+/).filter(Boolean).length;

  const tx = db.transaction(() => {
    // Insert new version
    db.prepare(`
      INSERT INTO content_versions (id, submission_id, version_number, body_text, word_count, change_summary)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(versionId, id, nextVersion, revisedBodyText, words, changeSummary || `Revision v${nextVersion}`);

    // Update submission status to IN_REVIEW
    db.prepare(`
      UPDATE content_submissions
      SET current_version = ?, current_status = 'IN_REVIEW', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextVersion, id);
  });

  tx();

  recordAuditLog({
    userId: req.user?.id,
    action: 'CONTENT_REVISED',
    contentId: id,
    previousStatus: sub.current_status,
    newStatus: 'IN_REVIEW',
    metadata: { version: nextVersion, changeSummary }
  });

  res.json({
    message: `Content revised and resubmitted as version ${nextVersion}`,
    submissionId: id,
    versionId,
    versionNumber: nextVersion
  });
}

// Submit draft for Reviewer approval
export function submitForReview(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const sub = db.prepare(`SELECT * FROM content_submissions WHERE id = ?`).get(id) as any;
  if (!sub) {
    res.status(404).json({ error: 'Submission not found' });
    return;
  }

  db.prepare(`
    UPDATE content_submissions
    SET current_status = 'IN_REVIEW', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);

  recordAuditLog({
    userId: req.user?.id,
    action: 'SUBMITTED_FOR_REVIEW',
    contentId: id,
    previousStatus: sub.current_status,
    newStatus: 'IN_REVIEW',
    metadata: { version: sub.current_version }
  });

  res.json({ message: 'Content submitted for human reviewer approval', status: 'IN_REVIEW' });
}
