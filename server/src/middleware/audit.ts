import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';

export function recordAuditLog(params: {
  userId?: string | null;
  action: string;
  contentId?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  metadata?: Record<string, any>;
}): void {
  try {
    const id = 'aud_' + uuidv4().slice(0, 16);
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, content_id, previous_status, new_status, metadata_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(
      id,
      params.userId || null,
      params.action,
      params.contentId || null,
      params.previousStatus || null,
      params.newStatus || null,
      params.metadata ? JSON.stringify(params.metadata) : null
    );
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
}
