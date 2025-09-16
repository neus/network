/**
 * NEUS SDK Utilities
 * Core utility functions for proof creation and verification
 * @license Apache-2.0
 */

import { SDKError } from './errors.js';

/**
 * Deterministic JSON stringification for consistent serialization
 * @param {Object} obj - Object to stringify
 * @returns {string} Deterministic JSON string
 */
function deterministicStringify(obj) {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }

  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(item => deterministicStringify(item)).join(',') + ']';
  }

  // Sort object keys for deterministic output
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key => JSON.stringify(key) + ':' + deterministicStringify(obj[key]));

  return '{' + pairs.join(',') + '}';
}

/**
 * Construct verification message for wallet signing
 *
 * @param {Object} params - Message parameters
 * @param {string} params.walletAddress - Wallet address
 * @param {number} params.signedTimestamp - Unix timestamp
 * @param {Object} params.data - Verification data
 * @param {Array<string>} params.verifierIds - Array of verifier IDs
 * @param {number} params.chainId - Chain ID
 * @returns {string} Message for signing
 */
export function constructVerificationMessage({
  walletAddress,
  signedTimestamp,
  data,
  verifierIds,
  chainId
}) {
  // Input validation for critical parameters
  if (!walletAddress || typeof walletAddress !== 'string') {
    throw new SDKError('walletAddress is required and must be a string', 'INVALID_WALLET_ADDRESS');
  }
  if (!signedTimestamp || typeof signedTimestamp !== 'number') {
    throw new SDKError('signedTimestamp is required and must be a number', 'INVALID_TIMESTAMP');
  }
  if (!data || typeof data !== 'object') {
    throw new SDKError('data is required and must be an object', 'INVALID_DATA');
  }
  if (!Array.isArray(verifierIds) || verifierIds.length === 0) {
    throw new SDKError(
      'verifierIds is required and must be a non-empty array',
      'INVALID_VERIFIER_IDS'
    );
  }
  if (!chainId || typeof chainId !== 'number') {
    throw new SDKError('chainId is required and must be a number', 'INVALID_CHAIN_ID');
  }

  // Normalize wallet address to lowercase for consistency (CRITICAL for signature recovery)
  const normalizedWalletAddress = walletAddress.toLowerCase();

  // CRITICAL: Use deterministic JSON serialization for consistency with backend
  // This MUST match backend serialization exactly for signature verification to work
  // NOTE: Any modification to this serialization will break signature verification
  const dataString = deterministicStringify(data);

  // Create canonical message format - EXACT format expected by backend
  const messageComponents = [
    'NEUS Verification Request',
    `Wallet: ${normalizedWalletAddress}`,
    `Chain: ${chainId}`,
    `Verifiers: ${verifierIds.join(',')}`,
    `Data: ${dataString}`,
    `Timestamp: ${signedTimestamp}`
  ];

  // Join with newlines - this is the message that gets signed
  return messageComponents.join('\n');
}

/**
 * Validate Ethereum wallet address format
 *
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid Ethereum address
 */
export function validateWalletAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Basic Ethereum address validation
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate timestamp freshness
 *
 * @param {number} timestamp - Timestamp to validate
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 5 minutes)
 * @returns {boolean} True if timestamp is valid and recent
 */
export function validateTimestamp(timestamp, maxAgeMs = 5 * 60 * 1000) {
  if (!timestamp || typeof timestamp !== 'number') {
    return false;
  }

  const now = Date.now();
  const age = now - timestamp;

  // Check if timestamp is in the past and within allowed age
  return age >= 0 && age <= maxAgeMs;
}

/**
 * Create formatted verification data object
 *
 * @param {string} content - Content to verify
 * @param {string} owner - Owner wallet address
 * @param {Object} reference - Reference object
 * @returns {Object} Formatted verification data
 */
export function createVerificationData(content, owner, reference = null) {
  return {
    content,
    owner: owner.toLowerCase(),
    reference: reference || {
      type: 'content',
      id: content.substring(0, 32)
    }
  };
}

