#!/usr/bin/env node
// Validates the Claude Code and Codex plugin manifests alongside the
// spec-compliant .mcp.json (the shape Claude Code and Codex consume).
//
// Claude Code:  .claude-plugin/marketplace.json + plugins/*/.claude-plugin/plugin.json + plugins/*/.mcp.json
// Codex:        .agents/plugins/marketplace.json + plugins/*/.codex-plugin/plugin.json (references .mcp.json)
//
// The spec-compliant .mcp.json uses { "mcpServers": { "name": { "type": "http", "url": "...", "headers?": {...} } } }.
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const errors = [];

function addError(message) {
  errors.push(message);
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function isValidHttpsUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

// Validate the spec-compliant .mcp.json (type: "http" required by Claude/Codex).
async function validateSpecMcp(pluginDir, hostLabel) {
  const mcpPath = path.join(pluginDir, ".mcp.json");
  const relative = path.relative(repoRoot, mcpPath);
  if (!(await pathExists(mcpPath))) {
    addError(`${hostLabel}: missing spec-compliant ${relative}.`);
    return;
  }

  let mcp;
  try {
    mcp = await readJsonFile(mcpPath);
  } catch (error) {
    addError(`${relative}: invalid JSON — ${error.message}`);
    return;
  }

  if (!mcp.mcpServers || typeof mcp.mcpServers !== "object" || Array.isArray(mcp.mcpServers)) {
    addError(`${relative}: mcpServers must be an object keyed by server name.`);
    return;
  }

  for (const [name, server] of Object.entries(mcp.mcpServers)) {
    if (!server || typeof server !== "object" || Array.isArray(server)) {
      addError(`${relative}.mcpServers.${name}: must be an object.`);
      continue;
    }
    if (server.type !== "http") {
      addError(`${relative}.mcpServers.${name}: "type" must be "http" for spec-compliant hosts.`);
    }
    if (!isValidHttpsUrl(server.url)) {
      addError(`${relative}.mcpServers.${name}: "url" must be a valid https:// URL.`);
    }
    if (server.headers && typeof server.headers !== "object") {
      addError(`${relative}.mcpServers.${name}: "headers" must be an object.`);
    }
  }
}

// Validate Claude Code marketplace + plugin manifests.
async function validateClaudeMarketplace() {
  const marketplacePath = path.join(repoRoot, ".claude-plugin", "marketplace.json");
  if (!(await pathExists(marketplacePath))) {
    addError("Claude Code: missing .claude-plugin/marketplace.json");
    return;
  }

  const marketplace = await readJsonFile(marketplacePath);
  if (!marketplace.owner || typeof marketplace.owner.name !== "string") {
    addError(".claude-plugin/marketplace.json: owner.name is required.");
  }
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    addError(".claude-plugin/marketplace.json: plugins must be a non-empty array.");
    return;
  }

  for (const [index, entry] of marketplace.plugins.entries()) {
    if (typeof entry.name !== "string" || entry.name.length === 0) {
      addError(`.claude-plugin/marketplace.json plugins[${index}].name is required.`);
      continue;
    }
    const pluginDir = path.join(repoRoot, entry.source);
    const pluginManifestPath = path.join(pluginDir, ".claude-plugin", "plugin.json");
    if (!(await pathExists(pluginManifestPath))) {
      addError(`${entry.name}: missing .claude-plugin/plugin.json`);
      continue;
    }
    const manifest = await readJsonFile(pluginManifestPath);
    if (manifest.name !== entry.name) {
      addError(`${entry.name}: marketplace entry name does not match .claude-plugin/plugin.json name ("${manifest.name}").`);
    }
    if (typeof manifest.version !== "string" || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      addError(`${entry.name}: .claude-plugin/plugin.json version must be semver.`);
    }
  }
}

// Validate Codex marketplace + plugin manifest.
async function validateCodexMarketplace() {
  const marketplacePath = path.join(repoRoot, ".agents", "plugins", "marketplace.json");
  if (!(await pathExists(marketplacePath))) {
    addError("Codex: missing .agents/plugins/marketplace.json");
    return;
  }

  const marketplace = await readJsonFile(marketplacePath);
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    addError(".agents/plugins/marketplace.json: plugins must be a non-empty array.");
    return;
  }

  for (const [index, entry] of marketplace.plugins.entries()) {
    if (typeof entry.name !== "string" || entry.name.length === 0) {
      addError(`.agents/plugins/marketplace.json plugins[${index}].name is required.`);
      continue;
    }
    const pluginDir = path.join(repoRoot, entry.source?.path ?? entry.source);
    const pluginManifestPath = path.join(pluginDir, ".codex-plugin", "plugin.json");
    if (!(await pathExists(pluginManifestPath))) {
      addError(`${entry.name}: missing .codex-plugin/plugin.json`);
      continue;
    }
    const manifest = await readJsonFile(pluginManifestPath);
    if (manifest.name !== entry.name) {
      addError(`${entry.name}: marketplace entry name does not match .codex-plugin/plugin.json name ("${manifest.name}").`);
    }
    if (typeof manifest.version !== "string" || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      addError(`${entry.name}: .codex-plugin/plugin.json version must be semver.`);
    }
    if (!manifest.interface || typeof manifest.interface.displayName !== "string") {
      addError(`${entry.name}: .codex-plugin/plugin.json interface.displayName is required for marketplace rendering.`);
    }
  }
}

async function main() {
  const pluginsDir = path.join(repoRoot, "plugins");
  if (!(await pathExists(pluginsDir))) {
    addError(`plugins directory not found: ${pluginsDir}`);
    summarizeAndExit();
    return;
  }

  await validateClaudeMarketplace();
  await validateCodexMarketplace();

  const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await validateSpecMcp(path.join(pluginsDir, entry.name), entry.name);
    }
  }

  summarizeAndExit();
}

function summarizeAndExit() {
  if (errors.length > 0) {
    console.error("Claude + Codex manifest validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }
  console.log("Claude + Codex manifest validation passed.");
}

await main();