#!/usr/bin/env node
import { exec, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NEUS_MCP_SERVER_NAME,
  NEUS_MCP_URL,
  buildCursorMcpConfig,
  buildVsCodeMcpConfig,
  buildNeusMcpHttpConfig
} from '../mcp-hosts.js';
import {
  resolveRuntimeBundleFromMcp,
  RUNTIME_MOUNT_SCHEMA,
  normalizeWallet,
  evaluateMountFileHealth
} from '../runtime-mount.js';
import { applyRuntimeBundle, readMountManifest } from '../runtime-adapters.js';

const __cliDir = path.dirname(fileURLToPath(import.meta.url));
const CLI_PACKAGE_VERSION = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(__cliDir, '..', 'package.json'), 'utf8')).version;
  } catch {
    return '0.0.0';
  }
})();

const NEUS_APP_URL = 'https://neus.network';
const NEUS_TOKEN_ENDPOINT = 'https://neus.network/api/v1/auth/mcp/token';
const NEUS_DISCONNECT_ENDPOINT = 'https://neus.network/api/v1/auth/mcp/revoke';
const NEUS_PROFILE_KEY_ENDPOINT = 'https://api.neus.network/api/v1/auth/profile-key';
const SUPPORTED_CLIENTS = ['claude', 'codex', 'cursor', 'vscode'];
const PROJECT_CLIENTS = ['claude', 'cursor', 'vscode'];
const CODEX_OAUTH_SCOPES = 'neus:core,neus:profile,neus:secrets,offline_access';
const IMPORT_SCHEMA = 'neus.portable-agent.v1';
const SUPPORTED_IMPORT_SOURCES = [
  'auto',
  'cursor',
  'claude-code',
  'claude-desktop'
];
const SUPPORTED_EXPORT_FORMATS = ['manifest', 'json'];

// ---------------------------------------------------------------------------
// OAuth token store (~/.neus/mcp-tokens.json — gitignored user-scope cache)
// ---------------------------------------------------------------------------
// Holds the refresh token returned alongside the short-lived OAuth access
// token. Powers the `neus refresh` escape hatch: when an IDE MCP client's
// own OAuth refresh has a bug, `neus refresh` rotates the access token in one
// command instead of a full browser re-auth. The primary refresh path is the
// IDE's native OAuth client; a URL-only mcp.json config lets the host run
// discovery, PKCE, and silent refresh itself.
//
// Never committed (lives under ~/.neus/). Never written into mcp.json. Refresh
// tokens rotate on each use; `neus refresh` is a user-run fallback, not a
// background daemon.
const NEUS_HOME_DIR = path.join(os.homedir(), '.neus');
const NEUS_TOKEN_STORE_PATH = path.join(NEUS_HOME_DIR, 'mcp-tokens.json');
const NEUS_OAUTH_CLIENT_ID = 'neus-cli';
const NEUS_MCP_RESOURCE = 'https://mcp.neus.network/mcp';

function readTokenStore() {
  try {
    const raw = fs.readFileSync(NEUS_TOKEN_STORE_PATH, 'utf8').trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeTokenStore(store) {
  if (!store || typeof store !== 'object') return;
  try {
    fs.mkdirSync(NEUS_HOME_DIR, { recursive: true });
    fs.writeFileSync(NEUS_TOKEN_STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 });
  } catch {
    // Non-blocking: refresh fallback is insurance, not the primary auth path.
  }
}

function clearTokenStore() {
  try {
    fs.unlinkSync(NEUS_TOKEN_STORE_PATH);
  } catch {
    // Non-blocking: file may not exist.
  }
}

function tokenExpiresAt(expiresIn) {
  const seconds = Number(expiresIn);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return Date.now() + seconds * 1000;
}

function isTokenExpired(store) {
  if (!store?.expiresAt) return true;
  return Date.now() >= (store.expiresAt - 60_000);
}

function persistOAuthTokens(tokenJson, clientId, resource) {
  const refreshToken = String(tokenJson?.refresh_token || '').trim();
  if (!refreshToken) return;
  writeTokenStore({
    accessToken: String(tokenJson?.access_token || '').trim(),
    refreshToken,
    expiresAt: tokenExpiresAt(tokenJson?.expires_in) || (Date.now() + 3600_000),
    clientId: clientId || NEUS_OAUTH_CLIENT_ID,
    resource: resource || NEUS_MCP_RESOURCE,
    scope: String(tokenJson?.scope || '').trim(),
    updatedAt: Date.now()
  });
}

async function refreshOAuthToken() {
  const store = readTokenStore();
  if (!store?.refreshToken) {
    throw new Error('No stored OAuth refresh token. Run `neus auth --oauth` first.');
  }
  const params = new URLSearchParams();
  params.set('grant_type', 'refresh_token');
  params.set('refresh_token', store.refreshToken);
  params.set('client_id', store.clientId || NEUS_OAUTH_CLIENT_ID);
  params.set('resource', store.resource || NEUS_MCP_RESOURCE);
  const resp = await fetch(NEUS_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: params.toString(),
    signal: AbortSignal.timeout(15_000)
  });
  const tokenJson = await resp.json();
  if (!tokenJson.access_token) {
    if (tokenJson.error === 'invalid_grant') clearTokenStore();
    throw new Error(tokenJson.error_description || tokenJson.error || 'Token refresh failed');
  }
  persistOAuthTokens(tokenJson, store.clientId, store.resource);
  return {
    accessToken: String(tokenJson.access_token).trim(),
    expiresAt: tokenExpiresAt(tokenJson.expires_in) || (Date.now() + 3600_000)
  };
}

const ansi = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
};

function isTruthyEnv(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function resolveColorEnabled() {
  if (isTruthyEnv(process.env.NO_COLOR)) return false;
  if (process.env.TERM === 'dumb') return false;
  return true;
}

function paint(value, color) {
  if (!resolveColorEnabled()) return String(value);
  return `${ansi[color] || ''}${value}${ansi.reset}`;
}

function terminalColumns() {
  const cols = Number(process.stderr.columns || process.stdout.columns || 0);
  if (Number.isFinite(cols) && cols >= 40) return cols;
  return 80;
}

function truncateDetail(text) {
  const raw = String(text || '');
  const max = Math.max(24, terminalColumns() - 18);
  if (raw.length <= max) return raw;
  return `${raw.slice(0, Math.max(0, max - 3))}...`;
}

function cliSymbols() {
  return { ok: 'ok', warn: '!', next: '>', skip: '-' };
}

function writeCliLine(line) {
  process.stderr.write(`${line}\n`);
}

let cliBannerEmitted = false;

function readCliVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__cliDir, '..', 'package.json'), 'utf8'));
    return String(pkg.version || '0.0.0').trim();
  } catch {
    return '0.0.0';
  }
}

function shouldEmitCliBanner(cliOptions = {}) {
  if (cliBannerEmitted) return false;
  if (cliOptions.json) return false;
  if (!process.stderr.isTTY) return false;
  return true;
}

function emitCliBanner(cliOptions = {}) {
  if (!shouldEmitCliBanner(cliOptions)) return;
  const version = readCliVersion();
  const title = paint('NEUS', 'green');
  const meta = `${paint(`v${version}`, 'dim')}${paint(' | trust that travels', 'dim')}`;
  writeCliLine('');
  writeCliLine(`  ${title}  ${meta}`);
  writeCliLine('');
  cliBannerEmitted = true;
}

function logStep(kind, label, detail = '') {
  const symbols = cliSymbols();
  const iconKey = kind === 'ok' ? 'ok' : kind === 'warn' ? 'warn' : kind === 'next' ? 'next' : 'skip';
  const iconColor = kind === 'ok' ? 'green' : kind === 'warn' ? 'yellow' : kind === 'next' ? 'cyan' : 'dim';
  const iconCell = symbols[iconKey].padEnd(2);
  const icon = paint(iconCell, iconColor);
  const name = paint(String(label).padEnd(10), 'cyan');
  const suffix = detail ? `  ${paint(truncateDetail(detail), 'dim')}` : '';
  writeCliLine(`  ${icon} ${name}${suffix}`);
}

function writeGuidanceLine(text) {
  writeCliLine(`  ${paint('-', 'dim')} ${text}`);
}

function describeClientResult(command, result) {
  if (result.dryRun && result.changed) {
    if (result.client === 'codex') {
      return `would update ${result.targetPath || '~/.codex/config.toml'}`;
    }
    return 'would update';
  }
  if (result.client === 'codex' && result.configured) {
    if (command === 'auth') {
      return result.authConfigured ? 'Codex OAuth complete' : 'Codex MCP config ready';
    }
    return `Codex MCP config: ${result.targetPath || '~/.codex/config.toml'}`;
  }
  if (result.changed) return 'updated';
  if (result.authConfigured) return 'signed in';
  if (result.configured) return 'ready';
  return 'ready';
}

function printBuilderGuidance(command, results) {
  if (!['setup', 'auth', 'check'].includes(command)) return;
  const hasCodex = results.some(result => result.client === 'codex');
  writeCliLine('');
  writeCliLine(paint('Next steps', 'cyan'));
  writeGuidanceLine('Run `npx -y -p @neus/sdk neus examples` for assistant prompts.');
  if (hasCodex) {
    writeGuidanceLine('Codex OAuth: `neus auth --client codex` or `codex mcp login neus`.');
  }
  writeGuidanceLine('Ask your assistant: "Use NEUS Verify before taking sensitive actions."');
}

function selectedClientNames(results) {
  return results.map(result => result.client).filter(Boolean);
}

function preferredSetupCommand(results) {
  const clients = selectedClientNames(results);
  const suffix = clients.length === 1 ? ` --client ${clients[0]}` : '';
  return `npx -y -p @neus/sdk neus setup${suffix}`;
}

function preferredAuthCommand(results) {
  const clients = selectedClientNames(results);
  if (clients.length === 1 && clients[0] === 'codex') {
    return 'npx -y -p @neus/sdk neus auth --client codex';
  }
  return 'npx -y -p @neus/sdk neus auth';
}