/**
 * DERIVE DID FROM ADDRESS AND CHAIN
 * did:pkh:eip155:<chainId>:<address_lowercase>
 */
export function deriveDid(address, chainId = 84532) {
  if (!address || typeof address !== 'string') {
    throw new SDKError('deriveDid: address is required', 'INVALID_ARGUMENT');
  }
  if (!validateWalletAddress(address)) {
    throw new SDKError('deriveDid: invalid wallet address format', 'INVALID_ARGUMENT');
  }
  if (!chainId || typeof chainId !== 'number') {
    throw new SDKError('deriveDid: chainId (number) is required', 'INVALID_ARGUMENT');
  }
  return `did:pkh:eip155:${chainId}:${address.toLowerCase()}`;
}

/**
 * Determine if a verification status is terminal (completed or failed)
 * @param {string} status - The verification status
 * @returns {boolean} Whether the status is terminal
 */
export function isTerminalStatus(status) {
  if (!status || typeof status !== 'string') return false;

  // Success states
  const successStates = [
    'verified',
    'verified_no_verifiers',
    'verified_crosschain_propagated',
    'partially_verified',
    'verified_propagation_failed'
  ];

  // Failure states
  const failureStates = [
    'rejected',
    'rejected_verifier_failure',
    'rejected_zk_initiation_failure',
    'error_processing_exception',
    'error_initialization',
    'error_storage_unavailable',
    'error_storage_query',
    'not_found'
  ];

  return successStates.includes(status) || failureStates.includes(status);
}

/**
 * Determine if a verification status indicates success
 * @param {string} status - The verification status
 * @returns {boolean} Whether the status indicates success
 */
export function isSuccessStatus(status) {
  if (!status || typeof status !== 'string') return false;

  const successStates = [
    'verified',
    'verified_no_verifiers',
    'verified_crosschain_propagated',
    'partially_verified',
    'verified_propagation_failed'
  ];

  return successStates.includes(status);
}

/**
 * Determine if a verification status indicates failure
 * @param {string} status - The verification status
 * @returns {boolean} Whether the status indicates failure
 */
export function isFailureStatus(status) {
  if (!status || typeof status !== 'string') return false;

  const failureStates = [
    'rejected',
    'rejected_verifier_failure',
    'rejected_zk_initiation_failure',
    'error_processing_exception',
    'error_initialization',
    'error_storage_unavailable',
    'error_storage_query',
    'not_found'
  ];

  return failureStates.includes(status);
}

/**
 * Format verification status for display
 * @param {string} status - Raw status from API
 * @returns {Object} Formatted status information
 */
export function formatVerificationStatus(status) {
  const statusMap = {
    processing_verifiers: {
      label: 'Processing',
      description: 'Verifiers are being executed',
      category: 'processing',
      color: 'blue'
    },
    processing_zk_proofs: {
      label: 'Generating ZK Proofs',
      description: 'Zero-knowledge proofs are being generated',
      category: 'processing',
      color: 'blue'
    },
    verified: {
      label: 'Verified',
      description: 'Verification completed successfully',
      category: 'success',
      color: 'green'
    },
    verified_crosschain_initiated: {
      label: 'Cross-chain Initiated',
      description: 'Verification successful, cross-chain propagation started',
      category: 'processing',
      color: 'blue'
    },
    verified_crosschain_propagating: {
      label: 'Cross-chain Propagating',
      description: 'Verification successful, transactions propagating to spoke chains',
      category: 'processing',
      color: 'blue'
    },
    verified_crosschain_propagated: {
      label: 'Fully Propagated',
      description: 'Verification completed and propagated to all target chains',
      category: 'success',
      color: 'green'
    },
    verified_no_verifiers: {
      label: 'Verified (No Verifiers)',
      description: 'Verification completed without specific verifiers',
      category: 'success',
      color: 'green'
    },
    verified_propagation_failed: {
      label: 'Propagation Failed',
      description: 'Verification successful but cross-chain propagation failed',
      category: 'warning',
      color: 'orange'
    },
    partially_verified: {
      label: 'Partially Verified',
      description: 'Some verifiers succeeded, others failed',
      category: 'warning',
      color: 'orange'
    },
    rejected: {
      label: 'Rejected',
      description: 'Verification failed',
      category: 'error',
      color: 'red'
    },
    rejected_verifier_failure: {
      label: 'Verifier Failed',
      description: 'One or more verifiers failed',
      category: 'error',
      color: 'red'
    },
    rejected_zk_initiation_failure: {
      label: 'ZK Initiation Failed',
      description: 'Zero-knowledge proof generation failed to start',
      category: 'error',
      color: 'red'
    },
    error_processing_exception: {
      label: 'Processing Error',
      description: 'An error occurred during verification processing',
      category: 'error',
      color: 'red'
    },
    error_initialization: {
      label: 'Initialization Error',
      description: 'Failed to initialize verification',
      category: 'error',
      color: 'red'
    },
    not_found: {
      label: 'Not Found',
      description: 'Verification record not found',
      category: 'error',
      color: 'red'
    }
  };

  return (
    statusMap[status] || {
      label: status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
      description: 'Unknown status',
      category: 'unknown',
      color: 'gray'
    }
  );
}

