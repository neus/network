/**
 * Create-mode defaults for VerifyGate: unlisted public proofs suitable for gate reuse.
 * Raw NeusClient.verify remains private-by-default; see SDK docs.
 * @param {Record<string, unknown>|undefined} proofOptions
 * @param {Record<string, unknown>|undefined} verifierOptions
 * @returns {Record<string, unknown>}
 */
export function mergeVerifyGateCreateProofOptions(proofOptions, verifierOptions) {
  return {
    privacyLevel: 'public',
    publicDisplay: false,
    storeOriginalContent: true,
    ...(proofOptions && typeof proofOptions === 'object' ? proofOptions : {}),
    ...(verifierOptions ? { verifierOptions } : {})
  };
}
