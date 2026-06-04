/**
 * Canonical NEUS mark + OG URLs (hosted on neus.network).
 * Keep NEUS_BRAND_PACK_VERSION aligned with neus/lib/brand/tokens.ts BRAND_PACK_VERSION.
 */
export const NEUS_BRAND_PACK_VERSION = '2026-06-03-mark-og-finalize-v1';

export const NEUS_MARK_CDN_ORIGIN = 'https://neus.network';

const PACK_BASE = `${NEUS_MARK_CDN_ORIGIN}/images/neus-brand-pack`;
const v = encodeURIComponent(NEUS_BRAND_PACK_VERSION);

/**
 * @param {string} file e.g. `favicon.svg`
 */
export function withBrandPackVersion(file) {
  const name = file.replace(/^\//, '');
  return `${PACK_BASE}/${name}?v=${v}`;
}

/** Transparent particle-ring favicon (tabs, badges, VerifyGate). */
export const NEUS_DEFAULT_MARK_URL = withBrandPackVersion('favicon.svg');

/** Default 1200×630 Open Graph card (product SSOT filename). */
export const NEUS_DEFAULT_OG_IMAGE_URL = withBrandPackVersion('og-default-1200x630-neus.png');
