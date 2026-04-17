/**
 * NEUS SDK Utilities
 * Core utility functions for proof creation and verification
 */

import { SDKError, ApiError, ValidationError } from './errors.js';

/** CAIP-380 six-line signer message — line 1 (fixed context label). */
export const PORTABLE_PROOF_SIGNER_HEADER = 'Portable Proof Verification Request';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58Bytes(input) {
  let source;
  if (input instanceof Uint8Array) {
    source = input;
  } else if (input instanceof ArrayBuffer) {
    source = new Uint8Array(input);
  } else if (ArrayBuffer.isView(input)) {
    source = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  } else if (typeof Buffer !== 'undefined' && typeof Buffer.isBuffer === 'function' && Buffer.isBuffer(input)) {
    source = new Uint8Array(input);
  } else {
    throw new SDKError('Unsupported non-EVM signature byte format', 'INVALID_SIGNATURE_FORMAT');
  }

  if (source.length === 0) return '';

  let zeroes = 0;
  while (zeroes < source.length && source[zeroes] === 0) {
    zeroes++;
  }

  const iFactor = Math.log(256) / Math.log(58);
  const size = (((source.length - zeroes) * iFactor) + 1) >>> 0;
  const b58 = new Uint8Array(size);

  let length = 0;
  for (let i = zeroes; i < source.length; i++) {
    let carry = source[i];
    let j = 0;
    for (let k = size - 1; (carry !== 0 || j < length) && k >= 0; k--, j++) {
      carry += 256 * b58[k];
      b58[k] = carry % 58;
      carry = (carry / 58) | 0;
    }
    length = j;
  }

  let it = size - length;
  while (it < size && b58[it] === 0) {
    it++;
  }

  let out = BASE58_ALPHABET[0].repeat(zeroes);
  for (; it < size; it++) {
    out += BASE58_ALPHABET[b58[it]];
  }
  return out;
}

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
    if (typeof obj === 'string') return JSON.stringify(obj.normalize('NFC'));
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return `[${  obj.map(item => (item === undefined ? 'null' : deterministicStringify(item))).join(',')  }]`;
  }

  const sortedKeys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
  const pairs = sortedKeys.map(key =>
    `${JSON.stringify(key)  }:${  deterministicStringify(obj[key])}`
  );

  return `{${  pairs.join(',')  }}`;
}

/**
 * CAIP-380 EVM: line3 is decimal chainId. Non-EVM: CAIP-2 chain string.
 */