function printStatusGuidance(results) {
  writeCliLine('');
  writeCliLine(paint('MCP endpoint', 'cyan'));
  writeGuidanceLine(NEUS_MCP_URL);
  writeCliLine(paint('Profile connection', 'cyan'));
  if (results.some(result => result.configured)) {
    writeGuidanceLine('Saved config found. Run `npx -y -p @neus/sdk neus check` to confirm live connection.');
  } else {
    writeGuidanceLine(`No selected MCP host is configured yet. Run \`${preferredSetupCommand(results)}\`.`);
  }
}

function printHostAuthIntro(host, cliOptions = {}) {
  if (cliOptions.json) return;
  emitCliBanner(cliOptions);
  writeCliLine(paint('auth', 'green'));
  if (host === 'codex') {
    logStep('next', 'codex', 'starting Codex-owned MCP OAuth');
    logStep('next', 'command', 'codex mcp login neus');
    writeCliLine('');
  }
}

function printFlowSummary(command, scope, results, { nextStep = '', cliOptions = {} } = {}) {
  emitCliBanner(cliOptions);
  writeCliLine(paint(String(command), 'green'));

  for (const result of results) {
    const client = result.client;
    if (result.error) {
      logStep('warn', client, result.error);
      continue;
    }
    if (result.configured) {
      const detail = describeClientResult(command, result);
      logStep('ok', client, detail);
      continue;
    }
    if (result.authConfigured === null) {
      logStep('skip', client, 'not installed');
      continue;
    }
    logStep('skip', client, 'not configured');
  }

  if (nextStep) {
    writeCliLine('');
    logStep('next', 'next', nextStep);
  }
  if (command === 'status') {
    printStatusGuidance(results);
  }
  printBuilderGuidance(command, results);
  writeCliLine('');
}

function printAuthBrowserIntro(authUrl, cliOptions = {}) {
  emitCliBanner(cliOptions);
  writeCliLine(paint('auth', 'green'));
  logStep('next', 'sign-in', 'opens in your browser');
  writeCliLine('');
  writeCliLine(`  ${paint(truncateDetail(authUrl), 'dim')}`);
  writeCliLine('');
}

function parseBearerHeader(value) {
  const raw = String(value || '').trim();
  if (!raw.toLowerCase().startsWith('bearer ')) return '';
  return raw.slice(7).trim();
}

function readCursorBearer(scope, cwd) {
  const targetPath = cursorConfigPath(scope, cwd);
  if (!fileExists(targetPath)) return '';
  const doc = readJsonFile(targetPath, {});
  return parseBearerHeader(doc.mcpServers?.[NEUS_MCP_SERVER_NAME]?.headers?.Authorization);
}

function readVsCodeBearer(scope, cwd) {
  const targetPath = vscodeConfigPath(scope, cwd);
  if (!fileExists(targetPath)) return '';
  const doc = readJsonFile(targetPath, {});
  return parseBearerHeader(doc.servers?.[NEUS_MCP_SERVER_NAME]?.headers?.Authorization);
}

function readClaudeBearer(scope, cwd) {
  if (scope === 'project') {
    const targetPath = claudeProjectConfigPath(cwd);
    if (!fileExists(targetPath)) return '';
    const doc = readJsonFile(targetPath, {});
    return parseBearerHeader(doc.mcpServers?.[NEUS_MCP_SERVER_NAME]?.headers?.Authorization);
  }
  if (!commandExists('claude')) return '';
  const result = spawnSync('claude', ['mcp', 'list'], {
    encoding: 'utf8',
    env: process.env
  });
  if (result.status !== 0) return '';
  const lines = String(result.stdout || '').split(/\r?\n/);
  if (!lines.includes(NEUS_MCP_SERVER_NAME)) return '';
  const statePath = process.env.NEUS_TEST_CLAUDE_STATE;
  if (statePath && fileExists(statePath)) {
    const state = readJsonFile(statePath, { servers: {} });
    const headers = state.servers?.[NEUS_MCP_SERVER_NAME]?.headers || [];
    const authLine = headers.find(line => String(line).toLowerCase().startsWith('authorization:'));
    if (authLine) {
      return parseBearerHeader(authLine.replace(/^authorization:\s*/i, ''));
    }
  }
  return '';
}

function readInstalledAccessKey(scope, cwd) {
  for (const reader of [readCursorBearer, readVsCodeBearer, readClaudeBearer]) {
    const token = reader(scope, cwd);
    if (token) return token;
  }
  return '';
}

function envAccessKey() {
  return String(process.env.NEUS_ACCESS_KEY || '').trim();
}

/** --access-key flag, else NEUS_ACCESS_KEY from the environment, else browser sign-in. */
function resolveAccessKey(options) {
  if (options?.oauth) return '';
  const explicit = String(options.accessKey || '').trim();
  if (explicit) return explicit;
  return envAccessKey();
}

/** --access-key, IDE MCP config, then NEUS_ACCESS_KEY from the environment. */
function resolveLiveAccessKey(options, scope, cwd) {
  const explicit = String(options.accessKey || '').trim();
  if (explicit) return explicit;
  const installed = readInstalledAccessKey(scope, cwd);
  if (installed) return installed;
  // Browser OAuth stores the access token in ~/.neus/mcp-tokens.json (not in
  // the IDE config, which is URL-only for IDE-native OAuth). Use it as a
  // fallback so `doctor --live` can probe the MCP server with a real credential.
  const store = readTokenStore();
  if (store?.accessToken && !isTokenExpired(store)) {
    return store.accessToken;
  }
  if (options?.oauth) return '';
  return envAccessKey();
}

function resolveAuthMethod(options, accessKey) {
  if (!accessKey) return 'browser';
  if (String(options.accessKey || '').trim()) return 'access-key';
  return 'env-key';
}

function fileExists(targetPath) {
  try {
    fs.accessSync(targetPath);
    return true;
  } catch {
    return false;
  }
}

function jsonStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function readJsonFile(targetPath, fallback) {
  if (!fileExists(targetPath)) return fallback;
  const raw = fs.readFileSync(targetPath, 'utf8').trim();
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${targetPath}`);
    }
    throw error;
  }
}

function writeJsonFile(targetPath, nextValue, dryRun) {
  const serialized = jsonStringify(nextValue);
  const hadExistingFile = fileExists(targetPath);
  const previous = hadExistingFile ? fs.readFileSync(targetPath, 'utf8') : null;
  const changed = previous !== serialized;
  const backupPath = hadExistingFile && changed ? `${targetPath}.bak` : null;

  if (!dryRun && changed) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    if (backupPath) {
      fs.copyFileSync(targetPath, backupPath);
    }
    fs.writeFileSync(targetPath, serialized, 'utf8');
  }

  return {
    changed,
    targetPath,
    backupPath,
    dryRun
  };
}

function readTextFile(targetPath) {
  if (!fileExists(targetPath)) return '';
  return fs.readFileSync(targetPath, 'utf8');
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function statBytes(targetPath) {
  try {
    return fs.statSync(targetPath).size;
  } catch {
    return 0;
  }
}

function listDirectoryNames(targetPath) {
  if (!fileExists(targetPath)) return [];
  try {
    return fs
      .readdirSync(targetPath, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function listFileNames(targetPath, extensions) {
  if (!fileExists(targetPath)) return [];
  try {
    return fs
      .readdirSync(targetPath, { withFileTypes: true })
      .filter(entry => entry.isFile())
      .map(entry => entry.name)
      .filter(name => extensions.some(extension => name.toLowerCase().endsWith(extension)))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function safeReadJson(targetPath, warnings) {
  if (!fileExists(targetPath)) return null;
  try {
    return readJsonFile(targetPath, null);
  } catch (error) {
    warnings.push(`Skipped malformed JSON at ${targetPath}: ${errorMessage(error)}`);
    return null;
  }
}

function portablePath(targetPath) {
  const homeDir = os.homedir();
  const cwd = process.cwd();
  const normalized = path.resolve(targetPath);
  const homeRelative = path.relative(homeDir, normalized);
  if (homeRelative && !homeRelative.startsWith('..') && !path.isAbsolute(homeRelative)) {
    return `~/${homeRelative.replaceAll(path.sep, '/')}`;
  }
  const cwdRelative = path.relative(cwd, normalized);
  if (cwdRelative && !cwdRelative.startsWith('..') && !path.isAbsolute(cwdRelative)) {
    return cwdRelative.replaceAll(path.sep, '/');
  }
  return normalized.replaceAll(path.sep, '/');
}

function instructionEntry(targetPath, name) {
  const raw = readTextFile(targetPath);
  if (!raw) return null;
  return {
    name,
    path: portablePath(targetPath),
    bytes: statBytes(targetPath),
    sha256: sha256(raw)
  };
}

function readMcpServers(targetPath, source, warnings) {
  const doc = safeReadJson(targetPath, warnings);
  if (!doc) return [];
  const mcpSection = doc.mcp && typeof doc.mcp === 'object' && !Array.isArray(doc.mcp) ? doc.mcp : null;
  const servers =
    doc.mcpServers && typeof doc.mcpServers === 'object' && !Array.isArray(doc.mcpServers)
      ? doc.mcpServers
      : mcpSection?.servers &&
          typeof mcpSection.servers === 'object' &&
          !Array.isArray(mcpSection.servers)
        ? mcpSection.servers
        : doc.servers && typeof doc.servers === 'object' && !Array.isArray(doc.servers)
          ? doc.servers
          : {};
  return Object.keys(servers)
    .sort((a, b) => a.localeCompare(b))
    .map(name => ({
      name,
      source,
      path: portablePath(targetPath),
      type:
        servers[name]?.type ||
        (servers[name]?.url ? 'http' : servers[name]?.command ? 'stdio' : 'unknown'),
      url:
        typeof servers[name]?.url === 'string' && !servers[name].headers
          ? servers[name].url
          : undefined
    }));
}

function resolveCommand(command) {
  const checker = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(checker, [command], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (result.status !== 0) return null;
  const firstMatch = result.stdout
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(Boolean);
  return firstMatch || null;
}

function runCommand(command, args, cwd, tolerateFailure = false) {
  const resolvedCommand = resolveCommand(command) || command;
  const isWindowsScript = process.platform === 'win32' && /\.(cmd|bat)$/i.test(resolvedCommand);
  const result = isWindowsScript
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', resolvedCommand, ...args], {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      })
    : spawnSync(resolvedCommand, args, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      });

  if (result.error && !tolerateFailure) {
    throw result.error;
  }

  if (result.status !== 0 && !tolerateFailure) {
    const detail =
      [result.stderr, result.stdout].find(value => typeof value === 'string' && value.trim()) || '';
    throw new Error(detail.trim() || `Command failed: ${command} ${args.join(' ')}`);
  }

  return result;
}

function commandExists(command) {
  return Boolean(resolveCommand(command));
}

function cursorInstalled() {
  const homeDir = os.homedir();
  const appData = process.env.APPDATA || '';
  const localAppData = process.env.LOCALAPPDATA || '';
  return [
    path.join(homeDir, '.cursor'),
    path.join(appData, 'Cursor'),
    path.join(localAppData, 'Programs', 'Cursor', 'Cursor.exe')
  ].some(fileExists);
}

function defaultUserClients() {
  const detected = [];
  if (commandExists('claude')) detected.push('claude');
  if (commandExists('codex')) detected.push('codex');
  if (cursorInstalled()) detected.push('cursor');
  if (commandExists('code') || fileExists(path.join(process.env.APPDATA || '', 'Code')))
    detected.push('vscode');
  return detected;
}

function parseClientOption(raw) {
  return String(raw || '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
}

function parseArgs(argv) {
  if (argv.length === 0) {
    return {
      command: 'help',
      options: {
        accessKey: '',
        clients: [],
        source: 'auto',
        format: 'manifest',
        output: '',
        live: false,
        json: false,
        dryRun: false,
        project: false
      }
    };
  }

  const command = argv[0];
  const options = {
    accessKey: '',
    clients: [],
    source: 'auto',
    format: 'manifest',
    output: '',
    live: false,
    json: false,
    dryRun: false,
    project: false,
    oauth: false,
    agent: '',
    apply: '',
    agentTarget: ''
  };

  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--json') {
      options.json = true;
      continue;
    }
    if (token === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (token === '--live') {
      options.live = true;
      continue;
    }
    if (token === '--project') {
      options.project = true;
      continue;
    }
    if (token === '--from') {
      const value = argv[index + 1];
      if (!value) throw new Error('--from requires a value');
      options.source = value.trim().toLowerCase();
      index += 1;
      continue;
    }
    if (token === '--to') {
      const value = argv[index + 1];
      if (!value) throw new Error('--to requires a value');
      options.format = value.trim().toLowerCase();
      index += 1;
      continue;
    }
    if (token === '--output') {
      const value = argv[index + 1];
      if (!value) throw new Error('--output requires a value');
      options.output = value;
      index += 1;
      continue;
    }
    if (token === '--client') {
      const value = argv[index + 1];
      if (!value) throw new Error('--client requires a value');
      options.clients.push(...parseClientOption(value));
      index += 1;
      continue;
    }
    if (token === '--access-key') {
      const value = argv[index + 1];
      if (!value) throw new Error('--access-key requires a value');
      options.accessKey = value;
      index += 1;
      continue;
    }
    if (token === '--oauth') {
      options.oauth = true;
      continue;
    }
    if (token === '--agent') {
      const value = argv[index + 1];
      if (!value) throw new Error('--agent requires a value');
      options.agent = value.trim();
      index += 1;
      continue;
    }
    if (token === '--apply') {
      const value = argv[index + 1];
      if (!value) throw new Error('--apply requires a value (cursor, claude, or codex)');
      options.apply = value.trim().toLowerCase();
      index += 1;
      continue;
    }
    if (command === 'mount' && !token.startsWith('-') && !options.agentTarget) {
      options.agentTarget = token;
      continue;
    }
    if (token === '--help' || token === '-h') {
      return { command: 'help', options };
    }
    throw new Error(`Unknown option: ${token}`);
  }

  options.accessKey = String(options.accessKey || '').trim();
  options.clients = [...new Set(options.clients)];

  return { command, options };
}

function printUsage(exitCode = 0) {
  const lines = [
    'Usage: neus <command> [options]',
    '',
    'Commands:',
    '  setup         Configure hosted NEUS MCP for supported clients',
    '  init          Configure supported MCP clients automatically',
    '  auth          Sign in (browser, or NEUS_ACCESS_KEY / --access-key when set)',
    '  refresh       Rotate the stored OAuth token using the saved refresh token',
    '  disconnect    Disconnect NEUS MCP (revoke the stored OAuth token or access key)',
    '  status        Show current NEUS MCP setup',
    '  check         Confirm setup and live NEUS connection (alias for doctor --live)',
    '  examples      Show assistant prompts to try after install',
    '  doctor        Deep check: config status, profile connection, and live MCP context',
    '  mount         Mount proof-backed agent context for any runtime',
    '  import        Detect and package supported assistant context for NEUS portability',
    '  export        Export the latest local NEUS portable agent manifest',
    '  help          Show this message',
    '',
    'Options:',
    '  --client <name[,name]>   Limit setup to claude, codex, cursor, or vscode',
    '  --project                Write shared project config instead of user config',
    '  --access-key <npk_...>   Override profile access key (else uses NEUS_ACCESS_KEY if set)',
    '  --oauth                    Force browser OAuth (ignore NEUS_ACCESS_KEY in the environment)',
    '  --from <source>          Import source: auto, cursor, claude-code, or claude-desktop',
    '  --to <format>            Export format: manifest or json',
    '  --output <path>          Write exported manifest to a specific path',
    '  --live                   Run live MCP checks (uses IDE credential or --access-key)',
    '  --agent <agentId>        Agent id for mount (also: neus mount <agentId>)',
    '  --apply <cursor|claude|codex>  Write mounted agent rules to the current project',
    '  --json                   Print JSON output',
    '  --dry-run                Preview changes without writing files'
  ];
  const stream = exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`${lines.join('\n')}\n`);
  process.exit(exitCode);
}

function assertValidClients(clients) {
  for (const client of clients) {
    if (!SUPPORTED_CLIENTS.includes(client)) {
      throw new Error(`Unsupported client: ${client}`);
    }
  }
}

function resolveScope(options) {
  return options.project ? 'project' : 'user';
}

function resolveClients(scope, requestedClients) {
  assertValidClients(requestedClients);
  if (requestedClients.length > 0) return requestedClients;
  if (scope === 'project') return [...PROJECT_CLIENTS];
  return defaultUserClients();
}

function ensureClientSelection(scope, clients) {
  if (clients.length > 0) return;
  if (scope === 'project') return;
  throw new Error(
    'No supported clients detected. Re-run with --project or use --client to target a specific client.'
  );
}

function ensureSafeAuth(command, scope, accessKey) {
  if ((command === 'auth' || command === 'setup') && scope !== 'user') {
    throw new Error(
      '`neus ${command}` only supports user scope so access keys never land in shared project config.'
    );
  }
  if (scope === 'project' && accessKey) {
    throw new Error(
      'Access keys are only supported in user scope. Remove --project or omit --access-key.'
    );
  }
}

function buildCursorServer(accessKey) {
  return buildCursorMcpConfig(accessKey);
}

function buildVsCodeServer(accessKey) {
  return buildVsCodeMcpConfig(accessKey);
}

function buildClaudeServer(accessKey) {
  return buildNeusMcpHttpConfig(accessKey);
}

function cursorConfigPath(scope, cwd) {
  return scope === 'user'
    ? path.join(os.homedir(), '.cursor', 'mcp.json')
    : path.join(cwd, '.cursor', 'mcp.json');
}

function vscodeConfigPath(scope, cwd) {
  if (scope !== 'user') {
    return path.join(cwd, '.vscode', 'mcp.json');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'mcp.json');
  }
  if (process.platform === 'win32') {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
      'Code',
      'User',
      'mcp.json'
    );
  }
  return path.join(os.homedir(), '.config', 'Code', 'User', 'mcp.json');
}

function claudeProjectConfigPath(cwd) {
  return path.join(cwd, '.mcp.json');
}

function codexConfigPath() {
  return path.join(os.homedir(), '.codex', 'config.toml');
}

function installCursor(scope, accessKey, dryRun, cwd) {
  const targetPath = cursorConfigPath(scope, cwd);
  const doc = readJsonFile(targetPath, { mcpServers: {} });
  const serverConfig = buildCursorServer(accessKey);
  const next = {
    ...doc,
    mcpServers: {
      ...(doc.mcpServers && typeof doc.mcpServers === 'object' && !Array.isArray(doc.mcpServers)
        ? doc.mcpServers
        : {}),
      [NEUS_MCP_SERVER_NAME]: serverConfig
    }
  };
  const writeResult = writeJsonFile(targetPath, next, dryRun);
  return {
    client: 'cursor',
    scope,
    configured: true,
    authConfigured: Boolean(serverConfig.headers),
    changed: writeResult.changed,
    targetPath,
    backupPath: writeResult.backupPath,
    dryRun,
    error: null
  };
}

function installVsCode(scope, accessKey, dryRun, cwd) {
  const targetPath = vscodeConfigPath(scope, cwd);
  const doc = readJsonFile(targetPath, { servers: {} });
  const serverConfig = buildVsCodeServer(accessKey);
  const next = {
    ...doc,
    servers: {
      ...(doc.servers && typeof doc.servers === 'object' && !Array.isArray(doc.servers)
        ? doc.servers
        : {}),
      [NEUS_MCP_SERVER_NAME]: serverConfig
    }
  };
  const writeResult = writeJsonFile(targetPath, next, dryRun);
  return {
    client: 'vscode',
    scope,
    configured: true,
    authConfigured: Boolean(serverConfig.headers),
    changed: writeResult.changed,
    targetPath,
    backupPath: writeResult.backupPath,
    dryRun,
    error: null
  };
}

function installClaudeProject(scope, accessKey, dryRun, cwd) {
  const targetPath = claudeProjectConfigPath(cwd);
  const doc = readJsonFile(targetPath, { mcpServers: {} });
  const serverConfig = buildClaudeServer(accessKey);
  const next = {
    ...doc,
    mcpServers: {
      ...(doc.mcpServers && typeof doc.mcpServers === 'object' && !Array.isArray(doc.mcpServers)
        ? doc.mcpServers
        : {}),
      [NEUS_MCP_SERVER_NAME]: serverConfig
    }
  };
  const writeResult = writeJsonFile(targetPath, next, dryRun);
  return {
    client: 'claude',
    scope,
    configured: true,
    authConfigured: Boolean(serverConfig.headers),
    changed: writeResult.changed,
    targetPath,
    backupPath: writeResult.backupPath,
    dryRun,
    error: null
  };
}

function installClaudeUser(scope, accessKey, dryRun, cwd) {
  if (!commandExists('claude')) {
    throw new Error('Claude Code CLI is not installed or not on PATH.');
  }

  if (!dryRun) {
    runCommand('claude', ['mcp', 'remove', '--scope', 'user', NEUS_MCP_SERVER_NAME], cwd, true);
    const addArgs = [
      'mcp',
      'add',
      '--transport',
      'http',
      '--scope',
      'user',
      NEUS_MCP_SERVER_NAME,
      NEUS_MCP_URL
    ];
    if (accessKey) {
      addArgs.push('--header', `Authorization: Bearer ${accessKey}`);
    }
    runCommand('claude', addArgs, cwd);
  }

  return {
    client: 'claude',
    scope,
    configured: true,
    authConfigured: Boolean(accessKey),
    changed: true,
    targetPath: '~/.claude.json',
    backupPath: null,
    dryRun,
    error: null
  };
}

function installClaude(scope, accessKey, dryRun, cwd) {
  if (scope === 'project') {
    return installClaudeProject(scope, accessKey, dryRun, cwd);
  }
  return installClaudeUser(scope, accessKey, dryRun, cwd);
}

function installCodex(scope, accessKey, dryRun, cwd) {
  if (scope !== 'user') {
    throw new Error('Codex MCP setup is user-scoped through ~/.codex/config.toml.');
  }
  if (!commandExists('codex')) {
    throw new Error('Codex CLI is not installed or not on PATH.');
  }

  const bearerTokenEnvVar = envAccessKey() ? 'NEUS_ACCESS_KEY' : '';

  if (!dryRun) {
    runCommand('codex', ['mcp', 'remove', NEUS_MCP_SERVER_NAME], cwd, true);
    const addArgs = [
      'mcp',
      'add',
      NEUS_MCP_SERVER_NAME,
      '--url',
      NEUS_MCP_URL,
      '--oauth-client-id',
      NEUS_OAUTH_CLIENT_ID,
      '--oauth-resource',
      NEUS_MCP_RESOURCE
    ];
    if (bearerTokenEnvVar) {
      addArgs.push('--bearer-token-env-var', bearerTokenEnvVar);
    }
    runCommand('codex', addArgs, cwd);
  }

  return {
    client: 'codex',
    scope,
    configured: true,
    authConfigured: bearerTokenEnvVar ? true : null,
    changed: true,
    targetPath: portablePath(codexConfigPath()),
    backupPath: null,
    dryRun,
    error: null
  };
}

function authCodex(scope, dryRun, cwd, cliOptions = {}) {
  const setupResult = installCodex(scope, '', dryRun, cwd);
  if (!dryRun) {
    printHostAuthIntro('codex', cliOptions);
    runCommand('codex', ['mcp', 'login', NEUS_MCP_SERVER_NAME, '--scopes', CODEX_OAUTH_SCOPES], cwd);
  }
  return {
    ...setupResult,
    authConfigured: !dryRun,
    changed: true
  };
}

function installClient(client, scope, accessKey, dryRun, cwd) {
  if (client === 'cursor') return installCursor(scope, accessKey, dryRun, cwd);
  if (client === 'vscode') return installVsCode(scope, accessKey, dryRun, cwd);
  if (client === 'claude') return installClaude(scope, accessKey, dryRun, cwd);
  if (client === 'codex') return installCodex(scope, accessKey, dryRun, cwd);
  throw new Error(`Unsupported client: ${client}`);
}

function inspectCursor(scope, cwd) {
  const targetPath = cursorConfigPath(scope, cwd);
  if (!fileExists(targetPath)) {
    return {
      client: 'cursor',
      scope,
      configured: false,
      authConfigured: false,
      targetPath,
      error: null
    };
  }
  const doc = readJsonFile(targetPath, {});
  const server = doc.mcpServers?.[NEUS_MCP_SERVER_NAME];
  return {
    client: 'cursor',
    scope,
    configured: Boolean(server && server.url === NEUS_MCP_URL),
    authConfigured: Boolean(server?.headers?.Authorization),
    targetPath,
    error: null
  };
}

function inspectVsCode(scope, cwd) {
  const targetPath = vscodeConfigPath(scope, cwd);
  if (!fileExists(targetPath)) {
    return {
      client: 'vscode',
      scope,
      configured: false,
      authConfigured: false,
      targetPath,
      error: null
    };
  }
  const doc = readJsonFile(targetPath, {});
  const server = doc.servers?.[NEUS_MCP_SERVER_NAME];
  return {
    client: 'vscode',
    scope,
    configured: Boolean(server && server.url === NEUS_MCP_URL),
    authConfigured: Boolean(server?.headers?.Authorization),
    targetPath,
    error: null
  };
}

function inspectClaude(scope, cwd) {
  if (scope === 'project') {
    const targetPath = claudeProjectConfigPath(cwd);
    if (!fileExists(targetPath)) {
      return {
        client: 'claude',
        scope,
        configured: false,
        authConfigured: false,
        targetPath,
        error: null
      };
    }
    const doc = readJsonFile(targetPath, {});
    const server = doc.mcpServers?.[NEUS_MCP_SERVER_NAME];
    return {
      client: 'claude',
      scope,
      configured: Boolean(server && server.url === NEUS_MCP_URL),
      authConfigured: Boolean(server?.headers?.Authorization),
      targetPath,
      error: null
    };
  }

  if (!commandExists('claude')) {
    return {
      client: 'claude',
      scope,
      configured: false,
      authConfigured: null,
      targetPath: '~/.claude.json',
      error: null
    };
  }

  const result = runCommand('claude', ['mcp', 'list'], cwd, true);
  const configured =
    result.status === 0 &&
    result.stdout.split(/\r?\n/).some(line => line.trim() === NEUS_MCP_SERVER_NAME);
  return {
    client: 'claude',
    scope,
    configured,
    authConfigured: configured ? null : false,
    targetPath: '~/.claude.json',
    error: null
  };
}

function inspectCodex(scope, cwd) {
  const targetPath = portablePath(codexConfigPath());
  if (scope !== 'user') {
    return {
      client: 'codex',
      scope,
      configured: false,
      authConfigured: null,
      targetPath,
      error: 'Codex MCP setup is user-scoped through ~/.codex/config.toml.'
    };
  }
  if (!commandExists('codex')) {
    return {
      client: 'codex',
      scope,
      configured: false,
      authConfigured: null,
      targetPath,
      error: null
    };
  }

  const result = runCommand('codex', ['mcp', 'get', NEUS_MCP_SERVER_NAME], cwd, true);
  const configured =
    result.status === 0 &&
    result.stdout.split(/\r?\n/).some(line => line.trim() === `url: ${NEUS_MCP_URL}`);
  return {
    client: 'codex',
    scope,
    configured,
    authConfigured: configured ? null : false,
    targetPath,
    error: null
  };
}

function inspectClient(client, scope, cwd) {
  if (client === 'cursor') return inspectCursor(scope, cwd);
  if (client === 'vscode') return inspectVsCode(scope, cwd);
  if (client === 'claude') return inspectClaude(scope, cwd);
  if (client === 'codex') return inspectCodex(scope, cwd);
  throw new Error(`Unsupported client: ${client}`);
}

function createEmptyManifest(source) {
  return {
    schema: IMPORT_SCHEMA,
    source,
    generatedAt: new Date().toISOString(),
    instructions: [],
    memories: [],
    rules: [],
    skills: [],
    mcpServers: [],
    secretRefs: [],
    proofHints: {
      status: 'not-issued',
      qHashes: [],
      next: ['neus setup', 'neus auth', 'neus check']
    }
  };
}

function sourceDetected(source) {
  if (source === 'cursor') {
    return (
      fileExists(path.join(process.cwd(), '.cursor', 'rules')) ||
      fileExists(path.join(process.cwd(), '.cursor', 'mcp.json'))
    );
  }
  if (source === 'claude-code') {
    return (
      fileExists(path.join(os.homedir(), '.claude', 'skills')) ||
      fileExists(path.join(process.cwd(), '.claude', 'settings.json'))
    );
  }
  if (source === 'claude-desktop') {
    return fileExists(path.join(os.homedir(), '.claude.json'));
  }
  return false;
}

function detectImportSources() {
  return SUPPORTED_IMPORT_SOURCES.filter(source => source !== 'auto' && sourceDetected(source)).map(
    source => ({
      source,
      detected: true
    })
  );
}

function chooseImportSource(requestedSource, detectedSources) {
  if (requestedSource && requestedSource !== 'auto') return requestedSource;
  const preference = ['claude-code', 'cursor', 'claude-desktop'];
  return (
    preference.find(source => detectedSources.some(candidate => candidate.source === source)) ||
    'cursor'
  );
}

function mergeManifest(base, next) {
  return {
    ...base,
    instructions: [...base.instructions, ...next.instructions],
    memories: [...base.memories, ...next.memories],
    rules: [...base.rules, ...next.rules],
    skills: [...base.skills, ...next.skills],
    mcpServers: [...base.mcpServers, ...next.mcpServers],
    secretRefs: [...base.secretRefs, ...next.secretRefs]
  };
}

function buildCursorManifest(warnings) {
  const source = 'cursor';
  const manifest = createEmptyManifest(source);
  const rulesDir = path.join(process.cwd(), '.cursor', 'rules');
  for (const fileName of listFileNames(rulesDir, ['.mdc', '.md'])) {
    const targetPath = path.join(rulesDir, fileName);
    manifest.rules.push({
      name: fileName,
      source,
      path: portablePath(targetPath),
      bytes: statBytes(targetPath),
      sha256: sha256(readTextFile(targetPath))
    });
  }
  manifest.mcpServers.push(
    ...readMcpServers(path.join(process.cwd(), '.cursor', 'mcp.json'), source, warnings)
  );
  return manifest;
}

function buildClaudeCodeManifest(warnings) {
  const source = 'claude-code';
  const manifest = createEmptyManifest(source);
  const settings = instructionEntry(
    path.join(process.cwd(), '.claude', 'settings.json'),
    '.claude/settings.json'
  );
  if (settings) manifest.rules.push({ ...settings, source });
  for (const skillName of listDirectoryNames(path.join(os.homedir(), '.claude', 'skills'))) {
    manifest.skills.push({
      name: skillName,
      kind: 'skill',
      source,
      path: portablePath(path.join(os.homedir(), '.claude', 'skills', skillName)),
      hasSkillMd: fileExists(path.join(os.homedir(), '.claude', 'skills', skillName, 'SKILL.md'))
    });
  }
  manifest.mcpServers.push(
    ...readMcpServers(path.join(process.cwd(), '.mcp.json'), source, warnings)
  );
  return manifest;
}

function buildClaudeDesktopManifest(warnings) {
  const source = 'claude-desktop';
  const manifest = createEmptyManifest(source);
  manifest.mcpServers.push(
    ...readMcpServers(path.join(os.homedir(), '.claude.json'), source, warnings)
  );
  return manifest;
}

function buildSourceManifest(source, warnings) {
  if (source === 'cursor') return buildCursorManifest(warnings);
  if (source === 'claude-code') return buildClaudeCodeManifest(warnings);
  if (source === 'claude-desktop') return buildClaudeDesktopManifest(warnings);
  throw new Error(`Unsupported import source: ${source}`);
}

function buildPortableManifest(requestedSource) {
  const warnings = [];
  const detectedSources = detectImportSources();
  const selectedSource = chooseImportSource(requestedSource, detectedSources);
  let manifest = buildSourceManifest(selectedSource, warnings);

  if (requestedSource === 'auto') {
    for (const candidate of detectedSources) {
      if (candidate.source === selectedSource) continue;
      manifest = mergeManifest(manifest, buildSourceManifest(candidate.source, warnings));
    }
  }

  manifest.generatedAt = new Date().toISOString();
  return { manifest, detectedSources, warnings, selectedSource };
}

function importedManifestPath(source, cwd) {
  return path.join(cwd, '.neus', 'imported', `${source}.json`);
}

function latestImportedManifest(cwd) {
  const dir = path.join(cwd, '.neus', 'imported');
  if (!fileExists(dir)) return null;
  const candidates = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
    .map(entry => path.join(dir, entry.name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return candidates[0] || null;
}

function printJson(payload) {
  process.stdout.write(jsonStringify(payload));
}

function clientTargetPath(client, scope, cwd) {
  if (client === 'cursor') return cursorConfigPath(scope, cwd);
  if (client === 'vscode') return vscodeConfigPath(scope, cwd);
  if (client === 'claude') {
    return scope === 'project' ? claudeProjectConfigPath(cwd) : '~/.claude.json';
  }
  return null;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error || 'Unknown error');
}

function parseSseMessages(text) {
  const messages = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload) continue;
    try {
      messages.push(JSON.parse(payload));
    } catch {
      // Ignore malformed SSE fragments. The caller will report the raw body preview.
    }
  }
  return messages;
}

function parseMcpResponse(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return parseSseMessages(trimmed)[0] || null;
  }
}

function firstTextContent(value) {
  const content = value?.result?.content ?? value?.content;
  if (!Array.isArray(content)) return '';
  const first = content.find(item => item?.type === 'text' && typeof item?.text === 'string');
  return first?.text || '';
}

function parseMcpToolPayload(value) {
  const text = firstTextContent(value);
  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      return { text };
    }
  }
  return value?.result ?? value;
}

async function postMcpJsonRpc({ id, method, params, accessKey, sessionId, signal }) {
  const response = await fetch(NEUS_MCP_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
      'mcp-protocol-version': '2025-11-25',
      ...(accessKey ? { authorization: `Bearer ${accessKey}` } : {}),
      ...(sessionId ? { 'mcp-session-id': sessionId } : {})
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params: params ?? {}
    }),
    signal
  });
  const body = await response.text();
  return {
    response,
    body,
    json: parseMcpResponse(body),
    sessionId: response.headers.get('mcp-session-id') || sessionId || ''
  };
}

async function callMcpTool({ name, args, accessKey, sessionId, signal }) {
  const result = await postMcpJsonRpc({
    id: 3,
    method: 'tools/call',
    params: { name, arguments: args ?? {} },
    accessKey,
    sessionId,
    signal
  });
  if (!result.response.ok || result.json?.error) {
    return {
      ok: false,
      name,
      status: result.response.status,
      error: result.json?.error?.message || result.json?.error || result.body.slice(0, 200)
    };
  }
  return {
    ok: true,
    name,
    payload: parseMcpToolPayload(result.json)
  };
}

async function initializeMcpSession(accessKey, signal) {
  const init = await postMcpJsonRpc({
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'neus-cli', version: CLI_PACKAGE_VERSION }
    },
    accessKey,
    signal
  });
  if (!init.response.ok || init.json?.error) {
    throw new Error(init.json?.error?.message || 'MCP initialize failed');
  }
  return { sessionId: init.sessionId || '' };
}

async function evaluateAgentMountDoctor(accessKey, cwd, signal) {
  const manifest = readMountManifest(cwd);
  const fileHealth = evaluateMountFileHealth(manifest);
  const out = {
    mountFilePresent: Boolean(manifest),
    mountFileValid: fileHealth.mountFileValid,
    mountNeedsRefresh: fileHealth.needsRefresh,
    mountRefreshReason: fileHealth.reason,
    missingDelegation: fileHealth.missingDelegation,
    delegationExpired: fileHealth.delegationExpired,
    mountAgentId: manifest?.identity?.agentId || null,
    agentVerified: false,
    agentLinkStatus: null
  };
  if (!accessKey) return out;

  let sessionId = '';
  try {
    const init = await initializeMcpSession(accessKey, signal);
    sessionId = init.sessionId;
  } catch {
    return out;
  }

  const agentId = out.mountAgentId || manifest?.identity?.agentId;
  const agentWallet = manifest?.identity?.agentWallet;
  if (agentWallet) {
    const link = await callMcpTool({
      name: 'neus_agent_link',
      args: { agentWallet },
      accessKey,
      sessionId,
      signal
    });
    if (link.ok) {
      out.agentLinkStatus = link.payload?.status || (link.payload?.linked ? 'ok' : 'link_required');
      out.agentVerified = Boolean(link.payload?.linked);
    }
  } else if (agentId) {
    try {
      const bundle = await resolveRuntimeBundleFromMcp({
        callMcpTool: args => callMcpTool({ ...args, accessKey, sessionId, signal }),
        accessKey,
        agentId,
        signal
      });
      out.agentVerified = Boolean(bundle?.trust?.identityQHash && bundle?.delegation);
      out.mountAgentId = bundle.identity?.agentId || agentId;
    } catch {
      out.agentVerified = false;
    }
  }
  return out;
}

async function runMount(options) {
  const cwd = process.cwd();
  const scope = resolveScope(options);
  const accessKey = await resolveLiveAccessKeyWithRefresh(options, scope, cwd);
  const agentTarget = String(options.agentTarget || options.agent || '').trim();
  if (!agentTarget) {
    throw new Error('Usage: neus mount <agentId> [--apply cursor|claude|codex]');
  }
  if (!accessKey) {
    throw new Error('Credential required. Run `neus auth` or pass --access-key.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const bundle = await resolveRuntimeBundleFromMcp({
      callMcpTool: args => callMcpTool({ ...args, accessKey, signal: controller.signal }),
      initializeMcp: () => initializeMcpSession(accessKey, controller.signal),
      accessKey,
      agentId: agentTarget,
      signal: controller.signal
    });

    const applyFlavor = String(options.apply || '').trim().toLowerCase();
    let applyResult = null;
    if (applyFlavor) {
      if (!['cursor', 'claude', 'codex'].includes(applyFlavor)) {
        throw new Error('--apply must be cursor, claude, or codex');
      }
      applyResult = applyRuntimeBundle(applyFlavor, bundle, cwd, { dryRun: options.dryRun });
    } else if (!options.json) {
      applyRuntimeBundle('cursor', bundle, cwd, { dryRun: options.dryRun });
    }

    const payload = {
      command: 'mount',
      schema: RUNTIME_MOUNT_SCHEMA,
      agentId: bundle.identity.agentId,
      bundle,
      applied: applyResult,
      dryRun: Boolean(options.dryRun)
    };

    if (options.json) {
      printJson(payload);
      return payload;
    }

    emitCliBanner(options);
    writeCliLine(paint('mount', 'green'));
    logStep('ok', 'agent', bundle.identity.agentLabel || bundle.identity.agentId);
    writeGuidanceLine(`Identity receipt: ${bundle.trust.identityProofUrl}`);
    if (bundle.trust.delegationProofUrl) {
      writeGuidanceLine(`Delegation receipt: ${bundle.trust.delegationProofUrl}`);
    } else {
      writeGuidanceLine('Delegation not on file — run agent setup on neus.network before scoped actions.');
    }
    if (applyResult) {
      for (const filePath of applyResult.written) {
        logStep('ok', 'wrote', filePath);
      }
    } else if (!options.dryRun) {
      logStep('ok', 'wrote', path.join(cwd, '.neus', 'mount.json'));
    }
    writeGuidanceLine('Start a new Agent chat so mounted rules load. Use NEUS Verify before sensitive actions.');
    writeCliLine('');
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function runLiveMcpDiagnostics(accessKey) {
  // Even without a static access key, attempt an unauthenticated initialize.
  // The MCP server responds with 401 + WWW-Authenticate (OAuth challenge) when
  // unauthenticated — that confirms the server is reachable and OAuth is configured.
  // With an access key, the full authenticated flow runs.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const init = await postMcpJsonRpc({
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'neus-cli', version: CLI_PACKAGE_VERSION }
      },
      accessKey,
      signal: controller.signal
    });
    if (!init.response.ok || init.json?.error) {
      // 401 means the server is reachable but requires authentication.
      // For URL-only OAuth configs (no accessKey), this is the expected
      // response — the IDE handles OAuth, not the CLI. Report as reachable.
      const isAuthRequired = init.response.status === 401;
      return {
        live: true,
        reachable: isAuthRequired || init.response.status < 500,
        authenticated: false,
        toolsCount: 0,
        tools: [],
        checks: [
          {
            name: 'initialize',
            ok: false,
            status: init.response.status,
            error: init.json?.error?.message || init.body.slice(0, 200)
          }
        ]
      };
    }

    const list = await postMcpJsonRpc({
      id: 2,
      method: 'tools/list',
      params: {},
      accessKey,
      sessionId: init.sessionId,
      signal: controller.signal
    });
    const tools = list.json?.result?.tools ?? list.json?.tools ?? [];
    const toolNames = Array.isArray(tools) ? tools.map(tool => tool.name).filter(Boolean) : [];
    const context = await callMcpTool({
      name: 'neus_context',
      args: {},
      accessKey,
      sessionId: init.sessionId,
      signal: controller.signal
    });
    const mode = context.ok ? context.payload?.mode?.current || context.payload?.mode || '' : '';
    const profileCtx = context.ok ? context.payload?.profileContext : null;
    const principal = profileCtx?.principal || null;
    const proofsTotal = profileCtx?.profileSummary?.proofsSummary?.total;
    return {
      live: true,
      reachable: true,
      authenticated: Boolean(accessKey) && context.ok,
      toolsCount: toolNames.length,
      tools: toolNames,
      contextMode: mode,
      sessionWallet: context.ok ? context.payload?.sessionWallet || principal?.primaryAccount || null : null,
      profileHandle: principal?.handle || null,
      proofsTotal: Number.isFinite(Number(proofsTotal)) ? Number(proofsTotal) : null,
      checks: [
        {
          name: 'initialize',
          ok: true,
          protocolVersion: init.json?.result?.protocolVersion || null
        },
        {
          name: 'tools/list',
          ok: list.response.ok && !list.json?.error,
          status: list.response.status,
          toolsCount: toolNames.length
        },
        { name: 'neus_context', ok: context.ok, mode }
      ]
    };
  } catch (error) {
    return {
      live: true,
      reachable: false,
      authenticated: false,
      toolsCount: 0,
      tools: [],
      checks: [{ name: 'network', ok: false, error: errorMessage(error) }]
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildClientFailure(client, scope, cwd, dryRun, error) {
  return {
    client,
    scope,
    configured: false,
    authConfigured: false,
    changed: false,
    targetPath: clientTargetPath(client, scope, cwd),
    backupPath: null,
    dryRun,
    error: errorMessage(error)
  };
}

function runClientOperations(clients, scope, cwd, dryRun, runner) {
  return clients.map(client => {
    try {
      return runner(client);
    } catch (error) {
      return buildClientFailure(client, scope, cwd, dryRun, error);
    }
  });
}


function printImportSummary(payload, cliOptions = {}) {
  emitCliBanner(cliOptions);
  const manifest = payload.manifest;
  writeCliLine(paint('import', 'green'));
  logStep('ok', 'source', `${manifest.source}${payload.dryRun ? ' (dry run)' : ''}`);
  logStep('ok', 'skills', String(manifest.skills.length));
  logStep('ok', 'servers', String(manifest.mcpServers.length));
  writeCliLine('');
  logStep('next', 'next', 'neus setup | neus auth');
  writeCliLine('');
}

function printExportSummary(payload, cliOptions = {}) {
  emitCliBanner(cliOptions);
  writeCliLine(paint('export', 'green'));
  logStep('ok', 'format', payload.format);
  logStep('ok', 'source', payload.manifest.source);
  if (payload.outputPath) {
    logStep('ok', 'output', payload.outputPath);
  }
  writeCliLine('');
}

function runInit(options) {
  const scope = resolveScope(options);
  const accessKey = resolveAccessKey(options);
  ensureSafeAuth('init', scope, accessKey);
  const cwd = process.cwd();

  const clients = resolveClients(scope, options.clients);
  ensureClientSelection(scope, clients);

  const results = runClientOperations(clients, scope, cwd, options.dryRun, client =>
    installClient(client, scope, accessKey, options.dryRun, cwd)
  );
  const payload = {
    command: 'init',
    scope,
    detectedClients: defaultUserClients(),
    clients,
    accessKeyConfigured: Boolean(accessKey),
    results,
    hasErrors: results.some(result => result.error)
  };

  if (options.json) {
    printJson(payload);
  } else {
    printFlowSummary('init', scope, results, {
      nextStep: accessKey ? '' : 'neus auth',
      cliOptions: options
    });
  }

  if (payload.hasErrors) {
    process.exitCode = 1;
  }
}

function base64url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateCodeVerifier() {
  return base64url(randomBytes(32));
}

function deriveCodeChallenge(verifier) {
  return base64url(createHash('sha256').update(verifier).digest());
}

async function runAuthBrowser(options) {
  const scope = resolveScope(options);
  if (scope !== 'user') {
    throw new Error('Browser auth only supports user scope. Remove --project flag.');
  }
  const clients = resolveClients(scope, options.clients);
  ensureClientSelection(scope, clients);
  const browserManagedClients = clients.filter(client => client !== 'codex');
  const hostManagedClients = clients.filter(client => client === 'codex');
  const cwd = process.cwd();

  const { createServer } = await import('node:http');

  const csrfState = randomBytes(16).toString('hex');
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = deriveCodeChallenge(codeVerifier);

  return new Promise((resolve, reject) => {
    let settled = false;
    function finish(error, value) {
      if (settled) return;
      settled = true;
      server.close();
      if (error) reject(error);
      else resolve(value);
    }

    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${server.address().port}`);

      // Ignore browser noise; keep the server alive for the real callback.
      if (url.pathname === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end();
        return;
      }

      const returnedState = url.searchParams.get('state');
      if (!returnedState || returnedState !== csrfState) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('<html><body><h2>Security check failed</h2><p>Invalid request. Try again.</p></body></html>');
        finish(new Error('CSRF state mismatch'));
        return;
      }

      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h2>Authentication failed</h2><p>You can close this tab and try again.</p></body></html>');
        finish(new Error(`Authentication failed: ${error}`));
        return;
      }

      if (!code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h2>Missing auth code</h2><p>You can close this tab and try again.</p></body></html>');
        finish(new Error('No auth code received from callback'));
        return;
      }

      const redirectUri = `http://127.0.0.1:${server.address().port}/callback`;
      const params = new URLSearchParams();
      params.set('grant_type', 'authorization_code');
      params.set('code', code);
      params.set('redirect_uri', redirectUri);
      params.set('client_id', NEUS_OAUTH_CLIENT_ID);
      params.set('code_verifier', codeVerifier);
      params.set('resource', NEUS_MCP_RESOURCE);

      fetch(NEUS_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: params.toString(),
        signal: AbortSignal.timeout(15_000),
      })
        .then(tokenResp => tokenResp.json())
        .then(tokenJson => {
          if (!tokenJson.access_token) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<html><body><h2>Token exchange failed</h2><p>Please try again.</p></body></html>');
            finish(new Error(tokenJson.error_description || tokenJson.error || 'Token exchange failed'));
            return;
          }

          const accessToken = tokenJson.access_token;
          persistOAuthTokens(tokenJson, NEUS_OAUTH_CLIENT_ID, NEUS_MCP_RESOURCE);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h2>Authenticated</h2><p>You can close this tab and return to your terminal.</p></body></html>');

          const results = runClientOperations(browserManagedClients, scope, cwd, options.dryRun, client =>
            installClient(client, scope, accessToken, options.dryRun, cwd)
          );
          results.push(
            ...runClientOperations(hostManagedClients, scope, cwd, options.dryRun, () =>
              authCodex(scope, options.dryRun, cwd, options)
            )
          );
          const payload = {
            command: 'auth',
            scope,
            clients,
            accessKeyConfigured: true,
            authMethod: 'browser',
            results,
            hasErrors: results.some(result => result.error)
          };
          finish(null, payload);
        })
        .catch(err => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h2>Connection error</h2><p>Please try again.</p></body></html>');
          finish(err);
        });
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const redirectUri = `http://127.0.0.1:${port}/callback`;
      const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: NEUS_OAUTH_CLIENT_ID,
        redirect_uri: redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: csrfState,
        scope: 'neus:core neus:profile neus:secrets offline_access',
        resource: NEUS_MCP_RESOURCE
      });
      const authUrl = `${NEUS_APP_URL}/oauth/authorize?${authParams.toString()}`;

      if (!options.json) {
        printAuthBrowserIntro(authUrl, options);
        logStep('next', 'wait', 'finish sign-in in the browser');
      }

      const openCommand = process.platform === 'win32'
        ? `cmd /c start "" "${authUrl.replace(/"/g, '\\"')}"`
        : process.platform === 'darwin'
          ? `open "${authUrl.replace(/"/g, '\\"')}"`
          : `xdg-open "${authUrl.replace(/"/g, '\\"')}"`;
      exec(openCommand, { shell: true }, err => {
        if (err && !options.json) {
          logStep('warn', 'browser', 'open the URL above manually');
        }
      });
    });

    // Timeout after 5 minutes
    const timeout = setTimeout(() => {
      finish(new Error('Authentication timed out after 5 minutes. Try again.'));
    }, 5 * 60 * 1000);

    server.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

