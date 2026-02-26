/**
 * Entity Matcher — Matches extracted document data to registered entities.
 *
 * Used after AI extraction to verify or detect which entity a document belongs to.
 * Returns a confidence score and matching entity, enabling:
 * - Auto-assign when confidence ≥ 90%
 * - Confirmation prompt when confidence 50–89%
 * - Manual selection when confidence < 50%
 */

import { prisma } from '@/lib/db';

export interface EntityMatchCandidate {
  entityId: string;
  entityName: string;
  entityType: string;
  confidence: number;
  matchReasons: string[];
}

export interface EntityMatchResult {
  /** Best matching entity, or null if no match */
  bestMatch: EntityMatchCandidate | null;
  /** All candidates sorted by confidence desc */
  candidates: EntityMatchCandidate[];
  /** Whether the match is confident enough to auto-assign (≥ 0.90) */
  autoAssign: boolean;
  /** Whether the system should ask the user to confirm (0.50–0.89) */
  needsConfirmation: boolean;
  /** Whether entity selection should be fully manual (< 0.50 or no match) */
  needsManualSelection: boolean;
  /** The entityId that was passed in as context (from the UI) */
  contextEntityId: string | null;
  /** Whether the detected entity differs from the context entity */
  mismatch: boolean;
}

interface DocumentSignals {
  /** Company or sender name extracted from the document */
  senderName?: string;
  /** Company number found in the document */
  companyNumber?: string;
  /** VAT number found in the document */
  vatNumber?: string;
  /** Address found in the document */
  address?: string;
  /** Any reference numbers (UTR, PAYE, NI) */
  referenceNumbers?: string[];
  /** Full extracted text or summary for fuzzy matching */
  rawText?: string;
}

/**
 * Match document signals against all entities for a given user.
 *
 * @param userId - The user who owns the entities
 * @param signals - Data extracted from the document by AI
 * @param contextEntityId - The entity currently selected in the UI (optional)
 * @returns EntityMatchResult with best match, candidates, and action flags
 */
