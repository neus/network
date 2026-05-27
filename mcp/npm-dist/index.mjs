/**
 * @neus/mcp-server — discovery metadata only.
 * The hosted NEUS MCP server runs at https://mcp.neus.network/mcp, not inside this npm package.
 *
 * @see https://mcp.neus.network/mcp
 * @see https://docs.neus.network/mcp/setup
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @returns {Record<string, unknown>} Parsed MCP registry / installer manifest (`server.json`). */
export function loadServerManifest() {
  const raw = readFileSync(join(__dirname, 'server.json'), 'utf8');
  return JSON.parse(raw);
}

export const serverManifest = loadServerManifest();
