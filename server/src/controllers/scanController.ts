import { Response } from 'express';
import db from '../db/connection.js';
import { AuthRequest } from '../middleware/auth.js';
import { executeGovernanceScan } from '../engine/governanceOrchestrator.js';
import { recordAuditLog } from '../middleware/audit.js';

export async function runScan(req: AuthRequest, res: Response): Promise<void> {
  const { submissionId, versionId } = req.body;

  if (!submissionId) {
    res.status(400).json({ error: 'submissionId is required' });
    return;
  }

  try {
    let targetVersionId = versionId;
    if (!targetVersionId) {
      const latestVer = db.prepare(`
        SELECT id FROM content_versions
        WHERE submission_id = ?
        ORDER BY version_number DESC
        LIMIT 1
      `).get(submissionId) as any;

      if (!latestVer) {
        res.status(404).json({ error: 'No content versions found for this submission' });
        return;
      }
      targetVersionId = latestVer.id;
    }

    // Execute Governance Scan
    const scanResult = await executeGovernanceScan(submissionId, targetVersionId);

    recordAuditLog({
      userId: req.user?.id,
      action: 'SCAN_COMPLETED',
      contentId: submissionId,
      metadata: {
        scanId: scanResult.scanId,
        score: scanResult.score,
        findingsCount: scanResult.findingsCount
      }
    });

    res.json(scanResult);
  } catch (error: any) {
    console.error('Scan execution failure:', error);
    res.status(500).json({ error: `Preflight scan failed: ${error.message}` });
  }
}

export function getScanDetail(req: AuthRequest, res: Response): void {
  const { id } = req.params;

  const scan = db.prepare(`SELECT * FROM scan_jobs WHERE id = ?`).get(id) as any;
  if (!scan) {
    res.status(404).json({ error: 'Scan job not found' });
    return;
  }

  const findings = db.prepare(`
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
  `).all(id);

  res.json({ scan, findings });
}
