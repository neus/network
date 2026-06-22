/**
 * NEUS CLI command strings — SSOT for docs, MCP context, product UI, and skills.
 *
 * Pattern (industry default):
 * - Install once: `npm i -g @neus/sdk`
 * - Daily use: `neus <command>` (short)
 * - Zero-install try: `npx @neus/sdk <command>` (no global install)
 */

export const NEUS_PKG = '@neus/sdk';

/** Recommended one-time install for builders using the CLI regularly. */
export const NEUS_INSTALL_CLI = `npm i -g ${NEUS_PKG}`;

/** Zero-install prefix — works without global install. */
export const NEUS_NPX = `npx ${NEUS_PKG}`;

/** Short commands (after `NEUS_INSTALL_CLI`). */
export const NEUS_SETUP_CLI = 'neus setup';
export const NEUS_AUTH_CLI = 'neus auth';
export const NEUS_CHECK_CLI = 'neus check';
export const NEUS_DOCTOR_CLI = 'neus doctor --live';
export const NEUS_EXAMPLES_CLI = 'neus examples';

/** One-shot copy-paste (no global install required). */
export const NEUS_SETUP_NPX = `${NEUS_NPX} setup`;
export const NEUS_AUTH_NPX = `${NEUS_NPX} auth`;
export const NEUS_CHECK_NPX = `${NEUS_NPX} check`;
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

/** Docs / landing quick start (installed path). */
export const NEUS_QUICKSTART_INSTALLED = `${NEUS_INSTALL_CLI}
${NEUS_SETUP_CLI}
${NEUS_AUTH_CLI}`;

/** Docs quick try (zero-install). */
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