function chainLineForPortableProofSigner(chain, chainId) {
  if (typeof chain === 'string' && chain.length > 0) {
    const m = chain.match(/^eip155:(\d+)$/);
    if (m) return Number(m[1]);
    return chain;
  }
  if (typeof chainId === 'number' && Number.isFinite(chainId) && chainId > 0) {
    return chainId;
  }
  throw new SDKError('chainId is required (or provide chain for universal mode)', 'INVALID_CHAIN_CONTEXT');
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
export function constructVerificationMessage({ walletAddress, signedTimestamp, data, verifierIds, chainId, chain }) {
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
    throw new SDKError('verifierIds is required and must be a non-empty array', 'INVALID_VERIFIER_IDS');
  }

  if ((typeof chain !== 'string' || !chain.length) && !(typeof chainId === 'number' && chainId > 0)) {
    throw new SDKError('chainId is required (or provide chain for universal mode)', 'INVALID_CHAIN_CONTEXT');
  }
  if (typeof chain === 'string' && chain.length > 0 && (!chain.includes(':'))) {
    throw new SDKError('chain must be a "namespace:reference" string', 'INVALID_CHAIN');
  }
  if ((!chain || !chain.length) && typeof chainId !== 'number') {
    throw new SDKError('chainId must be a number when provided', 'INVALID_CHAIN_ID');
  }

  const chainLine = chainLineForPortableProofSigner(chain, chainId);

  // Address normalization: EVM (`eip155`) is lowercased; non-EVM namespaces preserve the original string.
  const namespace = (typeof chain === 'string' && chain.includes(':')) ? chain.split(':')[0] : 'eip155';
  const normalizedWalletAddress = namespace === 'eip155' ? walletAddress.toLowerCase() : walletAddress;

  const dataString = deterministicStringify(data);

  const messageComponents = [
    PORTABLE_PROOF_SIGNER_HEADER,
    `Wallet: ${normalizedWalletAddress}`,
    `Chain: ${chainLine}`,
    `Verifiers: ${verifierIds.join(',')}`,
    `Data: ${dataString}`,
    `Timestamp: ${signedTimestamp}`
  ];

  return messageComponents.join('\n').normalize('NFC');
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
 * Validate universal wallet address format.
 * Uses chain namespace when provided; otherwise applies conservative multi-chain checks.
 *
 * @param {string} address - Address to validate
 * @param {string} [chain] - Optional CAIP-2 chain reference (namespace:reference)
 * @returns {boolean} True if valid universal wallet address
 */
export function validateUniversalAddress(address, chain) {
  if (!address || typeof address !== 'string') return false;
  const value = address.trim();
  if (!value) return false;

  const chainRef = typeof chain === 'string' ? chain.trim().toLowerCase() : '';
  const namespace = chainRef.includes(':') ? chainRef.split(':')[0] : '';

  if (validateWalletAddress(value)) return true;
  if (namespace === 'eip155') return false;

  if (namespace === 'solana') {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
  }

  if (namespace === 'bip122') {
    return /^(bc1|tb1|bcrt1)[a-z0-9]{11,87}$/.test(value.toLowerCase()) ||
      /^[13mn2][a-km-zA-HJ-NP-Z1-9]{25,62}$/.test(value);
  }

  if (namespace === 'near') {
    return /^[a-z0-9._-]{2,64}$/.test(value);
  }

  // Generic fallback for universal-address style identifiers.
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$/.test(value);
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
  // Small, deterministic reference ID for convenience (NOT a cryptographic hash).
  // Integrators that need a stable binding should prefer contentHash or an explicit reference.id.
  const stableRefId = (value) => {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // 32-bit
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `ref-id:${hex}:${str.length}`;
  };

  return {
    content,
    owner: validateWalletAddress(owner) ? owner.toLowerCase() : owner,
    reference: reference || {
      // Must be a valid backend enum value; 'content' is not supported.
      type: 'other',
      id: stableRefId(content)
    }
  };
}

/**
 * DERIVE DID FROM ADDRESS AND CHAIN
   * did:pkh:<namespace>:<chainId|segment>:<address_lowercase>
 */
export function deriveDid(address, chainIdOrChain) {
  if (!address || typeof address !== 'string') {
    throw new SDKError('deriveDid: address is required', 'INVALID_ARGUMENT');
  }

  const chainContext = chainIdOrChain || NEUS_CONSTANTS.HUB_CHAIN_ID;
  const isCAIP = typeof chainContext === 'string' && chainContext.includes(':');

  if (isCAIP) {
    const [namespace, segment] = chainContext.split(':');
    const normalized = (namespace === 'eip155') ? address.toLowerCase() : address;
    return `did:pkh:${namespace}:${segment}:${normalized}`;
  } else {
    if (typeof chainContext !== 'number') {
      throw new SDKError('deriveDid: chainId (number) or chain (namespace:reference string) is required', 'INVALID_ARGUMENT');
    }
    return `did:pkh:eip155:${chainContext}:${address.toLowerCase()}`;
  }
}

/**
 * Resolve DID from wallet identity via API endpoint
 *
 * @param {Object} params - DID resolution parameters
 * @param {string} params.walletAddress - Wallet address to resolve
 * @param {number} [params.chainId] - EVM chain ID
 * @param {string} [params.chain] - Universal chain context (namespace:reference)
 * @param {Object} [options] - Request options
 * @param {string} [options.endpoint='/api/v1/profile/did/resolve'] - DID resolve endpoint
 * @param {string} [options.apiUrl] - Absolute API base URL for non-relative endpoints
 * @param {RequestCredentials} [options.credentials] - Fetch credentials mode
 * @param {Record<string, string>} [options.headers] - Extra request headers
 * @returns {Promise<{did: string, data: any, raw: any}>}
 */
export async function resolveDID(params, options = {}) {
  const endpointPath = options.endpoint || '/api/v1/profile/did/resolve';
  const apiUrl = typeof options.apiUrl === 'string' ? options.apiUrl.trim() : '';

  const resolveEndpoint = (path) => {
    if (!path || typeof path !== 'string') return null;
    const trimmedPath = path.trim();
    if (!trimmedPath) return null;
    if (/^https?:\/\//i.test(trimmedPath)) return trimmedPath;
    if (trimmedPath.startsWith('/')) {
      if (!apiUrl) return trimmedPath;
      try {
        return new URL(trimmedPath, apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`).toString();
      } catch {
        return null;
      }
    }
    const base = apiUrl || NEUS_CONSTANTS.API_BASE_URL;
    if (!base || typeof base !== 'string') return null;
    try {
      return new URL(trimmedPath, base.endsWith('/') ? base : `${base}/`).toString();
    } catch {
      return null;
    }
  };

  const endpoint = resolveEndpoint(endpointPath);
  if (!endpoint) {
    throw new SDKError('resolveDID requires a valid endpoint', 'INVALID_ENDPOINT');
  }

  const payload = {
    walletAddress: params?.walletAddress,
    chainId: params?.chainId,
    chain: params?.chain
  };

  const isRelative = endpoint.startsWith('/') || !/^https?:\/\//i.test(endpoint);
  const credentialsMode = options.credentials !== undefined
    ? options.credentials
    : (isRelative ? 'same-origin' : 'omit');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {})
      },
      body: JSON.stringify(payload),
      credentials: credentialsMode
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = json?.error?.message || json?.error || json?.message || 'DID resolution failed';
      throw new SDKError(msg, 'DID_RESOLVE_FAILED', json);
    }

    const did = json?.data?.did || json?.did;
    if (!did || typeof did !== 'string') {
      throw new SDKError('DID resolution missing DID', 'DID_RESOLVE_MISSING', json);
    }

    return { did, data: json?.data || null, raw: json };
  } catch (error) {
    if (error instanceof SDKError) throw error;
    throw new SDKError(`DID resolution failed: ${error?.message || error}`, 'DID_RESOLVE_FAILED');
  }
}

/**
 * Standardize verification request via backend signer-string endpoint
 *
 * @param {Object} params - Verification request payload
 * @param {Object} [options] - Request options
 * @param {string} [options.endpoint='/api/v1/verification/standardize'] - Standardize endpoint
 * @param {string} [options.apiUrl] - Absolute API base URL for non-relative endpoints
 * @param {RequestCredentials} [options.credentials] - Fetch credentials mode
 * @param {Record<string, string>} [options.headers] - Extra request headers
 * @returns {Promise<any>}
 */
export async function standardizeVerificationRequest(params, options = {}) {
  const endpointPath = options.endpoint || '/api/v1/verification/standardize';
  const apiUrl = typeof options.apiUrl === 'string' ? options.apiUrl.trim() : '';

  const resolveEndpoint = (path) => {
    if (!path || typeof path !== 'string') return null;
    const trimmedPath = path.trim();
    if (!trimmedPath) return null;
    if (/^https?:\/\//i.test(trimmedPath)) return trimmedPath;
    if (trimmedPath.startsWith('/')) {
      if (!apiUrl) return trimmedPath;
      try {
        return new URL(trimmedPath, apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`).toString();
      } catch {
        return null;
      }
    }
    const base = apiUrl || NEUS_CONSTANTS.API_BASE_URL;
    if (!base || typeof base !== 'string') return null;
    try {
      return new URL(trimmedPath, base.endsWith('/') ? base : `${base}/`).toString();
    } catch {
      return null;
    }
  };

  const endpoint = resolveEndpoint(endpointPath);
  if (!endpoint) {
    throw new SDKError('standardizeVerificationRequest requires a valid endpoint', 'INVALID_ENDPOINT');
  }

  const isRelative = endpoint.startsWith('/') || !/^https?:\/\//i.test(endpoint);
  const credentialsMode = options.credentials !== undefined
    ? options.credentials
    : (isRelative ? 'same-origin' : 'omit');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {})
      },
      body: JSON.stringify(params || {}),
      credentials: credentialsMode
    });

    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const msg = json?.error?.message || json?.error || json?.message || 'Standardize request failed';
      throw new SDKError(msg, 'STANDARDIZE_FAILED', json);
    }

    return json?.data || json;
  } catch (error) {
    if (error instanceof SDKError) throw error;
    throw new SDKError(`Standardize request failed: ${error?.message || error}`, 'STANDARDIZE_FAILED');
  }
}

