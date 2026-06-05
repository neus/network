#!/usr/bin/env node
/**
 * Ensures lockstep semver across npm, MCP discovery, plugin, and example surfaces.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8'));
}

const sdkVersion = readJson('sdk/package.json').version;
const mcpPkgVersion = readJson('mcp/npm-dist/package.json').version;
const mcpServerVersion = readJson('mcp/npm-dist/server.json').version;
const pluginVersion = readJson('plugins/neus-trust/.claude-plugin/plugin.json').version;
const marketplace = readJson('.claude-plugin/marketplace.json');
const marketplaceVersion = marketplace.version;
const marketplacePluginVersion = marketplace.plugins?.[0]?.version;

const expectedTag = process.argv.includes('--tag')
  ? process.argv[process.argv.indexOf('--tag') + 1]
  : null;

const surfaces = {
  'sdk/package.json': sdkVersion,
  'mcp/npm-dist/package.json': mcpPkgVersion,
  'mcp/npm-dist/server.json': mcpServerVersion,
  'plugins/neus-trust/.claude-plugin/plugin.json': pluginVersion,
  '.claude-plugin/marketplace.json': marketplaceVersion,
  '.claude-plugin/marketplace.json (plugin)': marketplacePluginVersion,
};

const unique = [...new Set(Object.values(surfaces))];
const errors = [];

if (unique.length !== 1) {
  errors.push(`Version mismatch across network release surfaces:\n${JSON.stringify(surfaces, null, 2)}`);
}

const releaseVersion = unique[0];

if (expectedTag && releaseVersion !== expectedTag) {
  errors.push(`Release surfaces are ${releaseVersion} but --tag expects ${expectedTag}`);
}

for (const entry of readdirSync(join(root, 'examples'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const pkgPath = join('examples', entry.name, 'package.json');
  try {
    const pkg = readJson(pkgPath);
    const dep = pkg.dependencies?.['@neus/sdk'] || pkg.devDependencies?.['@neus/sdk'];
    if (!dep) continue;
    const normalized = dep.replace(/^\^/, '');
    if (normalized !== releaseVersion) {
      errors.push(`${pkgPath} pins @neus/sdk@${dep}; expected ^${releaseVersion}`);
    }
  } catch {
    /* no package.json */
  }
}

if (errors.length) {
  console.error(errors.join('\n\n'));
  process.exit(1);
}

console.log(`Release surfaces aligned at ${releaseVersion}`);
