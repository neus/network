/**
 * Mintlify docs OG cards — **network repo only**.
 *
 * Procedural particle-ring + Michroma lockup (1200×630). Product brand pack stays in `neus`.
 *
 *   npm run generate:docs-og
 *
 * Requires sibling `neus/node_modules` (sharp, opentype.js) — run `npm install` in `neus` once.
 * Favicon copied read-only from `neus/public/images/neus-brand-pack/favicon.svg`.
 */

import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const DOCS_IMAGES = path.join(REPO, 'docs', 'images');
const NEUS_ROOT = path.resolve(REPO, '..', 'neus');
const NEUS_BRAND_PACK = path.join(NEUS_ROOT, 'public', 'images', 'neus-brand-pack');
const sharp = require(path.join(NEUS_ROOT, 'node_modules', 'sharp'));
const opentype = require(path.join(NEUS_ROOT, 'node_modules', 'opentype.js'));

// ----------------------------------------------------------------------------
// Brand constants (aligned with lib/brand/tokens.ts + DESIGN.md)
// ----------------------------------------------------------------------------
const COLOR = {
  accent: '#98C0EF', // primary mark (light cloud blue, on-system accent)
  white: '#FFFFFF', // mono / white-safe variant
  ink: '#101113', // mark on light backgrounds (canvas tone)
  canvas: '#101113', // app canvas
  black: '#0A0A0A', // manifest theme_color / tile
  rail: '#141619',
  panel: '#1B1D21',
  textPrimary: '#EEF3F8',
  textSecondary: '#B8C3D1',
  textMuted: '#687483', // OG URL / metadata (muted steel)
};

/** Opaque plate for apple-touch and light-tab favicon plates (#0A0A0D). */
const DARK = { r: 10, g: 11, b: 13, alpha: 1 };

// Google Fonts (old-UA CSS resolves .ttf, which opentype.js can parse).
const FONT_CSS = {
  michroma: 'https://fonts.googleapis.com/css2?family=Michroma&display=swap',
  monaSans: 'https://fonts.googleapis.com/css2?family=Mona+Sans:wght@400;500;600&display=swap',
};

// ----------------------------------------------------------------------------
// Particle-ring geometry (authored in a 1024 space, center 512,512).
// Derived from analysis of the finalized ring reference.
// ----------------------------------------------------------------------------
const RING = {
  size: 1024,
  cx: 512,
  cy: 512,
  solidRingRadius: 254,
  solidRingStroke: 14,
  spokes: 84,
  ringCount: 14,
  innerDotRadius: 278,
  ringSpacing: 14.6,
  dotMax: 13.5,
  dotMin: 2.0,
  dotFalloff: 1.26,
  opaqueRings: 0.5,
  opacityFloor: 0.42,
  offsetAlternate: true,
};

/**
 * Uniform inset on tab/PWA rasters only ΓÇö same mark geometry, scaled to fit safe area
 * (Apple / Google recommend ~8ΓÇô12% margin; no alternate micro-mark or ring variants).
 */
const TAB_ICON_SAFE_PAD = 12;

/** Supersample factor for small rasters: render high, Lanczos downscale (crisp tabs). */
function supersamplePx(outputPx) {
  return Math.min(4096, Math.max(2048, outputPx * 128));
}

const f = (n) => Number(n.toFixed(3)).toString();
const escapeSvgText = (s) =>
  String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Retry transient Windows write locks (dev-server file watcher / AV / indexer). */
async function withRetry(fn, label, attempts = 6) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      await sleep(150 + i * 150);
    }
  }
  throw new Error(`write failed after ${attempts} attempts (${label}): ${lastErr?.message}`);
}

