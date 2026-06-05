#!/usr/bin/env node
/**
 * Fail if npm pack would ship dev-only files for @neus/sdk or @neus/mcp-server.
 */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const forbidden = [
  /\btest\//,
  /\.test\.js\b/,
  /\.jsx\b/,
  /neus-logo\.svg/,
  /\.eslintrc/,
  /vitest\.config/,
  /package-lock\.json/,
  /\b\.env\b/,
  /\b\.npmrc\b/,
];

const required = {
  sdk: ['sponsor.js', 'cli/neus.mjs', 'widgets/verify-gate/dist/VerifyGate.js'],
  'mcp/npm-dist': ['server.json', 'index.mjs'],
};

function packList(cwd) {
  const output = execSync('npm pack --dry-run --ignore-scripts 2>&1', {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const paths = [];
  let inContents = false;
  for (const raw of output.split('\n')) {
    const line = raw.trim();
    if (line === 'npm notice Tarball Contents') {
      inContents = true;
      continue;
    }
    if (inContents && line === 'npm notice Tarball Details') break;
    if (!inContents || !line.startsWith('npm notice ')) continue;
    const body = line.slice('npm notice '.length);
    const splitAt = body.search(/\s[^\s]/);
    if (splitAt === -1) continue;
    const path = body.slice(splitAt).trim();
    if (path && !path.includes(':')) paths.push(path);
  }
  return paths;
}

function verifyPackage(relativeDir, label) {
  const cwd = join(root, relativeDir);
  const lines = packList(cwd);
  const joined = lines.join('\n');
  const errors = [];

  for (const pattern of forbidden) {
    if (lines.some((entry) => pattern.test(entry))) {
      errors.push(`${label}: forbidden path matched ${pattern}`);
    }
  }

  for (const entry of required[relativeDir] || []) {
    if (!lines.some((line) => line === entry || line.endsWith(`/${entry}`))) {
      errors.push(`${label}: missing required publish file ${entry}`);
    }
  }

  return errors;
}

const errors = [...verifyPackage('sdk', '@neus/sdk'), ...verifyPackage('mcp/npm-dist', '@neus/mcp-server')];

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('npm pack surfaces are clean for @neus/sdk and @neus/mcp-server');