/**
 * Compute keccak256 content hash (0x-prefixed) for arbitrary input
 * Uses ethers (peer dependency) via dynamic import to avoid hard bundling
 *
 * @param {string|Uint8Array} input - Raw string (UTF-8) or bytes
 * @returns {Promise<string>} 0x-prefixed keccak256 hash
 */
export async function computeContentHash(input) {
  try {
    const ethers = await import('ethers');
    const toBytes = typeof input === 'string' ? ethers.toUtf8Bytes(input) : input;
    return ethers.keccak256(toBytes);
  } catch {
    throw new SDKError(
      'computeContentHash requires peer dependency "ethers" >= 6.0.0',
      'MISSING_PEER_DEP'
    );
  }
}

/**
 * Create a delay/sleep function
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the delay
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Status Polling Utility for tracking verification progress
 */
export class StatusPoller {
  constructor(client, qHash, options = {}) {
    this.client = client;
    this.qHash = qHash;
    this.options = {
      interval: 2000, // 2 seconds
      maxAttempts: 150, // 5 minutes total
      exponentialBackoff: true,
      maxInterval: 10000, // 10 seconds max
      ...options
    };
    this.attempt = 0;
    this.currentInterval = this.options.interval;
  }

  async poll() {
    return new Promise((resolve, reject) => {
      const pollAttempt = async () => {
        try {
          this.attempt++;

          const response = await this.client.getStatus(this.qHash);

          // Check if verification is complete using the terminal status utility
          if (isTerminalStatus(response.status)) {
            resolve(response);
            return;
          }

          // Check if we've exceeded max attempts
          if (this.attempt >= this.options.maxAttempts) {
            reject(new SDKError('Verification polling timeout', 'POLLING_TIMEOUT'));
            return;
          }

          // Schedule next poll with optional exponential backoff
          if (this.options.exponentialBackoff) {
            this.currentInterval = Math.min(this.currentInterval * 1.5, this.options.maxInterval);
          }

          setTimeout(pollAttempt, this.currentInterval);
        } catch (error) {
          reject(new SDKError(`Polling failed: ${error.message}`, 'POLLING_ERROR'));
        }
      };

      // Start polling immediately
      pollAttempt();
    });
  }
}

/**
 * NEUS Network Constants
 */
export const NEUS_CONSTANTS = {
  // Hub chain (where all verifications occur)
  HUB_CHAIN_ID: 84532, // Base Sepolia

  // Supported target chains for cross-chain propagation
  TESTNET_CHAINS: [
    11155111, // Ethereum Sepolia
    11155420, // Optimism Sepolia
    421614, // Arbitrum Sepolia
    80002 // Polygon Amoy
  ],

  // API endpoints
  API_BASE_URL: 'https://api.neus.network',
  API_VERSION: 'v1',

  // Timeouts and limits
  SIGNATURE_MAX_AGE_MS: 5 * 60 * 1000, // 5 minutes
  REQUEST_TIMEOUT_MS: 30 * 1000, // 30 seconds

  // Day-one verifiers (available at launch)
  DEFAULT_VERIFIERS: ['ownership-basic', 'nft-ownership', 'token-holding', 'ownership-licensed']
};

