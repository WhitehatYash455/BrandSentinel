import db from '../db/connection.js';

export interface RetrievedKnowledgeItem {
  id: string;
  sourceId: string;
  sourceType: 'BRAND_GUIDELINE' | 'TERMINOLOGY_RULE' | 'VOICE_TONE' | 'APPROVED_FACT' | 'APPROVED_CLAIM' | 'BRAND_ASSET';
  sourceName: string;
  sourceVersion: string;
  content: string;
  category: string;
  score: number;
}

export interface BrandKnowledgeCorpus {
  guidelines: any[];
  voiceRules: any[];
  terminologyRules: any[];
  approvedFacts: any[];
  approvedClaims: any[];
  brandAssets: any[];
  campaign: any | null;
}

export function loadBrandKnowledge(brandId: string, campaignId?: string | null): BrandKnowledgeCorpus {
  const currentDate = new Date().toISOString().split('T')[0];

  // 1. Approved Guidelines
  const guidelines = db.prepare(`
    SELECT g.id, g.title, g.category, g.current_version, v.content
    FROM brand_guidelines g
    LEFT JOIN guideline_versions v ON g.id = v.guideline_id AND g.current_version = v.version
    WHERE g.brand_id = ? AND g.status = 'APPROVED'
      AND g.effective_date <= ?
      AND (g.expiry_date IS NULL OR g.expiry_date >= ?)
  `).all(brandId, currentDate, currentDate);

  // 2. Voice & Tone Rules
  const voiceRules = db.prepare(`
    SELECT id, trait_name, do_guideline, dont_guideline, example_good, example_bad, severity
    FROM voice_tone_rules
    WHERE brand_id = ? AND status = 'APPROVED'
  `).all(brandId);

  // 3. Terminology Rules (active)
  const terminologyRules = db.prepare(`
    SELECT id, prohibited_term, preferred_term, context_explanation, category, severity
    FROM terminology_rules
    WHERE brand_id = ? AND is_active = 1
  `).all(brandId);

  // 4. Approved Facts
  const approvedFacts = db.prepare(`
    SELECT id, category, claim_text, context_notes, source_name, source_id, source_version
    FROM approved_facts
    WHERE brand_id = ? AND status = 'APPROVED'
      AND effective_date <= ?
      AND (expiry_date IS NULL OR expiry_date >= ?)
  `).all(brandId, currentDate, currentDate);

  // 5. Approved Claims
  const approvedClaims = db.prepare(`
    SELECT id, campaign_id, claim_statement, required_disclaimer, proof_doc_ref
    FROM approved_claims
    WHERE brand_id = ? AND status = 'APPROVED'
      AND (campaign_id IS NULL OR campaign_id = ?)
  `).all(brandId, campaignId || null);

  // 6. Brand Assets
  const brandAssets = db.prepare(`
    SELECT id, asset_name, asset_type, usage_guidelines, restrictions
    FROM brand_assets
    WHERE brand_id = ? AND status = 'APPROVED'
  `).all(brandId);

  // 7. Campaign Details
  let campaign = null;
  if (campaignId) {
    campaign = db.prepare(`SELECT * FROM campaigns WHERE id = ?`).get(campaignId);
  }

  return {
    guidelines,
    voiceRules,
    terminologyRules,
    approvedFacts,
    approvedClaims,
    brandAssets,
    campaign
  };
}

// Compute simple word token overlap score (Jaccard / TF similarity)
function computeSimilarity(textA: string, textB: string): number {
  const tokenize = (str: string) =>
    new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 2)
    );

  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection++;
    }
  }

  return intersection / Math.sqrt(tokensA.size * tokensB.size);
}

export function retrieveRelevantKnowledge(
  query: string,
  corpus: BrandKnowledgeCorpus,
  topK: number = 5
): RetrievedKnowledgeItem[] {
  const items: RetrievedKnowledgeItem[] = [];

  // Evaluate Approved Facts
  for (const fact of corpus.approvedFacts) {
    const score = computeSimilarity(query, `${fact.claim_text} ${fact.context_notes || ''}`);
    if (score > 0.05) {
      items.push({
        id: fact.id,
        sourceId: fact.source_id,
        sourceType: 'APPROVED_FACT',
        sourceName: fact.source_name,
        sourceVersion: fact.source_version || '1.0',
        content: fact.claim_text,
        category: fact.category,
        score
      });
    }
  }

  // Evaluate Voice Rules
  for (const rule of corpus.voiceRules) {
    const score = computeSimilarity(query, `${rule.trait_name} ${rule.do_guideline} ${rule.dont_guideline} ${rule.example_bad || ''}`);
    if (score > 0.05) {
      items.push({
        id: rule.id,
        sourceId: rule.id,
        sourceType: 'VOICE_TONE',
        sourceName: `Voice Rule: ${rule.trait_name}`,
        sourceVersion: '1.0',
        content: `DO: ${rule.do_guideline} | DON'T: ${rule.dont_guideline}`,
        category: 'VOICE_TONE',
        score
      });
    }
  }

  // Evaluate Guidelines
  for (const g of corpus.guidelines) {
    const score = computeSimilarity(query, `${g.title} ${g.content || ''}`);
    if (score > 0.05) {
      items.push({
        id: g.id,
        sourceId: g.id,
        sourceType: 'BRAND_GUIDELINE',
        sourceName: g.title,
        sourceVersion: g.current_version || '1.0',
        content: (g.content || '').substring(0, 300),
        category: g.category,
        score
      });
    }
  }

  // Evaluate Approved Claims
  for (const c of corpus.approvedClaims) {
    const score = computeSimilarity(query, `${c.claim_statement} ${c.required_disclaimer || ''}`);
    if (score > 0.05) {
      items.push({
        id: c.id,
        sourceId: c.proof_doc_ref || c.id,
        sourceType: 'APPROVED_CLAIM',
        sourceName: 'Approved Claim Repository',
        sourceVersion: '1.0',
        content: `${c.claim_statement} (Disclaimer: ${c.required_disclaimer || 'None'})`,
        category: 'LEGAL_COMPLIANCE',
        score
      });
    }
  }

  // Sort descending by relevance score
  items.sort((a, b) => b.score - a.score);
  return items.slice(0, topK);
}