// ----------------------------------------------------------------------------
// Mark geometry
// ----------------------------------------------------------------------------
function buildMarkInner(
  color,
  {
    solidRingStroke = RING.solidRingStroke,
    skipInnerRings = 0,
    maskPortalCenter = false,
    includeMaskDef = true,
    spokes = RING.spokes,
    minDotRadius = 0,
    dotRadiusScale = 1,
    particleOpacityFloor = RING.opacityFloor,
  } = {},
) {
  const { cx, cy } = RING;
  const portalInnerR = RING.solidRingRadius - solidRingStroke / 2;
  const maskDef =
    maskPortalCenter && includeMaskDef
      ? `<defs><mask id="mark-outside-portal"><rect width="${RING.size}" height="${RING.size}" fill="white"/><circle cx="${cx}" cy="${cy}" r="${f(portalInnerR)}" fill="black"/></mask></defs>`
      : '';
  const out = [
    maskDef,
    `<circle cx="${cx}" cy="${cy}" r="${RING.solidRingRadius}" stroke="${color}" stroke-width="${solidRingStroke}" fill="none"/>`,
  ];
  const dots = [];
  for (let k = skipInnerRings; k < RING.ringCount; k++) {
    const t = RING.ringCount === 1 ? 0 : k / (RING.ringCount - 1);
    const r = RING.innerDotRadius + k * RING.ringSpacing;
    const diam = (RING.dotMax - RING.dotMin) * Math.pow(1 - t, RING.dotFalloff) + RING.dotMin;
    let dotR = (diam / 2) * dotRadiusScale;
    if (minDotRadius > 0) {
      const span = Math.max(1, RING.ringCount - 1 - skipInnerRings);
      const localT = (k - skipInnerRings) / span;
      // Boost outer halo dots only ΓÇö keeps the portal ring crisp with particles outside it.
      const boostedMin = minDotRadius * (0.25 + 0.75 * localT);
      dotR = Math.max(dotR, boostedMin);
    }
    let opacity = 1;
    if (t > RING.opaqueRings) {
      const ft = (t - RING.opaqueRings) / (1 - RING.opaqueRings);
      opacity = 1 - ft * (1 - particleOpacityFloor);
    }
    const phase = RING.offsetAlternate && k % 2 === 1 ? Math.PI / spokes : 0;
    for (let j = 0; j < spokes; j++) {
      const a = (j / spokes) * Math.PI * 2 - Math.PI / 2 + phase;
      dots.push(
        `<circle cx="${f(cx + r * Math.cos(a))}" cy="${f(cy + r * Math.sin(a))}" r="${f(dotR)}"${opacity < 1 ? ` opacity="${f(opacity)}"` : ''}/>`,
      );
    }
  }
  const dotMask = maskPortalCenter ? ' mask="url(#mark-outside-portal)"' : '';
  out.push(`<g fill="${color}"${dotMask}>${dots.join('')}</g>`);
  return out.join('');
}

function buildMarkSvg({
  color = COLOR.accent,
  bg = null,
  round = false,
  pad = 0,
  solidRingStroke = RING.solidRingStroke,
  skipInnerRings = 0,
  maskPortalCenter = false,
  spokes = RING.spokes,
  minDotRadius = 0,
  dotRadiusScale = 1,
  particleOpacityFloor = RING.opacityFloor,
} = {}) {
  const S = RING.size;
  const scale = (S - 2 * pad) / S;
  const bgEl = bg
    ? round
      ? `<rect width="${S}" height="${S}" rx="${f(S * 0.22)}" fill="${bg}"/>`
      : `<rect width="${S}" height="${S}" fill="${bg}"/>`
    : '';
  const rootMaskDef = maskPortalCenter
    ? `<defs><mask id="mark-outside-portal"><rect width="${S}" height="${S}" fill="white"/><circle cx="${RING.cx}" cy="${RING.cy}" r="${f(RING.solidRingRadius - solidRingStroke / 2)}" fill="black"/></mask></defs>`
    : '';
  const markBody = buildMarkInner(color, {
    solidRingStroke,
    skipInnerRings,
    maskPortalCenter,
    includeMaskDef: false,
    spokes,
    minDotRadius,
    dotRadiusScale,
    particleOpacityFloor,
  });
  const wrap =
    pad > 0
      ? `<g transform="translate(${RING.cx} ${RING.cy}) scale(${f(scale)}) translate(${-RING.cx} ${-RING.cy})">${markBody}</g>`
      : markBody;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" fill="none" role="img" aria-label="NEUS">${rootMaskDef}${bgEl}${wrap}</svg>`;
}