function runAuth(options) {
  const scope = resolveScope(options);
  const accessKey = resolveAccessKey(options);
  ensureSafeAuth('auth', scope, accessKey);
  const cwd = process.cwd();
  const clients = resolveClients(scope, options.clients);
  ensureClientSelection(scope, clients);

  if (!accessKey) {
    if (clients.length === 1 && clients[0] === 'codex') {
      const results = runClientOperations(clients, scope, cwd, options.dryRun, () =>
        authCodex(scope, options.dryRun, cwd, options)
      );
      return {
        command: 'auth',
        scope,
        clients,
        accessKeyConfigured: results.some(result => result.authConfigured === true),
        authMethod: 'host-oauth',
        results,
        hasErrors: results.some(result => result.error)
      };
    }
    return runAuthBrowser(options);
  }

  const results = runClientOperations(clients, scope, cwd, options.dryRun, client =>
    installClient(client, scope, accessKey, options.dryRun, cwd)
  );
  const payload = {
    command: 'auth',
    scope,
    clients,
    accessKeyConfigured: true,
    authMethod: resolveAuthMethod(options, accessKey),
    results,
    hasErrors: results.some(result => result.error)
  };

  return payload;
}

async function runRefresh(options = {}) {
  const store = readTokenStore();
  if (!store?.refreshToken) {
    const message = 'No stored OAuth refresh token. Run `neus auth --oauth` first.';
    if (options.json) {
      printJson({ command: 'refresh', error: message });
    } else {
      writeCliLine('');
      writeCliLine(`  ${paint('NEUS', 'green')}  ${paint('refresh', 'red')}`);
      writeCliLine('');
      logStep('!', 'missing', 'no stored refresh token; run `neus auth --oauth` first');
    }
    process.exitCode = 1;
    return null;
  }
  try {
    const refreshed = await refreshOAuthToken();
    const expiresAtDate = new Date(refreshed.expiresAt).toLocaleString();
    if (options.json) {
      printJson({ command: 'refresh', status: 'ok', expiresAt: refreshed.expiresAt });
    } else {
      writeCliLine('');
      writeCliLine(`  ${paint('NEUS', 'green')}  ${paint('refresh', 'green')}`);
      writeCliLine('');
      logStep('ok', 'token', `rotated; valid until ${expiresAtDate}`);
      writeCliLine('');
      writeCliLine('  IDE MCP clients with their own OAuth lifecycle (Cursor with a URL-only');
      writeCliLine('  config) do not need this command. It is an escape hatch for clients whose');
      writeCliLine('  own refresh is absent or buggy. The stored access token is now fresh.');
    }
    return refreshed;
  } catch (err) {
    const message = err?.message || 'refresh failed';
    if (options.json) {
      printJson({ command: 'refresh', error: message });
    } else {
      writeCliLine('');
      writeCliLine(`  ${paint('NEUS', 'green')}  ${paint('refresh', 'red')}`);
      writeCliLine('');
      logStep('!', 'failed', message);
    }
    process.exitCode = 1;
    return null;
  }
}

