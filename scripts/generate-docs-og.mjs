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
/**
 * Mintlify docs social cards (1200×630).
 * Layout: headline + one-line subtitle left, particle-ring mark right.
 */
const DOCS_OG_SPECS = [
  { file: 'og-default.png', title: 'Documentation', tagline: 'Trust that travels.' },
  { file: 'og-quickstart.png', title: 'Quickstart', tagline: 'Gate, publish, embed, check.' },
  { file: 'og-api.png', title: 'API', tagline: 'REST checks and receipts.' },
  { file: 'og-sdk.png', title: 'SDK', tagline: 'Verify, poll, gate, and host.' },
  { file: 'og-mcp.png', title: 'MCP', tagline: 'Identity, authority, and trust receipts.' },
  { file: 'og-agents.png', title: 'Agents', tagline: 'Identity and delegation for agents.' },
  { file: 'og-verification.png', title: 'Verification', tagline: 'Checks that become receipts.' },
  { file: 'og-widgets.png', title: 'Widgets', tagline: 'VerifyGate and ProofBadge.' },
];

/**
 * OG grid (1200×630): 8px base, 56px margins, 48px column gutter.
 * Text column ~46% width; mark column gets the remainder.
 */
const DOCS_OG_CARD = {
  W: 1200,
  H: 630,
  pad: 56,
  colGap: 48,
  textColFrac: 0.46,
  textInset: 0.04,
  minMarkH: 400,
};

/** @param {string} str */
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** @param {number} seed */
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Soft radial glow on the mark + whisper-thin particle network in the bottom-left. */
function buildDocsOgBackground({ W, H, spotlightCx, spotlightCy, seed = 1 }) {
  const spotR = Math.round(Math.hypot(W, H) * 0.95);
  const rnd = mulberry32(seed);
  const regionW = W * 0.46;
  const regionH = H * 0.42;
  const nodeCount = 42;
  const nodes = [];
  const dots = [];

  for (let i = 0; i < nodeCount; i++) {
    const x = rnd() * regionW;
    const y = H - rnd() * regionH;
    const r = 0.45 + rnd() * 0.95;
    const opacity = 0.05 + rnd() * 0.1;
    nodes.push({ x, y });
    dots.push(
      `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${COLOR.accent}" opacity="${f(opacity)}"/>`,
    );
  }

  const lines = [];
  const linkDist = 110;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      if (dx * dx + dy * dy < linkDist * linkDist && rnd() > 0.72) {
        lines.push(
          `<line x1="${f(nodes[i].x)}" y1="${f(nodes[i].y)}" x2="${f(nodes[j].x)}" y2="${f(nodes[j].y)}" stroke="${COLOR.accent}" stroke-opacity="0.045" stroke-width="0.65"/>`,
        );
      }
    }
  }

  return `<defs>
    <linearGradient id="bg-base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#11151B"/>
      <stop offset="100%" stop-color="#090A0C"/>
    </linearGradient>
    <radialGradient id="mark-spotlight" gradientUnits="userSpaceOnUse" cx="${f(spotlightCx)}" cy="${f(spotlightCy)}" r="${spotR}">
      <stop offset="0%" stop-color="${COLOR.accent}" stop-opacity="0.14"/>
      <stop offset="32%" stop-color="#98C0EF" stop-opacity="0.06"/>
      <stop offset="58%" stop-color="#3D72C9" stop-opacity="0.025"/>
      <stop offset="82%" stop-color="#101113" stop-opacity="0"/>
      <stop offset="100%" stop-color="#101113" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg-base)"/>
  <rect width="${W}" height="${H}" fill="url(#mark-spotlight)"/>
  <g opacity="0.9" aria-hidden="true">${lines.join('')}${dots.join('')}</g>`;
}

/** Ink width of an outlined path (advance vs glyph bbox). */
function measurePathWidth(path) {
  const { x1, x2 } = path.bbox;
  return Math.max(path.width, x2 - x1);
}

