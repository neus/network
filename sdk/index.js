// NEUS SDK - Create and verify cryptographic proofs

// Core client
export { NeusClient } from './client.js';

// Essential utilities
export {
  constructVerificationMessage,
  validateWalletAddress,
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
  validateVerifierPayload,
  buildVerificationRequest,
  createVerificationData,
  validateSignatureComponents,
  withRetry,
  delay,
  NEUS_CONSTANTS
} from './utils.js';

// Gate recipes (examples, NOT defaults - pick what fits your use case)
export {
  // Time constants
  HOUR,
  DAY,
  WEEK,
  MONTH,
  YEAR,
  // Recipe gates
  GATE_NFT_HOLDER,
  GATE_TOKEN_HOLDER,
  GATE_CONTRACT_ADMIN,
  GATE_DOMAIN_OWNER,
  GATE_LINKED_WALLETS,
  // Helpers
  createGate,
  combineGates,
} from './gates.js';

// Error classes
export {
  SDKError,
  ApiError,
  ValidationError,
  NetworkError,
  ConfigurationError,
  VerificationError,
  AuthenticationError
} from './errors.js';

// Default export
export default {
  NeusClient: () => import('./client.js').then(m => m.NeusClient),
  toString: () => '[neus/sdk]'
};