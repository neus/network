import { afterEach, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, '..', 'cli', 'neus.mjs');

const cleanupPaths = [];

function buildFakeClaudeScript() {
  return `
const fs = require('node:fs');

const statePath = process.env.NEUS_TEST_CLAUDE_STATE;
const args = process.argv.slice(2);

function readState() {
  if (!fs.existsSync(statePath)) {
    return { servers: {} };
  }
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

function writeState(state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function optionValue(names) {
  for (let i = 0; i < args.length; i += 1) {
    if (names.includes(args[i]) && i + 1 < args.length) {
      return args[i + 1];
    }
  }
  return null;
}

function optionValues(names) {
  const values = [];
  for (let i = 0; i < args.length; i += 1) {
    if (names.includes(args[i]) && i + 1 < args.length) {
      values.push(args[i + 1]);
    }
  }
  return values;
}

if (args[0] === 'mcp' && args[1] === 'add') {
  const state = readState();
  const scope = optionValue(['--scope', '-s']) || 'local';
  const headers = optionValues(['--header', '-H']);
  const transport = optionValue(['--transport', '-t']) || 'stdio';
  let index = 2;
  while (index < args.length) {
    const value = args[index];
    if (['--scope', '-s', '--transport', '-t', '--header', '-H'].includes(value)) {
      index += 2;
      continue;
    }
    break;
  }
  const name = args[index];
  const commandOrUrl = args[index + 1];
  state.servers[name] = { scope, transport, commandOrUrl, headers };
  writeState(state);
  process.stdout.write(\`Added \${name}\\n\`);
  process.exit(0);
}

if (args[0] === 'mcp' && args[1] === 'remove') {
  const state = readState();
  const name = args[2];
  delete state.servers[name];
  writeState(state);
  process.stdout.write(\`Removed \${name}\\n\`);
  process.exit(0);
}

if (args[0] === 'mcp' && args[1] === 'list') {
  const state = readState();
  process.stdout.write(Object.keys(state.servers).join('\\n'));
  process.exit(0);
}

process.exit(0);
`;
}

async function createCommand(binDir, name, body) {
  const scriptPath = path.join(binDir, `${name}.js`);
  const cmdPath = path.join(binDir, `${name}.cmd`);
  await fs.writeFile(scriptPath, body, 'utf8');
  await fs.writeFile(cmdPath, `@echo off\r\nnode "${scriptPath}" %*\r\n`, 'utf8');
}

async function makeCliContext() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'neus-cli-'));
  cleanupPaths.push(root);

  const homeDir = path.join(root, 'home');
  const appDataDir = path.join(root, 'appdata');
  const localAppDataDir = path.join(root, 'localappdata');
  const workspaceDir = path.join(root, 'workspace');
  const binDir = path.join(root, 'bin');
  const claudeStatePath = path.join(root, 'claude-state.json');

  await fs.mkdir(homeDir, { recursive: true });
  await fs.mkdir(appDataDir, { recursive: true });
  await fs.mkdir(localAppDataDir, { recursive: true });
  await fs.mkdir(workspaceDir, { recursive: true });
  await fs.mkdir(binDir, { recursive: true });
  await fs.mkdir(path.join(appDataDir, 'Cursor'), { recursive: true });

  await createCommand(binDir, 'claude', buildFakeClaudeScript());
  await createCommand(binDir, 'code', 'process.exit(0);\n');

  const env = {
    ...process.env,
    HOME: homeDir,
    USERPROFILE: homeDir,
    APPDATA: appDataDir,
    LOCALAPPDATA: localAppDataDir,
    PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
    NEUS_TEST_CLAUDE_STATE: claudeStatePath,
  };

  return {
    env,
    homeDir,
    appDataDir,
    workspaceDir,
    claudeStatePath,
  };
}

async function runCli(args, context) {
  return execFileAsync(process.execPath, [cliPath, ...args], {
    encoding: 'utf8',
    cwd: context.workspaceDir,
    env: context.env,
  });
}

