import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { AuthRequest } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

// Get Review Queue
export function getReviewQueue(req: AuthRequest, res: Response): void {
  const queue = db.prepare(`
    SELECT s.*, u.full_name as creator_name, c.name as campaign_name,
      ra.reviewer_id, ra.status as assignment_status,
      (SELECT COUNT(*) FROM findings f JOIN scan_jobs sj ON f.scan_id = sj.id WHERE sj.submission_id = s.id AND f.severity = 'CRITICAL' AND f.status = 'OPEN') as critical_findings,
      (SELECT COUNT(*) FROM findings f JOIN scan_jobs sj ON f.scan_id = sj.id WHERE sj.submission_id = s.id AND f.severity = 'HIGH' AND f.status = 'OPEN') as high_findings,
      (SELECT score FROM scan_jobs sj WHERE sj.submission_id = s.id ORDER BY sj.started_at DESC LIMIT 1) as latest_score
    FROM content_submissions s
    LEFT JOIN users u ON s.creator_id = u.id
    LEFT JOIN campaigns c ON s.campaign_id = c.id
    LEFT JOIN review_assignments ra ON s.id = ra.submission_id
    WHERE s.current_status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'ESCALATED', 'SCANNED')
    ORDER BY
      CASE s.current_status
        WHEN 'IN_REVIEW' THEN 1
        WHEN 'ESCALATED' THEN 2
        WHEN 'CHANGES_REQUESTED' THEN 3
        ELSE 4
      END,
      s.updated_at DESC
  `).all();

  res.json({ queue });
}

// Add Review Comment
export function addComment(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const { commentText } = req.body;

  if (!commentText || commentText.trim().length === 0) {
    res.status(400).json({ error: 'Comment text is required' });
    return;
  }

  const commentId = 'cmt_' + uuidv4().slice(0, 16);
  db.prepare(`
    INSERT INTO review_comments (id, submission_id, author_id, comment_text)
    VALUES (?, ?, ?, ?)
  `).run(commentId, id, req.user?.id, commentText);

  res.status(201).json({ message: 'Comment added', commentId });
}

// Approve Content
export function approveContent(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const { reason } = req.body;

  const sub = db.prepare(`SELECT * FROM content_submissions WHERE id = ?`).get(id) as any;
  if (!sub) {
    res.status(404).json({ error: 'Submission not found' });
    return;
  }

  // Prevent creator self-approval unless explicit admin
  if (sub.creator_id === req.user?.id && req.user?.role !== 'BRAND_ADMIN') {
    res.status(403).json({ error: 'Creators are not permitted to approve their own content.' });
    return;
  }

  const decisionId = 'dec_' + uuidv4().slice(0, 16);
  const decisionReason = reason || 'Brand compliance verified against approved brand truth.';

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE content_submissions
      SET current_status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    db.prepare(`
      INSERT INTO review_decisions (id, submission_id, reviewer_id, decision, reason, version_number)
      VALUES (?, ?, ?, 'APPROVED', ?, ?)
    `).run(decisionId, id, req.user?.id, decisionReason, sub.current_version);
  });

  tx();

  recordAuditLog({
    userId: req.user?.id,
    action: 'REVIEW_DECISION_APPROVED',
    contentId: id,
    previousStatus: sub.current_status,
    newStatus: 'APPROVED',
    metadata: { version: sub.current_version, reason: decisionReason }
  });

  res.json({ message: 'Content approved for publication', status: 'APPROVED' });
}

// Reject Content
export function rejectContent(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim().length === 0) {
    res.status(400).json({ error: 'A mandatory rejection reason is required' });
    return;
  }

  const sub = db.prepare(`SELECT * FROM content_submissions WHERE id = ?`).get(id) as any;
  if (!sub) {
    res.status(404).json({ error: 'Submission not found' });
    return;
  }

  const decisionId = 'dec_' + uuidv4().slice(0, 16);

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE content_submissions
      SET current_status = 'REJECTED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    db.prepare(`
      INSERT INTO review_decisions (id, submission_id, reviewer_id, decision, reason, version_number)
      VALUES (?, ?, ?, 'REJECTED', ?, ?)
    `).run(decisionId, id, req.user?.id, reason, sub.current_version);
  });

  tx();

  recordAuditLog({
    userId: req.user?.id,
    action: 'REVIEW_DECISION_REJECTED',
    contentId: id,
    previousStatus: sub.current_status,
    newStatus: 'REJECTED',
    metadata: { version: sub.current_version, reason }
  });

  res.json({ message: 'Content rejected', status: 'REJECTED' });
}

// Request Changes (Revisions)
export function requestChanges(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim().length === 0) {
    res.status(400).json({ error: 'Revision guidance notes are required' });
    return;
  }

  const sub = db.prepare(`SELECT * FROM content_submissions WHERE id = ?`).get(id) as any;
  if (!sub) {
    res.status(404).json({ error: 'Submission not found' });
    return;
  }

  const decisionId = 'dec_' + uuidv4().slice(0, 16);

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE content_submissions
      SET current_status = 'CHANGES_REQUESTED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    db.prepare(`
      INSERT INTO review_decisions (id, submission_id, reviewer_id, decision, reason, version_number)
      VALUES (?, ?, ?, 'REQUEST_CHANGES', ?, ?)
    `).run(decisionId, id, req.user?.id, reason, sub.current_version);

    // Also record as comment
    db.prepare(`
      INSERT INTO review_comments (id, submission_id, author_id, comment_text)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), id, req.user?.id, `[Revision Requested]: ${reason}`);
  });

  tx();

  recordAuditLog({
    userId: req.user?.id,
    action: 'REVIEW_DECISION_CHANGES_REQUESTED',
    contentId: id,
    previousStatus: sub.current_status,
    newStatus: 'CHANGES_REQUESTED',
    metadata: { version: sub.current_version, reason }
  });

  res.json({ message: 'Revision requested from creator', status: 'CHANGES_REQUESTED' });
}

// Escalate Submission
export function escalateContent(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim().length === 0) {
    res.status(400).json({ error: 'An escalation rationale is required' });
    return;
  }

  const sub = db.prepare(`SELECT * FROM content_submissions WHERE id = ?`).get(id) as any;
  if (!sub) {
    res.status(404).json({ error: 'Submission not found' });
    return;
  }

  const decisionId = 'dec_' + uuidv4().slice(0, 16);

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE content_submissions
      SET current_status = 'ESCALATED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    db.prepare(`
      INSERT INTO review_decisions (id, submission_id, reviewer_id, decision, reason, version_number)
      VALUES (?, ?, ?, 'ESCALATED', ?, ?)
    `).run(decisionId, id, req.user?.id, reason, sub.current_version);
  });

  tx();

  recordAuditLog({
    userId: req.user?.id,
    action: 'REVIEW_DECISION_ESCALATED',
    contentId: id,
    previousStatus: sub.current_status,
    newStatus: 'ESCALATED',
    metadata: { version: sub.current_version, reason }
  });

  res.json({ message: 'Content escalated to Brand Leadership', status: 'ESCALATED' });
}