/** Largest Michroma size that fits maxW (shrink-only; 4% slack for hinting / PNG raster). */
function fitMichromaTitle(michroma, title, maxW, { min = 44, max = 128, lsRatio = 0.02 } = {}) {
  const limit = maxW * 0.96;
  let fit = { path: textToPath(michroma, title, min, min * lsRatio), fontSize: min };
  for (let size = max; size >= min; size -= 2) {
    const path = textToPath(michroma, title, size, size * lsRatio);
    if (measurePathWidth(path) <= limit) {
      fit = { path, fontSize: size };
      break;
    }
  }
  while (fit.fontSize > min && measurePathWidth(fit.path) > limit) {
    fit.fontSize -= 2;
    fit.path = textToPath(michroma, title, fit.fontSize, fit.fontSize * lsRatio);
  }
  return fit;
}

/** @param {import('opentype.js').Font} font */
function measureLineWidth(font, line, fontSize) {
  return measurePathWidth(textToPath(font, line, fontSize, 0));
}

/** @param {import('opentype.js').Font} font */
function wrapTaglineMeasured(font, text, maxWidth, fontSize, maxLines = 2) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (measureLineWidth(font, next, fontSize) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const merged = lines.slice(0, maxLines - 1).join(' ');
    const tail = lines.slice(maxLines - 1).join(' ');
    return [merged, tail].filter(Boolean);
  }
  return lines;
}

/** @param {import('opentype.js').Font} font */
function fitTaglineLayout(font, tagline, maxWidth, { min = 22, max = 28, maxLines = 1 } = {}) {
  for (let tagFont = max; tagFont >= min; tagFont -= 2) {
    const lines = wrapTaglineMeasured(font, tagline, maxWidth, tagFont, maxLines);
    const overflow = lines.some((ln) => measureLineWidth(font, ln, tagFont) > maxWidth);
    if (!overflow && lines.length <= maxLines) {
      return { tagFont, lines, tagLineHeight: Math.round(tagFont * 1.34) };
    }
  }
  const tagFont = min;
  const lines = wrapTaglineMeasured(font, tagline, maxWidth, tagFont, maxLines);
  return { tagFont, lines, tagLineHeight: Math.round(tagFont * 1.34) };
}

/** @param {ReturnType<typeof textToPath>} path @param {number} anchorX flush-left target */
function pathLeftAt(path, anchorX) {
  return anchorX - path.bbox.x1;
}

/** @param {ReturnType<typeof textToPath>} path @param {number} anchorX */
function pathRightAt(path, anchorX) {
  return pathLeftAt(path, anchorX) + measurePathWidth(path);
}

function assertDocsOgLayout({
  label,
  W,
  H,
  textX,
  textColEnd,
  titlePath,
  titleX,
  titleBaseline,
  tagLayouts,
  markX,
  markY,
  markH,
}) {
  const pad = DOCS_OG_CARD.pad;
  if (Math.abs(pathLeftAt(titlePath, textX) - titleX) > 0.5) {
    throw new Error(`[docs-og] ${label}: title left edge misaligned`);
  }
  if (pathRightAt(titlePath, textX) > textColEnd) {
    throw new Error(`[docs-og] ${label}: title overflows text column`);
  }
  for (const tag of tagLayouts) {
    if (Math.abs(tag.x - pathLeftAt(tag.path, textX)) > 0.5) {
      throw new Error(`[docs-og] ${label}: tagline left edge misaligned`);
    }
    if (pathRightAt(tag.path, textX) > textColEnd) {
      throw new Error(`[docs-og] ${label}: tagline overflows text column`);
    }
  }
  const blockTop = titleBaseline + titlePath.bbox.y1;
  const lastTag = tagLayouts[tagLayouts.length - 1];
  const blockBottom = lastTag.baseline + lastTag.path.bbox.y2;
  if (blockTop < pad - 2 || blockBottom > H - pad + 2) {
    throw new Error(`[docs-og] ${label}: text block outside vertical safe area`);
  }
  if (markX < textColEnd || markX + markH > W - pad || markY < pad - 8 || markY + markH > H - pad + 8) {
    throw new Error(`[docs-og] ${label}: mark outside right column safe area`);
  }
}

/**
 * Typography + mark geometry for docs OG (flush-left paths, centered block + mark).
 */