/** Tab/PWA raster variant ΓÇö primary mark with optional safe-area pad or dark plate. */
function buildTabMarkSvg(options = {}) {
  return buildMarkSvg({
    color: COLOR.accent,
    ...options,
    pad: options.pad ?? TAB_ICON_SAFE_PAD,
  });
}

// ----------------------------------------------------------------------------
// Fonts -> outlined vector paths (no runtime font dependency)
// ----------------------------------------------------------------------------
async function loadFont(cssUrl, weight) {
  const css = await fetch(cssUrl, {
    headers: { 'User-Agent': 'Mozilla/4.0' }, // force legacy .ttf payloads
  }).then((r) => r.text());
  // pick the url within the matching weight block (or first if single weight)
  let url = null;
  if (weight) {
    const block = css.match(
      new RegExp(`font-weight:\\s*${weight};[\\s\\S]*?url\\((https:[^)]+\\.ttf)\\)`),
    );
    url = block?.[1] ?? null;
  }
  if (!url) url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1] ?? null;
  if (!url) throw new Error(`No TTF url in CSS for ${cssUrl} (weight ${weight})`);
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

/** Outline a string into a single path (bypasses GSUB via charToGlyph). */
function textToPath(font, text, fontSize, letterSpacing = 0) {
  const scale = fontSize / font.unitsPerEm;
  let x = 0;
  const full = new opentype.Path();
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    full.extend(g.getPath(x, 0, fontSize));
    x += g.advanceWidth * scale + letterSpacing;
  }
  const width = x - (text.length ? letterSpacing : 0);
  const bb = full.getBoundingBox();
  return { d: full.toPathData(3), width, bbox: bb };
}

// ----------------------------------------------------------------------------
// Lockups (mark + Michroma "NEUS")
// ----------------------------------------------------------------------------
function buildHorizontalLockup({ michroma, markColor, wordColor }) {
  const markH = 240;
  const gap = 56;
  // Michroma cap height Γëê 0.765 em; scale so cap Γëê 0.46 * markH
  const capRatio = 0.765;
  const fontSize = (0.46 * markH) / capRatio;
  const ls = fontSize * 0.04;
  const { d, width, bbox } = textToPath(michroma, 'NEUS', fontSize, ls);
  const capH = -bbox.y1; // baseline at 0, glyphs go negative
  const totalW = markH + gap + width;
  const cy = markH / 2;
  // mark group scaled to markH from 1024 space
  const ms = markH / 1024;
  const markG = `<g transform="scale(${f(ms)})">${buildMarkInner(markColor)}</g>`;
  // wordmark baseline so cap-height block is vertically centered on cy
  const baseline = cy + capH / 2;
  const wordG = `<g transform="translate(${f(markH + gap)} ${f(baseline)})"><path d="${d}" fill="${wordColor}"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f(totalW)}" height="${markH}" viewBox="0 0 ${f(totalW)} ${markH}" fill="none" role="img" aria-label="NEUS">${markG}${wordG}</svg>`;
}

function buildStackedLockup({ michroma, markColor, wordColor }) {
  const markH = 360;
  const gap = 48;
  const capRatio = 0.765;
  const fontSize = (0.3 * markH) / capRatio;
  const ls = fontSize * 0.06;
  const { d, width, bbox } = textToPath(michroma, 'NEUS', fontSize, ls);
  const capH = -bbox.y1;
  const totalW = Math.max(markH, width);
  const totalH = markH + gap + capH;
  const ms = markH / 1024;
  const markX = (totalW - markH) / 2;
  const markG = `<g transform="translate(${f(markX)} 0) scale(${f(ms)})">${buildMarkInner(markColor)}</g>`;
  const wordX = (totalW - width) / 2;
  const baseline = markH + gap + capH;
  const wordG = `<g transform="translate(${f(wordX)} ${f(baseline)})"><path d="${d}" fill="${wordColor}"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f(totalW)}" height="${f(totalH)}" viewBox="0 0 ${f(totalW)} ${f(totalH)}" fill="none" role="img" aria-label="NEUS">${markG}${wordG}</svg>`;
}

