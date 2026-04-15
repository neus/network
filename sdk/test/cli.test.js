import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, '..', 'cli', 'neus.mjs');

describe('neus CLI', () => {
  it('prints MCP block and docs URLs for init', async () => {
    const { stdout, stderr } = await execFileAsync(process.execPath, [cliPath, 'init'], {
      encoding: 'utf8'
    });
    expect(stderr).toBe('');
    expect(stdout).toContain('https://mcp.neus.network/mcp');
    expect(stdout).toContain('streamableHttp');
    expect(stdout).toContain('https://docs.neus.network/platform/llm-docs');
    expect(stdout).toContain('https://docs.neus.network/llms.txt');
    expect(stdout).toContain('does not modify files');
  });

  it('exits non-zero for unknown subcommand', async () => {
    await expect(
      execFileAsync(process.execPath, [cliPath, 'nope'], { encoding: 'utf8' })
    ).rejects.toMatchObject({ code: 1 });
  });
});
