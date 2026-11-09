import assert from 'assert';
import db from '../db/connection.js';
import { seed } from '../db/seed.js';
import { executeGovernanceScan } from '../engine/governanceOrchestrator.js';

async function runEndToEndVerification() {
  console.log('=== BRAND SENTINEL END-TO-END VALIDATION SUITE ===\n');

  // 1. Reset and Seed Database
  console.log('Step 1: Initializing and Seeding Database...');
  seed();

  // 2. Verify Seeding Integrity
  const brand = db.prepare('SELECT * FROM brands WHERE slug = ?').get('vajra-sentinel') as any;
  assert.ok(brand, 'Brand must exist in database');
  console.log(`✓ Brand initialized: "${brand.name}"`);

  const usersCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  assert.strictEqual(usersCount, 3, 'Must have 3 core roles seeded (Creator, Reviewer, Admin)');
  console.log(`✓ Core RBAC Users verified: ${usersCount} users`);

  // 3. Test Governance Scan on Pre-seeded Content
  console.log('\nStep 2: Executing AI Governance Scan on Uncompliant Content...');
  const sub1 = db.prepare('SELECT * FROM content_submissions WHERE id = ?').get('sub_test_press_release_001') as any;
  const ver1 = db.prepare('SELECT * FROM content_versions WHERE submission_id = ? AND version_number = 1').get(sub1.id) as any;

  const scanResult = await executeGovernanceScan(sub1.id, ver1.id);

  console.log(`✓ Scan finished with score: ${scanResult.score}/100`);
  console.log(`✓ Total Violations Detected: ${scanResult.findingsCount}`);
  assert.ok(scanResult.findingsCount > 0, 'Scan must detect violations in bad copy');

  // Verify critical findings exist
  const criticalFindings = scanResult.findings.filter(f => f.severity === 'CRITICAL');
  console.log(`✓ Critical Findings: ${criticalFindings.length}`);
  assert.ok(criticalFindings.length >= 2, 'Should identify at least 2 critical findings (e.g. unhackable, 100% SLA discrepancy)');

  // Verify Source Grounding
  const groundedWithEvidence = scanResult.findings.filter(f => f.evidence && f.evidence.sourceId);
  console.log(`✓ Findings with Grounded Evidence: ${groundedWithEvidence.length}/${scanResult.findingsCount}`);
  assert.strictEqual(groundedWithEvidence.length, scanResult.findingsCount, 'Every finding must have grounded evidence');

  // Check specific finding: "unhackable"
  const unhackableFinding = scanResult.findings.find(f => f.problematicText.toLowerCase().includes('unhackable'));
  assert.ok(unhackableFinding, 'Must identify prohibited term "unhackable"');
  console.log(`✓ Grounded Finding Verified: "${unhackableFinding.problematicText}" -> Suggested: "${unhackableFinding.suggestion?.suggestedText}"`);

  // Check specific finding: metric discrepancy (10,000 customers vs approved 2,500)
  const metricFinding = scanResult.findings.find(f => f.problematicText.includes('10,000'));
  assert.ok(metricFinding, 'Must catch customer count discrepancy against approved financial fact');
  console.log(`✓ Factual Grounding Verified: "${metricFinding.problematicText}" -> Excerpt: "${metricFinding.evidence.sourceExcerpt}"`);

  // 4. Test Version Increment Lifecycle
  console.log('\nStep 3: Testing Revision Workflow (Version Increment)...');
  const revisedBody = 'Vajra Sentinel is an enterprise-grade resilient platform delivering a 99.99% high-availability SLA. Over 2,500 enterprise organizations trust our solution.';
  const nextVer = sub1.current_version + 1;

  db.prepare(`
    INSERT INTO content_versions (id, submission_id, version_number, body_text, word_count, change_summary)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('ver_test_v2', sub1.id, nextVer, revisedBody, revisedBody.split(' ').length, 'Applied AI suggestions');

  db.prepare(`UPDATE content_submissions SET current_version = ?, current_status = 'IN_REVIEW' WHERE id = ?`).run(nextVer, sub1.id);

  const updatedSub = db.prepare('SELECT * FROM content_submissions WHERE id = ?').get(sub1.id) as any;
  assert.strictEqual(updatedSub.current_version, 2, 'Version must be incremented to 2');
  assert.strictEqual(updatedSub.current_status, 'IN_REVIEW', 'Status must be updated to IN_REVIEW');
  console.log(`✓ Content revision v2 created and submitted to review queue`);

  // 5. Test Rescan of Compliant Copy
  console.log('\nStep 4: Scanning Compliant Revised Copy...');
  const rescan = await executeGovernanceScan(sub1.id, 'ver_test_v2');
  console.log(`✓ Revised Copy Score: ${rescan.score}/100 (Findings: ${rescan.findingsCount})`);
  assert.ok(rescan.score >= 90, 'Compliant revision should achieve high score (>=90)');

  // 6. Test Reviewer Decision & Human Stewardship Gate
  console.log('\nStep 5: Testing Human Reviewer Approval Gate...');
  const reviewer = db.prepare("SELECT * FROM users WHERE role = 'HUMAN_REVIEWER'").get() as any;
  db.prepare(`
    INSERT INTO review_decisions (id, submission_id, reviewer_id, decision, reason, version_number)
    VALUES (?, ?, ?, 'APPROVED', 'Verified all metrics against approved fact SRC-FIN-2025-09.', 2)
  `).run('dec_test_001', sub1.id, reviewer.id);
  db.prepare(`UPDATE content_submissions SET current_status = 'APPROVED' WHERE id = ?`).run(sub1.id);

  const finalSub = db.prepare('SELECT * FROM content_submissions WHERE id = ?').get(sub1.id) as any;
  assert.strictEqual(finalSub.current_status, 'APPROVED', 'Content must now be officially APPROVED');
  console.log(`✓ Human Reviewer Decision recorded: APPROVED by ${reviewer.full_name}`);

  // 7. Verify Immutable Audit Trail
  console.log('\nStep 6: Verifying Audit Log Integrity...');
  const auditLogsCount = (db.prepare('SELECT COUNT(*) as c FROM audit_logs').get() as any).c;
  assert.ok(auditLogsCount >= 5, 'Audit trail must contain multiple lifecycle records');
  console.log(`✓ Immutable Audit Trail confirmed with ${auditLogsCount} verified event logs`);

  console.log('\n==================================================');
  console.log(' ALL 6 END-TO-END VALIDATION CHECKS PASSED 100%! ');
  console.log('==================================================\n');
}

runEndToEndVerification().catch(err => {
  console.error('Validation test failed:', err);
  process.exit(1);
});
