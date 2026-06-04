import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('widgets/verify-gate/VerifyGate.jsx'), 'utf8');

describe('VerifyGate verifier SSOT contract', () => {
  it('does not rebuild verifier or gate contracts in the widget', () => {
    expect(source).not.toContain('DEFAULT_MAX_AGE_MS_BY_VERIFIER');
    expect(source).not.toContain('CREATABLE_VERIFIERS');
    expect(source).not.toContain('fetchPublicGate');
    expect(source).not.toContain('buildDataForVerifier');
  });
});
