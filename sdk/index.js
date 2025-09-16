/**
 * NEUS SDK - Universal Verification Protocol
 * Create and verify cryptographic proofs across applications
 * @license Apache-2.0
 */

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

// IPFS helpers
export const IPFS_GATEWAY = 'https://ipfs.neus.network/ipfs/';
export const toIpfsUrl = cid => `${IPFS_GATEWAY}${cid.replace(/^ipfs:\/\//, '')}`;
export const resolveIpfsUrl = cid => toIpfsUrl(cid);

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

// Convenience functions
export const verifyProof = async qHash => {
  const { NeusClient } = await import('./client.js');
  const client = new NeusClient();
  return client.getStatus(qHash);
};

export const checkProofStatus = async proofId => {
  const { NeusClient } = await import('./client.js');
  const client = new NeusClient();
  return client.getStatus(proofId);
};

// Default export
export default {
  NeusClient: () => import('./client.js').then(m => m.NeusClient),
  verifyProof,
  toIpfsUrl,
  resolveIpfsUrl
};