// ----------------------------------------------------------------------------
// OG / social / collateral cards
// ----------------------------------------------------------------------------
const OG_COPY = {
  infra: 'Portable Trust Infrastructure',
  travels: 'Trust that travels.',
};

/** Mintlify docs social cards (1200├ù630). Output via `--docs` ΓåÆ sibling network/docs/images. */
const DOCS_OG_SPECS = [
  { file: 'og-default.png', eyebrow: 'Documentation', tagline: OG_COPY.travels },
  { file: 'og-quickstart.png', eyebrow: 'Quickstart', tagline: 'Ship your first proof-backed check.' },
  { file: 'og-api.png', eyebrow: 'API', tagline: 'HTTP reference for verifiers and receipts.' },
  { file: 'og-sdk.png', eyebrow: 'SDK', tagline: 'JavaScript SDK, CLI, and widgets.' },
  { file: 'og-mcp.png', eyebrow: 'MCP', tagline: 'Trust context inside your IDE.' },
  { file: 'og-agents.png', eyebrow: 'Agents', tagline: 'Identity, delegation, and runtime trust.' },
  { file: 'og-verification.png', eyebrow: 'Verification', tagline: 'Checks that become reusable receipts.' },
  { file: 'og-widgets.png', eyebrow: 'Widgets', tagline: 'VerifyGate for hosted checkout flows.' },
];

const DOCS_OG_CARD = {
  W: 1200,
  H: 630,
  markH: 188,
  wordFont: 84,
  tagFont: 26,
  urlLabel: 'docs.neus.network',
};

