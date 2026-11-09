import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { preprocessContent } from './preprocessor.js';
import { loadBrandKnowledge } from './retrieval.js';
import { runDeterministicChecks } from './ruleEngine.js';
import { runLLMAnalysis } from './llmEngine.js';

export interface ScanResult {
  scanId: string;
  submissionId: string;
  versionId: string;
  score: number;
  status: 'COMPLETED' | 'FAILED';
  findingsCount: number;
  findings: Array<{
    id: string;
    category: string;
    severity: string;
    problematicText: string;
    startIndex: number;
    endIndex: number;
    explanation: string;
    status: string;
    evidence: {
      sourceId: string;
      sourceType: string;
      sourceVersion: string;
      sourceExcerpt: string;
      confidenceLevel: string;
    };
    suggestion: {
      id: string;
      suggestedText: string;
      reason: string;
      status: string;
    } | null;
  }>;
}

export async function executeGovernanceScan(
  submissionId: string,
  versionId: string
): Promise<ScanResult> {
  // 1. Fetch submission and version details
  const submission = db.prepare(`SELECT * FROM content_submissions WHERE id = ?`).get(submissionId) as any;
  if (!submission) {
    throw new Error(`Submission not found: ${submissionId}`);
  }

  const version = db.prepare(`SELECT * FROM content_versions WHERE id = ?`).get(versionId) as any;
  if (!version) {
    throw new Error(`Version not found: ${versionId}`);
  }

  // 2. Preprocess Content
  const preprocessed = preprocessContent(version.body_text);

  // 3. Load Active Approved Brand Knowledge Corpus
  const corpus = loadBrandKnowledge(submission.brand_id, submission.campaign_id);

  // 4. Run Deterministic Rule Engine
  const deterministicFindings = runDeterministicChecks(preprocessed, corpus, submission.channel);

  // 5. Run LLM & Semantic Analysis
  const llmFindings = await runLLMAnalysis(preprocessed, corpus, {
    channel: submission.channel,
    targetAudience: submission.target_audience,
    campaignCode: corpus.campaign?.code
  });

  // 6. Merge and Deduplicate Findings
  const allRawFindings = [...deterministicFindings, ...llmFindings];
  const uniqueFindings: typeof allRawFindings = [];

  for (const finding of allRawFindings) {
    // Deduplicate if overlap exists with same category
    const isDup = uniqueFindings.some(existing => {
      const overlap = Math.max(0, Math.min(existing.endIndex, finding.endIndex) - Math.max(existing.startIndex, finding.startIndex));
      return overlap > 0 && existing.category === finding.category;
    });

    if (!isDup) {
      uniqueFindings.push(finding);
    }
  }

  // 7. Calculate Health Score
  let score = 100;
  for (const f of uniqueFindings) {
    if (f.severity === 'CRITICAL') score -= 25;
    else if (f.severity === 'HIGH') score -= 15;
    else if (f.severity === 'MEDIUM') score -= 8;
    else if (f.severity === 'LOW') score -= 3;
  }
  score = Math.max(0, Math.min(100, score));

  // 8. Persist atomically to database
  const scanId = 'scn_' + uuidv4().slice(0, 16);

  const saveScanTransaction = db.transaction(() => {
    // Insert scan job
    db.prepare(`
      INSERT INTO scan_jobs (id, submission_id, version_id, status, findings_count, score, started_at, completed_at)
      VALUES (?, ?, ?, 'COMPLETED', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(scanId, submissionId, versionId, uniqueFindings.length, score);

    // Update submission status to SCANNED
    db.prepare(`
      UPDATE content_submissions
      SET current_status = 'SCANNED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(submissionId);

    const savedFindings: any[] = [];

    for (const f of uniqueFindings) {
      const findingId = 'fnd_' + uuidv4().slice(0, 16);
      const suggestionId = 'sug_' + uuidv4().slice(0, 16);

      // Insert Finding
      db.prepare(`
        INSERT INTO findings (id, scan_id, category, severity, problematic_text, start_index, end_index, explanation, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
      `).run(findingId, scanId, f.category, f.severity, f.problematicText, f.startIndex, f.endIndex, f.explanation);

      // Insert Evidence Reference
      const confidence = (f as any).confidence || 'HIGH';
      db.prepare(`
        INSERT INTO evidence_references (id, finding_id, source_id, source_type, source_version, source_excerpt, confidence_level)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), findingId, f.sourceId, f.sourceType, f.sourceVersion, f.sourceExcerpt, confidence);

      // Insert Suggestion
      if (f.suggestedCorrection) {
        db.prepare(`
          INSERT INTO correction_suggestions (id, finding_id, suggested_text, reason, status)
          VALUES (?, ?, ?, ?, 'PENDING')
        `).run(suggestionId, findingId, f.suggestedCorrection, f.reason);
      }

      savedFindings.push({
        id: findingId,
        category: f.category,
        severity: f.severity,
        problematicText: f.problematicText,
        startIndex: f.startIndex,
        endIndex: f.endIndex,
        explanation: f.explanation,
        status: 'OPEN',
        evidence: {
          sourceId: f.sourceId,
          sourceType: f.sourceType,
          sourceVersion: f.sourceVersion,
          sourceExcerpt: f.sourceExcerpt,
          confidenceLevel: confidence
        },
        suggestion: f.suggestedCorrection
          ? {
              id: suggestionId,
              suggestedText: f.suggestedCorrection,
              reason: f.reason,
              status: 'PENDING'
            }
          : null
      });
    }

    return savedFindings;
  });

  const persistedFindings = saveScanTransaction();

  return {
    scanId,
    submissionId,
    versionId,
    score,
    status: 'COMPLETED',
    findingsCount: persistedFindings.length,
    findings: persistedFindings
  };
}