export async function matchDocumentToEntity(
  userId: string,
  signals: DocumentSignals,
  contextEntityId: string | null = null
): Promise<EntityMatchResult> {
  // Fetch all entities for this user
  const entities = await prisma.entity.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      tradingName: true,
      type: true,
      companyNumber: true,
      vatNumber: true,
      utr: true,
      payeReference: true,
      niNumber: true,
      registeredAddress: true,
      tradingAddress: true,
      isDefault: true,
    },
  });

  if (entities.length === 0) {
    return {
      bestMatch: null,
      candidates: [],
      autoAssign: false,
      needsConfirmation: false,
      needsManualSelection: true,
      contextEntityId,
      mismatch: false,
    };
  }

  // If only one entity, auto-assign with high confidence
  if (entities.length === 1) {
    const single: EntityMatchCandidate = {
      entityId: entities[0].id,
      entityName: entities[0].name,
      entityType: entities[0].type,
      confidence: 1.0,
      matchReasons: ['Only entity registered'],
    };
    return {
      bestMatch: single,
      candidates: [single],
      autoAssign: true,
      needsConfirmation: false,
      needsManualSelection: false,
      contextEntityId,
      mismatch: contextEntityId ? contextEntityId !== entities[0].id : false,
    };
  }

  // Score each entity against the document signals
  const candidates: EntityMatchCandidate[] = entities.map((entity) => {
    let score = 0;
    const reasons: string[] = [];

    // --- Exact matches (high confidence) ---

    // Company number match
    if (signals.companyNumber && entity.companyNumber) {
      const cleanSignal = signals.companyNumber.replace(/\s/g, '').toUpperCase();
      const cleanEntity = entity.companyNumber.replace(/\s/g, '').toUpperCase();
      if (cleanSignal === cleanEntity) {
        score += 0.45;
        reasons.push(`Company number match: ${cleanEntity}`);
      }
    }

    // VAT number match
    if (signals.vatNumber && entity.vatNumber) {
      const cleanSignal = signals.vatNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      const cleanEntity = entity.vatNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (cleanSignal === cleanEntity) {
        score += 0.40;
        reasons.push(`VAT number match: ${cleanEntity}`);
      }
    }

    // Reference number matches (UTR, PAYE, NI)
    if (signals.referenceNumbers && signals.referenceNumbers.length > 0) {
      const entityRefs = [entity.utr, entity.payeReference, entity.niNumber].filter(Boolean).map(r => r!.replace(/\s/g, '').toUpperCase());
      for (const ref of signals.referenceNumbers) {
        const cleanRef = ref.replace(/\s/g, '').toUpperCase();
        if (entityRefs.includes(cleanRef)) {
          score += 0.35;
          reasons.push(`Reference number match: ${cleanRef}`);
          break;
        }
      }
    }

    // --- Name matching (medium confidence) ---
    if (signals.senderName) {
      const senderLower = signals.senderName.toLowerCase().trim();
      const entityNames = [entity.name, entity.tradingName].filter(Boolean).map(n => n!.toLowerCase().trim());

      for (const eName of entityNames) {
        // Exact name match
        if (senderLower === eName) {
          score += 0.35;
          reasons.push(`Exact name match: "${eName}"`);
          break;
        }
        // Substring containment (e.g., "ABC Ltd" appears in "Invoice from ABC Ltd Trading")
        if (senderLower.includes(eName) || eName.includes(senderLower)) {
          score += 0.25;
          reasons.push(`Name contained: "${eName}"`);
          break;
        }
        // Word overlap
        const senderWords = senderLower.split(/\s+/).filter(w => w.length > 2);
        const entityWords = eName.split(/\s+/).filter(w => w.length > 2);
        const commonWords = senderWords.filter(w => entityWords.includes(w));
        const overlap = commonWords.length / Math.max(senderWords.length, entityWords.length, 1);
        if (overlap >= 0.5) {
          score += 0.20 * overlap;
          reasons.push(`Name word overlap (${(overlap * 100).toFixed(0)}%): "${eName}"`);
          break;
        }
      }
    }

    // --- Address matching (low-medium confidence) ---
    if (signals.address) {
      const addrLower = signals.address.toLowerCase();
      const entityAddresses = [entity.registeredAddress, entity.tradingAddress].filter(Boolean).map(a => a!.toLowerCase());

      for (const eAddr of entityAddresses) {
        // Postcode extraction and matching
        const signalPostcodes = addrLower.match(/[a-z]{1,2}\d{1,2}\s?\d[a-z]{2}/gi) || [];
        const entityPostcodes = eAddr.match(/[a-z]{1,2}\d{1,2}\s?\d[a-z]{2}/gi) || [];
        
        if (signalPostcodes.length > 0 && entityPostcodes.length > 0) {
          const normalizedSignal = signalPostcodes.map(p => p.replace(/\s/g, '').toLowerCase());
          const normalizedEntity = entityPostcodes.map(p => p.replace(/\s/g, '').toLowerCase());
          if (normalizedSignal.some(p => normalizedEntity.includes(p))) {
            score += 0.15;
            reasons.push('Postcode match in address');
          }
        }
      }
    }

    // --- Raw text scanning for identifiers ---
    if (signals.rawText) {
      const textLower = signals.rawText.toLowerCase();
      
      // Check if entity name appears in the full document text
      const entityNames = [entity.name, entity.tradingName].filter(Boolean).map(n => n!.toLowerCase());
      for (const eName of entityNames) {
        if (textLower.includes(eName) && !reasons.some(r => r.includes('name'))) {
          score += 0.10;
          reasons.push(`Entity name found in document text: "${eName}"`);
          break;
        }
      }

      // Check for company number in text
      if (entity.companyNumber && !reasons.some(r => r.includes('Company number'))) {
        const cleanNum = entity.companyNumber.replace(/\s/g, '');
        if (textLower.includes(cleanNum.toLowerCase())) {
          score += 0.20;
          reasons.push(`Company number found in text: ${cleanNum}`);
        }
      }
    }

    // Context bonus — small boost if this entity is the one selected in the UI
    if (contextEntityId && entity.id === contextEntityId) {
      score += 0.05;
      reasons.push('Currently selected entity');
    }

    // Default entity small bonus
    if (entity.isDefault && reasons.length === 0) {
      score += 0.02;
      reasons.push('Default entity');
    }

    return {
      entityId: entity.id,
      entityName: entity.name,
      entityType: entity.type,
      confidence: Math.min(1.0, score),
      matchReasons: reasons,
    };
  });

  // Sort by confidence desc
  candidates.sort((a, b) => b.confidence - a.confidence);

  const bestMatch = candidates[0] && candidates[0].confidence > 0 ? candidates[0] : null;
  const autoAssign = bestMatch !== null && bestMatch.confidence >= 0.90;
  const needsConfirmation = bestMatch !== null && bestMatch.confidence >= 0.50 && bestMatch.confidence < 0.90;
  const needsManualSelection = bestMatch === null || bestMatch.confidence < 0.50;

  // Check if detected entity differs from context
  const mismatch = contextEntityId !== null && bestMatch !== null && bestMatch.entityId !== contextEntityId && bestMatch.confidence >= 0.50;

  return {
    bestMatch,
    candidates,
    autoAssign,
    needsConfirmation,
    needsManualSelection,
    contextEntityId,
    mismatch,
  };
}

/**
 * Extract entity-matching signals from AI-extracted document data.
 * Works with the extractedData JSON from any scan API.
 */
export function extractSignalsFromData(extractedData: Record<string, any>): DocumentSignals {
  const signals: DocumentSignals = {};

  // Sender/provider name
  signals.senderName = extractedData.senderName
    || extractedData.providerName
    || extractedData.companyName
    || extractedData.from
    || extractedData.issuer
    || undefined;

  // Company number
  signals.companyNumber = extractedData.companyNumber
    || extractedData.company_number
    || extractedData.companiesHouseNumber
    || undefined;

  // VAT number
  signals.vatNumber = extractedData.vatNumber
    || extractedData.vat_number
    || extractedData.vatRegistration
    || undefined;

  // Address
  signals.address = extractedData.address
    || extractedData.senderAddress
    || extractedData.registeredAddress
    || undefined;

  // Reference numbers
  const refs: string[] = [];
  if (extractedData.utr) refs.push(extractedData.utr);
  if (extractedData.payeReference) refs.push(extractedData.payeReference);
  if (extractedData.niNumber) refs.push(extractedData.niNumber);
  if (extractedData.taxReference) refs.push(extractedData.taxReference);
  if (refs.length > 0) signals.referenceNumbers = refs;

  // Raw text / summary
  signals.rawText = extractedData.summary
    || extractedData.rawText
    || extractedData.fullText
    || undefined;

  return signals;
}
