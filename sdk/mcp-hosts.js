/**
 * MCP host install constants shared by the `neus` CLI and product UI.
 * Browser-safe: no Node-only APIs except the Buffer fallback for non-browser tests.
 */

import {
  NEUS_AUTH_CLI,
  NEUS_INSTALL_CLI,
  NEUS_NPX,
  NEUS_SETUP_NPX,
  neusCmd,
} from './cli-commands.js';

export {
  NEUS_PKG,
  NEUS_INSTALL_CLI,
  NEUS_NPX,
  NEUS_SETUP_CLI,
  NEUS_SETUP_NPX,
  NEUS_AUTH_CLI,
  NEUS_CHECK_CLI,
  NEUS_DOCTOR_CLI,
  NEUS_EXAMPLES_CLI,
  NEUS_CHECK_NPX,
  NEUS_AUTH_NPX,
  NEUS_DOCTOR_NPX,
  NEUS_EXAMPLES_NPX,
  NEUS_QUICKSTART_INSTALLED,
  NEUS_QUICKSTART_NPX,
  NEUS_MOUNT_WORKFLOW,
  neusMountApply,
  neusMountApplyNpx,
  neusCmd,
  neusNpx,
} from './cli-commands.js';

export const NEUS_MCP_SERVER_NAME = 'neus';
export const NEUS_MCP_URL = 'https://mcp.neus.network/mcp';
export const NEUS_MCP_SETUP_DOCS_URL = 'https://docs.neus.network/mcp/setup';

/** CLI `neus setup --client` values. */
export const MCP_INSTALL_CLIENTS = ['claude', 'codex', 'cursor', 'vscode'];

/** Product Profile "Open in" hosts. */
export const MCP_INSTALL_HOSTS = ['cursor', 'claude', 'codex', 'vscode'];

export const IDE_HOST_LABELS = {
  cursor: 'Cursor',
  claude: 'Claude Code',
  codex: 'Codex',
  vscode: 'VS Code',
};

export const IDE_HOST_BRAND_LOGOS = {
  cursor: '/images/brandLogos/cursor.svg',
  claude: '/images/brandLogos/anthropic.svg',
  codex: '/images/brandLogos/openai.svg',
  vscode: '/images/brandLogos/microsoft.svg',
};

/**
 * Normalize an access key and decide whether it is a static Profile access key
 * (`npk_…`) or a JWT-shaped OAuth access token. OAuth tokens are never written
 * as a static Bearer header because IDE MCP clients cannot refresh them.
 *
 * @param {string | null | undefined} accessKey
 * @returns {string} The normalized key, or an empty string for OAuth-only mode.
 */
function normalizeAccessKey(accessKey) {
  const key = String(accessKey || '').trim();
  // OAuth access tokens are JWTs (three dot-separated base64url segments). Never write
  // them as a static Bearer header — return URL-only so the IDE runs OAuth itself.
  if (key && !key.startsWith('npk_') && key.split('.').length === 3) {
    return '';
  }
  return key;
}

/**
 * Build the MCP HTTP server config for an IDE/client.
 *
 * Two paths, one session model — same NEUS Profile/Account either way:
 *
 * - `npk_…` Profile access keys are durable (never expire). Written as a static
 *   `Authorization: Bearer npk_…` header. Used for servers, CI, and automation
 *   where browser OAuth is unavailable.
 * - OAuth (default for Cursor, VS Code, Claude Code, Codex): we return a URL-only
 *   config (no `headers`). The IDE MCP client discovers OAuth metadata from the
 *   server's `401 + WWW-Authenticate` challenge, then runs its own DCR + PKCE +
 *   silent-refresh lifecycle (matching Linear, GitHub, Notion). The access token
 *   is a short-lived JWT refreshed silently by the host for up to 30 days via the
 *   `offline_access` refresh token — the session is long-lived, the access token
 *   is not
 *
 * A raw OAuth access token (JWT) is never written as a static Bearer header: IDE
 * MCP clients cannot refresh a static header, and writing one would create a
 * session that dies when the access token expires. URL-only config is the correct
 * OAuth path and is what `neus setup`/`neus auth` produce for browser-OAuth clients.
 *
 * @param {string | null | undefined} accessKey
 * @returns {{ type: 'http'; url: string; headers?: { Authorization: string } }}
 */
