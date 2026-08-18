/**
 * NEUS mark + OG URLs hosted on neus.network.
 * Stable paths , replace assets in place on neus.network (no query-string versions).
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

/** Canonical explicit-circle particle-ring vector. */
export const NEUS_DEFAULT_MARK_URL = brandPackUrl('neus-mark.svg');

/** Sole art-directed default social and Open Graph card. */
export const NEUS_DEFAULT_OG_IMAGE_URL = brandPackUrl('social-share-card.png');
