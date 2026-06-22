import { describe, expect, it } from 'vitest';
import {
  MCP_INSTALL_HOSTS,
  NEUS_MCP_SERVER_NAME,
  NEUS_MCP_URL,
  buildAuthCommandForClient,
  buildCursorMcpInstallUrl,
  buildNeusMcpHttpConfig,
  buildSetupCommandForClient,
  buildSetupCommandForHost,
  buildVsCodeMcpInstallUrl
} from '../mcp-hosts.js';

describe('mcp-hosts', () => {
  it('lists product install hosts', () => {
    expect(MCP_INSTALL_HOSTS).toEqual(['cursor', 'claude', 'codex', 'vscode']);
  });

  it('builds NEUS HTTP MCP config', () => {
    expect(buildNeusMcpHttpConfig()).toEqual({
      type: 'http',
      url: NEUS_MCP_URL
    });
    expect(buildNeusMcpHttpConfig('npk_test')).toEqual({
      type: 'http',
      url: NEUS_MCP_URL,
      headers: { Authorization: 'Bearer npk_test' }
    });
  });

  it('builds Cursor install deeplink', () => {
    const url = buildCursorMcpInstallUrl();
    expect(url.startsWith('cursor://anysphere.cursor-deeplink/mcp/install?')).toBe(true);
    expect(url).toContain(`name=${encodeURIComponent(NEUS_MCP_SERVER_NAME)}`);
    expect(url).toContain('config=');
  });

  it('builds VS Code install deeplink', () => {
    const url = buildVsCodeMcpInstallUrl();
    expect(url.startsWith('vscode:mcp/install?')).toBe(true);
    const payload = JSON.parse(decodeURIComponent(url.replace('vscode:mcp/install?', '')));
    expect(payload.name).toBe(NEUS_MCP_SERVER_NAME);
    expect(payload.url).toBe(NEUS_MCP_URL);
  });

  it('builds setup commands per client', () => {
    expect(buildSetupCommandForClient('cursor')).toContain('--client cursor');
    expect(buildSetupCommandForClient('codex')).toContain('--client codex');
    expect(buildSetupCommandForClient('vscode')).toContain('--client vscode');
    expect(buildSetupCommandForClient('claude')).toContain('--client claude');
    expect(buildSetupCommandForClient('codex', 'npk_x')).toBe(
      'npm i -g @neus/sdk\nneus setup --client codex --access-key npk_x'
    );
  });

  it('builds Codex-specific auth command', () => {
    expect(buildAuthCommandForClient('codex')).toContain('--client codex');
    expect(buildAuthCommandForClient('cursor')).not.toContain('--client');
  });

  it('maps product hosts to CLI clients', () => {
    expect(buildSetupCommandForHost('codex')).toContain('--client codex');
    expect(buildSetupCommandForHost('codex')).toContain('neus auth --client codex');
  });

});
