
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

export {
  SDKError,
  ApiError,
  ValidationError,
  NetworkError,
  ConfigurationError,
  VerificationError,
  AuthenticationError
} from './errors.js';

export default {
  NeusClient: () => import('./client.js').then(m => m.NeusClient),
  toString: () => '[neus/sdk]'
};