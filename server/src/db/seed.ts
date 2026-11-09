import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db, { initDatabase } from './connection.js';

export function seed() {
  initDatabase();
  console.log('Seeding Brand Sentinel enterprise dataset...');

  // Clear existing data for clean seed
  const tables = [
    'notifications', 'audit_logs', 'review_decisions', 'review_comments',
    'review_assignments', 'correction_suggestions', 'evidence_references',
    'findings', 'scan_jobs', 'content_versions', 'content_submissions',
    'document_uploads', 'brand_assets', 'approved_claims', 'approved_facts',
    'terminology_rules', 'voice_tone_rules', 'guideline_versions',
    'brand_guidelines', 'campaigns', 'brand_members', 'brands', 'users'
  ];

  for (const table of tables) {
    db.prepare(`DELETE FROM ${table}`).run();
  }

  const salt = bcrypt.genSaltSync(10);
  const commonPasswordHash = bcrypt.hashSync('password123', salt);

  // 1. Create Users
  const creatorId = 'usr_creator_001';
  const reviewerId = 'usr_reviewer_002';
  const adminId = 'usr_admin_003';

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(creatorId, 'creator@vajra.com', commonPasswordHash, 'Yash Vardhan (Creator)', 'CONTENT_CREATOR', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  insertUser.run(reviewerId, 'reviewer@vajra.com', commonPasswordHash, 'Marcus Vance (Senior Reviewer)', 'HUMAN_REVIEWER', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');
  insertUser.run(adminId, 'admin@vajra.com', commonPasswordHash, 'Elena Rostova (Brand Governance Lead)', 'BRAND_ADMIN', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150');

  // 2. Create Brand
  const brandId = 'brd_vajra_sentinel';
  db.prepare(`
    INSERT INTO brands (id, name, slug, description, logo_url)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    brandId,
    'Vajra Sentinel Enterprise',
    'vajra-sentinel',
    'The premier autonomous enterprise brand safety and pre-publication compliance platform.',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'
  );

  // Brand members
  const insertMember = db.prepare(`INSERT INTO brand_members (id, brand_id, user_id, role) VALUES (?, ?, ?, ?)`);
  insertMember.run(uuidv4(), brandId, creatorId, 'CONTENT_CREATOR');
  insertMember.run(uuidv4(), brandId, reviewerId, 'HUMAN_REVIEWER');
  insertMember.run(uuidv4(), brandId, adminId, 'BRAND_ADMIN');

  // 3. Campaign
  const campaignId = 'cmp_shield_2026';
  db.prepare(`
    INSERT INTO campaigns (id, brand_id, name, code, description, target_audience, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    campaignId,
    brandId,
    'Operation Shield 2026: Enterprise Zero-Trust Governance',
    'SHIELD-2026',
    'Global campaign targeting Fortune 500 Chief Marketing Officers & Chief Risk Officers.',
    'CMOs, VP Brand, General Counsel, Enterprise Marketing Directors',
    '2026-01-01',
    '2026-12-31',
    'ACTIVE'
  );

  // 4. Brand Guidelines
  const insertGuideline = db.prepare(`
    INSERT INTO brand_guidelines (id, brand_id, title, category, status, current_version, effective_date, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const g1 = 'gd_voice_001';
  const g2 = 'gd_claims_002';
  const g3 = 'gd_editorial_003';
  insertGuideline.run(g1, brandId, 'Global Voice & Tone Charter 2026', 'VOICE_TONE', 'APPROVED', '2.1', '2026-01-01', adminId);
  insertGuideline.run(g2, brandId, 'Factual Claims & Regulatory Compliance Mandate', 'LEGAL_COMPLIANCE', 'APPROVED', '1.4', '2026-01-01', adminId);
  insertGuideline.run(g3, brandId, 'Editorial Terminology & Brand Lexicon', 'EDITORIAL', 'APPROVED', '3.0', '2026-01-01', adminId);

  // Guideline Versions
  const insertVersion = db.prepare(`
    INSERT INTO guideline_versions (id, guideline_id, version, content, changelog, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertVersion.run(uuidv4(), g1, '2.1', 'Our tone is authoritative, visionary, empirical, and empathetic. We never speak in ungrounded superlatives or sensational clickbait.', 'Updated tone guidelines for AI product launches.', adminId);
  insertVersion.run(uuidv4(), g2, '1.4', 'All statistics must cite our annual SOC2 audit, ESG disclosure, or Q4 2025 investor deck. No 100% security claims permitted.', 'Explicitly banned "unhackable" and "100% guarantee".', adminId);
  insertVersion.run(uuidv4(), g3, '3.0', 'Brand vocabulary definitions and banned buzzwords catalog.', 'Added rules on inclusive terms and hyperbole.', adminId);

  // 5. Voice and Tone Rules
  const insertVoice = db.prepare(`
    INSERT INTO voice_tone_rules (id, brand_id, trait_name, do_guideline, dont_guideline, example_good, example_bad, severity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertVoice.run(
    uuidv4(),
    brandId,
    'Empirical Authority',
    'State verified outcomes, cite statistical benchmarks, and highlight verifiable architecture.',
    'Avoid unsubstantiated superlatives like "revolutionary", "best in the world", or "miraculous".',
    'Our platform lowered pre-publication review turnaround by 64% across enterprise pilot audits.',
    'We are the most revolutionary, flawless marketing engine ever created.',
    'HIGH',
    'APPROVED'
  );

  insertVoice.run(
    uuidv4(),
    brandId,
    'Responsible Transparency',
    'Acknowledge that governance pairs automated intelligence with essential human-in-the-loop accountability.',
    'Never claim autonomous AI replaces legal oversight or guarantees zero brand liability.',
    'Brand Sentinel accelerates compliance while reserving authoritative approval for human brand stewards.',
    'Fire your compliance team because our magical AI guarantees you will never be sued.',
    'CRITICAL',
    'APPROVED'
  );

  insertVoice.run(
    uuidv4(),
    brandId,
    'Enterprise Professionalism',
    'Maintain respectful, clear, and inclusive language suitable for boardroom and legal scrutiny.',
    'Avoid aggressive competitor bashing, fear-mongering, or unverified rival comparisons.',
    'Unlike legacy manual workflows, unified automated governance ensures continuous consistency.',
    'Our competitors are dinosaur clowns whose software will destroy your company.',
    'HIGH',
    'APPROVED'
  );

  // 6. Terminology Rules (Prohibited & Preferred)
  const insertTerm = db.prepare(`
    INSERT INTO terminology_rules (id, brand_id, prohibited_term, preferred_term, context_explanation, category, severity, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const termRules = [
    ['unhackable', 'enterprise-grade resilient', 'Absolute security claims are legally indefensible and violate corporate liability guidelines.', 'LEGAL_RISK', 'CRITICAL', 1],
    ['foolproof', 'robust and validated', 'Implies zero risk and condescends to operators.', 'BRAND_IDENTITY', 'HIGH', 1],
    ['guaranteed 100% uptime', '99.99% high-availability SLA', 'Regulatory and SLA standards prohibit claiming 100% uptime without exclusions.', 'LEGAL_RISK', 'CRITICAL', 1],
    ['cheap', 'cost-effective / high ROI', 'Devalues our enterprise premium brand positioning.', 'BRAND_IDENTITY', 'MEDIUM', 1],
    ['magic', 'intelligent algorithmic governance', 'Demystify our technology; we build deterministic and empirical software, not mysticism.', 'BRAND_IDENTITY', 'HIGH', 1],
    ['game-changing', 'transformative / high-impact', 'Overused marketing cliché that reduces perceived credibility.', 'HYPERBOLE', 'LOW', 1],
    ['revolutionary', 'advanced / state-of-the-art', 'Overstated claim unless backed by peer-reviewed patented breakthrough.', 'HYPERBOLE', 'MEDIUM', 1],
    ['bulletproof', 'resilient / battle-tested', 'Militaristic and inaccurate security metaphor.', 'BRAND_IDENTITY', 'HIGH', 1],
    ['VajraAI', 'Vajra Sentinel', 'Brand name is Vajra Sentinel. Avoid unofficial product moniker abbreviations.', 'PRODUCT_NAMING', 'HIGH', 1],
    ['whitelist', 'allowlist', 'Adhere to modern inclusive technical lexicon standards.', 'INCLUSIVE_LANGUAGE', 'MEDIUM', 1],
    ['blacklist', 'blocklist', 'Adhere to modern inclusive technical lexicon standards.', 'INCLUSIVE_LANGUAGE', 'MEDIUM', 1],
    ['100% compliance guarantee', 'comprehensive pre-publication governance framework', 'No software can warrant legal immunity.', 'LEGAL_RISK', 'CRITICAL', 1]
  ];

  for (const [proh, pref, ctx, cat, sev, act] of termRules) {
    insertTerm.run(uuidv4(), brandId, proh, pref, ctx, cat, sev, act);
  }

  // 7. Approved Facts
  const insertFact = db.prepare(`
    INSERT INTO approved_facts (id, brand_id, category, claim_text, context_notes, source_name, source_id, source_version, effective_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const approvedFacts = [
    ['SECURITY', 'Vajra Sentinel maintains SOC 2 Type II certification and ISO/IEC 27001:2022 compliance.', 'Validated by Schellman & Co annual audit report.', 'SOC 2 Type II Audit Report 2025', 'SRC-SEC-2025-01', '2.0', '2025-01-01', 'APPROVED'],
    ['PRODUCT_SPECS', 'Platform latency is sub-15ms at 99th percentile across multi-region edge gateways.', 'Benchmarked on 10,000 req/sec sustained payload tests.', 'Q4 Engineering Performance Benchmark', 'SRC-ENG-2025-Q4', '1.2', '2025-11-15', 'APPROVED'],
    ['FINANCIAL', 'Over 2,500 enterprise organizations use Vajra platform across 42 countries.', 'Audited customer accounting records as of December 31, 2025.', 'Annual Corporate Filing 2025', 'SRC-FIN-2025-09', '1.0', '2026-01-10', 'APPROVED'],
    ['PRODUCT_SPECS', 'Delivers 99.99% high-availability SLA backed by contractual financial credits.', 'Standard enterprise enterprise master service agreement.', 'Enterprise Master Service Agreement 2026', 'SRC-LEGAL-MSA-26', '3.1', '2026-01-01', 'APPROVED'],
    ['ESG', '100% of server infrastructure runs on certified carbon-neutral renewable data centers.', 'Confirmed via Google Cloud & AWS verified Renewable Energy Certificates (RECs).', 'ESG Impact Report 2025', 'SRC-ESG-2025', '1.0', '2025-06-01', 'APPROVED']
  ];

  for (const [cat, text, ctx, sName, sId, sVer, eff, stat] of approvedFacts) {
    insertFact.run(uuidv4(), brandId, cat, text, ctx, sName, sId, sVer, eff, stat);
  }

  // 8. Approved Claims & Disclaimers
  const insertClaim = db.prepare(`
    INSERT INTO approved_claims (id, brand_id, campaign_id, claim_statement, required_disclaimer, proof_doc_ref, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertClaim.run(
    uuidv4(),
    brandId,
    campaignId,
    'Reduces pre-publication review turnaround cycles by up to 64%.',
    '*Based on an internal 90-day benchmark of 14,000 reviewed marketing assets compared to manual email approval loops.',
    'SRC-BENCHMARK-64PCT',
    'APPROVED'
  );

  insertClaim.run(
    uuidv4(),
    brandId,
    campaignId,
    'Pre-publication governance catches up to 98% of preventable brand violations before release.',
    '*Observed during controlled synthetic and historical red-team content evaluations.',
    'SRC-QA-EVAL-98',
    'APPROVED'
  );

  // 9. Brand Assets
  const insertAsset = db.prepare(`
    INSERT INTO brand_assets (id, brand_id, asset_name, asset_type, file_url, usage_guidelines, restrictions, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAsset.run(
    uuidv4(),
    brandId,
    'Primary Horizontal Logomark (Navy/Slate)',
    'LOGO',
    'https://assets.vajrasentinel.com/brand/logo_horizontal.svg',
    'Use on white or light-grey (#F8FAFC) backgrounds only. Maintain a minimum padding equal to the letter "V" height.',
    'Never stretch, skew, change the gradient, or place on busy photographic backgrounds.',
    'APPROVED'
  );

  insertAsset.run(
    uuidv4(),
    brandId,
    'Enterprise Brand Boilerplate Disclaimer 2026',
    'BOILERPLATE',
    '',
    'Must be appended to all external press releases and formal investor collateral.',
    'Must not be edited or abbreviated without written approval from Legal.',
    'APPROVED'
  );

  // 10. Sample Submissions & Lifecycle Data
  // Submission 1: A submission with severe violations to test scanning & reviewer flow!
  const sub1Id = 'sub_test_press_release_001';
  db.prepare(`
    INSERT INTO content_submissions (id, brand_id, campaign_id, creator_id, title, channel, target_audience, content_type, current_status, current_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sub1Id,
    brandId,
    campaignId,
    creatorId,
    'Operation Shield Launch: Revolutionary Unhackable Cloud Security Release',
    'PRESS_RELEASE',
    'Enterprise CISOs & Marketing Executives',
    'PRESS_RELEASE',
    'SCANNED',
    1
  );

  const ver1Id = 'ver_sub1_v1';
  const sub1Body = `VajraAI is proud to announce our revolutionary new cloud governance platform that delivers a guaranteed 100% uptime with magic-like automated precision. Our foolproof technology is completely unhackable, making all other legacy vendors look like cheap dinosaurs. With our 100% compliance guarantee, your legal team can sleep soundly while our algorithms eliminate 100% of risk without human review. We are serving over 10,000 enterprise customers across the world today.`;

  db.prepare(`
    INSERT INTO content_versions (id, submission_id, version_number, body_text, word_count, change_summary)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(ver1Id, sub1Id, 1, sub1Body, sub1Body.split(/\s+/).length, 'Initial draft submission for launch announcement.');

  // Pre-seed a scan for submission 1
  const scan1Id = 'scn_sub1_001';
  db.prepare(`
    INSERT INTO scan_jobs (id, submission_id, version_id, status, findings_count, score, started_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(scan1Id, sub1Id, ver1Id, 'COMPLETED', 7, 34);

  // Seed findings and evidence for sub 1
  const insertFinding = db.prepare(`
    INSERT INTO findings (id, scan_id, category, severity, problematic_text, start_index, end_index, explanation, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEvidence = db.prepare(`
    INSERT INTO evidence_references (id, finding_id, source_id, source_type, source_version, source_excerpt, confidence_level)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSuggestion = db.prepare(`
    INSERT INTO correction_suggestions (id, finding_id, suggested_text, reason, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Finding A: "unhackable"
  const fA = 'fnd_001';
  insertFinding.run(fA, scan1Id, 'TERMINOLOGY', 'CRITICAL', 'unhackable', 170, 180, 'Prohibited term: Absolute security claims violate corporate legal liability guidelines.', 'OPEN');
  insertEvidence.run(uuidv4(), fA, 'gd_claims_002', 'TERMINOLOGY_RULE', '1.4', 'Prohibited term "unhackable". Preferred term: "enterprise-grade resilient". Absolute security claims are legally indefensible.', 'HIGH');
  insertSuggestion.run(uuidv4(), fA, 'enterprise-grade resilient', 'Complies with legal guidelines and maintains technical credibility.', 'PENDING');

  // Finding B: "guaranteed 100% uptime"
  const fB = 'fnd_002';
  insertFinding.run(fB, scan1Id, 'UNSUPPORTED_CLAIM', 'CRITICAL', 'guaranteed 100% uptime', 85, 107, 'Unsupported claim: Corporate SLA specifies 99.99% high-availability SLA, not 100%.', 'OPEN');
  insertEvidence.run(uuidv4(), fB, 'SRC-LEGAL-MSA-26', 'APPROVED_FACT', '3.1', 'Delivers 99.99% high-availability SLA backed by contractual financial credits.', 'HIGH');
  insertSuggestion.run(uuidv4(), fB, 'contractually backed 99.99% high-availability SLA', 'Reflects verified corporate SLA.', 'PENDING');

  // Finding C: "VajraAI"
  const fC = 'fnd_003';
  insertFinding.run(fC, scan1Id, 'TERMINOLOGY', 'HIGH', 'VajraAI', 0, 7, 'Product naming violation: Official brand name is "Vajra Sentinel".', 'OPEN');
  insertEvidence.run(uuidv4(), fC, 'gd_editorial_003', 'TERMINOLOGY_RULE', '3.0', 'Brand name is Vajra Sentinel. Avoid unofficial abbreviations.', 'HIGH');
  insertSuggestion.run(uuidv4(), fC, 'Vajra Sentinel', 'Matches registered brand entity name.', 'PENDING');

  // Finding D: "10,000 enterprise customers"
  const fD = 'fnd_004';
  insertFinding.run(fD, scan1Id, 'UNSUPPORTED_CLAIM', 'CRITICAL', 'over 10,000 enterprise customers', 390, 424, 'Not verified — approved supporting evidence not found. Verified corporate record indicates 2,500 enterprise customers.', 'OPEN');
  insertEvidence.run(uuidv4(), fD, 'SRC-FIN-2025-09', 'APPROVED_FACT', '1.0', 'Over 2,500 enterprise organizations use Vajra platform across 42 countries.', 'HIGH');
  insertSuggestion.run(uuidv4(), fD, 'over 2,500 enterprise organizations worldwide', 'Corrects inflated metric to match audited financial disclosure.', 'PENDING');

  // Finding E: "cheap dinosaurs"
  const fE = 'fnd_005';
  insertFinding.run(fE, scan1Id, 'BRAND_VOICE', 'HIGH', 'cheap dinosaurs', 215, 230, 'Voice violation: Aggressive, informal derogatory language violates Enterprise Professionalism standards.', 'OPEN');
  insertEvidence.run(uuidv4(), fE, 'gd_voice_001', 'VOICE_TONE', '2.1', 'Avoid aggressive competitor bashing. Maintain respectful, empirical tone suitable for boardroom scrutiny.', 'HIGH');
  insertSuggestion.run(uuidv4(), fE, 'traditional manual review workflows', 'Maintains professional focus on operational modernization.', 'PENDING');

  // Submission 2: An Approved Submission with Full Review & Audit Trail
  const sub2Id = 'sub_approved_campaign_002';
  db.prepare(`
    INSERT INTO content_submissions (id, brand_id, campaign_id, creator_id, title, channel, target_audience, content_type, current_status, current_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sub2Id,
    brandId,
    campaignId,
    creatorId,
    'LinkedIn Leadership Post: The Future of Continuous Brand Governance',
    'LINKEDIN',
    'Marketing Leaders & Compliance Directors',
    'SOCIAL_COPY',
    'APPROVED',
    2
  );

  const sub2BodyV1 = `We are changing the game with magic brand safety tools. Guaranteed 100% safe.`;
  const sub2BodyV2 = `Modern enterprise governance requires empirical rigor. Vajra Sentinel empowers marketing teams to accelerate pre-publication reviews by up to 64%, while retaining full human stewardship over critical releases. Backed by our verified SOC 2 Type II compliance and 99.99% high-availability SLA, organizations safeguard brand equity across every channel.`;

  db.prepare(`
    INSERT INTO content_versions (id, submission_id, version_number, body_text, word_count, change_summary)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), sub2Id, 1, sub2BodyV1, sub2BodyV1.split(/\s+/).length, 'Initial creator draft with unverified claims.');

  db.prepare(`
    INSERT INTO content_versions (id, submission_id, version_number, body_text, word_count, change_summary)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), sub2Id, 2, sub2BodyV2, sub2BodyV2.split(/\s+/).length, 'Revised based on AI preflight findings and verified facts.');

  // Review decision for submission 2
  db.prepare(`
    INSERT INTO review_decisions (id, submission_id, reviewer_id, decision, reason, version_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), sub2Id, reviewerId, 'APPROVED', 'All claims verified against approved knowledge base (SOC2, SLA, and 64% speedup benchmark). Tone conforms to brand guidelines.', 2);

  // Review comment for submission 2
  db.prepare(`
    INSERT INTO review_comments (id, submission_id, author_id, comment_text)
    VALUES (?, ?, ?, ?)
  `).run(uuidv4(), sub2Id, reviewerId, 'Excellent revision! Grounded metrics and clear human-governance positioning.');

  // Submission 3: In Review queue
  const sub3Id = 'sub_review_blog_003';
  db.prepare(`
    INSERT INTO content_submissions (id, brand_id, campaign_id, creator_id, title, channel, target_audience, content_type, current_status, current_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sub3Id,
    brandId,
    campaignId,
    creatorId,
    'Technical Blog: How Autonomous Verification Protects Global Brand Equity',
    'WEBSITE',
    'Technical Marketing & Operations',
    'MARKETING_BLOG',
    'IN_REVIEW',
    1
  );

  const sub3Body = `In modern multi-channel marketing, inconsistencies compound quickly. Vajra Sentinel provides continuous preflight governance, cross-referencing terminology and factual claims against approved brand truth before distribution. With 99.99% high-availability infrastructure, global teams preserve unified voice across 42 countries.`;
  db.prepare(`
    INSERT INTO content_versions (id, submission_id, version_number, body_text, word_count, change_summary)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), sub3Id, 1, sub3Body, sub3Body.split(/\s+/).length, 'Ready for final reviewer sign-off.');

  // Review assignment
  db.prepare(`
    INSERT INTO review_assignments (id, submission_id, reviewer_id, status)
    VALUES (?, ?, ?, ?)
  `).run(uuidv4(), sub3Id, reviewerId, 'ASSIGNED');

  // 11. Audit Logs (Immutable)
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, content_id, previous_status, new_status, metadata_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(uuidv4(), creatorId, 'CONTENT_CREATED', sub1Id, null, 'DRAFT', JSON.stringify({ version: 1 }), '2026-02-01 10:00:00');
  insertAudit.run(uuidv4(), creatorId, 'SCAN_REQUESTED', sub1Id, 'DRAFT', 'IN_SCAN', JSON.stringify({ version: 1 }), '2026-02-01 10:05:00');
  insertAudit.run(uuidv4(), null, 'SCAN_COMPLETED', sub1Id, 'IN_SCAN', 'SCANNED', JSON.stringify({ findings_count: 5, score: 34 }), '2026-02-01 10:05:03');

  insertAudit.run(uuidv4(), creatorId, 'CONTENT_CREATED', sub2Id, null, 'DRAFT', JSON.stringify({ version: 1 }), '2026-02-02 09:30:00');
  insertAudit.run(uuidv4(), creatorId, 'CONTENT_REVISED', sub2Id, 'CHANGES_REQUESTED', 'IN_REVIEW', JSON.stringify({ version: 2 }), '2026-02-02 14:15:00');
  insertAudit.run(uuidv4(), reviewerId, 'REVIEW_DECISION_APPROVED', sub2Id, 'IN_REVIEW', 'APPROVED', JSON.stringify({ reviewer: 'Marcus Vance', version: 2, reason: 'Full brand compliance verified.' }), '2026-02-02 15:00:00');

  insertAudit.run(uuidv4(), creatorId, 'SUBMITTED_FOR_REVIEW', sub3Id, 'SCANNED', 'IN_REVIEW', JSON.stringify({ version: 1 }), '2026-02-03 11:20:00');

  // 12. Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, link, is_read)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertNotif.run(uuidv4(), reviewerId, 'New Review Assigned', 'Submission "Technical Blog: How Autonomous Verification..." is awaiting your review.', `/reviews/${sub3Id}`, 0);
  insertNotif.run(uuidv4(), creatorId, 'Content Approved', 'Your submission "LinkedIn Leadership Post..." was approved by Marcus Vance.', `/content/${sub2Id}`, 1);

  console.log('Database seeding successfully completed with full enterprise truth dataset!');
}

// Allow direct CLI execution: node seed.js
if (process.argv[1]?.includes('seed')) {
  seed();
}

