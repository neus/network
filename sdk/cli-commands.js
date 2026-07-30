/**
 * NEUS CLI command strings — SSOT for docs, MCP context, product UI, and skills.
 *
 * Golden path:
 * - Run the published CLI without relying on a global shim.
 * - `setup` owns MCP registration for every supported host.
 * - `doctor --live` is the only health-check command.
 */

export const NEUS_PKG = '@neus/sdk';

/** Recommended one-time install for builders using the CLI regularly. */
export const NEUS_INSTALL_CLI = `npm i -g ${NEUS_PKG}`;

/** Zero-install prefix — works without global install. */
export const NEUS_NPX = `npx -y -p ${NEUS_PKG} neus`;

/** Short commands (after `NEUS_INSTALL_CLI`). */
export const NEUS_SETUP_CLI = 'neus setup';
export const NEUS_AUTH_CLI = 'neus auth';
export const NEUS_DOCTOR_CLI = 'neus doctor --live';
export const NEUS_EXAMPLES_CLI = 'neus examples';

/** One-shot copy-paste (no global install required). */
export const NEUS_SETUP_NPX = `${NEUS_NPX} setup`;
export const NEUS_AUTH_NPX = `${NEUS_NPX} auth`;
export const NEUS_DOCTOR_NPX = `${NEUS_NPX} doctor --live`;
export const NEUS_EXAMPLES_NPX = `${NEUS_NPX} examples`;

/**
 * @param {string} agentId
 * @param {'cursor' | 'claude' | 'codex'} [host]
 */
export function neusMountApply(agentId, host = 'cursor') {
  const id = String(agentId || '').trim();
  return `neus mount ${id} --apply ${host}`;
}

/**
 * @param {string} agentId
 * @param {'cursor' | 'claude' | 'codex'} [host]
 */
export function neusMountApplyNpx(agentId, host = 'cursor') {
  const id = String(agentId || '').trim();
  return `${NEUS_NPX} mount ${id} --apply ${host}`;
}

/** Docs and product quick start. */
export const NEUS_QUICKSTART_NPX = NEUS_SETUP_NPX;

/** Per-repo agent bind (after auth on the machine). */
export const NEUS_MOUNT_WORKFLOW = `${NEUS_AUTH_CLI}
neus mount <agentId> --apply cursor
${NEUS_DOCTOR_CLI}`;

/**
 * @param {string} subcommand
 */
export function neusCmd(subcommand) {
  return `neus ${String(subcommand || '').trim()}`;
}

/**
 * @param {string} subcommand
 */
export function neusNpx(subcommand) {
  return `${NEUS_NPX} ${String(subcommand || '').trim()}`;
}
