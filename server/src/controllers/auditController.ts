import { Response } from 'express';
import db from '../db/connection.js';
import { AuthRequest } from '../middleware/auth.js';

export function getAuditLogs(req: AuthRequest, res: Response): void {
  const { contentId, action, limit = 50 } = req.query;

  let query = `
    SELECT al.*, u.full_name as user_name, u.role as user_role, s.title as content_title
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN content_submissions s ON al.content_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (contentId) {
    query += ` AND al.content_id = ?`;
    params.push(contentId);
  }

  if (action) {
    query += ` AND al.action = ?`;
    params.push(action);
  }

  query += ` ORDER BY al.created_at DESC LIMIT ?`;
  params.push(Number(limit));

  const logs = db.prepare(query).all(...params);
  res.json({ logs });
}

