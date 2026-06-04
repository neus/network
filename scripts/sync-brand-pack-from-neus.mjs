#!/usr/bin/env node
/**
 * Copy canonical NEUS brand-pack assets from sibling `neus` into `network/docs/images/neus-brand-pack`.
 * Run from `network/` after `npm run brand:generate` in `neus/` when marks change.
 *
 *   node scripts/sync-brand-pack-from-neus.mjs
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NETWORK_ROOT = path.resolve(__dirname, '..');
const NEUS_PACK = path.resolve(NETWORK_ROOT, '..', 'neus', 'public', 'images', 'neus-brand-pack');
const DOCS_PACK = path.join(NETWORK_ROOT, 'docs', 'images', 'neus-brand-pack');
const PLUGIN_ICON = path.join(NETWORK_ROOT, 'plugins', 'neus-trust', 'assets', 'icon.png');

/** Shipped in docs pack for reference only — opaque; do not wire into docs.json logo/favicon. */
const OPAQUE_REFERENCE_ONLY = new Set(['favicon-plate-32.png', 'favicon-plate-48.png']);

const COPY_FILES = [
  'favicon.svg',
  'neus-mark.svg',
  'neus-mark-ink.svg',
  'neus-mark-white.svg',
  'neus-mark-16.png',
  'neus-mark-32.png',
  'neus-mark-48.png',
  'neus-mark-64.png',
  'neus-mark-128.png',
  'neus-mark-256.png',
  'neus-mark-512.png',
  'neus-logo.svg',
  'neus-lockup-horizontal.svg',
  'neus-lockup-horizontal-ink.svg',
  'favicon-plate-32.png',
  'favicon-plate-48.png',
  'og-default-1200x630-neus.png',
];

const VERSION_FILE = path.join(DOCS_PACK, 'BRAND_PACK_VERSION.txt');

async function readBrandPackVersion() {
  const tokensPath = path.resolve(NETWORK_ROOT, '..', 'neus', 'lib', 'brand', 'tokens.ts');
  const src = await readFile(tokensPath, 'utf8');
  const match = src.match(/export const BRAND_PACK_VERSION = '([^']+)'/);
  if (!match) throw new Error(`BRAND_PACK_VERSION not found in ${tokensPath}`);
  return match[1];
}

async function main() {
  await mkdir(DOCS_PACK, { recursive: true });
  const version = await readBrandPackVersion();
  let copied = 0;

  for (const name of COPY_FILES) {
    const src = path.join(NEUS_PACK, name);
    const dest = path.join(DOCS_PACK, name);
    try {
      await copyFile(src, dest);
      copied++;
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
        console.warn(`[sync-brand-pack] skip missing: ${name}`);
        continue;
      }
      throw err;
    }
  }

  const transparentMark512 = path.join(NEUS_PACK, 'neus-mark-512.png');
  await copyFile(transparentMark512, PLUGIN_ICON);

  await writeFile(VERSION_FILE, `${version}\n`, 'utf8');

  console.log(`[sync-brand-pack] copied ${copied} assets → docs/images/neus-brand-pack`);
  console.log(`[sync-brand-pack] version ${version} → BRAND_PACK_VERSION.txt`);
  console.log('[sync-brand-pack] plugin icon ← neus-mark-512.png (transparent alpha)');
  if ([...OPAQUE_REFERENCE_ONLY].every((name) => COPY_FILES.includes(name))) {
    console.log('[sync-brand-pack] note: favicon-plate-* copied for reference only — use favicon.svg / neus-mark-*.png in UI');
  }
}

main().catch((err) => {
  console.error('[sync-brand-pack] failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
