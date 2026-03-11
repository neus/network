#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const docsRoot = path.join(repoRoot, 'docs');

const bannedPhrases = [
  'for your deployment',
  'deployment supports',
  'attached to your deployment',
  'enabled for your deployment',
  'self-hosted deployments',
  'real-world deployments'
];

function walkMdx(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.mintlify-home')) continue; // Mintlify CLI cache
      walkMdx(absolutePath, files);
      continue;
    }

    if (entry.isFile() && absolutePath.endsWith('.mdx')) {
      files.push(absolutePath);
    }
  }

  return files;
}

function normalizeText(value) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function getFrontmatterDescription(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return null;
  const descriptionMatch = match[1].match(/^description:\s*(.+)$/m);
  return descriptionMatch ? descriptionMatch[1].trim() : null;
}

function getFirstParagraph(content) {
  const withoutFrontmatter = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trimStart();
  const blocks = withoutFrontmatter
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  for (const block of blocks) {
    if (block.startsWith('<') || block.startsWith('#') || block.startsWith('|') || block.startsWith('```')) {
      continue;
    }

    return block;
  }

  return null;
}

const failures = [];

for (const absolutePath of walkMdx(docsRoot)) {
  const relativePath = path.relative(repoRoot, absolutePath).split(path.sep).join('/');
  const content = fs.readFileSync(absolutePath, 'utf8');
  const description = getFrontmatterDescription(content);
  const firstParagraph = getFirstParagraph(content);
  const normalizedContent = normalizeText(content).toLowerCase();

  for (const phrase of bannedPhrases) {
    if (normalizedContent.includes(phrase)) {
      failures.push(`${relativePath}: banned phrase "${phrase}"`);
    }
  }

  if (description && firstParagraph && normalizeText(description) === normalizeText(firstParagraph)) {
    failures.push(`${relativePath}: first paragraph duplicates frontmatter description`);
  }
}

if (failures.length > 0) {
  console.error('Docs content checks failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Docs content checks passed.');