function runStatus(options) {
  const scope = resolveScope(options);
  const cwd = process.cwd();
  const clients = resolveClients(scope, options.clients);
  ensureClientSelection(scope, clients);

  const inspected = runClientOperations(clients, scope, cwd, options.dryRun, client =>
    inspectClient(client, scope, cwd)
  );
  const payload = {
    command: 'status',
    scope,
    clients: inspected,
    hasErrors: inspected.some(result => result.error)
  };

  if (options.json) {
    printJson(payload);
    return;
  }
  printFlowSummary('status', scope, inspected, { cliOptions: options });
}

async function runSetup(options) {
  const scope = resolveScope(options);
  const accessKey = resolveAccessKey(options);
  ensureSafeAuth('setup', scope, accessKey);
  const cwd = process.cwd();
  if (options.project && accessKey) {
    throw new Error(
      'Access keys are only supported in user scope. Remove --project or omit --access-key.'
    );
  }

  const clients = resolveClients(scope, options.clients);
  ensureClientSelection(scope, clients);
  const initResults = runClientOperations(clients, scope, cwd, options.dryRun, client =>
    installClient(client, scope, accessKey, options.dryRun, cwd)
  );

  const payload = {
    command: 'setup',
    scope,
    detectedClients: defaultUserClients(),
    clients,
    accessKeyConfigured: Boolean(accessKey),
    results: initResults,
    hasErrors: initResults.some(result => result.error)
  };

  if (payload.hasErrors) {
    if (options.json) printJson(payload);
    else printFlowSummary('setup', scope, initResults, { cliOptions: options });
    process.exitCode = 1;
    return payload;
  }

  if (options.json) {
    payload.authRequired = !accessKey && !options.dryRun;
    if (payload.authRequired) {
      payload.nextCommand = clients.length === 1 && clients[0] === 'codex'
        ? 'neus auth --client codex'
        : 'neus auth';
    }
    printJson(payload);
    return payload;
  }

  printFlowSummary('setup', scope, initResults, {
    nextStep: accessKey ? 'Run `neus examples`, then ask your assistant to use NEUS Verify.' : '',
    cliOptions: options
  });

  if (!accessKey && !options.dryRun) {
    const authResult = await runAuth(options);
    if (authResult && !authResult.hasErrors) {
      printFlowSummary('auth', authResult.scope, authResult.results, {
        nextStep: 'Run `neus examples`, then ask your assistant to use NEUS Verify.',
        cliOptions: options
      });
    }
    if (authResult?.hasErrors) {
      process.exitCode = 1;
    }
    return authResult || payload;
  }

  if (options.agent && !options.dryRun) {
    const mountKey = resolveLiveAccessKey(options, scope, cwd);
    if (mountKey) {
      await runMount({
        ...options,
        agentTarget: options.agent,
        apply: options.apply || 'cursor',
        json: false,
        live: true
      });
    }
  }

  return payload;
}

