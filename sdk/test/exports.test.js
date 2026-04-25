import { describe, it, expect } from 'vitest';
import * as Index from '../index.js';

describe('package exports', () => {
  it('re-exports client, errors, gate helpers, and utils', () => {
    expect(Index.NeusClient).toBeTypeOf('function');
    expect(Index.ValidationError).toBeTypeOf('function');
    expect(Index.createGate).toBeTypeOf('function');
    expect(Index.getHostedCheckoutUrl).toBeTypeOf('function');
  });
});
