#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const NEUS_SERVER_NAME = 'neus';
const NEUS_MCP_URL = 'https://mcp.neus.network/mcp';
const NEUS_APP_URL = 'https://neus.network';
const NEUS_TOKEN_ENDPOINT = 'https://neus.network/api/v1/auth/mcp/token';
const NEUS_DISCONNECT_ENDPOINT = 'https://neus.network/api/v1/auth/mcp/revoke';
const NEUS_PROFILE_KEY_ENDPOINT = 'https://api.neus.network/api/v1/auth/profile-key';
const SUPPORTED_CLIENTS = ['claude', 'cursor', 'vscode'];
const IMPORT_SCHEMA = 'neus.portable-agent.v1';
const SUPPORTED_IMPORT_SOURCES = [
  'auto',
  'openclaw',
  'hermes',
  'cursor',
  'claude-code',
  'claude-desktop'
];
const SUPPORTED_EXPORT_FORMATS = ['manifest', 'json'];
const SECRET_NAME_PATTERN =
  /(?:^|_)(?:api[_-]?key|secret|token|password|private[_-]?key|access[_-]?key|bearer)(?:$|_)/i;
const ANSI_ENABLED = process.env.NO_COLOR !== '1' && process.env.TERM !== 'dumb';

const ansi = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
};

function paint(value, color) {
  if (!ANSI_ENABLED) return String(value);
  return `${ansi[color] || ''}${value}${ansi.reset}`;
}

function printBrandHeader(title) {
  const line = paint('NEUS', 'green');
  process.stdout.write(
    `${paint('::', 'dim')} ${line} ${paint('trust portability', 'cyan')} ${paint('::', 'dim')} ${title}\n`
  );
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

function parseEnvSecretRefs(targetPath, source, warnings) {
  if (!fileExists(targetPath)) return [];
  const refs = [];
  const seen = new Set();
  const raw = readTextFile(targetPath);
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const name = trimmed.split('=')[0].trim();
    if (!name || !SECRET_NAME_PATTERN.test(name) || seen.has(name)) continue;
    seen.add(name);
    refs.push({ name, source, handling: 'detected-only' });
  }
  if (refs.length > 0) {
    warnings.push(
      `Detected ${refs.length} secret-like env name${refs.length === 1 ? '' : 's'} in ${portablePath(targetPath)}; values were not read into the manifest.`
    );
  }
  return refs;
}

function readMcpServers(targetPath, source, warnings) {
  const doc = safeReadJson(targetPath, warnings);
  if (!doc) return [];
  const servers =
    doc.mcpServers && typeof doc.mcpServers === 'object' && !Array.isArray(doc.mcpServers)
      ? doc.mcpServers
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
        accessKey: process.env.NEUS_ACCESS_KEY || '',
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
    accessKey: process.env.NEUS_ACCESS_KEY || '',
    clients: [],
    source: 'auto',
    format: 'manifest',
    output: '',
    live: false,
    json: false,
    dryRun: false,
    project: false
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
    '  setup         One-command: run init, then auth if --access-key is provided',
    '  init          Configure supported MCP clients automatically',
    '  auth          Sign in via browser (recommended) or add an access key for NEUS MCP',
    '  disconnect    Disconnect NEUS MCP (revoke the stored OAuth token or access key)',
    '  status        Show current NEUS MCP setup',
    '  doctor        Deep check: config status, profile connection, agent verification',
    '  import        Detect and package an existing agent runtime for NEUS proof-backed portability',
    '  export        Export the latest local NEUS portable agent manifest',
    '  help          Show this message',
    '',
    'Options:',
    '  --client <name[,name]>   Limit setup to claude, cursor, or vscode',
    '  --project                Write shared project config instead of user config',
    '  --access-key <npk_...>   Use manual access key instead of browser sign-in',
    '  --from <source>          Import source: auto, openclaw, hermes, cursor, claude-code, claude-desktop',
    '  --to <format>            Export format: manifest or json',
    '  --output <path>          Write exported manifest to a specific path',
    '  --live                   Run live MCP checks when an access key is available',
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
  if (scope === 'project') return [...SUPPORTED_CLIENTS];
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
  return {
    type: 'http',
    url: NEUS_MCP_URL,
    ...(accessKey ? { headers: { Authorization: `Bearer ${accessKey}` } } : {})
  };
}

