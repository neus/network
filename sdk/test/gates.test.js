import { describe, it, expect } from 'vitest';
import {
  HOUR,
  DAY,
  WEEK,
  createGate,
  combineGates,
  GATE_NFT_HOLDER,
  GATE_TOKEN_HOLDER,
  GATE_CONTRACT_ADMIN,
  GATE_WALLET_RISK
} from '../gates.js';

describe('gates', () => {
  it('exports time constants in ms', () => {
    expect(DAY).toBe(24 * HOUR);
    expect(WEEK).toBe(7 * DAY);
  });

  it('recipe gates name expected verifierId values', () => {
    expect(GATE_NFT_HOLDER).toEqual([{ verifierId: 'nft-ownership' }]);
    expect(GATE_TOKEN_HOLDER).toEqual([{ verifierId: 'token-holding' }]);
    expect(GATE_CONTRACT_ADMIN[0]).toMatchObject({
      verifierId: 'contract-ownership',
      maxAgeMs: HOUR
    });
    expect(GATE_WALLET_RISK).toEqual([{ verifierId: 'wallet-risk' }]);
  });

  it('createGate stringifies simple ids', () => {
    expect(createGate(['a', 'b'])).toEqual([{ verifierId: 'a' }, { verifierId: 'b' }]);
  });

  it('createGate preserves objects', () => {
    const g = createGate([{ verifierId: 'nft-ownership', maxAgeMs: 1000, match: { x: 1 } }]);
    expect(g[0].maxAgeMs).toBe(1000);
    expect(g[0].match).toEqual({ x: 1 });
  });

  it('combineGates deduplicates by verifierId + match', () => {
    const a = createGate([{ verifierId: 'x', match: { k: 1 } }]);
    const b = createGate([{ verifierId: 'x', match: { k: 1 } }, { verifierId: 'y' }]);
    const c = combineGates(a, b);
    expect(c).toHaveLength(2);
  });
});
