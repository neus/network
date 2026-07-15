/**
 * NEUS mark + OG URLs hosted on neus.network.
 * Stable paths — replace assets in place on neus.network (no query-string versions).
 */
export const NEUS_MARK_CDN_ORIGIN = 'https://neus.network';

const PACK_BASE = `${NEUS_MARK_CDN_ORIGIN}/images/neus-brand-pack`;

/**
 * @param {string} file e.g. `favicon.svg`
 */
export function brandPackUrl(file) {
  const name = file.replace(/^\//, '');
  return `${PACK_BASE}/${name}`;
}

/** Transparent particle-ring favicon (tabs, badges, VerifyGate). */
export const NEUS_DEFAULT_MARK_URL = brandPackUrl('favicon.svg');

/** Default 1200x630 Open Graph card. */
export const NEUS_DEFAULT_OG_IMAGE_URL = brandPackUrl('og-default-1200x630-neus.png');
