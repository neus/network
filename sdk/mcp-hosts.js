/**
 * MCP host install constants shared by the `neus` CLI and product UI.
 * Browser-safe: no Node-only APIs except the Buffer fallback for non-browser tests.
 */

export const NEUS_MCP_SERVER_NAME = 'neus';
export const NEUS_MCP_URL = 'https://mcp.neus.network/mcp';
export const NEUS_SETUP_CLI = 'npx -y -p @neus/sdk neus setup';
export const NEUS_AUTH_CLI = 'npx -y -p @neus/sdk neus auth';
export const NEUS_MCP_SETUP_DOCS_URL = 'https://docs.neus.network/mcp/ide-plugin';

/** CLI `neus setup --client` values. */
export const MCP_INSTALL_CLIENTS = ['claude', 'codex', 'cursor', 'vscode'];

/** Product Profile "Open in" hosts. */
export const MCP_INSTALL_HOSTS = ['cursor', 'claude', 'codex'];

export const IDE_HOST_LABELS = {
  cursor: 'Cursor',
  claude: 'Claude Code',
  codex: 'Codex'
};

export const IDE_HOST_BRAND_LOGOS = {
  cursor: '/images/brandLogos/cursor.svg',
  claude: '/images/brandLogos/anthropic.svg',
  codex: '/images/brandLogos/openai.svg'
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
    ...(key ? { headers: { Authorization: `Bearer ${key}` } } : {})
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
    ...buildNeusMcpHttpConfig(accessKey)
  };
  return `vscode:mcp/install?${encodeURIComponent(JSON.stringify(payload))}`;
}

/**
 * @param {'claude' | 'codex' | 'cursor' | 'vscode'} client
 * @returns {string}
 */
export function buildAuthCommandForClient(client) {
  if (client === 'codex') {
    return `${NEUS_AUTH_CLI} --client codex`;
  }
  return NEUS_AUTH_CLI;
}

/**
 * @param {'claude' | 'codex' | 'cursor' | 'vscode'} client
 * @param {string | null | undefined} accessKey
 * @returns {string}
 */
export function buildSetupCommandForClient(client, accessKey) {
  const key = String(accessKey || '').trim();
  const setup = key
    ? `${NEUS_SETUP_CLI} --client ${client} --access-key ${key}`
    : `${NEUS_SETUP_CLI} --client ${client}`;
  if (key) return setup;
  return `${setup}\n${buildAuthCommandForClient(client)}`;
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
