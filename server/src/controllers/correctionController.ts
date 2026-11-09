import { Response } from 'express';
import db from '../db/connection.js';
import { AuthRequest } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

export function acceptSuggestion(req: AuthRequest, res: Response): void {
  const { id } = req.params;

  const suggestion = db.prepare(`SELECT * FROM correction_suggestions WHERE id = ?`).get(id) as any;
  if (!suggestion) {
    res.status(404).json({ error: 'Correction suggestion not found' });
    return;
  }

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE correction_suggestions SET status = 'ACCEPTED' WHERE id = ?
    `).run(id);

    db.prepare(`
      UPDATE findings SET status = 'RESOLVED' WHERE id = ?
    `).run(suggestion.finding_id);
  });

  tx();

  recordAuditLog({
    userId: req.user?.id,
    action: 'SUGGESTION_ACCEPTED',
    metadata: { suggestionId: id, findingId: suggestion.finding_id }
  });

  res.json({ message: 'Suggestion accepted and finding marked resolved', suggestionId: id });
}

export function dismissSuggestion(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim().length === 0) {
    res.status(400).json({ error: 'A justification reason is required to dismiss an AI finding suggestion' });
    return;
  }

  const suggestion = db.prepare(`SELECT * FROM correction_suggestions WHERE id = ?`).get(id) as any;
  if (!suggestion) {
    res.status(404).json({ error: 'Correction suggestion not found' });
    return;
  }

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE correction_suggestions
      SET status = 'DISMISSED', creator_feedback = ?
      WHERE id = ?
    `).run(reason, id);

    db.prepare(`
      UPDATE findings SET status = 'DISMISSED' WHERE id = ?
    `).run(suggestion.finding_id);
  });

  tx();

  recordAuditLog({
    userId: req.user?.id,
    action: 'SUGGESTION_DISMISSED',
    metadata: { suggestionId: id, findingId: suggestion.finding_id, reason }
  });

  res.json({ message: 'Suggestion dismissed with recorded justification', suggestionId: id });
}

export function editSuggestion(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const { customText, feedback } = req.body;

  if (!customText) {
    res.status(400).json({ error: 'Custom replacement text is required' });
    return;
  }

  db.prepare(`
    UPDATE correction_suggestions
    SET suggested_text = ?, status = 'EDITED', creator_feedback = ?
    WHERE id = ?
  `).run(customText, feedback || 'Custom creator wording', id);

  res.json({ message: 'Suggestion updated with creator wording', id, customText });
}
