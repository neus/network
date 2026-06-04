/**
 * Canonical NEUS particle-ring mark URLs (hosted on neus.network).
 * Keep NEUS_BRAND_PACK_VERSION aligned with neus/lib/brand/tokens.ts after brand:generate.
 *
 * Policy: default to **transparent** mark assets (vector or alpha PNG).
 * Do NOT use favicon-plate-* or apple-touch-icon for logos — those are opaque PWA / light-tab only.
 */
export const NEUS_BRAND_PACK_VERSION = '2026-06-03-mark-og-finalize-v1';

export const NEUS_MARK_CDN_ORIGIN = 'https://neus.network';

const PACK_BASE = `${NEUS_MARK_CDN_ORIGIN}/images/neus-brand-pack`;

/** Opaque assets — never use for inline logos, docs header, or SDK badges. */
/** @type {{ appleTouch: string; faviconPlate32: string; faviconPlate48: string }} */
export const NEUS_OPAQUE_ICON_PATHS = {
  appleTouch: `${NEUS_MARK_CDN_ORIGIN}/apple-touch-icon.png`,
  faviconPlate32: `${PACK_BASE}/favicon-plate-32.png`,
  faviconPlate48: `${PACK_BASE}/favicon-plate-48.png`,
};

/**
 * @param {string} file e.g. `favicon.svg`
 * @returns {string}
 */
export function withBrandPackVersion(file) {
  const name = file.replace(/^\//, '');
  return `${PACK_BASE}/${name}?v=${encodeURIComponent(NEUS_BRAND_PACK_VERSION)}`;
}

/** Primary default: transparent vector mark (tabs, badges, widgets). */
export const NEUS_DEFAULT_MARK_URL = withBrandPackVersion('favicon.svg');

/** Transparent raster fallback when SVG is unsupported. */
export const NEUS_DEFAULT_MARK_PNG_URL = withBrandPackVersion('neus-mark-64.png');

/** Compact transparent raster (Mintlify / dense UI). */
export const NEUS_MARK_URL_32 = withBrandPackVersion('neus-mark-32.png');
