/**
 * Create-mode defaults for VerifyGate match raw SDK verification: private first,
 * with advanced visibility still available via explicit proofOptions overrides.
 * @param {Record<string, unknown>|undefined} proofOptions
 * @param {Record<string, unknown>|undefined} verifierOptions
 * @returns {Record<string, unknown>}
 */
export function mergeVerifyGateCreateProofOptions(proofOptions, verifierOptions) {
  return {
    privacyLevel: 'private',
    publicDisplay: false,
    storeOriginalContent: true,
    ...(proofOptions && typeof proofOptions === 'object' ? proofOptions : {}),
    ...(verifierOptions ? { verifierOptions } : {})
  };
}
