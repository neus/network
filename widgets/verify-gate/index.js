"use client";

// Prefer built ESM bundles for compatibility; fall back to source in dev
export { VerifyGate } from './dist/VerifyGate.js';
export { ProofBadge, NeusPillLink } from './dist/ProofBadge.js';

// Note: if building locally without dist, run `npm run build` in @neus/widgets
// to generate verify-gate/dist output.