/**
 * Resolve default ZK Passport configuration values.
 * Kept as an SDK utility to preserve existing app integrations.
 *
 * @param {Object} [overrides] - Caller-provided config overrides
 * @returns {Object}
 */
export function resolveZkPassportConfig(overrides = {}) {
  const defaults = {
    provider: 'zkpassport',
    scope: 'basic_kyc',
    checkSanctions: true,
    requireFaceMatch: true,
    faceMatchMode: 'strict'
  };

  return {
    ...defaults,
    ...(overrides && typeof overrides === 'object' ? overrides : {})
  };
}

/**
 * Convert a UTF-8 string to `0x`-prefixed hex.
 *
 * @param {string} value
 * @returns {string}
 */
export function toHexUtf8(value) {
  const input = typeof value === 'string' ? value : String(value || '');
  const bytes = new TextEncoder().encode(input);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Sign an arbitrary message with the provided wallet/provider.
 * Supports EIP-1193 wallets and signer-like objects.
 *
 * @param {Object} params
 * @param {Object} [params.provider] - Wallet provider/signer
 * @param {string} params.message - Message to sign
 * @param {string} [params.walletAddress] - Explicit signer address (recommended)
 * @param {string} [params.chain] - Chain context (`namespace:reference`)
 * @returns {Promise<string>}
 */
export async function signMessage({ provider, message, walletAddress, chain } = {}) {
  const msg = typeof message === 'string' ? message : String(message || '');
  if (!msg) {
    throw new SDKError('signMessage: message is required', 'INVALID_ARGUMENT');
  }

  const resolvedProvider = provider || (
    typeof window !== 'undefined' && window?.ethereum ? window.ethereum : null
  );
  if (!resolvedProvider) {
    throw new SDKError('signMessage: provider is required', 'SIGNER_UNAVAILABLE');
  }

  const chainStr = typeof chain === 'string' && chain.trim().length > 0 ? chain.trim() : 'eip155';
  const namespace = chainStr.includes(':') ? chainStr.split(':')[0] || 'eip155' : 'eip155';

  const resolveAddress = async () => {
    if (typeof walletAddress === 'string' && walletAddress.trim().length > 0) return walletAddress;
    if (namespace === 'solana') {
      if (resolvedProvider?.publicKey && typeof resolvedProvider.publicKey.toBase58 === 'function') {
        const pk = resolvedProvider.publicKey.toBase58();
        if (typeof pk === 'string' && pk) return pk;
      }
      if (typeof resolvedProvider.getAddress === 'function') {
        const addr = await resolvedProvider.getAddress().catch(() => null);
        if (typeof addr === 'string' && addr) return addr;
      }
      if (typeof resolvedProvider.address === 'string' && resolvedProvider.address) return resolvedProvider.address;
      return null;
    }
    if (typeof resolvedProvider.address === 'string' && resolvedProvider.address) return resolvedProvider.address;
    if (typeof resolvedProvider.getAddress === 'function') return resolvedProvider.getAddress();
    if (typeof resolvedProvider.request === 'function') {
      let accounts = await resolvedProvider.request({ method: 'eth_accounts' }).catch(() => []);
      if (!Array.isArray(accounts) || accounts.length === 0) {
        accounts = await resolvedProvider.request({ method: 'eth_requestAccounts' }).catch(() => []);
      }
      if (Array.isArray(accounts) && accounts[0]) return accounts[0];
    }
    return null;
  };

  if (namespace !== 'eip155') {
    if (typeof resolvedProvider.signMessage === 'function') {
      const encoded = typeof msg === 'string' ? new TextEncoder().encode(msg) : msg;
      const result = await resolvedProvider.signMessage(encoded);
      if (typeof result === 'string' && result) return result;
      if (result instanceof Uint8Array) return encodeBase58Bytes(result);
      if (result instanceof ArrayBuffer) return encodeBase58Bytes(new Uint8Array(result));
      if (ArrayBuffer.isView(result)) return encodeBase58Bytes(result);
      if (typeof Buffer !== 'undefined' && typeof Buffer.isBuffer === 'function' && Buffer.isBuffer(result)) return encodeBase58Bytes(result);
    }
    throw new SDKError('Non-EVM signing requires provider.signMessage', 'SIGNER_UNAVAILABLE');
  }

  const address = await resolveAddress();

  if (typeof resolvedProvider.request === 'function' && address) {
    let firstPersonalSignError = null;
    try {
      const sig = await resolvedProvider.request({ method: 'personal_sign', params: [msg, address] });
      if (typeof sig === 'string' && sig) return sig;
    } catch (error) {
      firstPersonalSignError = error;
    }

    let secondPersonalSignError = null;
    try {
      const sig = await resolvedProvider.request({ method: 'personal_sign', params: [address, msg] });
      if (typeof sig === 'string' && sig) return sig;
    } catch (error) {
      secondPersonalSignError = error;
      const signatureErrorMessage = String(
        error?.message ||
        error?.reason ||
        firstPersonalSignError?.message ||
        firstPersonalSignError?.reason ||
        ''
      ).toLowerCase();
      const needsHex = /byte|bytes|invalid byte sequence|encoding|non-hex/i.test(signatureErrorMessage);
      if (needsHex) {
        try {
          const hexMsg = toHexUtf8(msg);
          const sig = await resolvedProvider.request({ method: 'personal_sign', params: [hexMsg, address] });
          if (typeof sig === 'string' && sig) return sig;
        } catch {
          // Continue to additional fallbacks.
        }
      }
    }

    try {
      const sig = await resolvedProvider.request({ method: 'eth_sign', params: [address, msg] });
      if (typeof sig === 'string' && sig) return sig;
    } catch { /* try next method */ }

    if (secondPersonalSignError || firstPersonalSignError) {
      const lastError = secondPersonalSignError || firstPersonalSignError;
      const isUserRejection = [4001, 'ACTION_REJECTED'].includes(lastError?.code);
      if (isUserRejection) {
        throw lastError;
      }
    }
  }

  if (typeof resolvedProvider.signMessage === 'function') {
    const result = await resolvedProvider.signMessage(msg);
    if (typeof result === 'string' && result) return result;
  }

  throw new SDKError('Unable to sign message with provided wallet/provider', 'SIGNER_UNAVAILABLE');
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
    'processing_verifiers': {
      label: 'Processing',
      description: 'Verifiers are being executed',
      category: 'processing',
      color: 'blue'
    },
    'processing_zk_proofs': {
      label: 'Generating ZK Proofs',
      description: 'Zero-knowledge proofs are being generated',
      category: 'processing',
      color: 'blue'
    },
    'verified': {
      label: 'Verified',
      description: 'Verification completed successfully',
      category: 'success',
      color: 'green'
    },
    'verified_crosschain_initiated': {
      label: 'Cross-chain Initiated',
      description: 'Verification successful, cross-chain propagation started',
      category: 'processing',
      color: 'blue'
    },
    'verified_crosschain_propagating': {
      label: 'Cross-chain Propagating',
      description: 'Verification successful, transactions propagating to spoke chains',
      category: 'processing',
      color: 'blue'
    },
    'verified_crosschain_propagated': {
      label: 'Fully Propagated',
      description: 'Verification completed and propagated to all target chains',
      category: 'success',
      color: 'green'
    },
    'verified_no_verifiers': {
      label: 'Verified (No Verifiers)',
      description: 'Verification completed without specific verifiers',
      category: 'success',
      color: 'green'
    },
    'verified_propagation_failed': {
      label: 'Propagation Failed',
      description: 'Verification successful but cross-chain propagation failed',
      category: 'warning',
      color: 'orange'
    },
    'partially_verified': {
      label: 'Partially Verified',
      description: 'Some verifiers succeeded, others failed',
      category: 'warning',
      color: 'orange'
    },
    'rejected': {
      label: 'Rejected',
      description: 'Verification failed',
      category: 'error',
      color: 'red'
    },
    'rejected_verifier_failure': {
      label: 'Verifier Failed',
      description: 'One or more verifiers failed',
      category: 'error',
      color: 'red'
    },
    'rejected_zk_initiation_failure': {
      label: 'ZK Initiation Failed',
      description: 'Zero-knowledge proof generation failed to start',
      category: 'error',
      color: 'red'
    },
    'error_processing_exception': {
      label: 'Processing Error',
      description: 'An error occurred during verification processing',
      category: 'error',
      color: 'red'
    },
    'error_initialization': {
      label: 'Initialization Error',
      description: 'Failed to initialize verification',
      category: 'error',
      color: 'red'
    },
    'not_found': {
      label: 'Not Found',
      description: 'Verification record not found',
      category: 'error',
      color: 'red'
    }
  };

  return statusMap[status] || {
    label: status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
    description: 'Unknown status',
    category: 'unknown',
    color: 'gray'
  };
}

