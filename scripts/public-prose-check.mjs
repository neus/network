#!/usr/bin/env node
/**
 * Fail if disallowed jargon appears in public-facing prose under this repo.
 * Run from network repo root: node scripts/public-prose-check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const BANNED = [{ word: /\bcanonical\b/gi, label: "canonical" }];

const ROOTS = [
  path.join(ROOT, "docs"),
  path.join(ROOT, "sdk"),
  path.join(ROOT, "spec", "verifiers"),
];

const EXT = new Set([".md", ".html", ".mdx"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name === "node_modules" || name.name === ".git") continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function allowLine(line) {
  const t = line.trim();
  if (t.includes("alternates:") && t.includes("canonical")) return true;
  if (t.includes("canonicalUrl")) return true;
  if (t.includes("canonicalAgentKey")) return true;
  if (t.includes("canonicalAgentId")) return true;
  if (t.includes("canonicalProofPayload")) return true;
  if (t.includes("canonical_json")) return true;
  if (t.includes("CanonicalSubset")) return true;
  return false;
}

let errors = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const ext = path.extname(file);
    if (!EXT.has(ext)) continue;
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (allowLine(line)) return;
      for (const { word, label } of BANNED) {
        word.lastIndex = 0;
        if (word.test(line)) {
          console.error(`${path.relative(ROOT, file)}:${i + 1}: disallowed "${label}" in public prose`);
          errors++;
        }
      }
    });
  }
}

if (errors) {
  console.error(`\npublic-prose-check: ${errors} issue(s)`);
  process.exit(1);
}
console.log("public-prose-check: OK");
