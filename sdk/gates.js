// SPDX-License-Identifier: Apache-2.0

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 30 * DAY;
export const YEAR = 365 * DAY;

export const GATE_NFT_HOLDER = [{ verifierId: 'nft-ownership' }];

export const GATE_TOKEN_HOLDER = [{ verifierId: 'token-holding' }];

export const GATE_CONTRACT_ADMIN = [{ verifierId: 'contract-ownership', maxAgeMs: HOUR }];

export const GATE_DOMAIN_OWNER = [{ verifierId: 'ownership-dns-txt' }];

export const GATE_LINKED_WALLETS = [{ verifierId: 'wallet-link' }];

export const GATE_AGENT_IDENTITY = [{ verifierId: 'agent-identity' }];

export const GATE_AGENT_DELEGATION = [{ verifierId: 'agent-delegation', maxAgeMs: 7 * DAY }];

export const GATE_CONTENT_MODERATION = [{ verifierId: 'ai-content-moderation' }];

export const GATE_WALLET_RISK = [{ verifierId: 'wallet-risk' }];

export const GATE_PSEUDONYM = [{ verifierId: 'ownership-pseudonym' }];

export function createGate(requirements) {
  return requirements.map((req) => {
    if (typeof req === 'string') {
      return { verifierId: req };
    }
    return req;
  });
}

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
  HOUR,
  DAY,
  WEEK,
  MONTH,
  YEAR,
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
  createGate,
  combineGates
};