/**
 * Additional validation and utility helpers
 */

/**
 * Validate qHash format (0x + 64 hex chars)
 * @param {string} qHash - The qHash to validate
 * @returns {boolean} True if valid qHash format
 */
export function validateQHash(qHash) {
  return typeof qHash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(qHash);
}

/**
 * Format timestamp to human readable string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
export function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

/**
 * Check if a chain ID is supported for cross-chain propagation
 * @param {number} chainId - Chain ID to check
 * @returns {boolean} True if supported
 */
export function isSupportedChain(chainId) {
  return NEUS_CONSTANTS.TESTNET_CHAINS.includes(chainId) || chainId === NEUS_CONSTANTS.HUB_CHAIN_ID;
}

/**
 * Normalize wallet address to lowercase (EIP-55 agnostic)
 * @param {string} address - Wallet address to normalize
 * @returns {string} Lowercase address
 */
export function normalizeAddress(address) {
  if (!validateWalletAddress(address)) {
    throw new SDKError('Invalid wallet address format', 'INVALID_ADDRESS');
  }
  return address.toLowerCase();
}

/**
 * Validate a verifier payload for basic structural integrity.
 * Lightweight validation checks; verifier authors should document complete schemas.
 * @param {string} verifierId - Verifier identifier (e.g., 'ownership-basic' or custom)
 * @param {any} data - Verifier-specific payload
 * @returns {{ valid: boolean, error?: string, missing?: string[], warnings?: string[] }}
 */
export function validateVerifierPayload(verifierId, data) {
  const result = { valid: true, missing: [], warnings: [] };

  if (!verifierId || typeof verifierId !== 'string') {
    return { valid: false, error: 'verifierId is required and must be a string' };
  }

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'data must be a non-null object' };
  }

  // Best-effort field hints for day-one built-ins
  const id = verifierId.replace(/@\d+$/, '');
  if (id === 'nft-ownership') {
    ['ownerAddress', 'contractAddress', 'tokenId', 'chainId'].forEach(key => {
      if (!(key in data)) result.missing.push(key);
    });
  } else if (id === 'token-holding') {
    ['ownerAddress', 'contractAddress', 'minBalance', 'chainId'].forEach(key => {
      if (!(key in data)) result.missing.push(key);
    });
  } else if (id === 'ownership-basic') {
    ['content'].forEach(key => {
      if (!(key in data)) result.missing.push(key);
    });
  } else if (id === 'ownership-licensed') {
    ['content', 'owner', 'license'].forEach(key => {
      if (!(key in data)) result.missing.push(key);
    });
    if (data.license && typeof data.license === 'object') {
      ['contractAddress', 'tokenId', 'chainId', 'ownerAddress'].forEach(key => {
        if (!(key in data.license)) result.missing.push(`license.${key}`);
      });
    }
  }

  if (result.missing.length > 0) {
    result.valid = false;
    result.error = `Missing required fields: ${result.missing.join(', ')}`;
  }

  return result;
}

/**
 * Build a canonical verification request and signing message for manual flows.
 * Returns the message to sign and the request body (sans signature).
 * @param {Object} params
 * @param {string[]} params.verifierIds
 * @param {object} params.data
 * @param {string} params.walletAddress
 * @param {number} [params.chainId=NEUS_CONSTANTS.HUB_CHAIN_ID]
 * @param {object} [params.options]
 * @param {number} [params.signedTimestamp=Date.now()]
 * @returns {{ message: string, request: { verifierIds: string[], data: object, walletAddress: string, signedTimestamp: number, chainId: number, options?: object } }}
 */