function layoutDocsOgCard({ michroma, monaSans, W, H, title, tagline }) {
  const { pad, colGap, textColFrac, textInset, minMarkH } = DOCS_OG_CARD;
  const centerY = H / 2;
  const textX = pad;
  const textColEnd = Math.round(W * textColFrac);
  const safeTextW = (textColEnd - textX) * (1 - textInset);
  const markColStart = textColEnd + colGap;
  const markColW = W - markColStart - pad;

  const titleMax =
    title.length >= 13 ? 96 : title.length > 9 ? 108 : title.length > 5 ? 120 : 128;
  const { path: titlePath } = fitMichromaTitle(michroma, title, safeTextW, { max: titleMax, min: 44 });

  const { tagFont, lines: tagLines, tagLineHeight } = fitTaglineLayout(monaSans, tagline, safeTextW * 0.96, {
    max: 28,
    min: 22,
    maxLines: 1,
  });

  const titleBoxH = titlePath.bbox.y2 - titlePath.bbox.y1;
  const tagBlockH = tagLines.length * tagLineHeight;
  const gapTitleTag = Math.round(tagFont * 0.62);
  const blockH = titleBoxH + gapTitleTag + tagBlockH;
  const blockTop = centerY - blockH / 2;
  const titleBaseline = blockTop - titlePath.bbox.y1;
  const titleX = pathLeftAt(titlePath, textX);

  const tagLayouts = tagLines.map((line, i) => {
    const path = textToPath(monaSans, line, tagFont, 0);
    const baseline = titleBaseline + titlePath.bbox.y2 + gapTitleTag + tagFont * 0.82 + i * tagLineHeight;
    return { path, baseline, x: pathLeftAt(path, textX) };
  });

  const markCx = markColStart + markColW / 2;
  const markCy = centerY;
  const markH = Math.min(markColW * 0.94, H - pad * 2, Math.max(minMarkH, blockH * 1.08));
  const ms = markH / 1024;
  const markX = markCx - markH / 2;
  const markY = markCy - markH / 2;

  assertDocsOgLayout({
    label: title,
    W,
    H,
    textX,
    textColEnd,
    titlePath,
    titleX,
    titleBaseline,
    tagLayouts,
    markX,
    markY,
    markH,
  });

  return {
    textX,
    titlePath,
    titleX,
    titleBaseline,
    tagLayouts,
    tagFont,
    markCx,
    markCy,
    markX,
    markY,
    markH,
    ms,
  };
}

/**
 * Docs OG layout: title + one-line subtitle left, mark right, NEUS bottom-right.
 */
function buildDocsOgCard({ michroma, monaSans, W, H, title, tagline }) {
  const layout = layoutDocsOgCard({ michroma, monaSans, W, H, title, tagline });

  const tagEls = layout.tagLayouts
    .map(
      ({ path, baseline, x }) =>
        `<g transform="translate(${f(x)} ${f(baseline)})"><path d="${path.d}" fill="${COLOR.white}"/></g>`,
    )
    .join('\n  ');

  const brandFont = 20;
  const brandLs = brandFont * 0.14;
  const brand = textToPath(michroma, 'NEUS', brandFont, brandLs);
  const brandX = W - DOCS_OG_CARD.pad;
  const brandBaseline = H - DOCS_OG_CARD.pad * 0.65;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-label="${escapeSvgText(title)} — ${escapeSvgText(tagline)}">
  ${buildDocsOgBackground({ W, H, spotlightCx: layout.markCx, spotlightCy: layout.markCy, seed: hashSeed(title) })}
  <g transform="translate(${f(layout.titleX)} ${f(layout.titleBaseline)})"><path d="${layout.titlePath.d}" fill="${COLOR.accent}"/></g>
  ${tagEls}
  <g transform="translate(${f(layout.markX)} ${f(layout.markY)}) scale(${f(layout.ms)})">${buildMarkInner(COLOR.accent)}</g>
  <g transform="translate(${f(brandX - brand.width)} ${f(brandBaseline - brandFont * 0.15)})"><path d="${brand.d}" fill="${COLOR.textMuted}"/></g>
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
    const svg = buildDocsOgCard({
      michroma,
      monaSans,
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