function buildVsCodeServer(accessKey) {
  return {
    type: 'http',
    url: NEUS_MCP_URL,
    ...(accessKey ? { headers: { Authorization: `Bearer ${accessKey}` } } : {})
  };
}

function buildClaudeServer(accessKey) {
  return {
    type: 'http',
    url: NEUS_MCP_URL,
    ...(accessKey ? { headers: { Authorization: `Bearer ${accessKey}` } } : {})
  };
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

function installCursor(scope, accessKey, dryRun, cwd) {
  const targetPath = cursorConfigPath(scope, cwd);
  const doc = readJsonFile(targetPath, { mcpServers: {} });
  const next = {
    ...doc,
    mcpServers: {
      ...(doc.mcpServers && typeof doc.mcpServers === 'object' && !Array.isArray(doc.mcpServers)
        ? doc.mcpServers
        : {}),
      [NEUS_SERVER_NAME]: buildCursorServer(accessKey)
    }
  };
  const writeResult = writeJsonFile(targetPath, next, dryRun);
  return {
    client: 'cursor',
    scope,
    configured: true,
    authConfigured: Boolean(accessKey),
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
  const next = {
    ...doc,
    servers: {
      ...(doc.servers && typeof doc.servers === 'object' && !Array.isArray(doc.servers)
        ? doc.servers
        : {}),
      [NEUS_SERVER_NAME]: buildVsCodeServer(accessKey)
    }
  };
  const writeResult = writeJsonFile(targetPath, next, dryRun);
  return {
    client: 'vscode',
    scope,
    configured: true,
    authConfigured: Boolean(accessKey),
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
  const next = {
    ...doc,
    mcpServers: {
      ...(doc.mcpServers && typeof doc.mcpServers === 'object' && !Array.isArray(doc.mcpServers)
        ? doc.mcpServers
        : {}),
      [NEUS_SERVER_NAME]: buildClaudeServer(accessKey)
    }
  };
  const writeResult = writeJsonFile(targetPath, next, dryRun);
  return {
    client: 'claude',
    scope,
    configured: true,
    authConfigured: Boolean(accessKey),
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
    runCommand('claude', ['mcp', 'remove', '--scope', 'user', NEUS_SERVER_NAME], cwd, true);
    const addArgs = [
      'mcp',
      'add',
      '--transport',
      'http',
      '--scope',
      'user',
      NEUS_SERVER_NAME,
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

function installClient(client, scope, accessKey, dryRun, cwd) {
  if (client === 'cursor') return installCursor(scope, accessKey, dryRun, cwd);
  if (client === 'vscode') return installVsCode(scope, accessKey, dryRun, cwd);
  if (client === 'claude') return installClaude(scope, accessKey, dryRun, cwd);
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
  const server = doc.mcpServers?.[NEUS_SERVER_NAME];
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
  const server = doc.servers?.[NEUS_SERVER_NAME];
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
    const server = doc.mcpServers?.[NEUS_SERVER_NAME];
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
    result.stdout.split(/\r?\n/).some(line => line.trim() === NEUS_SERVER_NAME);
  return {
    client: 'claude',
    scope,
    configured,
    authConfigured: null,
    targetPath: '~/.claude.json',
    error: null
  };
}

function inspectClient(client, scope, cwd) {
  if (client === 'cursor') return inspectCursor(scope, cwd);
  if (client === 'vscode') return inspectVsCode(scope, cwd);
  if (client === 'claude') return inspectClaude(scope, cwd);
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
      next: ['neus setup', 'neus doctor --live', 'open your MCP client and call neus_agent_create']
    }
  };
}

function openclawRoots() {
  return [
    path.join(os.homedir(), '.openclaw', 'workspace'),
    path.join(process.cwd(), '.openclaw', 'workspace'),
    process.cwd()
  ];
}

function hermesRoots() {
  return [path.join(os.homedir(), '.hermes'), path.join(process.cwd(), '.hermes')];
}

function sourceDetected(source) {
  if (source === 'openclaw') {
    return openclawRoots().some(
      root => fileExists(path.join(root, 'SOUL.md')) || fileExists(path.join(root, 'skills'))
    );
  }
  if (source === 'hermes') {
    return hermesRoots().some(
      root => fileExists(path.join(root, 'SOUL.md')) || fileExists(path.join(root, 'skills'))
    );
  }
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
  const preference = ['openclaw', 'hermes', 'claude-code', 'cursor', 'claude-desktop'];
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

function buildOpenclawManifest(warnings) {
  const source = 'openclaw';
  const root = openclawRoots().find(
    candidate =>
      fileExists(path.join(candidate, 'SOUL.md')) || fileExists(path.join(candidate, 'skills'))
  );
  const manifest = createEmptyManifest(source);
  if (!root) {
    warnings.push('OpenClaw workspace was not found.');
    return manifest;
  }

  const soul = instructionEntry(path.join(root, 'SOUL.md'), 'SOUL.md');
  const memory = instructionEntry(path.join(root, 'MEMORY.md'), 'MEMORY.md');
  if (soul) manifest.instructions.push(soul);
  if (memory) manifest.memories.push(memory);

  for (const skillName of listDirectoryNames(path.join(root, 'skills'))) {
    manifest.skills.push({
      name: skillName,
      kind: 'skill',
      source,
      path: portablePath(path.join(root, 'skills', skillName)),
      hasSkillMd: fileExists(path.join(root, 'skills', skillName, 'SKILL.md'))
    });
  }

  manifest.secretRefs.push(...parseEnvSecretRefs(path.join(root, '.env'), source, warnings));
  manifest.mcpServers.push(
    ...readMcpServers(
      path.join(os.homedir(), '.openclaw', 'agents', 'main', 'agent', 'claude-mcp.json'),
      source,
      warnings
    ),
    ...readMcpServers(
      path.join(os.homedir(), '.openclaw', 'agents', 'main', 'agent', 'runtime-mcp.json'),
      source,
      warnings
    )
  );
  return manifest;
}

function buildHermesManifest(warnings) {
  const source = 'hermes';
  const root = hermesRoots().find(
    candidate =>
      fileExists(path.join(candidate, 'SOUL.md')) || fileExists(path.join(candidate, 'skills'))
  );
  const manifest = createEmptyManifest(source);
  if (!root) {
    warnings.push('HERMES workspace was not found.');
    return manifest;
  }

  const soul = instructionEntry(path.join(root, 'SOUL.md'), 'SOUL.md');
  if (soul) manifest.instructions.push(soul);

  for (const skillName of listDirectoryNames(path.join(root, 'skills'))) {
    manifest.skills.push({
      name: skillName,
      kind: 'skill',
      source,
      path: portablePath(path.join(root, 'skills', skillName)),
      hasSkillMd: fileExists(path.join(root, 'skills', skillName, 'SKILL.md'))
    });
  }

  manifest.secretRefs.push(...parseEnvSecretRefs(path.join(root, '.env'), source, warnings));
  manifest.mcpServers.push(...readMcpServers(path.join(root, 'config.json'), source, warnings));
  return manifest;
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
  if (source === 'openclaw') return buildOpenclawManifest(warnings);
  if (source === 'hermes') return buildHermesManifest(warnings);
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

async function runLiveMcpDiagnostics(accessKey) {
  if (!accessKey) {
    return {
      live: false,
      reachable: false,
      authenticated: false,
      toolsCount: 0,
      tools: [],
      checks: [{ name: 'access-key', ok: false, status: 'missing' }]
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const init = await postMcpJsonRpc({
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'neus-cli', version: '1.0.0' }
      },
      accessKey,
      signal: controller.signal
    });
    if (!init.response.ok || init.json?.error) {
      return {
        live: true,
        reachable: false,
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
    return {
      live: true,
      reachable: true,
      authenticated: Boolean(accessKey) && context.ok,
      toolsCount: toolNames.length,
      tools: toolNames,
      contextMode: mode,
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

function printResultSummary(command, scope, results, accessKey) {
  const changedCount = results.filter(result => result.changed).length;
  const configuredClients = results
    .filter(result => result.configured)
    .map(result => result.client)
    .join(', ');
  const failures = results.filter(result => result.error);
  const lines = [
    `NEUS ${command} completed for ${results.length} client${results.length === 1 ? '' : 's'} in ${scope} scope.`,
    `Configured: ${configuredClients || 'none'}.`
  ];

  if (changedCount > 0) {
    lines.push(`Updated: ${changedCount} target${changedCount === 1 ? '' : 's'}.`);
  }

  if ((command === 'init' || command === 'setup') && !accessKey) {
    lines.push(
      `Sign in with: neus auth (opens browser) or neus auth --access-key <npk_...> (servers and CI only)`
    );
  }
  if (command === 'init' || command === 'setup') {
    lines.push('All hosts (Cursor, Codex, OpenClaw, Hermes, Windsurf, Gemini, …): https://docs.neus.network/mcp/ide-plugin');
    lines.push('Claude Code plugin: neus-trust@neus — same page');
    lines.push(
      'Auto-setup clients: claude, cursor, vscode — re-run with --client to limit scope'
    );
  }
  if ((command === 'init' || command === 'auth') && accessKey) {
    lines.push(
      'Personal account tools are enabled.'
    );
  }
  if (command === 'status') {
    const enabled = results.filter(result => result.configured).map(result => result.client);
    lines.push(`Active: ${enabled.length > 0 ? enabled.join(', ') : 'none'}.`);
  }
  if (failures.length > 0) {
    lines.push(
      `Issues: ${failures.map(result => `${result.client}: ${result.error}`).join(' | ')}`
    );
  }

  process.stdout.write(`${lines.join('\n')}\n`);
}

function printImportSummary(payload) {
  printBrandHeader('agent import');
  const manifest = payload.manifest;
  const lines = [
    `${paint('Source', 'cyan')}: ${manifest.source}${payload.dryRun ? ' (dry run)' : ''}`,
    `${paint('Instructions', 'cyan')}: ${manifest.instructions.length}`,
    `${paint('Skills', 'cyan')}: ${manifest.skills.length}`,
    `${paint('MCP servers', 'cyan')}: ${manifest.mcpServers.length}`,
    `${paint('Secret refs', 'cyan')}: ${manifest.secretRefs.length} detected, values never written`,
    `${paint('Proofs', 'cyan')}: ${manifest.proofHints.status}; create or link receipts through NEUS MCP`
  ];
  if (payload.targetPath) {
    lines.push(
      `${paint('Manifest', 'cyan')}: ${payload.targetPath}${payload.changed ? '' : ' (unchanged)'}`
    );
  }
  if (payload.warnings.length > 0) {
    lines.push('');
    lines.push(paint('Notes', 'yellow'));
    lines.push(...payload.warnings.map(warning => `- ${warning}`));
  }
  lines.push('');
  lines.push(
    'Next: run `neus setup`, then `neus doctor --live`, then call `neus_agent_create` from your MCP client.'
  );
  process.stdout.write(`${lines.join('\n')}\n`);
}

function printExportSummary(payload) {
  printBrandHeader('agent export');
  const lines = [
    `${paint('Format', 'cyan')}: ${payload.format}`,
    `${paint('Source', 'cyan')}: ${payload.manifest.source}`,
    `${paint('Skills', 'cyan')}: ${payload.manifest.skills?.length || 0}`,
    `${paint('Proof refs', 'cyan')}: ${payload.manifest.proofHints?.qHashes?.length || 0} qHash value${payload.manifest.proofHints?.qHashes?.length === 1 ? '' : 's'}`
  ];
  if (payload.outputPath) {
    lines.push(`${paint('Output', 'cyan')}: ${payload.outputPath}`);
  }
  process.stdout.write(`${lines.join('\n')}\n`);
}

function runInit(options) {
  const scope = resolveScope(options);
  ensureSafeAuth('init', scope, options.accessKey);
  const cwd = process.cwd();

  const clients = resolveClients(scope, options.clients);
  ensureClientSelection(scope, clients);

  const results = runClientOperations(clients, scope, cwd, options.dryRun, client =>
    installClient(client, scope, options.accessKey, options.dryRun, cwd)
  );
  const payload = {
    command: 'init',
    scope,
    detectedClients: defaultUserClients(),
    clients,
    accessKeyConfigured: Boolean(options.accessKey),
    results,
    hasErrors: results.some(result => result.error)
  };

  if (options.json) {
    printJson(payload);
  } else {
    printResultSummary('init', scope, results, options.accessKey);
  }

  if (payload.hasErrors) {
    process.exitCode = 1;
  }
}

const NEUS_OAUTH_CLIENT_ID = 'neus-cli';
const NEUS_MCP_RESOURCE = 'https://mcp.neus.network/mcp';

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
  const cwd = process.cwd();

  const { createServer } = await import('node:http');

  const csrfState = randomBytes(16).toString('hex');
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = deriveCodeChallenge(codeVerifier);

  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${server.address().port}`);
      if (url.pathname === '/callback') {
        const returnedState = url.searchParams.get('state');
        if (!returnedState || returnedState !== csrfState) {
          res.writeHead(403, { 'Content-Type': 'text/html' });
          res.end('<html><body><h2>Security check failed</h2><p>Invalid request. Try again.</p></body></html>');
          server.close();
          reject(new Error('CSRF state mismatch'));
          return;
        }

        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h2>Authentication failed</h2><p>You can close this tab and try again.</p></body></html>');
          server.close();
          reject(new Error(`Authentication failed: ${error}`));
          return;
        }

        if (!code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h2>Missing auth code</h2><p>You can close this tab and try again.</p></body></html>');
          server.close();
          reject(new Error('No auth code received from callback'));
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
              server.close();
              reject(new Error(tokenJson.error_description || tokenJson.error || 'Token exchange failed'));
              return;
            }

            const accessToken = tokenJson.access_token;
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<html><body><h2>Authenticated</h2><p>You can close this tab and return to your terminal.</p></body></html>');
            server.close();

            const results = runClientOperations(clients, scope, cwd, options.dryRun, client =>
              installClient(client, scope, accessToken, options.dryRun, cwd)
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
            resolve(payload);
          })
          .catch(err => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<html><body><h2>Connection error</h2><p>Please try again.</p></body></html>');
            server.close();
            reject(err);
          });
      } else {
        res.writeHead(404);
        res.end();
      }
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

      console.log('');
      console.log('  Opening browser for NEUS authentication...');
      console.log(`  If the browser doesn't open, visit:`);
      console.log(`  ${authUrl}`);
      console.log('');

      const { exec } = require('node:child_process');
      const openCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
      exec(`${openCmd} "${authUrl}"`, (err) => {
        if (err) {
          console.log('  Could not open browser automatically. Copy the URL above and open it manually.');
        }
      });
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Authentication timed out after 5 minutes. Try again.'));
    }, 5 * 60 * 1000);
  });
}

function runAuth(options) {
  const scope = resolveScope(options);
  ensureSafeAuth('auth', scope, options.accessKey);
  const cwd = process.cwd();

  // Browser flow: when no --access-key is provided, open browser
  if (!options.accessKey) {
    return runAuthBrowser(options);
  }

  // Manual key flow: --access-key provided
  const clients = resolveClients(scope, options.clients);
  ensureClientSelection(scope, clients);

  const results = runClientOperations(clients, scope, cwd, options.dryRun, client =>
    installClient(client, scope, options.accessKey, options.dryRun, cwd)
  );
  const payload = {
    command: 'auth',
    scope,
    clients,
    accessKeyConfigured: true,
    authMethod: 'access-key',
    results,
    hasErrors: results.some(result => result.error)
  };

  return payload;
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
  printResultSummary('status', scope, inspected, '');
}

function runSetup(options) {
  const scope = resolveScope(options);
  ensureSafeAuth('setup', scope, options.accessKey);
  const cwd = process.cwd();
  if (options.project && options.accessKey) {
    throw new Error(
      'Access keys are only supported in user scope. Remove --project or omit --access-key.'
    );
  }

  const clients = resolveClients(scope, options.clients);
  ensureClientSelection(scope, clients);

  const initResults = runClientOperations(clients, scope, cwd, options.dryRun, client =>
    installClient(client, scope, options.accessKey, options.dryRun, cwd)
  );

  const payload = {
    command: 'setup',
    scope,
    detectedClients: defaultUserClients(),
    clients,
    accessKeyConfigured: Boolean(options.accessKey),
    results: initResults,
    hasErrors: initResults.some(result => result.error)
  };

  if (options.json) {
    printJson(payload);
  } else {
    printResultSummary('setup', scope, initResults, options.accessKey);
  }

  if (payload.hasErrors) {
    process.exitCode = 1;
  }
}

function runImport(options) {
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

  if (options.json) {
    printJson(payload);
  } else {
    printImportSummary(payload);
  }

  if (payload.hasErrors) {
    process.exitCode = 1;
  }
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
  printExportSummary(payload);
}

async function runDoctor(options) {
  const scope = resolveScope(options);
  const cwd = process.cwd();
  const clients = resolveClients(scope, options.clients);
  ensureClientSelection(scope, clients);

  const inspected = runClientOperations(clients, scope, cwd, options.dryRun, client =>
    inspectClient(client, scope, cwd)
  );
  const configuredClients = inspected.filter(r => r.configured);
  const payload = {
    command: 'doctor',
    scope,
    clients: inspected,
    configuredCount: configuredClients.length,
    accessKeyPresent: Boolean(options.accessKey),
    profileConnectable: false,
    agentVerified: false,
    live: options.live,
    mcp: null,
    summary: '',
    hasErrors: inspected.some(result => result.error)
  };

  if (options.live) {
    payload.mcp = await runLiveMcpDiagnostics(options.accessKey);
    payload.profileConnectable = Boolean(payload.mcp.authenticated);
    payload.hasErrors = payload.hasErrors || !payload.mcp.reachable || !payload.mcp.authenticated;
  }

  if (options.json) {
    printJson(payload);
    return;
  }

  printResultSummary('doctor', scope, inspected, '');

  const lines = [];
  if (configuredClients.length > 0) {
    lines.push(
      `MCP reachable: ${configuredClients.map(r => r.client).join(', ')} ready at ${NEUS_MCP_URL}.`
    );
  } else {
    lines.push('MCP reachable: No clients configured. Run `neus setup` first.');
    process.stdout.write(`\n${lines.join('\n')}\n`);
    process.exit(1);
  }

  if (options.accessKey) {
    if (options.live && payload.mcp) {
      lines.push(
        `Profile connection: ${payload.mcp.authenticated ? 'live MCP context confirmed' : 'not confirmed by live MCP check'}.`
      );
      lines.push(`Tools: ${payload.mcp.toolsCount || 0} discovered.`);
    } else {
      lines.push(
        'Profile connection: auth header present. Re-run `neus doctor --live` to confirm against hosted MCP.'
      );
    }
  } else {
    lines.push(
      `Profile connection: No access key found. Run \`neus auth\` (browser sign-in) or \`neus auth --access-key <npk_...>\` and reconnect.`
    );
  }

  lines.push(
    'Agent verification: Run `neus_agent_link` and `neus_proofs_check` inside the MCP-connected client to verify agent identity and delegation proofs.'
  );
  lines.push('');
  lines.push(
    'Next: Open your editor/IDE, connect to the NEUS MCP endpoint, and run `neus_context`.'
  );

  process.stdout.write(`\n${lines.join('\n')}\n`);
}

async function runDisconnect(options) {
  const scope = resolveScope(options);
  if (scope !== 'user') {
    throw new Error('Disconnect only supports user scope. Remove --project flag.');
  }

  if (!options.accessKey) {
    throw new Error('Credential required. Run `neus disconnect --access-key <token>` or set NEUS_ACCESS_KEY.');
  }

  try {
    const token = String(options.accessKey || '').trim();
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

  const cwd = process.cwd();
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
    printBrandHeader('disconnect');
    console.log('  NEUS MCP credential disconnected. Your client configurations have been updated to remove the token.');
    console.log('  Re-authenticate with: neus auth');
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
        } else {
          const displayKey = result.authMethod === 'browser' ? '<browser-auth>' : options.accessKey;
          printResultSummary('auth', result.scope, result.results, displayKey);
          if (result.authMethod === 'browser') {
            console.log('');
            console.log('  Authenticated via browser. Your MCP clients are now configured.');
          }
        }
        if (result.hasErrors) {
          process.exitCode = 1;
        }
      }
      return;
    }
    if (command === 'status') {
      runStatus(options);
      return;
    }
    if (command === 'setup') {
      runSetup(options);
      return;
    }
    if (command === 'doctor') {
      await runDoctor(options);
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