export function buildVerificationRequest({
  verifierIds,
  data,
  walletAddress,
  chainId = NEUS_CONSTANTS.HUB_CHAIN_ID,
  options = undefined,
  signedTimestamp = Date.now()
}) {
  if (!Array.isArray(verifierIds) || verifierIds.length === 0) {
    throw new SDKError('verifierIds must be a non-empty array', 'INVALID_ARGUMENT');
  }
  if (!validateWalletAddress(walletAddress)) {
    throw new SDKError('walletAddress must be a valid 0x address', 'INVALID_ARGUMENT');
  }
  if (!data || typeof data !== 'object') {
    throw new SDKError('data must be a non-null object', 'INVALID_ARGUMENT');
  }
  if (typeof chainId !== 'number') {
    throw new SDKError('chainId must be a number', 'INVALID_ARGUMENT');
  }

  const message = constructVerificationMessage({
    walletAddress,
    signedTimestamp,
    data,
    verifierIds,
    chainId
  });

  const request = {
    verifierIds,
    data,
    walletAddress,
    signedTimestamp,
    chainId,
    ...(options ? { options } : {})
  };

  return { message, request };
}

/**
 * Create a retry utility with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Promise that resolves with function result
 */
export async function withRetry(fn, options = {}) {
  const { maxAttempts = 3, baseDelay = 1000, maxDelay = 10000, backoffFactor = 2 } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) break;

      const delayMs = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);

      await delay(delayMs);
    }
  }

  throw lastError;
}

/**
 * Validate signature components for debugging signature verification issues
 * @param {Object} params - Signature components to validate
 * @param {string} params.walletAddress - Wallet address
 * @param {string} params.signature - EIP-191 signature
 * @param {number} params.signedTimestamp - Unix timestamp
 * @param {Object} params.data - Verification data
 * @param {Array<string>} params.verifierIds - Array of verifier IDs
 * @param {number} params.chainId - Chain ID
 * @returns {Object} Validation result with detailed feedback
 */
export function validateSignatureComponents({
  walletAddress,
  signature,
  signedTimestamp,
  data,
  verifierIds,
  chainId
}) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    debugInfo: {}
  };

  // Validate wallet address
  if (!validateWalletAddress(walletAddress)) {
    result.valid = false;
    result.errors.push('Invalid wallet address format - must be 0x + 40 hex characters');
  } else {
    result.debugInfo.normalizedAddress = walletAddress.toLowerCase();
    if (walletAddress !== walletAddress.toLowerCase()) {
      result.warnings.push('Wallet address should be lowercase for consistency');
    }
  }

  // Validate signature format
  if (!signature || typeof signature !== 'string') {
    result.valid = false;
    result.errors.push('Signature is required and must be a string');
  } else if (!/^0x[a-fA-F0-9]{130}$/.test(signature)) {
    result.valid = false;
    result.errors.push('Invalid signature format - must be 0x + 130 hex characters (65 bytes)');
  }

  // Validate timestamp
  if (!validateTimestamp(signedTimestamp)) {
    result.valid = false;
    result.errors.push('Invalid or expired timestamp - must be within 5 minutes');
  } else {
    result.debugInfo.timestampAge = Date.now() - signedTimestamp;
  }

  // Validate data object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    result.valid = false;
    result.errors.push('Data must be a non-null object');
  } else {
    result.debugInfo.dataString = deterministicStringify(data);
  }

  // Validate verifier IDs
  if (!Array.isArray(verifierIds) || verifierIds.length === 0) {
    result.valid = false;
    result.errors.push('VerifierIds must be a non-empty array');
  }

  // Validate chain ID
  if (typeof chainId !== 'number') {
    result.valid = false;
    result.errors.push('ChainId must be a number');
  }

  // Generate the message that would be signed
  if (result.valid || result.errors.length < 3) {
    try {
      result.debugInfo.messageToSign = constructVerificationMessage({
        walletAddress: walletAddress?.toLowerCase() || walletAddress,
        signedTimestamp,
        data,
        verifierIds,
        chainId
      });
    } catch (error) {
      result.errors.push(`Failed to construct message: ${error.message}`);
    }
  }

  return result;
}