export function buildNeusMcpHttpConfig(accessKey) {
  const key = normalizeAccessKey(accessKey);
  return {
    type: 'http',
    url: NEUS_MCP_URL,
    ...(key ? { headers: { Authorization: `Bearer ${key}` } } : {}),
  };
}

/**
 * Build the Cursor-native MCP server config.
 *
 * Cursor's `mcp.json` does not use the spec `type: 'http'` field; it expects a
 * top-level `mcpServers.<name>` object with a `url` field (and optional static
 * `headers` for access keys). OAuth discovery is driven by the server's 401
 * `WWW-Authenticate` challenge.
 *
 * @param {string | null | undefined} accessKey
 * @returns {{ url: string; headers?: { Authorization: string } }}
 */
export function buildCursorMcpConfig(accessKey) {
  const key = normalizeAccessKey(accessKey);
  return {
    url: NEUS_MCP_URL,
    ...(key ? { headers: { Authorization: `Bearer ${key}` } } : {}),
  };
}

/**
 * Build the VS Code-native MCP server config.
 *
 * VS Code's `mcp.json` uses the spec-compliant `type: 'http'` field.
 *
 * @param {string | null | undefined} accessKey
 * @returns {{ type: 'http'; url: string; headers?: { Authorization: string } }}
 */
export function buildVsCodeMcpConfig(accessKey) {
  return buildNeusMcpHttpConfig(accessKey);
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function encodeBase64Json(value) {
  const json = JSON.stringify(value);
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(json);
  }
  return Buffer.from(json, 'utf8').toString('base64');
}

/**
 * @param {string | null | undefined} accessKey
 * @returns {string}
 */
export function buildCursorMcpInstallUrl(accessKey) {
  const config = buildCursorMcpConfig(accessKey);
  const encoded = encodeBase64Json(config);
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(NEUS_MCP_SERVER_NAME)}&config=${encodeURIComponent(encoded)}`;
}

/**
 * @param {string | null | undefined} accessKey
 * @returns {string}
 */
export function buildVsCodeMcpInstallUrl(accessKey) {
  const payload = {
    name: NEUS_MCP_SERVER_NAME,
    ...buildVsCodeMcpConfig(accessKey),
  };
  return `vscode:mcp/install?${encodeURIComponent(JSON.stringify(payload))}`;
}

/**
 * @param {'claude' | 'codex' | 'cursor' | 'vscode'} client
 * @returns {string}
 */
export function buildAuthCommandForClient(client) {
  if (client === 'codex') {
    return neusCmd(`auth --client codex`);
  }
  return NEUS_AUTH_CLI;
}

/**
 * Copy-paste block for Profile / IDE onboarding (install + setup + auth).
 * @param {'claude' | 'codex' | 'cursor' | 'vscode'} client
 * @param {string | null | undefined} accessKey
 * @returns {string}
 */
export function buildSetupCommandForClient(client, accessKey) {
  const key = String(accessKey || '').trim();
  const setup = key
    ? neusCmd(`setup --client ${client} --access-key ${key}`)
    : neusCmd(`setup --client ${client}`);
  if (key) {
    return `${NEUS_INSTALL_CLI}\n${setup}`;
  }
  const auth = buildAuthCommandForClient(client);
  return `${NEUS_INSTALL_CLI}\n${setup}\n${auth}`;
}

/**
 * @param {'cursor' | 'claude' | 'codex'} host
 * @param {string | null | undefined} accessKey
 * @returns {string}
 */
export function buildSetupCommandForHost(host, accessKey) {
  return buildSetupCommandForClient(host, accessKey);
}

/**
 * Zero-install one-liner for landing pages and copy buttons.
 * @param {'claude' | 'codex' | 'cursor' | 'vscode'} [client]
 */
export function buildSetupNpxOneLiner(client) {
  if (!client) return NEUS_SETUP_NPX;
  return `${NEUS_NPX} setup --client ${client}`;
}

/**
 * Cursor and VS Code support MCP install deeplinks on desktop browsers.
 * Claude Code and Codex are CLI-only hosts with no deeplink protocol.
 * @param {'cursor' | 'claude' | 'codex' | 'vscode'} host
 * @returns {boolean}
 */
export function supportsMcpInstallDeeplink(host) {
  if (host !== 'cursor' && host !== 'vscode') return false;
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}
