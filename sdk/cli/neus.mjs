#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const NEUS_SERVER_NAME = 'neus';
const NEUS_MCP_URL = 'https://mcp.neus.network/mcp';
const NEUS_ACCESS_KEYS_URL = 'https://neus.network/profile?tab=account';
const SUPPORTED_CLIENTS = ['claude', 'cursor', 'vscode'];

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
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
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
    dryRun,
  };
}

function resolveCommand(command) {
  const checker = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(checker, [command], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) return null;
  const firstMatch = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return firstMatch || null;
}

function runCommand(command, args, cwd, tolerateFailure = false) {
  const resolvedCommand = resolveCommand(command) || command;
  const isWindowsScript = process.platform === 'win32' && /\.(cmd|bat)$/i.test(resolvedCommand);
  const result = isWindowsScript
    ? spawnSync(
        process.env.ComSpec || 'cmd.exe',
        ['/d', '/s', '/c', resolvedCommand, ...args],
        {
          cwd,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      )
    : spawnSync(resolvedCommand, args, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

  if (result.error && !tolerateFailure) {
    throw result.error;
  }

  if (result.status !== 0 && !tolerateFailure) {
    const detail = [result.stderr, result.stdout].find((value) => typeof value === 'string' && value.trim()) || '';
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
    path.join(localAppData, 'Programs', 'Cursor', 'Cursor.exe'),
  ].some(fileExists);
}

function defaultUserClients() {
  const detected = [];
  if (commandExists('claude')) detected.push('claude');
  if (cursorInstalled()) detected.push('cursor');
  if (commandExists('code') || fileExists(path.join(process.env.APPDATA || '', 'Code'))) detected.push('vscode');
  return detected;
}

function parseClientOption(raw) {
  return String(raw || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function parseArgs(argv) {
  if (argv.length === 0) {
    return {
      command: 'help',
      options: {
        accessKey: process.env.NEUS_ACCESS_KEY || '',
        clients: [],
        json: false,
        dryRun: false,
        project: false,
      },
    };
  }

  const command = argv[0];
  const options = {
    accessKey: process.env.NEUS_ACCESS_KEY || '',
    clients: [],
    json: false,
    dryRun: false,
    project: false,
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
    if (token === '--project') {
      options.project = true;
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
    '  init          Configure supported MCP clients automatically',
    '  auth          Add or update a personal access key for NEUS MCP',
    '  status        Show current NEUS MCP setup',
    '  help          Show this message',
    '',
    'Options:',
    '  --client <name[,name]>   Limit setup to claude, cursor, or vscode',
    '  --project                Write shared project config instead of user config',
    '  --access-key <npk_...>   Configure Bearer auth for personal account tools',
    '  --json                   Emit machine-readable output',
    '  --dry-run                Preview changes without writing files',
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
  throw new Error('No supported clients detected. Re-run with --project or use --client to target a specific client.');
}

function ensureSafeAuth(command, scope, accessKey) {
  if (command === 'auth' && scope !== 'user') {
    throw new Error('`neus auth` only supports user scope so access keys never land in shared project config.');
  }
  if (scope === 'project' && accessKey) {
    throw new Error('Access keys are only supported in user scope. Remove --project or omit --access-key.');
  }
}

function buildCursorServer(accessKey) {
  return {
    type: 'streamableHttp',
    url: NEUS_MCP_URL,
    ...(accessKey ? { headers: { Authorization: `Bearer ${accessKey}` } } : {}),
  };
}

function buildVsCodeServer(accessKey) {
  return {
    type: 'http',
    url: NEUS_MCP_URL,
    ...(accessKey ? { headers: { Authorization: `Bearer ${accessKey}` } } : {}),
  };
}

function buildClaudeServer(accessKey) {
  return {
    type: 'http',
    url: NEUS_MCP_URL,
    ...(accessKey ? { headers: { Authorization: `Bearer ${accessKey}` } } : {}),
  };
}

function cursorConfigPath(scope, cwd) {
  return scope === 'user'
    ? path.join(os.homedir(), '.cursor', 'mcp.json')
    : path.join(cwd, '.cursor', 'mcp.json');
}

function vscodeConfigPath(scope, cwd) {
  return scope === 'user'
    ? path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Code', 'User', 'mcp.json')
    : path.join(cwd, '.vscode', 'mcp.json');
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
      ...(doc.mcpServers && typeof doc.mcpServers === 'object' && !Array.isArray(doc.mcpServers) ? doc.mcpServers : {}),
      [NEUS_SERVER_NAME]: buildCursorServer(accessKey),
    },
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
  };
}

function installVsCode(scope, accessKey, dryRun, cwd) {
  const targetPath = vscodeConfigPath(scope, cwd);
  const doc = readJsonFile(targetPath, { servers: {} });
  const next = {
    ...doc,
    servers: {
      ...(doc.servers && typeof doc.servers === 'object' && !Array.isArray(doc.servers) ? doc.servers : {}),
      [NEUS_SERVER_NAME]: buildVsCodeServer(accessKey),
    },
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
  };
}

function installClaudeProject(scope, accessKey, dryRun, cwd) {
  const targetPath = claudeProjectConfigPath(cwd);
  const doc = readJsonFile(targetPath, { mcpServers: {} });
  const next = {
    ...doc,
    mcpServers: {
      ...(doc.mcpServers && typeof doc.mcpServers === 'object' && !Array.isArray(doc.mcpServers) ? doc.mcpServers : {}),
      [NEUS_SERVER_NAME]: buildClaudeServer(accessKey),
    },
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
      NEUS_MCP_URL,
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
    return { client: 'cursor', scope, configured: false, authConfigured: false, targetPath };
  }
  const doc = readJsonFile(targetPath, {});
  const server = doc.mcpServers?.[NEUS_SERVER_NAME];
  return {
    client: 'cursor',
    scope,
    configured: Boolean(server && server.url === NEUS_MCP_URL),
    authConfigured: Boolean(server?.headers?.Authorization),
    targetPath,
  };
}

function inspectVsCode(scope, cwd) {
  const targetPath = vscodeConfigPath(scope, cwd);
  if (!fileExists(targetPath)) {
    return { client: 'vscode', scope, configured: false, authConfigured: false, targetPath };
  }
  const doc = readJsonFile(targetPath, {});
  const server = doc.servers?.[NEUS_SERVER_NAME];
  return {
    client: 'vscode',
    scope,
    configured: Boolean(server && server.url === NEUS_MCP_URL),
    authConfigured: Boolean(server?.headers?.Authorization),
    targetPath,
  };
}

function inspectClaude(scope, cwd) {
  if (scope === 'project') {
    const targetPath = claudeProjectConfigPath(cwd);
    if (!fileExists(targetPath)) {
      return { client: 'claude', scope, configured: false, authConfigured: false, targetPath };
    }
    const doc = readJsonFile(targetPath, {});
    const server = doc.mcpServers?.[NEUS_SERVER_NAME];
    return {
      client: 'claude',
      scope,
      configured: Boolean(server && server.url === NEUS_MCP_URL),
      authConfigured: Boolean(server?.headers?.Authorization),
      targetPath,
    };
  }

  if (!commandExists('claude')) {
    return { client: 'claude', scope, configured: false, authConfigured: null, targetPath: '~/.claude.json' };
  }

  const result = runCommand('claude', ['mcp', 'list'], cwd, true);
  const configured = result.status === 0 && result.stdout.split(/\r?\n/).some((line) => line.trim() === NEUS_SERVER_NAME);
  return {
    client: 'claude',
    scope,
    configured,
    authConfigured: null,
    targetPath: '~/.claude.json',
  };
}

function inspectClient(client, scope, cwd) {
  if (client === 'cursor') return inspectCursor(scope, cwd);
  if (client === 'vscode') return inspectVsCode(scope, cwd);
  if (client === 'claude') return inspectClaude(scope, cwd);
  throw new Error(`Unsupported client: ${client}`);
}

function printJson(payload) {
  process.stdout.write(jsonStringify(payload));
}

function printResultSummary(command, scope, results, accessKey) {
  const changedCount = results.filter((result) => result.changed).length;
  const configuredClients = results.map((result) => result.client).join(', ');
  const lines = [
    `NEUS ${command} completed for ${results.length} client${results.length === 1 ? '' : 's'} in ${scope} scope.`,
    `Configured: ${configuredClients || 'none'}.`,
  ];

  if (changedCount > 0) {
    lines.push(`Updated: ${changedCount} target${changedCount === 1 ? '' : 's'}.`);
  }

  if (command === 'init' && !accessKey) {
    lines.push(`Account tools stay optional. Add personal auth later with: neus auth --access-key <npk_...>`);
  }
  if ((command === 'init' || command === 'auth') && accessKey) {
    lines.push('Personal account tools are enabled where the client supports user-scope auth setup.');
  }
  if (command === 'status') {
    const enabled = results.filter((result) => result.configured).map((result) => result.client);
    lines.push(`Active: ${enabled.length > 0 ? enabled.join(', ') : 'none'}.`);
  }

  process.stdout.write(`${lines.join('\n')}\n`);
}

function runInit(options) {
  const scope = resolveScope(options);
  ensureSafeAuth('init', scope, options.accessKey);

  const clients = resolveClients(scope, options.clients);
  ensureClientSelection(scope, clients);

  const results = clients.map((client) => installClient(client, scope, options.accessKey, options.dryRun, process.cwd()));
  const payload = {
    command: 'init',
    scope,
    detectedClients: defaultUserClients(),
    clients,
    accessKeyConfigured: Boolean(options.accessKey),
    results,
  };

  if (options.json) {
    printJson(payload);
    return;
  }
  printResultSummary('init', scope, results, options.accessKey);
}

function runAuth(options) {
  const scope = resolveScope(options);
  ensureSafeAuth('auth', scope, options.accessKey);
  if (!options.accessKey) {
    throw new Error(`Missing access key. Create one at ${NEUS_ACCESS_KEYS_URL} and rerun neus auth --access-key <npk_...>.`);
  }

  const clients = resolveClients(scope, options.clients);
  ensureClientSelection(scope, clients);

  const results = clients.map((client) => installClient(client, scope, options.accessKey, options.dryRun, process.cwd()));
  const payload = {
    command: 'auth',
    scope,
    clients,
    accessKeyConfigured: true,
    results,
  };

  if (options.json) {
    printJson(payload);
    return;
  }
  printResultSummary('auth', scope, results, options.accessKey);
}

function runStatus(options) {
  const scope = resolveScope(options);
  const clients = resolveClients(scope, options.clients);
  ensureClientSelection(scope, clients);

  const inspected = clients.map((client) => inspectClient(client, scope, process.cwd()));
  const payload = {
    command: 'status',
    scope,
    clients: inspected,
  };

  if (options.json) {
    printJson(payload);
    return;
  }
  printResultSummary('status', scope, inspected, '');
}

function main() {
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
      runAuth(options);
      return;
    }
    if (command === 'status') {
      runStatus(options);
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