/**
 * Compute keccak256 content hash (0x-prefixed) for arbitrary input
 * Uses ethers (peer dependency) via dynamic import to avoid hard bundling
 *
 * Note: The NEUS backend uses SHAKE256 (quantum-resistant) for content hashing.
 * For content hashes that match the backend, use the /verification/standardize
 * endpoint to get the server-computed hash, or provide the content directly and let
 * the backend compute the hash.
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
    throw new SDKError('computeContentHash requires peer dependency "ethers" >= 6.0.0', 'MISSING_PEER_DEP');
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

          const response = await this.client.getProof(this.qHash);

          // Check if verification is complete using the terminal status utility
          if (isTerminalStatus(response.status)) {
            resolve(response);
            return;
          }

          // Check if we've exceeded max attempts
          if (this.attempt >= this.options.maxAttempts) {
            reject(new SDKError(
              'Verification polling timeout',
              'POLLING_TIMEOUT'
            ));
            return;
          }

          // Schedule next poll with optional exponential backoff
          if (this.options.exponentialBackoff) {
            this.currentInterval = Math.min(
              this.currentInterval * 1.5,
              this.options.maxInterval
            );
          }

          setTimeout(pollAttempt, this.currentInterval);

        } catch (error) {
          if (error instanceof ValidationError) {
            reject(error);
            return;
          }

          if ((error instanceof ApiError && error.statusCode === 429) || error?.isRetryable === true) {
            if (this.options.exponentialBackoff) {
              const next = Math.min(this.currentInterval * 2, this.options.maxInterval);
              const jitter = next * (0.5 + Math.random() * 0.5);
              this.currentInterval = Math.max(250, Math.floor(jitter));
            }

            if (this.attempt >= this.options.maxAttempts) {
              reject(new SDKError('Verification polling timeout', 'POLLING_TIMEOUT'));
              return;
            }

            setTimeout(pollAttempt, this.currentInterval);
            return;
          }

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
  /** Default EVM chain id for NEUS protocol signing context (`HUB_CHAIN_ID` name kept for compatibility). */
  HUB_CHAIN_ID: 84532,

  // Supported target chains for cross-chain propagation
  TESTNET_CHAINS: [
    11155111, // Ethereum Sepolia
    11155420, // Optimism Sepolia
    421614,   // Arbitrum Sepolia
    80002     // Polygon Amoy
  ],

  // API endpoints
  API_BASE_URL: 'https://api.neus.network',
  API_VERSION: 'v1',

  // Timeouts and limits
  SIGNATURE_MAX_AGE_MS: 5 * 60 * 1000, // 5 minutes
  REQUEST_TIMEOUT_MS: 30 * 1000,       // 30 seconds

  // Default verifier set for quick starts
  DEFAULT_VERIFIERS: [
    'ownership-basic',
    'nft-ownership',
    'token-holding'
  ]
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

  // Minimal field hints for built-in verifiers
  const id = verifierId.replace(/@\d+$/, '');
  if (id === 'nft-ownership') {
    ['contractAddress', 'tokenId', 'chainId'].forEach((key) => {
      if (!(key in data)) result.missing.push(key);
    });
    if (!('ownerAddress' in data)) {
      result.warnings.push('ownerAddress omitted (defaults to the signed walletAddress)');
    }
  } else if (id === 'token-holding') {
    ['contractAddress', 'minBalance', 'chainId'].forEach((key) => {
      if (!(key in data)) result.missing.push(key);
    });
    if (!('ownerAddress' in data)) {
      result.warnings.push('ownerAddress omitted (defaults to the signed walletAddress)');
    }
  } else if (id === 'ownership-basic') {
    // ownership-basic requires an owner, and needs at least one binding:
    // - content (inline), or
    // - contentHash (recommended for large content), or
    // - reference.id (reference-only proofs)
    if (!('owner' in data)) result.missing.push('owner');
    const hasContent = typeof data.content === 'string' && data.content.length > 0;
    const hasContentHash = typeof data.contentHash === 'string' && data.contentHash.length > 0;
    const hasRefId = typeof data.reference?.id === 'string' && data.reference.id.length > 0;
    if (!hasContent && !hasContentHash && !hasRefId) {
      result.missing.push('content (or contentHash or reference.id)');
    }
  }

  if (result.missing.length > 0) {
    result.valid = false;
    result.error = `Missing required fields: ${result.missing.join(', ')}`;
  }

  return result;
}

