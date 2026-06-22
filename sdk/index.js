
export { NeusClient } from './client.js';

export {
  PORTABLE_PROOF_SIGNER_HEADER,
  constructVerificationMessage,
  validateWalletAddress,
  validateUniversalAddress,
  validateTimestamp,
  validateQHash,
  normalizeAddress,
  isTerminalStatus,
  isSuccessStatus,
  isFailureStatus,
  formatVerificationStatus,
  formatTimestamp,
  isSupportedChain,
  StatusPoller,
  computeContentHash,
  deriveDid,
  toHexUtf8,
  resolveDID,
  signMessage,
  standardizeVerificationRequest,
  resolveZkPassportConfig,
  validateVerifierPayload,
  buildVerificationRequest,
  createVerificationData,
  validateSignatureComponents,
  withRetry,
  delay,
  NEUS_CONSTANTS,
  DEFAULT_HOSTED_VERIFY_URL,
  getHostedCheckoutUrl,
  toAgentDelegationMaxSpend
} from './utils.js';

export {
  HOUR,
  DAY,
  WEEK,
  MONTH,
  YEAR,
  GATE_NFT_HOLDER,
  GATE_TOKEN_HOLDER,
  GATE_CONTRACT_ADMIN,
  GATE_DOMAIN_OWNER,
  GATE_LINKED_WALLETS,
  GATE_AGENT_IDENTITY,
  GATE_AGENT_DELEGATION,
  GATE_CONTENT_MODERATION,
  GATE_WALLET_RISK,
  GATE_PSEUDONYM,
  createGate,
  combineGates
} from './gates.js';

export { fetchSponsorGrant } from './sponsor.js';

export {
  RUNTIME_MOUNT_SCHEMA,
  normalizeWallet,
  isDelegationExpired,
  pickIdentity,
  pickActiveDelegation,
  resolveEffectiveRuntime,
  extractAgentContextFromProofs,
  buildRuntimeBundle,
  profileAgentToIdentitySeed,
  isRuntimeBundle,
  resolveRuntimeBundleFromMcp,
  evaluateMountFileHealth
} from './runtime-mount.js';

// Node-only adapters (fs/path): import `@neus/sdk/runtime-adapters` — not re-exported here (Next/webpack safe).

export {
  SDKError,
  ApiError,
  ValidationError,
  NetworkError,
  ConfigurationError,
  VerificationError,
  AuthenticationError
} from './errors.js';

export {
  NEUS_MCP_SERVER_NAME,
  NEUS_MCP_URL,
  NEUS_SETUP_CLI,
  NEUS_AUTH_CLI,
  NEUS_CHECK_CLI,
  NEUS_DOCTOR_CLI,
  NEUS_SETUP_NPX,
  NEUS_CHECK_NPX,
  NEUS_INSTALL_CLI,
  NEUS_NPX,
  NEUS_QUICKSTART_INSTALLED,
  NEUS_QUICKSTART_NPX,
  NEUS_MOUNT_WORKFLOW,
  NEUS_MCP_SETUP_DOCS_URL,
  MCP_INSTALL_CLIENTS,
  MCP_INSTALL_HOSTS,
  IDE_HOST_LABELS,
  IDE_HOST_BRAND_LOGOS,
  buildNeusMcpHttpConfig,
  buildCursorMcpInstallUrl,
  buildVsCodeMcpInstallUrl,
  buildSetupCommandForClient,
  buildSetupCommandForHost,
  buildSetupNpxOneLiner,
  buildAuthCommandForClient,
  supportsMcpInstallDeeplink,
  neusMountApply,
  neusMountApplyNpx,
} from './mcp-hosts.js';

export {
  NEUS_PKG,
  NEUS_EXAMPLES_CLI,
  NEUS_EXAMPLES_NPX,
  NEUS_AUTH_NPX,
  NEUS_DOCTOR_NPX,
  neusCmd,
  neusNpx,
} from './cli-commands.js';

export default {
  NeusClient: () => import('./client.js').then((m) => m.NeusClient),
  toString: () => '[neus/sdk]',
};