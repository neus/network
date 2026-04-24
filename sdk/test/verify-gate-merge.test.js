/**
 * VerifyGate create-mode defaults: omitted proofOptions must resolve to the
 * same private-first contract as raw SDK verification.
 */
import { describe, it, expect } from 'vitest';
import { mergeVerifyGateCreateProofOptions } from '../widgets/verify-gate/mergeCreateProofOptions.js';

describe('mergeVerifyGateCreateProofOptions', () => {
  it('defaults to private with stored content when proofOptions omitted', () => {
    const merged = mergeVerifyGateCreateProofOptions(undefined, undefined);
    expect(merged.privacyLevel).toBe('private');
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