/**
 * Build a standard verification request and signing message for manual flows.
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
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) break;

      const delayMs = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );

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
export function validateSignatureComponents({ walletAddress, signature, signedTimestamp, data, verifierIds, chainId }) {
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

/**
 * Convert a non-negative decimal display amount to agent-delegation `maxSpend`
 * (whole-number string in token base units, 1–78 digits).
 * @param {string|number} humanAmount - e.g. "100.50" or 100.5
 * @param {number} decimals - Number of decimal places for the token (e.g. 6 for USDC, 18 for ETH)
 * @returns {string}
 */
export function toAgentDelegationMaxSpend(humanAmount, decimals) {
  if (humanAmount === undefined || humanAmount === null) {
    throw new ValidationError('humanAmount is required', 'humanAmount', humanAmount);
  }
  const s0 = String(humanAmount).trim();
  if (!s0) {
    throw new ValidationError('humanAmount must be non-empty', 'humanAmount', humanAmount);
  }
  if (s0.startsWith('-') || s0.startsWith('+')) {
    throw new ValidationError('humanAmount must be non-negative', 'humanAmount', humanAmount);
  }
  const d = Number(decimals);
  if (!Number.isInteger(d) || d < 0 || d > 78) {
    throw new ValidationError('decimalPlaces must be an integer from 0 to 78', 'decimals', decimals);
  }
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(s0)) {
    throw new ValidationError(
      'humanAmount must be a decimal string (e.g. "100" or "100.50")',
      'humanAmount',
      humanAmount
    );
  }
  const dot = s0.indexOf('.');
  const intPart = dot === -1 ? s0 : s0.slice(0, dot);
  const fracRaw = dot === -1 ? '' : s0.slice(dot + 1);
  const intNormalized =
    intPart === ''
      ? '0'
      : (() => {
        const s = intPart.replace(/^0+/, '');
        return s === '' ? '0' : s;
      })();
  if (!/^\d+$/.test(intNormalized)) {
    throw new ValidationError('humanAmount has an invalid integer part', 'humanAmount', humanAmount);
  }
  if (fracRaw && !/^\d*$/.test(fracRaw)) {
    throw new ValidationError('humanAmount has an invalid fractional part', 'humanAmount', humanAmount);
  }
  const fracPadded = `${fracRaw}${'0'.repeat(d)}`.slice(0, d);
  const base = BigInt(10) ** BigInt(d);
  const value = BigInt(intNormalized) * base + BigInt(fracPadded || '0');
  const out = value.toString();
  if (out.length > 78) {
    throw new ValidationError('maxSpend exceeds 78-digit limit after conversion', 'humanAmount', humanAmount);
  }
  return out;
}

