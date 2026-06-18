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
export const MCP_INSTALL_HOSTS = ['cursor', 'claude', 'codex'];

export const IDE_HOST_LABELS = {
  cursor: 'Cursor',
  claude: 'Claude Code',
  codex: 'Codex',
};

export const IDE_HOST_BRAND_LOGOS = {
  cursor: '/images/brandLogos/cursor.svg',
  claude: '/images/brandLogos/anthropic.svg',
  codex: '/images/brandLogos/openai.svg',
};

/**
 * @param {string | null | undefined} accessKey
 * @returns {{ type: 'http'; url: string; headers?: { Authorization: string } }}
 */
export function buildNeusMcpHttpConfig(accessKey) {
  const key = String(accessKey || '').trim();
  return {
    type: 'http',
    url: NEUS_MCP_URL,
    ...(key ? { headers: { Authorization: `Bearer ${key}` } } : {}),
  };
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
  const config = buildNeusMcpHttpConfig(accessKey);
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
    ...buildNeusMcpHttpConfig(accessKey),
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
 * Cursor supports MCP install deeplinks; Codex uses CLI, not VS Code deeplinks.
 * @param {'cursor' | 'claude' | 'codex'} host
 * @returns {boolean}
 */
export function supportsMcpInstallDeeplink(host) {
  if (host !== 'cursor') return false;
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}
