import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { AuthRequest } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

// Get Full Brand Workspace Knowledge Base
export function getBrandKnowledge(req: AuthRequest, res: Response): void {
  const brand = db.prepare(`SELECT * FROM brands LIMIT 1`).get() as any;
  if (!brand) {
    res.status(404).json({ error: 'No brand configured' });
    return;
  }

  const guidelines = db.prepare(`
    SELECT g.*, u.full_name as owner_name, v.content as current_content
    FROM brand_guidelines g
    LEFT JOIN users u ON g.owner_id = u.id
    LEFT JOIN guideline_versions v ON g.id = v.guideline_id AND g.current_version = v.version
    WHERE g.brand_id = ?
    ORDER BY g.created_at DESC
  `).all(brand.id);

  const voiceRules = db.prepare(`
    SELECT * FROM voice_tone_rules WHERE brand_id = ? ORDER BY created_at DESC
  `).all(brand.id);

  const terminologyRules = db.prepare(`
    SELECT * FROM terminology_rules WHERE brand_id = ? ORDER BY created_at DESC
  `).all(brand.id);

  const approvedFacts = db.prepare(`
    SELECT * FROM approved_facts WHERE brand_id = ? ORDER BY created_at DESC
  `).all(brand.id);

  const approvedClaims = db.prepare(`
    SELECT * FROM approved_claims WHERE brand_id = ? ORDER BY created_at DESC
  `).all(brand.id);

  const brandAssets = db.prepare(`
    SELECT * FROM brand_assets WHERE brand_id = ? ORDER BY created_at DESC
  `).all(brand.id);

  const campaigns = db.prepare(`
    SELECT * FROM campaigns WHERE brand_id = ? ORDER BY created_at DESC
  `).all(brand.id);

  res.json({
    brand,
    guidelines,
    voiceRules,
    terminologyRules,
    approvedFacts,
    approvedClaims,
    brandAssets,
    campaigns
  });
}

// Create or Update Guideline (Admin only)
export function createGuideline(req: AuthRequest, res: Response): void {
  const { title, category, content, version, effectiveDate, expiryDate } = req.body;
  const brand = db.prepare(`SELECT id FROM brands LIMIT 1`).get() as any;

  if (!title || !category || !content) {
    res.status(400).json({ error: 'Title, category, and content are required' });
    return;
  }

  const guidelineId = 'gd_' + uuidv4().slice(0, 16);
  const v = version || '1.0';

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO brand_guidelines (id, brand_id, title, category, status, current_version, effective_date, expiry_date, owner_id)
      VALUES (?, ?, ?, ?, 'APPROVED', ?, ?, ?, ?)
    `).run(guidelineId, brand.id, title, category, v, effectiveDate || new Date().toISOString().split('T')[0], expiryDate || null, req.user?.id);

    db.prepare(`
      INSERT INTO guideline_versions (id, guideline_id, version, content, changelog, created_by)
      VALUES (?, ?, ?, ?, 'Initial version created', ?)
    `).run(uuidv4(), guidelineId, v, content, req.user?.id);
  });

  tx();

  recordAuditLog({
    userId: req.user?.id,
    action: 'GUIDELINE_CREATED',
    metadata: { guidelineId, title, version: v }
  });

  res.status(201).json({ message: 'Guideline created successfully', guidelineId });
}

// Add or Update Terminology Rule
export function addTerminologyRule(req: AuthRequest, res: Response): void {
  const { prohibitedTerm, preferredTerm, contextExplanation, category, severity } = req.body;
  const brand = db.prepare(`SELECT id FROM brands LIMIT 1`).get() as any;

  if (!prohibitedTerm || !contextExplanation) {
    res.status(400).json({ error: 'Prohibited term and context explanation are required' });
    return;
  }

  const id = 'trm_' + uuidv4().slice(0, 16);
  db.prepare(`
    INSERT INTO terminology_rules (id, brand_id, prohibited_term, preferred_term, context_explanation, category, severity, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    id,
    brand.id,
    prohibitedTerm,
    preferredTerm || null,
    contextExplanation,
    category || 'BRAND_IDENTITY',
    severity || 'HIGH'
  );

  recordAuditLog({
    userId: req.user?.id,
    action: 'TERMINOLOGY_RULE_ADDED',
    metadata: { prohibitedTerm, preferredTerm }
  });

  res.status(201).json({ message: 'Terminology rule registered', id });
}

// Add Approved Fact
export function addApprovedFact(req: AuthRequest, res: Response): void {
  const { category, claimText, contextNotes, sourceName, sourceId, sourceVersion, effectiveDate } = req.body;
  const brand = db.prepare(`SELECT id FROM brands LIMIT 1`).get() as any;

  if (!claimText || !sourceName || !sourceId) {
    res.status(400).json({ error: 'Claim text, source name, and source ID are required' });
    return;
  }

  const id = 'fct_' + uuidv4().slice(0, 16);
  db.prepare(`
    INSERT INTO approved_facts (id, brand_id, category, claim_text, context_notes, source_name, source_id, source_version, effective_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')
  `).run(
    id,
    brand.id,
    category || 'PRODUCT_SPECS',
    claimText,
    contextNotes || null,
    sourceName,
    sourceId,
    sourceVersion || '1.0',
    effectiveDate || new Date().toISOString().split('T')[0]
  );

  recordAuditLog({
    userId: req.user?.id,
    action: 'APPROVED_FACT_ADDED',
    metadata: { sourceId, sourceName }
  });

  res.status(201).json({ message: 'Approved fact registered', id });
}

// Add Voice & Tone Rule
export function addVoiceRule(req: AuthRequest, res: Response): void {
  const { traitName, doGuideline, dontGuideline, exampleGood, exampleBad, severity } = req.body;
  const brand = db.prepare(`SELECT id FROM brands LIMIT 1`).get() as any;

  if (!traitName || !doGuideline || !dontGuideline) {
    res.status(400).json({ error: 'Trait name, DO and DONT guidelines are required' });
    return;
  }

  const id = 'vcr_' + uuidv4().slice(0, 16);
  db.prepare(`
    INSERT INTO voice_tone_rules (id, brand_id, trait_name, do_guideline, dont_guideline, example_good, example_bad, severity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')
  `).run(
    id,
    brand.id,
    traitName,
    doGuideline,
    dontGuideline,
    exampleGood || null,
    exampleBad || null,
    severity || 'HIGH'
  );

  recordAuditLog({
    userId: req.user?.id,
    action: 'VOICE_RULE_ADDED',
    metadata: { traitName }
  });

  res.status(201).json({ message: 'Voice rule registered', id });
}

// Add Brand Asset
export function addBrandAsset(req: AuthRequest, res: Response): void {
  const { assetName, assetType, fileUrl, usageGuidelines, restrictions } = req.body;
  const brand = db.prepare(`SELECT id FROM brands LIMIT 1`).get() as any;

  if (!assetName || !assetType || !usageGuidelines) {
    res.status(400).json({ error: 'Asset name, type, and usage guidelines are required' });
    return;
  }

  const id = 'ast_' + uuidv4().slice(0, 16);
  db.prepare(`
    INSERT INTO brand_assets (id, brand_id, asset_name, asset_type, file_url, usage_guidelines, restrictions, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'APPROVED')
  `).run(
    id,
    brand.id,
    assetName,
    assetType,
    fileUrl || null,
    usageGuidelines,
    restrictions || 'Use only as specified'
  );

  res.status(201).json({ message: 'Brand asset registered', id });
}
