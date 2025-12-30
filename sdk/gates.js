/**
 * NEUS SDK Gate Recipes
 * 
 * These are EXAMPLES, not defaults.
 * Pick or copy-paste what fits your use case.
 * 
 * @license Apache-2.0
 */

// Time constants (milliseconds)
export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 30 * DAY;
export const YEAR = 365 * DAY;

// ============================================================================
// RECIPE GATES - Use case specific examples
// ============================================================================

/**
 * NFT holder gate
 * Integrator should add match: { contractAddress: '0x...' } when using
 */
export const GATE_NFT_HOLDER = [
  { verifierId: 'nft-ownership' },
];

/**
 * Token holder gate
 * Integrator should add match: { contractAddress: '0x...', minBalance: '...' }
 */
export const GATE_TOKEN_HOLDER = [
  { verifierId: 'token-holding' },
];

/**
 * Contract admin gate: requires recent contract ownership verification
 * Short TTL (1h) because ownership can transfer (point-in-time proof)
 */
export const GATE_CONTRACT_ADMIN = [
  { verifierId: 'contract-ownership', maxAgeMs: HOUR },
];

/**
 * Domain owner gate: requires DNS TXT verification
 * For verified organization badges, creator platforms
 */
export const GATE_DOMAIN_OWNER = [
  { verifierId: 'ownership-dns-txt' },
];

/**
 * Linked wallets gate: requires wallet linking
 * For multi-wallet identity features
 */
export const GATE_LINKED_WALLETS = [
  { verifierId: 'wallet-link' },
];

/**
 * Agent identity gate: requires verified agent identity
 * For agent/bot verification features
 */
export const GATE_AGENT_IDENTITY = [
  { verifierId: 'agent-identity' },
];

/**
 * Agent delegation gate: requires delegation proof
 * With recommended 7-day TTL for security
 */
export const GATE_AGENT_DELEGATION = [
  { verifierId: 'agent-delegation', maxAgeMs: 7 * DAY },
];

/**
 * Content moderation gate: requires a moderation proof for the exact contentHash.
 * Proof is permanent (policy snapshot); re-run only if your policy/provider requirements change.
 */
export const GATE_CONTENT_MODERATION = [
  { verifierId: 'ai-content-moderation' },
];

/**
 * Wallet risk gate: requires wallet risk assessment
 * Provider-backed risk signal
 */
export const GATE_WALLET_RISK = [
  { verifierId: 'wallet-risk' },
];

/**
 * Pseudonym gate: requires pseudonymous identity proof
 * For anonymous reputation systems
 */
export const GATE_PSEUDONYM = [
  { verifierId: 'ownership-pseudonym' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a custom gate from verifier IDs
 * @param {Array<string|Object>} requirements - Array of verifier IDs or requirement objects
 * @returns {Array} Gate requirements array
 * 
 * @example
 * // Simple: just verifier IDs
 * const gate = createGate(['nft-ownership', 'token-holding']);
 * 
 * // With options
 * const gate = createGate([
 *   { verifierId: 'nft-ownership', match: { contractAddress: '0x...' } },
 *   { verifierId: 'token-holding', maxAgeMs: 7 * DAY },
 * ]);
 */
export function createGate(requirements) {
  return requirements.map(req => {
    if (typeof req === 'string') {
      return { verifierId: req };
    }
    return req;
  });
}

/**
 * Combine multiple gates (union of requirements)
 * @param  {...Array} gates - Gate arrays to combine
 * @returns {Array} Combined gate requirements
 * 
 * @example
 * const strictGate = combineGates(GATE_NFT_HOLDER, GATE_TOKEN_HOLDER);
 */
export function combineGates(...gates) {
  const combined = [];
  const seen = new Set();
  
  for (const gate of gates) {
    for (const req of gate) {
      const key = req.verifierId + JSON.stringify(req.match || {});
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(req);
      }
    }
  }
  
  return combined;
}

export default {
  // Time constants
  HOUR,
  DAY,
  WEEK,
  MONTH,
  YEAR,
  // Recipe gates
  GATE_NFT_HOLDER,
  GATE_TOKEN_HOLDER,
  GATE_CONTRACT_ADMIN,
  GATE_DOMAIN_OWNER,
  GATE_LINKED_WALLETS,
  GATE_AGENT_IDENTITY,
  GATE_AGENT_DELEGATION,
  GATE_CONTENT_MODERATION,
  GATE_WALLET_RISK,
  GATE_PSEUDONYM,
  // Helpers
  createGate,
  combineGates,
};
