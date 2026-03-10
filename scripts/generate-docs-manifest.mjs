#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { keccak256, toUtf8Bytes } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const includeRoots = [
  'package.json',
  'README.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  '.markdownlint-cli2.jsonc',
  '.github/workflows/docs.yml',
  '.github/PULL_REQUEST_TEMPLATE.md',
  'sdk',
  'examples',
  'spec/verifiers',
  'scripts',
  'mintlify'
];

const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'coverage']);

function parseArgs(argv) {
  const args = { out: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--out') {
      args.out = argv[index + 1] || null;
      index += 1;
    }
  }
  return args;
}

function includeFile(relativePath) {
  if (relativePath.endsWith('.json')) {
    return relativePath === 'mintlify/openapi/public-api.json';
  }

  return (
    relativePath.endsWith('.md') ||
    relativePath.endsWith('.mdx') ||
    relativePath === 'package.json' ||
    relativePath === 'README.md' ||
    relativePath === 'SECURITY.md' ||
    relativePath === 'CONTRIBUTING.md' ||
    relativePath === '.markdownlint-cli2.jsonc' ||
    relativePath === '.github/workflows/docs.yml' ||
    relativePath === '.github/PULL_REQUEST_TEMPLATE.md' ||
    relativePath === 'mintlify/docs.json'
  );
}

function walk(relativePath, files) {
  const absolutePath = path.join(repoRoot, relativePath);
  const stat = fs.statSync(absolutePath);

  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath).sort()) {
      if (ignoredDirs.has(entry)) continue;
      walk(path.join(relativePath, entry), files);
    }
    return;
  }

  const normalized = relativePath.split(path.sep).join('/');
  if (includeFile(normalized)) {
    files.push(normalized);
  }
}

function sha256Hex(content) {
  return createHash('sha256').update(content).digest('hex');
}

const args = parseArgs(process.argv.slice(2));
const files = [];

for (const entry of includeRoots) {
  const absolutePath = path.join(repoRoot, entry);
  if (fs.existsSync(absolutePath)) {
    walk(entry, files);
  }
}

const uniqueFiles = [...new Set(files)].sort((left, right) => left.localeCompare(right));
const fileHashes = {};

for (const relativePath of uniqueFiles) {
  const content = fs.readFileSync(path.join(repoRoot, relativePath));
  fileHashes[relativePath] = `sha256:${sha256Hex(content)}`;
}

const aggregateInput = uniqueFiles
  .map((relativePath) => `${relativePath}:${fileHashes[relativePath]}`)
  .join('\n');

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  root: repoRoot.split(path.sep).join('/'),
  fileCount: uniqueFiles.length,
  files: fileHashes,
  aggregateHash: keccak256(toUtf8Bytes(aggregateInput))
};

const output = `${JSON.stringify(manifest, null, 2)}\n`;

if (args.out) {
  const outPath = path.resolve(process.cwd(), args.out);
  fs.writeFileSync(outPath, output, 'utf8');
  process.stdout.write(`${manifest.aggregateHash}\n`);
} else {
  process.stdout.write(output);
}