function runImport(options, { emitOutput = true } = {}) {
  if (!SUPPORTED_IMPORT_SOURCES.includes(options.source)) {
    throw new Error(`Unsupported import source: ${options.source}`);
  }
  const cwd = process.cwd();
  const { manifest, detectedSources, warnings } = buildPortableManifest(options.source);
  const targetPath = importedManifestPath(manifest.source, cwd);
  const writeResult = writeJsonFile(targetPath, manifest, options.dryRun);
  const payload = {
    command: 'import',
    source: options.source,
    selectedSource: manifest.source,
    dryRun: options.dryRun,
    detectedSources,
    manifest,
    targetPath,
    changed: writeResult.changed,
    warnings,
    hasErrors:
      manifest.instructions.length === 0 &&
      manifest.skills.length === 0 &&
      manifest.rules.length === 0 &&
      manifest.mcpServers.length === 0
  };

  if (emitOutput) {
    if (options.json) {
      printJson(payload);
    } else {
      printImportSummary(payload, options);
    }
  }

  if (emitOutput && payload.hasErrors) {
    process.exitCode = 1;
  }
  return payload;
}

function runExport(options) {
  if (!SUPPORTED_EXPORT_FORMATS.includes(options.format)) {
    throw new Error(`Unsupported export format: ${options.format}`);
  }
  const cwd = process.cwd();
  const sourcePath = latestImportedManifest(cwd);
  if (!sourcePath) {
    throw new Error(
      'No local NEUS portable agent manifest found. Run `neus import --dry-run` first, then `neus import` to write one.'
    );
  }
  const manifest = readJsonFile(sourcePath, null);
  if (!manifest || manifest.schema !== IMPORT_SCHEMA) {
    throw new Error(`Invalid NEUS portable agent manifest at ${sourcePath}`);
  }
  const outputPath = options.output ? path.resolve(cwd, options.output) : '';
  if (outputPath && !options.dryRun) {
    writeJsonFile(outputPath, manifest, false);
  }
  const payload = {
    command: 'export',
    format: options.format,
    sourcePath,
    outputPath,
    dryRun: options.dryRun,
    manifest
  };

  if (options.json) {
    printJson(payload);
    return;
  }
  printExportSummary(payload, options);
}

