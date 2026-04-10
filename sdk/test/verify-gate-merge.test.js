/**
 * VerifyGate create-mode defaults: omitted proofOptions must resolve to unlisted public * (privacyLevel public, publicDisplay false) for gate-friendly reuse.
 */
import { describe, it, expect } from 'vitest';
import { mergeVerifyGateCreateProofOptions } from '../widgets/verify-gate/mergeCreateProofOptions.js';

describe('mergeVerifyGateCreateProofOptions', () => {
  it('defaults to unlisted public with stored content when proofOptions omitted', () => {
    const merged = mergeVerifyGateCreateProofOptions(undefined, undefined);
    expect(merged.privacyLevel).toBe('public');
    expect(merged.publicDisplay).toBe(false);
    expect(merged.storeOriginalContent).toBe(true);
    expect(merged.verifierOptions).toBeUndefined();
  });

  it('allows explicit private override', () => {
    const merged = mergeVerifyGateCreateProofOptions(
      { privacyLevel: 'private', publicDisplay: false },
      undefined
    );
    expect(merged.privacyLevel).toBe('private');
    expect(merged.publicDisplay).toBe(false);
  });

  it('nests verifierOptions when provided', () => {
    const merged = mergeVerifyGateCreateProofOptions(undefined, { foo: 1 });
    expect(merged.verifierOptions).toEqual({ foo: 1 });
  });
});
