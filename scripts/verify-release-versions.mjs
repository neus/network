#!/usr/bin/env node
/**
 * Verify all version surfaces match the release tag.
 * Called by .github/workflows/release.yml — kept as a committed script so
 * bash never has to parse JS quoting (the inline node -e approach broke on
 * regex double-quotes inside bash double-quoted strings).
 *
 * Usage: node scripts/verify-release-versions.mjs <version>
 * Exits 1 if any surface is mismatched.
 */
import { readFileSync } from 'fs';

const target = process.argv[2]?.replace(/^v/, '');
if (!target) {
  console.error('Usage: node scripts/verify-release-versions.mjs <version>');
  process.exit(1);
}

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const readRaw = (p) => readFileSync(p, 'utf8');

const surfaces = {
  'sdk/package.json': readJson('sdk/package.json').version,
  'sdk/package-lock.json': readJson('sdk/package-lock.json').version,
  'mcp/npm-dist/package.json': readJson('mcp/npm-dist/package.json').version,
  'mcp/npm-dist/server.json': readJson('mcp/npm-dist/server.json').version,
  'plugins/neus-trust/.cursor-plugin/plugin.json': readJson('plugins/neus-trust/.cursor-plugin/plugin.json').version,
  'plugins/neus-trust/.claude-plugin/plugin.json': readJson('plugins/neus-trust/.claude-plugin/plugin.json').version,
  'plugins/neus-trust/.codex-plugin/plugin.json': readJson('plugins/neus-trust/.codex-plugin/plugin.json').version,
  '.cursor-plugin/marketplace.json': readJson('.cursor-plugin/marketplace.json').metadata?.version,
  '.claude-plugin/marketplace.json': readJson('.claude-plugin/marketplace.json').metadata?.version,
  '.agents/plugins/marketplace.json': readJson('.agents/plugins/marketplace.json').metadata?.version,
  'plugins/neus-trust/skills/neus-trust-workflow/SKILL.md': (() => {
    const raw = readRaw('plugins/neus-trust/skills/neus-trust-workflow/SKILL.md');
    // agentskills.io: version lives under metadata.version; accept legacy top-level version too.
    return (
      (raw.match(/^\s*version:\s*"([^"]+)"\s*$/m) || [])[1] ||
      (raw.match(/^version:\s*"([^"]+)"$/m) || [])[1] ||
      null
    );
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

console.log('All ' + Object.keys(surfaces).length + ' version surfaces at ' + target + ' — verified.');