afterEach(async () => {
  while (cleanupPaths.length > 0) {
    const target = cleanupPaths.pop();
    await fs.rm(target, { recursive: true, force: true });
  }
});

describe('neus CLI', () => {
  it('configures detected clients in user scope by default', async () => {
    const context = await makeCliContext();

    const { stdout, stderr } = await runCli(['init', '--json'], context);
    const payload = JSON.parse(stdout);

    expect(stderr).toBe('');
    expect(payload.command).toBe('init');
    expect(payload.scope).toBe('user');
    expect(payload.detectedClients.sort()).toEqual(['claude', 'cursor', 'vscode']);

    const cursorConfig = JSON.parse(
      await fs.readFile(path.join(context.homeDir, '.cursor', 'mcp.json'), 'utf8')
    );
    expect(cursorConfig.mcpServers.neus).toEqual({
      type: 'streamableHttp',
      url: 'https://mcp.neus.network/mcp',
    });

    const vscodeConfig = JSON.parse(
      await fs.readFile(path.join(context.appDataDir, 'Code', 'User', 'mcp.json'), 'utf8')
    );
    expect(vscodeConfig.servers.neus).toEqual({
      type: 'http',
      url: 'https://mcp.neus.network/mcp',
    });

    const claudeState = JSON.parse(await fs.readFile(context.claudeStatePath, 'utf8'));
    expect(claudeState.servers.neus.scope).toBe('user');
    expect(claudeState.servers.neus.transport).toBe('http');
    expect(claudeState.servers.neus.commandOrUrl).toBe('https://mcp.neus.network/mcp');
    expect(claudeState.servers.neus.headers).toEqual([]);

    await expect(fs.readFile(path.join(context.workspaceDir, '.mcp.json'), 'utf8')).rejects.toThrow();
  });

  it('adds Authorization headers when an access key is supplied', async () => {
    const context = await makeCliContext();

    const { stdout } = await runCli(['auth', '--access-key', 'npk_test.secret', '--json'], context);
    const payload = JSON.parse(stdout);

    expect(payload.command).toBe('auth');
    expect(payload.scope).toBe('user');

    const cursorConfig = JSON.parse(
      await fs.readFile(path.join(context.homeDir, '.cursor', 'mcp.json'), 'utf8')
    );
    expect(cursorConfig.mcpServers.neus.headers.Authorization).toBe('Bearer npk_test.secret');

    const vscodeConfig = JSON.parse(
      await fs.readFile(path.join(context.appDataDir, 'Code', 'User', 'mcp.json'), 'utf8')
    );
    expect(vscodeConfig.servers.neus.headers.Authorization).toBe('Bearer npk_test.secret');

    const claudeState = JSON.parse(await fs.readFile(context.claudeStatePath, 'utf8'));
    expect(claudeState.servers.neus.headers).toContain('Authorization: Bearer npk_test.secret');
  });

  it('reports current NEUS MCP setup in JSON', async () => {
    const context = await makeCliContext();

    await runCli(['auth', '--access-key', 'npk_test.secret', '--json'], context);
    const { stdout } = await runCli(['status', '--json'], context);
    const payload = JSON.parse(stdout);

    expect(payload.command).toBe('status');
    expect(payload.scope).toBe('user');

    const byClient = Object.fromEntries(payload.clients.map((client) => [client.client, client]));
    expect(byClient.cursor.configured).toBe(true);
    expect(byClient.cursor.authConfigured).toBe(true);
    expect(byClient.vscode.configured).toBe(true);
    expect(byClient.vscode.authConfigured).toBe(true);
    expect(byClient.claude.configured).toBe(true);
  });

  it('exits non-zero for unknown subcommand', async () => {
    const context = await makeCliContext();

    await expect(runCli(['nope'], context)).rejects.toMatchObject({ code: 1 });
  });
});
