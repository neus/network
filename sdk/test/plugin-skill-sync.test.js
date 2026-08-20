import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..', '..');

function directoryDigest(dir) {
  const entries = [];
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile()) {
        entries.push(
          `${path.relative(dir, fullPath).replaceAll(path.sep, '/')}\0${readFileSync(fullPath, 'utf8')}`
        );
      }
    }
  };
  visit(dir);
  entries.sort();
  return createHash('sha256').update(entries.join('\0')).digest('hex');
}

function fileExists(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

function listSdkSkills() {
  const skillsDir = path.join(repoRoot, 'sdk', 'skills');
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fileExists(path.join(skillsDir, entry.name, 'SKILL.md')))
    .map((entry) => entry.name);
}

const skillNames = listSdkSkills();

describe('plugin skill sync (all SDK skills)', () => {
  it('finds at least two SDK skills (trust-workflow + integrate)', () => {
    expect(skillNames.length).toBeGreaterThanOrEqual(2);
    expect(skillNames).toContain('neus-trust-workflow');
    expect(skillNames).toContain('neus-integrate');
  });

  for (const name of skillNames) {
    const sdkSource = path.join(repoRoot, 'sdk', 'skills', name);
    const pluginCopy = path.join(repoRoot, 'plugins', 'neus-mcp', 'skills', name);

    describe(`skill: ${name}`, () => {
      it('ships SKILL.md in the SDK package', () => {
        expect(fileExists(path.join(sdkSource, 'SKILL.md'))).toBe(true);
      });

      it('bundles SKILL.md in the neus-mcp plugin', () => {
        expect(fileExists(path.join(pluginCopy, 'SKILL.md'))).toBe(true);
      });

      it('keeps the SDK and plugin copies byte-identical', () => {
        const sdkDigest = directoryDigest(sdkSource);
        const pluginDigest = directoryDigest(pluginCopy);
        expect(pluginDigest).toBe(sdkDigest);
      });
    });
  }

  it('ships Cursor-native plugin MCP for marketplace Connect', () => {
    const mcpPath = path.join(repoRoot, 'plugins', 'neus-mcp', 'mcp.json');
    const pluginPath = path.join(repoRoot, 'plugins', 'neus-mcp', '.cursor-plugin', 'plugin.json');
    const mcp = JSON.parse(readFileSync(mcpPath, 'utf8'));
    const plugin = JSON.parse(readFileSync(pluginPath, 'utf8'));

    expect(mcp.mcpServers.neus).toEqual({ url: 'https://mcp.neus.network/mcp' });
    expect(plugin.mcpServers).toBe('./mcp.json');
  });
});