const ASSISTANT_EXAMPLE_PROMPTS = [
  'Use NEUS Verify before taking sensitive actions.',
  'Check whether I already have the required trust receipt.',
  'Verify this agent is trusted before it runs tools.',
  'Mount my NEUS agent context with neus_agent_mount, then follow its scoped policy.',
  'Use NEUS Vault before storing or using secrets.',
  'Show the receipt for this verification.'
];

function runExamples(options) {
  const payload = {
    command: 'examples',
    intro: 'Try this in your assistant:',
    prompts: ASSISTANT_EXAMPLE_PROMPTS
  };

  if (options.json) {
    printJson(payload);
    return;
  }

  emitCliBanner(options);
  writeCliLine(paint('examples', 'green'));
  writeCliLine('');
  writeCliLine(`  ${paint(payload.intro, 'dim')}`);
  writeCliLine('');
  ASSISTANT_EXAMPLE_PROMPTS.forEach((prompt, index) => {
    writeCliLine(`  ${paint(String(index + 1) + '.', 'cyan')} ${prompt}`);
  });
  writeCliLine('');
}

async function resolveLiveAccessKeyWithRefresh(options, scope, cwd) {
  const liveAccessKey = resolveLiveAccessKey(options, scope, cwd);
  const store = readTokenStore();
  // If the CLI is using a stored OAuth access token that has expired, rotate
  // it silently so `doctor --live` and `check` stay useful without forcing a
  // full re-auth. Access keys (npk_…) and IDE-native OAuth never hit this path.
  if (store?.refreshToken && store?.accessToken && liveAccessKey === store.accessToken && isTokenExpired(store)) {
    try {
      const refreshed = await refreshOAuthToken();
      return refreshed.accessToken;
    } catch (error) {
      // Leave the original key in place; downstream diagnostics will report the
      // authentication failure in plain language.
      return liveAccessKey;
    }
  }
  return liveAccessKey;
}

