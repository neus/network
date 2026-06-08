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

function vscodeConfigPathForTest(scope, homeDir, appDataDir, cwd) {
  if (scope !== 'user') {
    return path.join(cwd, '.vscode', 'mcp.json');
  }
  if (process.platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'mcp.json');
  }
  if (process.platform === 'win32') {
    return path.join(appDataDir || path.join(homeDir, 'AppData', 'Roaming'), 'Code', 'User', 'mcp.json');
  }
  return path.join(homeDir, '.config', 'Code', 'User', 'mcp.json');
}

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

function buildFakeCodexScript() {
  return `
const fs = require('node:fs');

const statePath = process.env.NEUS_TEST_CODEX_STATE;
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

if (args[0] === 'mcp' && args[1] === 'add') {
  const state = readState();
  const name = args[2];
  state.servers[name] = {
    url: optionValue(['--url']),
    bearerTokenEnvVar: optionValue(['--bearer-token-env-var']),
    oauthClientId: optionValue(['--oauth-client-id']),
    oauthResource: optionValue(['--oauth-resource'])
  };
  writeState(state);
  process.stdout.write(\`Added \${name}\\n\`);
  process.exit(0);
}

if (args[0] === 'mcp' && args[1] === 'remove') {
  const state = readState();
  delete state.servers[args[2]];
  writeState(state);
  process.stdout.write(\`Removed \${args[2]}\\n\`);
  process.exit(0);
}

if (args[0] === 'mcp' && args[1] === 'login') {
  const state = readState();
  const server = state.servers[args[2]] || {};
  state.servers[args[2]] = {
    ...server,
    loggedIn: true,
    scopes: optionValue(['--scopes'])
  };
  writeState(state);
  process.stdout.write(\`Logged in \${args[2]}\\n\`);
  process.exit(0);
}

if (args[0] === 'mcp' && args[1] === 'get') {
  const state = readState();
  const server = state.servers[args[2]];
  if (!server) process.exit(1);
  process.stdout.write(\`\${args[2]}\\n  enabled: true\\n  transport: streamable_http\\n  url: \${server.url}\\n\`);
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
  await fs.writeFile(scriptPath, body, 'utf8');
  if (process.platform === 'win32') {
    const cmdPath = path.join(binDir, `${name}.cmd`);
    await fs.writeFile(cmdPath, `@echo off\r\nnode "${scriptPath}" %*\r\n`, 'utf8');
    return;
  }
  const shimPath = path.join(binDir, name);
  const launcher = `#!/bin/sh
exec node "${scriptPath}" "$@"
`;
  await fs.writeFile(shimPath, launcher, 'utf8');
  await fs.chmod(shimPath, 0o755);
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
  const codexStatePath = path.join(root, 'codex-state.json');

  await fs.mkdir(homeDir, { recursive: true });
  await fs.mkdir(appDataDir, { recursive: true });
  await fs.mkdir(localAppDataDir, { recursive: true });
  await fs.mkdir(workspaceDir, { recursive: true });
  await fs.mkdir(binDir, { recursive: true });
  await fs.mkdir(path.join(appDataDir, 'Cursor'), { recursive: true });
  await fs.mkdir(path.join(appDataDir, 'Code'), { recursive: true });

  await createCommand(binDir, 'claude', buildFakeClaudeScript());
  await createCommand(binDir, 'codex', buildFakeCodexScript());
  await createCommand(binDir, 'code', 'process.exit(0);\n');

  const env = {
    ...process.env,
    HOME: homeDir,
    USERPROFILE: homeDir,
    APPDATA: appDataDir,
    LOCALAPPDATA: localAppDataDir,
    PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
    NEUS_TEST_CLAUDE_STATE: claudeStatePath,
    NEUS_TEST_CODEX_STATE: codexStatePath,
    NEUS_ACCESS_KEY: '',
    NO_COLOR: '1'
  };

  return {
    env,
    homeDir,
    appDataDir,
    workspaceDir,
    claudeStatePath,
    codexStatePath
  };
}

async function runCli(args, context) {
  return execFileAsync(process.execPath, [cliPath, ...args], {
    encoding: 'utf8',
    cwd: context.workspaceDir,
    env: context.env
  });
}

async function writeJson(targetPath, value) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, JSON.stringify(value, null, 2), 'utf8');
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
    expect(payload.detectedClients.sort()).toEqual(['claude', 'codex', 'cursor', 'vscode']);

    const cursorConfig = JSON.parse(
      await fs.readFile(path.join(context.homeDir, '.cursor', 'mcp.json'), 'utf8')
    );
    expect(cursorConfig.mcpServers.neus).toEqual({
      type: 'http',
      url: 'https://mcp.neus.network/mcp'
    });

    const vscodeConfig = JSON.parse(
      await fs.readFile(vscodeConfigPathForTest('user', context.homeDir, context.appDataDir, context.workspaceDir), 'utf8')
    );
    expect(vscodeConfig.servers.neus).toEqual({
      type: 'http',
      url: 'https://mcp.neus.network/mcp'
    });

    const claudeState = JSON.parse(await fs.readFile(context.claudeStatePath, 'utf8'));
    expect(claudeState.servers.neus.scope).toBe('user');
    expect(claudeState.servers.neus.transport).toBe('http');
    expect(claudeState.servers.neus.commandOrUrl).toBe('https://mcp.neus.network/mcp');
    expect(claudeState.servers.neus.headers).toEqual([]);

    const codexState = JSON.parse(await fs.readFile(context.codexStatePath, 'utf8'));
    expect(codexState.servers.neus).toEqual({
      url: 'https://mcp.neus.network/mcp',
      bearerTokenEnvVar: null,
      oauthClientId: 'neus-cli',
      oauthResource: 'https://mcp.neus.network/mcp'
    });

    await expect(
      fs.readFile(path.join(context.workspaceDir, '.mcp.json'), 'utf8')
    ).rejects.toThrow();
  });

  it('configures Codex through the Codex MCP CLI when requested directly', async () => {
    const context = await makeCliContext();

    const { stdout, stderr } = await runCli(['setup', '--client', 'codex', '--json'], context);
    const payload = JSON.parse(stdout);

    expect(stderr).toBe('');
    expect(payload.clients).toEqual(['codex']);
    expect(payload.results[0]).toMatchObject({
      client: 'codex',
      configured: true,
      authConfigured: null,
      targetPath: '~/.codex/config.toml'
    });

    const codexState = JSON.parse(await fs.readFile(context.codexStatePath, 'utf8'));
    expect(codexState.servers.neus.url).toBe('https://mcp.neus.network/mcp');
    expect(codexState.servers.neus.oauthClientId).toBe('neus-cli');
  });

  it('uses Codex-owned OAuth for auth --client codex instead of opening NEUS browser auth', async () => {
    const context = await makeCliContext();

    const { stdout, stderr } = await runCli(['auth', '--client', 'codex', '--json'], context);
    const payload = JSON.parse(stdout);

    expect(stderr).toBe('');
    expect(payload.authMethod).toBe('host-oauth');
    expect(payload.results[0]).toMatchObject({
      client: 'codex',
      configured: true,
      authConfigured: true
    });

    const codexState = JSON.parse(await fs.readFile(context.codexStatePath, 'utf8'));
    expect(codexState.servers.neus.loggedIn).toBe(true);
    expect(codexState.servers.neus.scopes).toBe('neus:core,neus:profile,neus:secrets,offline_access');
  });

  it('prints builder-facing Codex setup guidance in human output', async () => {
    const context = await makeCliContext();

    const { stderr } = await runCli(['setup', '--client', 'codex', '--dry-run'], context);

    expect(stderr).toContain('would update ~/.codex/config.toml');
    expect(stderr).not.toContain('updated');
    expect(stderr).toContain('neus auth --client codex');
    expect(stderr).toContain('npx -y -p @neus/sdk neus');
    expect(stderr).toContain('neus examples');
    expect(stderr).toContain('Use NEUS Verify before taking sensitive actions');
  });

  it('prints a readable profile connection summary in doctor output', async () => {
    const context = await makeCliContext();
    await runCli(['setup', '--client', 'codex', '--json'], context);

    const { stderr } = await runCli(['doctor', '--client', 'codex'], context);

    expect(stderr).toContain('Profile connection');
    expect(stderr).toContain('Codex owns OAuth');
  });

  it('reports installed but unconfigured hosts as not configured in status output', async () => {
    const context = await makeCliContext();

    const { stderr } = await runCli(['status', '--client', 'codex'], context);

    expect(stderr).toContain('status');
    expect(stderr).toContain('codex');
    expect(stderr).toContain('not configured');
    expect(stderr).not.toContain('not installed');
    expect(stderr).toContain('MCP endpoint');
    expect(stderr).toContain('https://mcp.neus.network/mcp');
  });

  it('prints actionable doctor guidance when no selected MCP host is configured', async () => {
    const context = await makeCliContext();

    await expect(runCli(['doctor', '--client', 'codex'], context)).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('Profile connection')
    });

    await expect(runCli(['doctor', '--client', 'codex'], context)).rejects.toMatchObject({
      stderr: expect.stringContaining('neus setup --client codex')
    });
  });

  it('applies NEUS_ACCESS_KEY from the shell on setup', async () => {
    const context = await makeCliContext();
    context.env.NEUS_ACCESS_KEY = 'npk_from_env_auto';

    await runCli(['setup', '--json'], context);

    const cursorConfig = JSON.parse(
      await fs.readFile(path.join(context.homeDir, '.cursor', 'mcp.json'), 'utf8')
    );
    expect(cursorConfig.mcpServers.neus.headers.Authorization).toBe('Bearer npk_from_env_auto');
  });

  it('uses NEUS_ACCESS_KEY from the shell on auth without extra flags', async () => {
    const context = await makeCliContext();
    context.env.NEUS_ACCESS_KEY = 'npk_from_env_auth';

    const { stdout } = await runCli(['auth', '--json'], context);
    const payload = JSON.parse(stdout);
    expect(payload.authMethod).toBe('env-key');

    const cursorConfig = JSON.parse(
      await fs.readFile(path.join(context.homeDir, '.cursor', 'mcp.json'), 'utf8')
    );
    expect(cursorConfig.mcpServers.neus.headers.Authorization).toBe('Bearer npk_from_env_auth');
  });

  it('doctor uses the IDE MCP bearer before shell env', async () => {
    const context = await makeCliContext();
    context.env.NEUS_ACCESS_KEY = 'npk_from_env_should_not_apply';
    await writeJson(path.join(context.homeDir, '.cursor', 'mcp.json'), {
      mcpServers: {
        neus: {
          type: 'http',
          url: 'https://mcp.neus.network/mcp',
          headers: { Authorization: 'Bearer oauth_token_from_ide' }
        }
      }
    });

    const { stdout } = await runCli(['doctor', '--json'], context);
    const payload = JSON.parse(stdout);

    expect(payload.accessKeyPresent).toBe(true);
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
      await fs.readFile(vscodeConfigPathForTest('user', context.homeDir, context.appDataDir, context.workspaceDir), 'utf8')
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

    const byClient = Object.fromEntries(payload.clients.map(client => [client.client, client]));
    expect(byClient.cursor.configured).toBe(true);
    expect(byClient.cursor.authConfigured).toBe(true);
    expect(byClient.vscode.configured).toBe(true);
    expect(byClient.vscode.authConfigured).toBe(true);
    expect(byClient.claude.configured).toBe(true);
  });

  it('treats empty MCP config files as unconfigured instead of crashing', async () => {
    const context = await makeCliContext();
    const vscodeConfigPath = path.join(context.appDataDir, 'Code', 'User', 'mcp.json');

    await fs.mkdir(path.dirname(vscodeConfigPath), { recursive: true });
    await fs.writeFile(vscodeConfigPath, '', 'utf8');

    const { stdout, stderr } = await runCli(['status', '--json'], context);
    const payload = JSON.parse(stdout);
    const byClient = Object.fromEntries(payload.clients.map(client => [client.client, client]));

    expect(stderr).toBe('');
    expect(byClient.vscode.configured).toBe(false);
    expect(byClient.vscode.error).toBe(null);
  });

  it('reports malformed MCP config files without blocking other clients', async () => {
    const context = await makeCliContext();
    const vscodeConfigPath = vscodeConfigPathForTest('user', context.homeDir, context.appDataDir, context.workspaceDir);

    await fs.mkdir(path.dirname(vscodeConfigPath), { recursive: true });
    await fs.writeFile(vscodeConfigPath, '{"servers":', 'utf8');

    const { stdout, stderr } = await runCli(['status', '--json'], context);
    const payload = JSON.parse(stdout);
    const byClient = Object.fromEntries(payload.clients.map(client => [client.client, client]));

    expect(stderr).toBe('');
    expect(byClient.cursor.configured).toBe(false);
    expect(byClient.cursor.error).toBe(null);
    expect(byClient.vscode.configured).toBe(false);
    expect(byClient.vscode.error).toContain(vscodeConfigPath);
    expect(byClient.vscode.error).toContain('Invalid JSON');
  });

  it('continues configuring healthy clients when one config file is malformed', async () => {
    const context = await makeCliContext();
    const vscodeConfigPath = vscodeConfigPathForTest('user', context.homeDir, context.appDataDir, context.workspaceDir);

    await fs.mkdir(path.dirname(vscodeConfigPath), { recursive: true });
    await fs.writeFile(vscodeConfigPath, '{"servers":', 'utf8');

    await expect(runCli(['init', '--json'], context)).rejects.toMatchObject({
      code: 1
    });

    const cursorConfig = JSON.parse(
      await fs.readFile(path.join(context.homeDir, '.cursor', 'mcp.json'), 'utf8')
    );
    expect(cursorConfig.mcpServers.neus.url).toBe('https://mcp.neus.network/mcp');
  });

  it('rejects unsupported import sources from the public CLI', async () => {
    const context = await makeCliContext();

    await expect(runCli(['import', '--from', 'private-runtime', '--dry-run', '--json'], context)).rejects.toMatchObject({
      code: 1
    });
  });

  it('auto-detects portable agent sources when import --from auto is used', async () => {
    const context = await makeCliContext();

    await fs.mkdir(path.join(context.workspaceDir, '.cursor', 'rules'), { recursive: true });
    await fs.writeFile(
      path.join(context.workspaceDir, '.cursor', 'rules', 'neus.mdc'),
      'alwaysApply: true\n',
      'utf8'
    );
    const { stdout } = await runCli(['import', '--dry-run', '--json'], context);
    const payload = JSON.parse(stdout);

    expect(payload.source).toBe('auto');
    expect(payload.detectedSources.map(source => source.source).sort()).toEqual(['cursor']);
    expect(payload.manifest.source).toBe('cursor');
    expect(payload.manifest.rules.map(rule => rule.name)).toContain('neus.mdc');
  });

  it('exports the local imported manifest as a portable NEUS manifest', async () => {
    const context = await makeCliContext();
    const importedPath = path.join(context.workspaceDir, '.neus', 'imported', 'cursor.json');

    await writeJson(importedPath, {
      schema: 'neus.portable-agent.v1',
      source: 'cursor',
      generatedAt: '2026-05-22T00:00:00.000Z',
      rules: [{ name: 'neus.mdc', path: '/tmp/.cursor/rules/neus.mdc', bytes: 12 }],
      mcpServers: [{ name: 'neus', source: 'cursor' }],
      secretRefs: [],
      proofHints: { status: 'not-issued', qHashes: [] }
    });

    const { stdout, stderr } = await runCli(['export', '--to', 'manifest', '--json'], context);
    const payload = JSON.parse(stdout);

    expect(stderr).toBe('');
    expect(payload.command).toBe('export');
    expect(payload.format).toBe('manifest');
    expect(payload.manifest.source).toBe('cursor');
    expect(payload.manifest.proofHints.qHashes).toEqual([]);
    expect(payload.manifest.secretRefs).toEqual([]);
  });

  it('exits non-zero for unknown subcommand', async () => {
    const context = await makeCliContext();

    await expect(runCli(['nope'], context)).rejects.toMatchObject({ code: 1 });
  });

  it('prints assistant examples', async () => {
    const context = await makeCliContext();
    const { stdout, stderr } = await runCli(['examples', '--json'], context);
    const payload = JSON.parse(stdout);

    expect(stderr).toBe('');
    expect(payload.command).toBe('examples');
    expect(payload.prompts).toContain('Use NEUS Verify before taking sensitive actions.');
    expect(payload.prompts).toHaveLength(5);
  });

  it('runs check as doctor --live', async () => {
    const context = await makeCliContext();
    const { stdout } = await runCli(['check', '--json'], context);
    const payload = JSON.parse(stdout);

    expect(payload.command).toBe('check');
    expect(payload.live).toBe(true);
  });
});
