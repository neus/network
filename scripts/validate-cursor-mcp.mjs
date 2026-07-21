#!/usr/bin/env node
// Validates that plugin mcp.json files use the Cursor-native shape.
// Cursor's mcp.json schema expects { "mcpServers": { "name": { "url": "...", "headers?": {...} } } }
// and rejects the spec { type: "http", authorization: {...} } shape that other hosts use.
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

async function validatePluginMcp(pluginDir, { requireFile = false } = {}) {
  const mcpPath = path.join(pluginDir, "mcp.json");
  const relative = path.relative(repoRoot, mcpPath);
  if (!(await pathExists(mcpPath))) {
    if (requireFile) {
      addError(`${relative}: missing Cursor-native mcp.json (required when the plugin ships hosted MCP).`);
    }
    return;
  }
  let mcp;
  try {
    mcp = await readJsonFile(mcpPath);
  } catch (error) {
    addError(`${relative}: invalid JSON ΓÇö ${error.message}`);
    return;
  }

  if (!mcp.mcpServers || typeof mcp.mcpServers !== "object" || Array.isArray(mcp.mcpServers)) {
    addError(`${relative}: mcpServers must be an object keyed by server name.`);
    return;
  }

  const allowedServerKeys = new Set(["url", "headers"]);
  for (const [name, server] of Object.entries(mcp.mcpServers)) {
    if (!server || typeof server !== "object" || Array.isArray(server)) {
      addError(`${relative}.mcpServers.${name}: must be an object.`);
      continue;
    }

    const extraKeys = Object.keys(server).filter((key) => !allowedServerKeys.has(key));
    if (extraKeys.length > 0) {
      addError(
        `${relative}.mcpServers.${name}: Cursor mcp.json does not support ${extraKeys.map((k) => `"${k}"`).join(", ")}. Use only "url" and "headers".`
      );
    }

    if (!isValidHttpsUrl(server.url)) {
      addError(`${relative}.mcpServers.${name}: "url" must be a valid https:// URL.`);
    }

    if (server.headers && typeof server.headers !== "object") {
      addError(`${relative}.mcpServers.${name}: "headers" must be an object.`);
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

  const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pluginDir = path.join(pluginsDir, entry.name);
    // Dual-host packaging: Cursor discovers mcp.json; Claude/Codex use .mcp.json.
    // If either file exists (or this is the neus-trust plugin), require Cursor-native mcp.json.
    const hasSpecMcp = await pathExists(path.join(pluginDir, ".mcp.json"));
    const requireFile = entry.name === "neus-trust" || hasSpecMcp;
    await validatePluginMcp(pluginDir, { requireFile });
  }

  summarizeAndExit();
}

function summarizeAndExit() {
  if (errors.length > 0) {
    console.error("Cursor mcp.json validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Cursor mcp.json validation passed.");
}

await main();

