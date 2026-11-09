import { PreprocessedContent } from './preprocessor.js';
import { BrandKnowledgeCorpus } from './retrieval.js';

export interface RuleFinding {
  category: 'BRAND_VOICE' | 'TERMINOLOGY' | 'UNSUPPORTED_CLAIM' | 'OUTDATED_CLAIM' | 'ASSET_USAGE' | 'CAMPAIGN_INCONSISTENCY' | 'ACCESSIBILITY';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  problematicText: string;
  startIndex: number;
  endIndex: number;
  explanation: string;
  sourceId: string;
  sourceType: 'BRAND_GUIDELINE' | 'TERMINOLOGY_RULE' | 'VOICE_TONE' | 'APPROVED_FACT' | 'APPROVED_CLAIM' | 'BRAND_ASSET' | 'UNVERIFIED';
  sourceVersion: string;
  sourceExcerpt: string;
  suggestedCorrection: string;
  reason: string;
}

export function runDeterministicChecks(
  content: PreprocessedContent,
  corpus: BrandKnowledgeCorpus,
  channel: string
): RuleFinding[] {
  const findings: RuleFinding[] = [];
  const text = content.normalizedText;

  // 1. Prohibited & Preferred Terminology Checks
  for (const rule of corpus.terminologyRules) {
    const term = rule.prohibited_term;
    // Word boundary regex
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      findings.push({
        category: 'TERMINOLOGY',
        severity: rule.severity,
        problematicText: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        explanation: `Prohibited term detected: ${rule.context_explanation}`,
        sourceId: rule.id,
        sourceType: 'TERMINOLOGY_RULE',
        sourceVersion: '1.0',
        sourceExcerpt: `Rule: Prohibit "${rule.prohibited_term}". Preferred alternative: "${rule.preferred_term || 'rephrase'}". Category: ${rule.category}`,
        suggestedCorrection: rule.preferred_term || '',
        reason: `Replaces prohibited term with approved enterprise terminology.`
      });
    }
  }

  // 2. Unsubstantiated Absolute Guarantees (Legal / Policy Check)
  const absoluteGuaranteeRegex = /\b(100%\s*(?:safe|secure|guaranteed|uptime|compliant|compliance|risk-free|immune))\b/gi;
  let absMatch: RegExpExecArray | null;
  while ((absMatch = absoluteGuaranteeRegex.exec(text)) !== null) {
    // Avoid duplicate if already caught by a specific term rule
    const exists = findings.some(f => Math.abs(f.startIndex - absMatch!.index) < 5);
    if (!exists) {
      findings.push({
        category: 'UNSUPPORTED_CLAIM',
        severity: 'CRITICAL',
        problematicText: absMatch[0],
        startIndex: absMatch.index,
        endIndex: absMatch.index + absMatch[0].length,
        explanation: 'Absolute guarantee detected. Enterprise compliance policy prohibits warranties of absolute immunity or 100% compliance without SLA exclusions.',
        sourceId: 'gd_claims_002',
        sourceType: 'BRAND_GUIDELINE',
        sourceVersion: '1.4',
        sourceExcerpt: 'Factual Claims Mandate: No 100% security or legal immunity claims permitted in external publications.',
        suggestedCorrection: absMatch[0].toLowerCase().includes('uptime') ? '99.99% high-availability SLA' : 'enterprise-grade resilient governance',
        reason: 'Restricts unqualified legal liability and aligns with standard service terms.'
      });
    }
  }

  // 3. Channel Constraint Validation
  if (channel === 'TWITTER' && text.length > 280) {
    findings.push({
      category: 'CAMPAIGN_INCONSISTENCY',
      severity: 'HIGH',
      problematicText: text.substring(280, Math.min(text.length, 310)),
      startIndex: 280,
      endIndex: text.length,
      explanation: `Content length (${text.length} characters) exceeds Twitter limit of 280 characters by ${text.length - 280} characters.`,
      sourceId: 'gd_editorial_003',
      sourceType: 'BRAND_GUIDELINE',
      sourceVersion: '3.0',
      sourceExcerpt: 'Channel Constraints: Twitter/X posts must strictly stay within 280 characters.',
      suggestedCorrection: text.substring(0, 275) + '...',
      reason: 'Trims copy to meet platform distribution constraints.'
    });
  }

  // 4. Missing Required Claim Disclaimers
  for (const claim of corpus.approvedClaims) {
    if (claim.required_disclaimer) {
      // Check if claim statement keyword is mentioned in text
      const claimKeywords = claim.claim_statement.match(/\b\d+%\b/g);
      if (claimKeywords) {
        for (const kw of claimKeywords) {
          if (text.includes(kw) && !text.includes(claim.required_disclaimer.slice(0, 25))) {
            const idx = text.indexOf(kw);
            findings.push({
              category: 'UNSUPPORTED_CLAIM',
              severity: 'HIGH',
              problematicText: kw,
              startIndex: idx,
              endIndex: idx + kw.length,
              explanation: `Benchmark statistic "${kw}" is cited without the mandatory legal disclaimer.`,
              sourceId: claim.proof_doc_ref || claim.id,
              sourceType: 'APPROVED_CLAIM',
              sourceVersion: '1.0',
              sourceExcerpt: `Approved Claim: "${claim.claim_statement}". Required Disclaimer: "${claim.required_disclaimer}"`,
              suggestedCorrection: `${kw} (Note: ${claim.required_disclaimer})`,
              reason: 'Attaches mandatory audited benchmark methodology note.'
            });
          }
        }
      }
    }
  }

  // 5. Readability & Accessibility Checks
  for (const sentence of content.sentences) {
    const wordCount = sentence.text.split(/\s+/).length;
    if (wordCount > 45) {
      findings.push({
        category: 'ACCESSIBILITY',
        severity: 'LOW',
        problematicText: sentence.text.substring(0, 60) + '...',
        startIndex: sentence.startIndex,
        endIndex: sentence.endIndex,
        explanation: `Cognitive readability issue: Sentence is ${wordCount} words long. Enterprise editorial guidelines recommend sentences under 30 words for clear comprehension.`,
        sourceId: 'gd_editorial_003',
        sourceType: 'BRAND_GUIDELINE',
        sourceVersion: '3.0',
        sourceExcerpt: 'Editorial Readability: Keep sentences concise and clear (target < 30 words per sentence).',
        suggestedCorrection: sentence.text.split(/,\s+/).join('.\nFurthermore, '),
        reason: 'Splits run-on compound thoughts into digestible sentences.'
      });
    }

    // Excessive shouting caps
    const words = sentence.text.split(/\s+/);
    const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase() && /^[A-Z]+$/.test(w));
    if (capsWords.length >= 3) {
      findings.push({
        category: 'BRAND_VOICE',
        severity: 'MEDIUM',
        problematicText: capsWords.join(' '),
        startIndex: sentence.startIndex,
        endIndex: sentence.startIndex + 40,
        explanation: 'Avoid excessive capitalisation. All-caps text degrades professional brand perception and triggers spam filters.',
        sourceId: 'gd_voice_001',
        sourceType: 'VOICE_TONE',
        sourceVersion: '2.1',
        sourceExcerpt: 'Voice Guidelines: Do not shout in capital letters. Use calm, empirical sentence casing.',
        suggestedCorrection: sentence.text.toLowerCase().replace(/(^\w|\.\s*\w)/g, c => c.toUpperCase()),
        reason: 'Restores respectful, executive-grade sentence casing.'
      });
    }
  }

  return findings;
}

