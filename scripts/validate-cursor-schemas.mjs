#!/usr/bin/env node
// Validates .cursor-plugin/marketplace.json and plugins/*/.cursor-plugin/plugin.json
// against the OFFICIAL Cursor plugin + marketplace JSON Schemas (draft-07).
// Sources:
//   https://raw.githubusercontent.com/cursor/plugins/main/schemas/plugin.schema.json
//   https://raw.githubusercontent.com/cursor/plugins/main/schemas/marketplace.schema.json
//
// Unlike scripts/validate-template.mjs (which only checks structural presence), this
// script enforces additionalProperties:false and field-type constraints the way
// Cursor's real marketplace ingestion does. Run before every marketplace submission.
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

// Ajv is a dev-only convenience; fall back to a hand-rolled draft-07 checker so the
// script works in CI without an extra dependency. The hand-rolled checker covers the
// subset of draft-07 features the official Cursor schemas use: type, required,
// additionalProperties:false, pattern, format (uri/email), $ref to $defs, oneOf.
const errors = [];

function fail(msg) {
  errors.push(msg);
}

function isString(v) {
  return typeof v === "string";
}

function matchesPattern(v, re) {
  return isString(v) && re.test(v);
}

const uriRe = /^https?:\/\//i;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkFormat(value, format) {
  if (!format) return true;
  if (format === "uri") return isString(value) && uriRe.test(value);
  if (format === "email") return isString(value) && emailRe.test(value);
  return true;
}

function validateValue(schema, value, ctx, defs) {
  if (!schema || typeof schema !== "object") return true;
  let ok = true;
  if (schema.$ref) {
    const ref = schema.$ref.replace(/^#\/\$defs\//, "");
    const def = defs && defs[ref];
    if (!def) {
      fail(`${ctx}: unresolved $ref ${schema.$ref}`);
      return false;
    }
    return validateValue(def, value, ctx, defs);
  }
  if (schema.oneOf) {
    const matched = schema.oneOf.some((s) => {
      const before = errors.length;
      const r = validateValue(s, value, ctx, defs);
      return r && errors.length === before;
    });
    if (!matched) {
      fail(`${ctx}: value did not match any oneOf branch`);
      return false;
    }
    return true;
  }
  if (schema.type) {
    if (schema.type === "object") {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        fail(`${ctx}: expected object`);
        return false;
      }
    } else if (schema.type === "string") {
      if (!isString(value)) {
        fail(`${ctx}: expected string`);
        return false;
      }
    } else if (schema.type === "array") {
      if (!Array.isArray(value)) {
        fail(`${ctx}: expected array`);
        return false;
      }
    } else if (schema.type === "boolean") {
      if (typeof value !== "boolean") {
        fail(`${ctx}: expected boolean`);
        return false;
      }
    }
  }
  if (schema.minLength !== undefined && isString(value) && value.length < schema.minLength) {
    fail(`${ctx}: shorter than minLength ${schema.minLength}`);
    ok = false;
  }
  if (schema.pattern && isString(value)) {
    const re = new RegExp(schema.pattern.slice(1, -1).replace(/\\"/g, '"'));
    if (!re.test(value)) {
      fail(`${ctx}: does not match pattern ${schema.pattern}`);
      ok = false;
    }
  }
  if (schema.format && !checkFormat(value, schema.format)) {
    fail(`${ctx}: invalid format ${schema.format} for "${value}"`);
    ok = false;
  }
  if (schema.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    if (schema.required) {
      for (const r of schema.required) {
        if (!(r in value)) {
          fail(`${ctx}: missing required property "${r}"`);
          ok = false;
        }
      }
    }
    if (schema.additionalProperties === false && schema.properties) {
      const allowed = new Set(Object.keys(schema.properties));
      for (const k of Object.keys(value)) {
        if (!allowed.has(k)) {
          fail(`${ctx}: additional property "${k}" not allowed`);
          ok = false;
        }
      }
    }
    if (schema.properties) {
      for (const [k, sub] of Object.entries(schema.properties)) {
        if (k in value) {
          const subOk = validateValue(sub, value[k], `${ctx}.${k}`, defs);
          ok = ok && subOk;
        }
      }
    }
  }
  if (schema.type === "array" && Array.isArray(value)) {
    if (schema.items) {
      value.forEach((item, i) => {
        const itemOk = validateValue(schema.items, item, `${ctx}[${i}]`, defs);
        ok = ok && itemOk;
      });
    }
  }
  return ok;
}

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

async function main() {
  const repoRoot = process.cwd();
  const marketplaceSchemaPath = path.join(repoRoot, "schemas", "marketplace.schema.json");
  const pluginSchemaPath = path.join(repoRoot, "schemas", "plugin.schema.json");

  const marketplaceSchema = await readJson(marketplaceSchemaPath);
  const pluginSchema = await readJson(pluginSchemaPath);

  const marketplace = await readJson(path.join(repoRoot, ".cursor-plugin", "marketplace.json"));
  validateValue(marketplaceSchema, marketplace, "marketplace.json", marketplaceSchema.$defs || {});

  const pluginRoots = (marketplace.plugins || []).map((p) => p.source);
  for (const root of pluginRoots) {
    const pluginPath = path.join(repoRoot, root, ".cursor-plugin", "plugin.json");
    try {
      const plugin = await readJson(pluginPath);
      validateValue(pluginSchema, plugin, `${root}/.cursor-plugin/plugin.json`, pluginSchema.$defs || {});
    } catch (e) {
      fail(`${root}/.cursor-plugin/plugin.json: ${e.message}`);
    }
  }

  if (errors.length > 0) {
    console.error("Schema validation failed:");
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
  }
  console.log("Official Cursor schema validation passed.");
}

await main();