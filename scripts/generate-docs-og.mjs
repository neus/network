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

/** Mintlify docs social cards (1200×630). */
const DOCS_OG_SPECS = [
  { file: 'og-default.png', title: 'Documentation', tagline: OG_COPY.travels },
  { file: 'og-quickstart.png', title: 'Quickstart', tagline: 'Ship your first proof-backed check.' },
  { file: 'og-api.png', title: 'API', tagline: 'HTTP reference for verifiers and receipts.' },
  { file: 'og-sdk.png', title: 'SDK', tagline: 'JavaScript SDK, CLI, and widgets.' },
  { file: 'og-mcp.png', title: 'MCP', tagline: 'Trust context inside your IDE.' },
  { file: 'og-agents.png', title: 'Agents', tagline: 'Identity, delegation, and runtime trust.' },
  { file: 'og-verification.png', title: 'Verification', tagline: 'Checks that become reusable receipts.' },
  { file: 'og-widgets.png', title: 'Widgets', tagline: 'VerifyGate for hosted checkout flows.' },
];

const DOCS_OG_CARD = { W: 1200, H: 630, leftFrac: 0.6, pad: 52 };

/** Flat canvas + smooth radial spotlight centered on the left mark, spanning the full card. */
function buildDocsOgBackground({ W, H, spotlightCx, spotlightCy }) {
  const spotR = Math.round(Math.hypot(W, H) * 0.92);
  return `<defs>
    <linearGradient id="bg-base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#11151B"/>
      <stop offset="100%" stop-color="#090A0C"/>
    </linearGradient>
    <radialGradient id="mark-spotlight" gradientUnits="userSpaceOnUse" cx="${f(spotlightCx)}" cy="${f(spotlightCy)}" r="${spotR}">
      <stop offset="0%" stop-color="${COLOR.accent}" stop-opacity="0.32"/>
      <stop offset="28%" stop-color="#98C0EF" stop-opacity="0.14"/>
      <stop offset="52%" stop-color="#3D72C9" stop-opacity="0.06"/>
      <stop offset="78%" stop-color="#101113" stop-opacity="0"/>
      <stop offset="100%" stop-color="#101113" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg-base)"/>
  <rect width="${W}" height="${H}" fill="url(#mark-spotlight)"/>`;
}

/**
 * Docs OG layout: dominant mark left (~60%), section title + subtitle right, NEUS in bottom corner.
 */
function buildDocsOgCard({ michroma, W, H, title, tagline }) {
  const leftW = W * DOCS_OG_CARD.leftFrac;
  const markH = Math.min(leftW * 0.88, H * 0.8);
  const markCx = leftW / 2;
  const markCy = H / 2;
  const ms = markH / 1024;
  const markX = markCx - markH / 2;
  const markY = markCy - markH / 2;

  let titleFont = 76;
  const titleLs = titleFont * 0.03;
  let titlePath = textToPath(michroma, title, titleFont, titleLs);
  const maxTitleW = W - leftW - DOCS_OG_CARD.pad * 2;
  while (titlePath.width > maxTitleW && titleFont > 44) {
    titleFont -= 2;
    titlePath = textToPath(michroma, title, titleFont, titleFont * 0.03);
  }
  const titleCap = titleFont * 0.765;

  const tagFont = 24;
  const tagLineHeight = Math.round(tagFont * 1.38);
  const tagLines = wrapTagline(tagline, maxTitleW, tagFont);

  const gapTitleTag = 22;
  const blockH = titleCap + gapTitleTag + tagLines.length * tagLineHeight;
  const blockTop = (H - blockH) / 2;
  const textX = leftW + DOCS_OG_CARD.pad;
  const titleBaseline = blockTop + titleCap;
  const tagStartY = titleBaseline + gapTitleTag + tagFont;

  const tagEls = tagLines
    .map(
      (line, i) =>
        `<text x="${f(textX)}" y="${f(tagStartY + i * tagLineHeight)}" fill="${COLOR.white}" font-family="Mona Sans, Arial, sans-serif" font-size="${tagFont}" font-weight="500">${escapeSvgText(line)}</text>`,
    )
    .join('\n  ');

  const brandFont = 20;
  const brandLs = brandFont * 0.14;
  const brand = textToPath(michroma, 'NEUS', brandFont, brandLs);
  const brandX = W - DOCS_OG_CARD.pad;
  const brandBaseline = H - DOCS_OG_CARD.pad * 0.65;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-label="${escapeSvgText(title)}">
  ${buildDocsOgBackground({ W, H, spotlightCx: markCx, spotlightCy: markCy })}
  <g transform="translate(${f(markX)} ${f(markY)}) scale(${f(ms)})">${buildMarkInner(COLOR.accent)}</g>
  <g transform="translate(${f(textX)} ${f(titleBaseline)})"><path d="${titlePath.d}" fill="${COLOR.accent}"/></g>
  ${tagEls}
  <g transform="translate(${f(brandX - brand.width)} ${f(brandBaseline - brandFont * 0.15)})"><path d="${brand.d}" fill="${COLOR.textMuted}"/></g>
</svg>`;
}

/** @param {string} text @param {number} maxWidth @param {number} fontSize */
function wrapTagline(text, maxWidth, fontSize) {
  const charW = fontSize * 0.5;
  const maxChars = Math.max(12, Math.floor(maxWidth / charW));
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
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
    const svg = buildDocsOgCard({
      michroma,
      W: DOCS_OG_CARD.W,
      H: DOCS_OG_CARD.H,
      title: spec.title,
      tagline: spec.tagline,
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