function buildPortalAtmosphere({ W, H, portalCx, portalCy, reach = 1 }) {
  const coreR = Math.round(Math.min(W, H) * 0.18 * reach);
  const fieldR = Math.round(Math.max(W, H) * 0.72 * reach);
  const meshR1 = Math.round(Math.max(W, H) * 0.55 * reach);
  const meshR2 = Math.round(Math.max(W, H) * 0.48 * reach);
  const meshCx1 = W * 0.12;
  const meshCy1 = H * 0.06;
  const meshCx2 = W * 0.92;
  const meshCy2 = H * 0.94;
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#11151B"/>
      <stop offset="56%" stop-color="#101113"/>
      <stop offset="100%" stop-color="#090A0C"/>
    </linearGradient>
    <radialGradient id="mesh-a" gradientUnits="userSpaceOnUse" cx="${f(meshCx1)}" cy="${f(meshCy1)}" r="${meshR1}">
      <stop offset="0%" stop-color="${COLOR.accent}" stop-opacity="0.22"/>
      <stop offset="38%" stop-color="#3D72C9" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#101113" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="mesh-b" gradientUnits="userSpaceOnUse" cx="${f(meshCx2)}" cy="${f(meshCy2)}" r="${meshR2}">
      <stop offset="0%" stop-color="#3D72C9" stop-opacity="0.18"/>
      <stop offset="42%" stop-color="#203A64" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#101113" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="portal-core" gradientUnits="userSpaceOnUse" cx="${f(portalCx)}" cy="${f(portalCy)}" r="${coreR}">
      <stop offset="0%" stop-color="${COLOR.accent}" stop-opacity="0"/>
      <stop offset="34%" stop-color="${COLOR.accent}" stop-opacity="0"/>
      <stop offset="42%" stop-color="${COLOR.accent}" stop-opacity="0.34"/>
      <stop offset="54%" stop-color="${COLOR.accent}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${COLOR.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="portal-field" gradientUnits="userSpaceOnUse" cx="${f(portalCx)}" cy="${f(portalCy)}" r="${fieldR}">
      <stop offset="0%" stop-color="#203A64" stop-opacity="0"/>
      <stop offset="26%" stop-color="#203A64" stop-opacity="0"/>
      <stop offset="46%" stop-color="#203A64" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#101113" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="edge-vignette" cx="50%" cy="48%" r="78%">
      <stop offset="50%" stop-color="#101113" stop-opacity="0"/>
      <stop offset="100%" stop-color="#050608" stop-opacity="0.62"/>
    </radialGradient>
    <pattern id="grain" width="88" height="88" patternUnits="userSpaceOnUse">
      <path d="M6 12h1M38 9h1M73 19h1M21 44h1M61 58h1M12 78h1M82 81h1" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#mesh-a)"/>
  <rect width="${W}" height="${H}" fill="url(#mesh-b)"/>
  <rect width="${W}" height="${H}" fill="url(#portal-field)"/>
  <rect width="${W}" height="${H}" fill="url(#portal-core)"/>
  <rect width="${W}" height="${H}" fill="url(#edge-vignette)"/>
  <rect width="${W}" height="${H}" fill="url(#grain)" opacity="0.06"/>`;
}

/** Shared dark atmosphere + NEUS lockup; ring highlight stays on the portal, center stays clear. */
function buildCard({
  michroma,
  monaSans,
  W,
  H,
  markH,
  wordFont,
  tagFont,
  showUrl = true,
  tagline = OG_COPY.travels,
  layout = 'horizontal',
  urlLabel = 'neus.network',
  eyebrow = null,
}) {
  const cx = W / 2;
  const ms = markH / 1024;
  const wls = wordFont * 0.05;
  const word = textToPath(michroma, 'NEUS', wordFont, wls);
  const wordCap = wordFont * 0.765;

  let markX;
  let markY;
  let wordX;
  let wordBaseline;
  let tagBaseline;
  let portalCx;
  let portalCy;

  const eyebrowFont = eyebrow ? Math.round(tagFont * 0.72) : 0;
  const gapEyebrowTag = eyebrow ? Math.round(tagFont * 0.38) : 0;
  const tagBlock = tagFont + (eyebrow ? eyebrowFont + gapEyebrowTag : 0);

  if (layout === 'stacked') {
    const gapMarkWord = Math.round(markH * 0.28);
    const gapWordTag = Math.round(markH * 0.26);
    const blockH = markH + gapMarkWord + wordCap + gapWordTag + tagBlock;
    const blockTop = (H - blockH) / 2 - (showUrl ? H * 0.02 : 0);
    markX = cx - markH / 2;
    markY = blockTop;
    wordX = cx - word.width / 2;
    wordBaseline = markY + markH + gapMarkWord + wordCap;
    tagBaseline = wordBaseline + gapWordTag + tagBlock;
    portalCx = cx;
    portalCy = markY + markH / 2;
  } else {
    // One-line lockup: ring mark + Michroma wordmark, vertically centered.
    const lockupGap = markH * 0.2;
    const lockupW = markH + lockupGap + word.width;
    const lockupH = Math.max(markH, wordCap);
    const gapLockTag = Math.round(markH * 0.34);
    const blockH = lockupH + gapLockTag + tagBlock;
    const blockTop = (H - blockH) / 2 - (showUrl ? H * 0.015 : 0);
    const lockupLeft = cx - lockupW / 2;
    const lockupCy = blockTop + lockupH / 2;
    markX = lockupLeft;
    markY = lockupCy - markH / 2;
    wordX = lockupLeft + markH + lockupGap;
    wordBaseline = lockupCy + wordCap / 2;
    tagBaseline = blockTop + lockupH + gapLockTag + tagBlock;
    portalCx = markX + markH / 2;
    portalCy = lockupCy;
  }

  let eyebrowEl = '';
  if (eyebrow) {
    const eyebrowBaseline =
      tagBaseline - tagFont - gapEyebrowTag + Math.round(eyebrowFont * 0.12);
    eyebrowEl = `<text x="${f(cx)}" y="${f(eyebrowBaseline)}" text-anchor="middle" fill="${COLOR.accent}" font-family="Michroma, Arial, sans-serif" font-size="${eyebrowFont}" font-weight="400" letter-spacing="${f(eyebrowFont * 0.2)}">${escapeSvgText(String(eyebrow).toUpperCase())}</text>`;
  }

  let footer = '';
  if (showUrl) {
    const uFont = Math.round(H * 0.035);
    footer = `<text x="${f(cx)}" y="${f(H - H * 0.07)}" text-anchor="middle" fill="${COLOR.textMuted}" font-family="Mona Sans, Arial, sans-serif" font-size="${uFont}" font-weight="600" letter-spacing="${f(uFont * 0.05)}">${escapeSvgText(urlLabel)}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  ${buildPortalAtmosphere({ W, H, portalCx, portalCy, reach: layout === 'stacked' ? 0.86 : 1 })}
  <g transform="translate(${f(markX)} ${f(markY)}) scale(${f(ms)})">${buildMarkInner(COLOR.accent)}</g>
  <g transform="translate(${f(wordX)} ${f(wordBaseline)})"><path d="${word.d}" fill="${COLOR.textPrimary}"/></g>
  ${eyebrowEl}
  <text x="${f(cx)}" y="${f(tagBaseline)}" text-anchor="middle" fill="${COLOR.textSecondary}" font-family="Mona Sans, Arial, sans-serif" font-size="${tagFont}" font-weight="500">${escapeSvgText(tagline)}</text>
  ${footer}
</svg>`;
}

async function svgToPng(svg, width, outPath, { height } = {}) {
  const buf = await sharp(Buffer.from(svg), { density: 400 })
    .resize(width, height ?? width, { fit: 'fill', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
  await withRetry(() => writeFile(outPath, buf), outPath);
}

async function generateDocsOgCards({ michroma, monaSans }) {
  const docsDir = DOCS_IMAGES;
  await mkdir(docsDir, { recursive: true });
  const packFavicon = path.join(NEUS_BRAND_PACK, 'favicon.svg');
  const docsFavicon = path.join(docsDir, 'favicon.svg');

  for (const spec of DOCS_OG_SPECS) {
    const svg = buildCard({
      michroma,
      monaSans,
      W: DOCS_OG_CARD.W,
      H: DOCS_OG_CARD.H,
      markH: DOCS_OG_CARD.markH,
      wordFont: DOCS_OG_CARD.wordFont,
      tagFont: DOCS_OG_CARD.tagFont,
      tagline: spec.tagline,
      eyebrow: spec.eyebrow,
      urlLabel: DOCS_OG_CARD.urlLabel,
    });
    await svgToPng(svg, DOCS_OG_CARD.W, path.join(docsDir, spec.file), { height: DOCS_OG_CARD.H });
  }

  try {
    await copyFile(packFavicon, docsFavicon);
  } catch {
    await withRetry(() => writeFile(docsFavicon, buildTabMarkSvg(), 'utf8'), 'docs favicon.svg');
  }

  const mark512 = path.join(NEUS_BRAND_PACK, 'neus-mark-512.png');
  const pluginIcon = path.join(REPO, 'plugins', 'neus-trust', 'assets', 'icon.png');
  try {
    await copyFile(mark512, pluginIcon);
    console.log('[docs-og] plugin icon <- neus-mark-512.png (read-only from neus pack)');
  } catch {
    // sibling neus pack missing — run brand:generate in neus first
  }

  console.log(`[docs-og] wrote ${DOCS_OG_SPECS.length} cards + favicon.svg -> ${docsDir}`);
}

async function main() {
  console.log('[docs-og] loading fonts (Michroma + Mona Sans)...');
  const michroma = await loadFont(FONT_CSS.michroma);
  const monaSans = await loadFont(FONT_CSS.monaSans, 500);
  await generateDocsOgCards({ michroma, monaSans });
}

await main().catch((e) => {
  console.error(e);
  process.exit(1);
});

