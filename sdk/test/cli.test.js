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

  await fs.mkdir(homeDir, { recursive: true });
  await fs.mkdir(appDataDir, { recursive: true });
  await fs.mkdir(localAppDataDir, { recursive: true });
  await fs.mkdir(workspaceDir, { recursive: true });
  await fs.mkdir(binDir, { recursive: true });
  await fs.mkdir(path.join(appDataDir, 'Cursor'), { recursive: true });
  await fs.mkdir(path.join(appDataDir, 'Code'), { recursive: true });

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
    NEUS_ACCESS_KEY: ''
  };

  return {
    env,
    homeDir,
    appDataDir,
    workspaceDir,
    claudeStatePath
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
    expect(payload.detectedClients.sort()).toEqual(['claude', 'cursor', 'vscode']);

    const cursorConfig = JSON.parse(
      await fs.readFile(path.join(context.homeDir, '.cursor', 'mcp.json'), 'utf8')
    );
    expect(cursorConfig.mcpServers.neus).toEqual({
      type: 'http',
      url: 'https://mcp.neus.network/mcp'
    });

    const vscodeConfig = JSON.parse(
      await fs.readFile(path.join(context.appDataDir, 'Code', 'User', 'mcp.json'), 'utf8')
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

    await expect(
      fs.readFile(path.join(context.workspaceDir, '.mcp.json'), 'utf8')
    ).rejects.toThrow();
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
    const vscodeConfigPath = path.join(context.appDataDir, 'Code', 'User', 'mcp.json');

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
    const vscodeConfigPath = path.join(context.appDataDir, 'Code', 'User', 'mcp.json');

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

  it('imports an OpenClaw workspace in dry-run mode without writing secrets', async () => {
    const context = await makeCliContext();
    const openclawDir = path.join(context.homeDir, '.openclaw', 'workspace');
    const agentConfigDir = path.join(context.homeDir, '.openclaw', 'agents', 'main', 'agent');

    await fs.mkdir(path.join(openclawDir, 'skills', 'research'), { recursive: true });
    await fs.mkdir(agentConfigDir, { recursive: true });
    await fs.writeFile(
      path.join(openclawDir, 'SOUL.md'),
      '# Builder Agent\n\nProof-aware operator.',
      'utf8'
    );
    await fs.writeFile(path.join(openclawDir, 'MEMORY.md'), 'Durable preference.', 'utf8');
    await fs.writeFile(
      path.join(openclawDir, 'skills', 'research', 'SKILL.md'),
      '# Research\n',
      'utf8'
    );
    await fs.writeFile(
      path.join(openclawDir, '.env'),
      'OPENAI_API_KEY=sk-secret\nPUBLIC_FLAG=true\n',
      'utf8'
    );
    await writeJson(path.join(agentConfigDir, 'claude-mcp.json'), {
      mcpServers: {
        filesystem: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] }
      }
    });

    const { stdout, stderr } = await runCli(
      ['import', '--from', 'openclaw', '--dry-run', '--json'],
      context
    );
    const payload = JSON.parse(stdout);

    expect(stderr).toBe('');
    expect(payload.command).toBe('import');
    expect(payload.source).toBe('openclaw');
    expect(payload.dryRun).toBe(true);
    expect(payload.manifest.instructions.length).toBe(1);
    expect(payload.manifest.skills.map(skill => skill.name)).toContain('research');
    expect(payload.manifest.secretRefs).toEqual([
      { name: 'OPENAI_API_KEY', source: 'openclaw', handling: 'detected-only' }
    ]);
    expect(stdout).not.toContain('sk-secret');
    await expect(
      fs.readFile(path.join(context.workspaceDir, '.neus', 'imported', 'openclaw.json'), 'utf8')
    ).rejects.toThrow();
  });

  it('auto-detects portable agent sources when import --from auto is used', async () => {
    const context = await makeCliContext();

    await fs.mkdir(path.join(context.workspaceDir, '.cursor', 'rules'), { recursive: true });
    await fs.writeFile(
      path.join(context.workspaceDir, '.cursor', 'rules', 'neus.mdc'),
      'alwaysApply: true\n',
      'utf8'
    );
    await fs.mkdir(path.join(context.homeDir, '.hermes', 'skills', 'ops'), { recursive: true });
    await fs.writeFile(
      path.join(context.homeDir, '.hermes', 'SOUL.md'),
      '# Hermes Agent\n',
      'utf8'
    );
    await fs.writeFile(
      path.join(context.homeDir, '.hermes', 'skills', 'ops', 'SKILL.md'),
      '# Ops\n',
      'utf8'
    );

    const { stdout } = await runCli(['import', '--dry-run', '--json'], context);
    const payload = JSON.parse(stdout);

    expect(payload.source).toBe('auto');
    expect(payload.detectedSources.map(source => source.source).sort()).toEqual([
      'cursor',
      'hermes'
    ]);
    expect(payload.manifest.source).toBe('hermes');
    expect(payload.manifest.skills.map(skill => skill.name)).toContain('ops');
  });

  it('exports the local imported manifest as a portable NEUS manifest', async () => {
    const context = await makeCliContext();
    const importedPath = path.join(context.workspaceDir, '.neus', 'imported', 'openclaw.json');

    await writeJson(importedPath, {
      schema: 'neus.portable-agent.v1',
      source: 'openclaw',
      generatedAt: '2026-05-22T00:00:00.000Z',
      instructions: [{ name: 'SOUL.md', path: '/tmp/SOUL.md', bytes: 12 }],
      skills: [{ name: 'research', path: '/tmp/skills/research', kind: 'skill' }],
      mcpServers: [{ name: 'neus', source: 'openclaw' }],
      secretRefs: [{ name: 'OPENAI_API_KEY', source: 'openclaw', handling: 'detected-only' }],
      proofHints: { status: 'not-issued', qHashes: [] }
    });

    const { stdout, stderr } = await runCli(['export', '--to', 'manifest', '--json'], context);
    const payload = JSON.parse(stdout);

    expect(stderr).toBe('');
    expect(payload.command).toBe('export');
    expect(payload.format).toBe('manifest');
    expect(payload.manifest.source).toBe('openclaw');
    expect(payload.manifest.proofHints.qHashes).toEqual([]);
    expect(payload.manifest.secretRefs[0].handling).toBe('detected-only');
  });

  it('exits non-zero for unknown subcommand', async () => {
    const context = await makeCliContext();

    await expect(runCli(['nope'], context)).rejects.toMatchObject({ code: 1 });
  });
});
