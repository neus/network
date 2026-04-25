export function mergeVerifyGateCreateProofOptions(proofOptions, verifierOptions) {
  return {
    privacyLevel: 'private',
    publicDisplay: false,
    storeOriginalContent: true,
    ...(proofOptions && typeof proofOptions === 'object' ? proofOptions : {}),
    ...(verifierOptions ? { verifierOptions } : {})
  };
}