async function runDoctor(options) {
  const displayCommand = options.displayCommand || 'doctor';
  const scope = resolveScope(options);
  const cwd = process.cwd();
  const clients = resolveClients(scope, options.clients);
  ensureClientSelection(scope, clients);

  const inspected = runClientOperations(clients, scope, cwd, options.dryRun, client =>
    inspectClient(client, scope, cwd)
  );
  const configuredClients = inspected.filter(r => r.configured);
  const liveAccessKey = await resolveLiveAccessKeyWithRefresh(options, scope, cwd);
  const payload = {
    command: displayCommand,
    scope,
    clients: inspected,
    configuredCount: configuredClients.length,
    accessKeyPresent: Boolean(liveAccessKey),
    profileConnectable: false,
    agentVerified: false,
    live: options.live,
    mcp: null,
    summary: '',
    hasErrors: inspected.some(result => result.error)
  };

  if (options.live) {
    payload.mcp = await runLiveMcpDiagnostics(liveAccessKey);
    payload.profileConnectable = Boolean(payload.mcp.authenticated);
    payload.hasErrors =
      payload.hasErrors || (liveAccessKey && (!payload.mcp.reachable || !payload.mcp.authenticated));
    if (liveAccessKey) {
      try {
        const agentDoctor = await evaluateAgentMountDoctor(
          liveAccessKey,
          cwd,
          AbortSignal.timeout(20000)
        );
        payload.agentVerified = agentDoctor.agentVerified;
        payload.mountFilePresent = agentDoctor.mountFilePresent;
        payload.mountFileValid = agentDoctor.mountFileValid;
        payload.mountNeedsRefresh = agentDoctor.mountNeedsRefresh;
        payload.mountRefreshReason = agentDoctor.mountRefreshReason;
        payload.mountAgentId = agentDoctor.mountAgentId;
        payload.agentLinkStatus = agentDoctor.agentLinkStatus;
        payload.delegationExpired = agentDoctor.delegationExpired;
        payload.missingDelegation = agentDoctor.missingDelegation;
      } catch {
        payload.agentVerified = false;
      }
    }
  } else {
    const manifest = readMountManifest(cwd);
    payload.mountFilePresent = Boolean(manifest);
    payload.mountAgentId = manifest?.identity?.agentId || null;
  }

  if (options.json) {
    printJson(payload);
    return;
  }

  if (configuredClients.length === 0) {
    emitCliBanner(options);
    writeCliLine(paint(displayCommand, 'green'));
    for (const result of inspected) {
      if (result.error) {
        logStep('warn', result.client, result.error);
      } else if (result.authConfigured === null) {
        logStep('skip', result.client, 'not installed');
      } else {
        logStep('skip', result.client, 'not configured');
      }
    }
    writeCliLine('');
    writeCliLine(paint('MCP endpoint', 'cyan'));
    writeGuidanceLine(NEUS_MCP_URL);
    writeCliLine(paint('Profile connection', 'cyan'));
    writeGuidanceLine(`No selected MCP host is configured yet. Run \`${preferredSetupCommand(inspected)}\`.`);
    writeGuidanceLine(`Then run \`${preferredAuthCommand(inspected)}\` and re-check with \`npx -y -p @neus/sdk neus check\`.`);
    writeCliLine('');
    process.exitCode = 1;
    return;
  }

  printFlowSummary(displayCommand, scope, inspected, { cliOptions: options });
  const hasCodex = inspected.some(result => result.client === 'codex');
  writeCliLine(paint('Profile connection', 'cyan'));
  if (options.live && payload.mcp) {
    if (!liveAccessKey) {
      // Check if any configured client uses URL-only OAuth (no Bearer header in
      // the config, but the IDE handles OAuth natively). This is a valid auth
      // path — the credential lives in the IDE's OAuth lifecycle, not in a
      // static header. Don't say "No account credential found" when OAuth is set up.
      const hasUrlOnlyOAuth = inspected.some(
        result => result.configured && !result.authConfigured
      );
      if (hasUrlOnlyOAuth) {
        writeGuidanceLine('IDE-native OAuth configured. The MCP server handles authentication through your IDE session.');
        if (payload.mcp.reachable) {
          writeGuidanceLine('MCP server is reachable. Ask your assistant to use NEUS tools.');
        } else {
          writeGuidanceLine('MCP server was not reachable. Check your network or run `neus check` again.');
          payload.hasErrors = true;
        }
      } else {
        writeGuidanceLine(
          hasCodex
            ? 'Codex owns OAuth: run `neus auth --client codex` or `codex mcp login neus`.'
            : 'No account credential found for the configured MCP clients. Run `neus auth`.'
        );
      }
    } else {
      if (payload.mcp.authenticated) {
        const handle = payload.mcp.profileHandle ? ` as ${payload.mcp.profileHandle}` : '';
        const receipts =
          payload.mcp.proofsTotal != null ? ` · ${payload.mcp.proofsTotal} trust receipts on file` : '';
        logStep('ok', 'profile', `connected${handle}${receipts}`);
        writeGuidanceLine('NEUS Verify is ready. Ask your assistant to verify trust before sensitive actions.');
        writeGuidanceLine('Run `npx -y -p @neus/sdk neus examples` for starter prompts.');
        if (payload.mountFilePresent) {
          logStep('ok', 'mount', payload.mountAgentId ? `project mount: ${payload.mountAgentId}` : 'project mount on file');
        }
        if (payload.mountNeedsRefresh) {
          const reason =
            payload.delegationExpired
              ? 'delegation expired'
              : payload.missingDelegation
                ? 'delegation missing on file'
                : 'mount stale';
          logStep('warn', 'mount', `${reason} — run \`neus mount ${payload.mountAgentId || '<agentId>'} --apply cursor\``);
          payload.hasErrors = true;
        } else if (payload.agentVerified) {
          logStep('ok', 'agent', 'identity and delegation on file');
        } else if (payload.mountAgentId || payload.mountFilePresent) {
          writeGuidanceLine(
            `Mounted agent is not fully linked yet. Run \`neus mount ${payload.mountAgentId || '<agentId>'} --apply cursor\` after auth.`
          );
          payload.hasErrors = true;
        }
      } else {
        if (!payload.mcp.reachable) {
          logStep('warn', 'profile', 'MCP server unreachable — check network or try again');
        } else {
          logStep('warn', 'profile', 'sign-in expired or invalid — run `neus auth` to reconnect');
        }
      }
    }
  } else if (liveAccessKey) {
    writeGuidanceLine('Saved credential found. Run `neus check` to confirm live connection.');
  } else {
    writeGuidanceLine(
      hasCodex
        ? 'Codex owns OAuth: run `neus auth --client codex` or `codex mcp login neus`.'
        : 'No account credential found. Run `neus auth` for browser sign-in.'
    );
  }
  writeCliLine('');
}

async function runDisconnect(options) {
  const scope = resolveScope(options);
  if (scope !== 'user') {
    throw new Error('Disconnect only supports user scope. Remove --project flag.');
  }

  const cwd = process.cwd();
  const token = resolveLiveAccessKey(options, scope, cwd);
  if (!token) {
    throw new Error(
      'Credential required. Run `neus disconnect --access-key <token>` or sign in first (`neus auth`).'
    );
  }

  try {
    const isProfileKey = token.startsWith('npk_');
    const resp = isProfileKey
      ? await fetch(NEUS_PROFILE_KEY_ENDPOINT, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          },
          signal: AbortSignal.timeout(10_000),
        })
      : await fetch(NEUS_DISCONNECT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            token,
            token_type_hint: 'access_token',
            client_id: NEUS_OAUTH_CLIENT_ID
          }).toString(),
          signal: AbortSignal.timeout(10_000),
        });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body?.error?.message || `Disconnect failed with status ${resp.status}`);
    }
  } catch (error) {
    if (error.message && !error.message.includes('Disconnect failed')) {
      throw new Error(`Disconnect request failed: ${error.message}`);
    }
    throw error;
  }

  const clients = resolveClients(scope, options.clients);
  ensureClientSelection(scope, clients);

  const results = runClientOperations(clients, scope, cwd, options.dryRun, client =>
    installClient(client, scope, '', options.dryRun, cwd)
  );

  const payload = {
    command: 'disconnect',
    scope,
    clients,
    disconnected: true,
    results,
    hasErrors: results.some(result => result.error)
  };

  if (options.json) {
    printJson(payload);
  } else {
    emitCliBanner(options);
    writeCliLine(paint('disconnect', 'green'));
    logStep('ok', 'signed-out', 'MCP configs updated');
    logStep('next', 'next', 'neus auth');
    writeCliLine('');
  }
}

async function main() {
  try {
    const { command, options } = parseArgs(process.argv.slice(2));

    if (command === 'help') {
      printUsage(0);
      return;
    }
    if (command === 'init') {
      runInit(options);
      return;
    }
    if (command === 'auth') {
      const result = await runAuth(options);
      if (result) {
        if (options.json) {
          printJson(result);
        } else if (result.authMethod !== 'browser') {
          printFlowSummary('auth', result.scope, result.results, {
            nextStep: 'Run `neus examples`, then ask your assistant to use NEUS Verify.',
            cliOptions: options
          });
        } else {
          printFlowSummary('auth', result.scope, result.results, {
            nextStep: 'Run `neus examples`, then ask your assistant to use NEUS Verify.',
            cliOptions: options
          });
        }
        if (result.hasErrors) {
          process.exitCode = 1;
        }
      }
      return;
    }
    if (command === 'refresh') {
      await runRefresh(options);
      return;
    }
    if (command === 'status') {
      runStatus(options);
      return;
    }
    if (command === 'setup') {
      const setupResult = await runSetup(options);
      if (setupResult?.hasErrors) {
        process.exitCode = 1;
      }
      return;
    }
    if (command === 'check') {
      await runDoctor({ ...options, live: true, displayCommand: 'check' });
      return;
    }
    if (command === 'doctor') {
      await runDoctor(options);
      return;
    }
    if (command === 'mount') {
      await runMount(options);
      return;
    }
    if (command === 'examples') {
      runExamples(options);
      return;
    }
    if (command === 'import') {
      runImport(options);
      return;
    }
    if (command === 'export') {
      runExport(options);
      return;
    }
    if (command === 'disconnect' || command === 'revoke') {
      await runDisconnect(options);
      return;
    }

    process.stderr.write(`Unknown subcommand: ${command}\n`);
    printUsage(1);
  } catch (error) {
    process.stderr.write(`${error?.message || 'Unknown error'}\n`);
    process.exit(1);
  }
}

main();
