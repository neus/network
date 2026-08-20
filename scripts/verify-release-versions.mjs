#!/usr/bin/env node
/**
 * Verify all version surfaces match the release tag.
 * Called by .github/workflows/release.yml , kept as a committed script so
 * bash never has to parse JS quoting (the inline node -e approach broke on
 * regex double-quotes inside bash double-quoted strings).
 *
 * Usage: node scripts/verify-release-versions.mjs <version>
 * Exits 1 if any surface is mismatched.
 */
import { existsSync, readFileSync } from 'fs';

const target = process.argv[2]?.replace(/^v/, '');
if (!target) {
  console.error('Usage: node scripts/verify-release-versions.mjs <version>');
  process.exit(1);
}

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const readRaw = (p) => readFileSync(p, 'utf8');
const mcpPackage = readJson('mcp/npm-dist/package.json');
const mcpServer = readJson('mcp/npm-dist/server.json');
const canonicalPlugin = readJson('plugins/neus-mcp/.cursor-plugin/plugin.json');

const surfaces = {
  'sdk/package.json': readJson('sdk/package.json').version,
  'sdk/package-lock.json': readJson('sdk/package-lock.json').version,
  'docs/openapi/public-api.json': readJson('docs/openapi/public-api.json').info?.version,
  'mcp/npm-dist/package.json': mcpPackage.version,
  'mcp/npm-dist/server.json': mcpServer.version,
  'plugins/neus-mcp/.cursor-plugin/plugin.json': readJson('plugins/neus-mcp/.cursor-plugin/plugin.json').version,
  'plugins/neus-mcp/.claude-plugin/plugin.json': readJson('plugins/neus-mcp/.claude-plugin/plugin.json').version,
  'plugins/neus-mcp/.codex-plugin/plugin.json': readJson('plugins/neus-mcp/.codex-plugin/plugin.json').version,
  '.cursor-plugin/marketplace.json': readJson('.cursor-plugin/marketplace.json').metadata?.version,
  '.claude-plugin/marketplace.json': readJson('.claude-plugin/marketplace.json').metadata?.version,
  '.agents/plugins/marketplace.json': readJson('.agents/plugins/marketplace.json').metadata?.version,
  'sdk/skills/neus-trust-workflow/SKILL.md': (() => {
    const raw = readRaw('sdk/skills/neus-trust-workflow/SKILL.md');
    return (raw.match(/^\s*version:\s*"([^"]+)"\s*$/m) || [])[1] || null;
  })(),
};

const mismatched = Object.entries(surfaces).filter(([, v]) => v !== target);
if (mismatched.length) {
  console.error('Version mismatch (expected ' + target + '):');
  for (const [file, version] of mismatched) {
    console.error('  ' + file + ': ' + version);
  }
  process.exit(1);
}

const metadataErrors = [];
if (mcpPackage.description !== mcpServer.description) {
  metadataErrors.push('mcp/npm-dist package and server descriptions must match');
}
if (String(mcpServer.description || '').length > 100) {
  metadataErrors.push('mcp/npm-dist/server.json description must be <=100 characters');
}
if (mcpServer.repository?.subfolder !== 'mcp/npm-dist') {
  metadataErrors.push('mcp/npm-dist/server.json repository.subfolder must be mcp/npm-dist');
}
if (!mcpPackage.files?.includes('LICENSE') || !existsSync('mcp/npm-dist/LICENSE')) {
  metadataErrors.push('mcp/npm-dist must publish its Apache-2.0 LICENSE file');
}
const pluginDescriptions = {
  'plugins/neus-mcp/.claude-plugin/plugin.json': readJson('plugins/neus-mcp/.claude-plugin/plugin.json').description,
  'plugins/neus-mcp/.codex-plugin/plugin.json': readJson('plugins/neus-mcp/.codex-plugin/plugin.json').description,
  '.cursor-plugin/marketplace.json': readJson('.cursor-plugin/marketplace.json').plugins?.[0]?.description,
  '.claude-plugin/marketplace.json': readJson('.claude-plugin/marketplace.json').plugins?.[0]?.description,
  '.agents/plugins/marketplace.json': readJson('.agents/plugins/marketplace.json').plugins?.[0]?.description,
};
for (const [file, description] of Object.entries(pluginDescriptions)) {
  if (description !== canonicalPlugin.description) {
    metadataErrors.push(`${file} description must match the canonical Cursor plugin description`);
  }
}
if (metadataErrors.length) {
  console.error('MCP package metadata failure:');
  for (const error of metadataErrors) console.error('  ' + error);
  process.exit(1);
}

console.log('All ' + Object.keys(surfaces).length + ' version surfaces at ' + target + ' , verified.');