/** Default hosted verify base URL */
export const DEFAULT_HOSTED_VERIFY_URL = 'https://neus.network/verify';

/**
 * Build standardized hosted checkout/verify URL for your app.
 * Single typed entry point to avoid copy-paste errors.
 * @param {Object} opts
 * @param {string} [opts.gateId] - Gate ID for gate-backed checkout
 * @param {string} [opts.returnUrl] - Partner return URL (postMessage/redirect)
 * @param {string[]} [opts.verifiers] - Verifier IDs (comma-joined)
 * @param {string} [opts.preset] - Preset name (e.g. 'human')
 * @param {string} [opts.mode] - 'popup' or null
 * @param {string} [opts.intent] - 'login' for auth-code flow
 * @param {string} [opts.origin] - Allowed parent origin for popup completion
 * @param {string} [opts.oauthProvider] - Optional OAuth provider id to pre-select for social/org verifiers (hosted flow)
 * @param {string} [opts.baseUrl] - Hosted verify URL override
 * @returns {string} Full URL
 */
export function getHostedCheckoutUrl(opts = {}) {
  const base = typeof opts.baseUrl === 'string' && opts.baseUrl.trim()
    ? opts.baseUrl.replace(/\/+$/, '')
    : DEFAULT_HOSTED_VERIFY_URL;
  const params = new URLSearchParams();
  if (opts.gateId) params.set('gateId', String(opts.gateId));
  if (opts.returnUrl) params.set('returnUrl', String(opts.returnUrl));
  if (Array.isArray(opts.verifiers) && opts.verifiers.length > 0) {
    params.set('verifiers', opts.verifiers.filter(Boolean).join(','));
  }
  if (opts.preset) params.set('preset', String(opts.preset));
  if (opts.mode) params.set('mode', String(opts.mode));
  if (opts.intent) params.set('intent', String(opts.intent));
  if (opts.origin) params.set('origin', String(opts.origin));
  if (opts.oauthProvider) params.set('oauthProvider', String(opts.oauthProvider));
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}