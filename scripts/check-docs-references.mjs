#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const textExtensions = new Set([
  '.json',
  '.md',
  '.mdx',
  '.mjs',
  '.txt',
  '.yml'
]);

const ignoredDirs = new Set([
  '.git',
  '.mintlify-home',
  '.mintlify-home-validate-4',
  'node_modules'
]);

const bannedPatterns = [
  '../docs/',
  './docs/',
  'docs/api/README.md',
  'docs/api/public-api.json',
  'docs/verifiers/',
  'docs/QUICKSTART.md',
  'mintlify/mint.json'
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        walk(absolutePath, files);
      }
      continue;
    }

    if (entry.isFile() && textExtensions.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

const failures = [];

for (const absolutePath of walk(repoRoot)) {
  const relativePath = path.relative(repoRoot, absolutePath).split(path.sep).join('/');
  if (relativePath === 'scripts/check-docs-references.mjs') continue;
  const content = fs.readFileSync(absolutePath, 'utf8');

  for (const pattern of bannedPatterns) {
    if (content.includes(pattern)) {
      failures.push(`${relativePath}: contains stale reference "${pattern}"`);
    }
  }
}

const specPath = path.join(repoRoot, 'spec', 'VERIFIERS.json');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

for (const verifier of spec.verifiers ?? []) {
  const inputSchemaPath = verifier.inputSchemaPath;
  const absoluteSchemaPath = path.join(repoRoot, inputSchemaPath);

  if (!fs.existsSync(absoluteSchemaPath)) {
    failures.push(`spec/VERIFIERS.json: missing schema for ${verifier.id} at ${inputSchemaPath}`);
  }
}

if (failures.length > 0) {
  console.error('Docs reference checks failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Docs reference checks passed.');
