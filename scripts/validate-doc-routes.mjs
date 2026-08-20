#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = path.join(repoRoot, 'docs');
const config = JSON.parse(fs.readFileSync(path.join(docsRoot, 'docs.json'), 'utf8'));
const errors = [];

function walkFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(target) : [target];
  });
}

function collectPageIds(value, ids = []) {
  if (Array.isArray(value)) {
    for (const entry of value) collectPageIds(entry, ids);
    return ids;
  }
  if (!value || typeof value !== 'object') return ids;
  if (Array.isArray(value.pages)) {
    for (const page of value.pages) {
      if (typeof page === 'string') ids.push(page);
    }
  }
  for (const child of Object.values(value)) collectPageIds(child, ids);
  return ids;
}

function pageRoute(pageId) {
  const withoutIndex = pageId.replace(/\/index$/, '');
  return withoutIndex ? `/${withoutIndex}` : '/';
}

function pageFile(pageId) {
  return path.join(docsRoot, `${pageId}.mdx`);
}

const pageIds = [...new Set(collectPageIds(config.navigation))];
const routes = new Set(['/']);
for (const pageId of pageIds) {
  routes.add(pageRoute(pageId));
  if (!fs.existsSync(pageFile(pageId))) {
    errors.push(`Navigation page is missing: docs/${pageId}.mdx`);
  }
}

const mdxFiles = walkFiles(docsRoot).filter(file => file.endsWith('.mdx'));
for (const file of mdxFiles) {
  const relative = path.relative(docsRoot, file).replaceAll(path.sep, '/').replace(/\.mdx$/, '');
  routes.add(pageRoute(relative));
}

function readFrontmatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    errors.push(`${path.relative(repoRoot, file)} is missing frontmatter`);
    return null;
  }

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^(title|description):\s*(.+?)\s*$/);
    if (!field) continue;
    fields[field[1]] = field[2].replace(/^(["'])([\s\S]*)\1$/, '$2').trim();
  }

  return { fields, body: source.slice(match[0].length) };
}

const uniqueFrontmatterFields = new Map([
  ['title', new Map()],
  ['description', new Map()],
]);

for (const file of mdxFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const frontmatter = readFrontmatter(source, file);
  if (!frontmatter) continue;

  for (const [fieldName, seenValues] of uniqueFrontmatterFields) {
    const value = frontmatter.fields[fieldName];
    if (!value) {
      errors.push(`${path.relative(repoRoot, file)} is missing frontmatter ${fieldName}`);
      continue;
    }

    const normalizedValue = value.toLocaleLowerCase('en-US');
    const firstFile = seenValues.get(normalizedValue);
    if (firstFile) {
      errors.push(
        `Duplicate ${fieldName} "${value}": ${path.relative(repoRoot, firstFile)} and ${path.relative(repoRoot, file)}`,
      );
    } else {
      seenValues.set(normalizedValue, file);
    }
  }

  const description = frontmatter.fields.description;
  if (description && frontmatter.body.includes(description)) {
    errors.push(`${path.relative(repoRoot, file)} repeats its frontmatter description verbatim in the page body`);
  }
}

const redirects = Array.isArray(config.redirects) ? config.redirects : [];
const redirectSources = new Set(redirects.map(row => row.source));
for (const redirect of redirects) {
  const destination = String(redirect.destination || '').split(/[?#]/, 1)[0];
  if (!destination || destination.includes(':')) continue;
  if (!routes.has(destination) && !redirectSources.has(destination)) {
    errors.push(`Redirect destination is missing: ${redirect.source} -> ${destination}`);
  }
}

const installRedirect = redirects.find(row => row.source === '/install');
if (installRedirect?.destination !== '/mcp/setup') {
  errors.push('/install must redirect to /mcp/setup');
}
for (const removedPage of ['mcp/ide-plugin', 'mcp/journeys', 'brand-kit', 'agents/a2a', 'platform/environments']) {
  if (pageIds.includes(removedPage)) errors.push(`Removed page remains in navigation: ${removedPage}`);
}

function normalizeDocsRoute(rawHref, sourceFile) {
  const href = String(rawHref || '').trim();
  if (!href || href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href)) return null;
  const withoutSuffix = href.split(/[?#]/, 1)[0];
  if (!withoutSuffix) return null;
  if (withoutSuffix.startsWith('/')) return path.posix.normalize(withoutSuffix);

  const sourceRelative = path.relative(docsRoot, sourceFile).replaceAll(path.sep, '/');
  const sourceRouteDir = path.posix.dirname(`/${sourceRelative.replace(/\.mdx$/, '')}`);
  return path.posix.normalize(path.posix.join(sourceRouteDir, withoutSuffix.replace(/\.mdx$/, '')));
}

const hrefPatterns = [/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, /\bhref=["']([^"']+)["']/g];
for (const file of mdxFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const pattern of hrefPatterns) {
    for (const match of source.matchAll(pattern)) {
      const route = normalizeDocsRoute(match[1], file);
      if (!route || routes.has(route) || redirectSources.has(route)) continue;

      const relativeTarget = path.resolve(path.dirname(file), match[1].split(/[?#]/, 1)[0]);
      if (fs.existsSync(relativeTarget)) continue;
      errors.push(`${path.relative(repoRoot, file)} links to missing route ${route}`);
    }
  }
}

for (const option of config.contextual?.options || []) {
  if (!option || typeof option !== 'object') continue;
  const href = String(option.href || '');
  if (href.startsWith('/') && !routes.has(href) && !redirectSources.has(href)) {
    errors.push(`Contextual link is missing: ${href}`);
  }
}

if (errors.length > 0) {
  console.error(`Docs route validation failed:\n- ${[...new Set(errors)].join('\n- ')}`);
  process.exit(1);
}

console.log(`Docs routes valid: ${pageIds.length} navigation pages, ${redirects.length} redirects, ${mdxFiles.length} MDX files.`);
