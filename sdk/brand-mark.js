/**
 * Default NEUS mark for SDK widgets (hosted on neus.network).
 * Bump NEUS_BRAND_PACK_VERSION when neus/lib/brand/tokens.ts BRAND_PACK_VERSION changes.
 */
export const NEUS_BRAND_PACK_VERSION = '2026-06-03-mark-og-finalize-v1';

const v = encodeURIComponent(NEUS_BRAND_PACK_VERSION);

/** Transparent particle-ring favicon (tabs, badges, VerifyGate). */
export const NEUS_DEFAULT_MARK_URL = `https://neus.network/images/neus-brand-pack/favicon.svg?v=${v}`;
