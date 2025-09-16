/**
 * NEUS SDK Client
 * Create and verify cryptographic proofs across applications
 * @license Apache-2.0
 */

import { ApiError, ValidationError, NetworkError, ConfigurationError } from './errors.js';
import { constructVerificationMessage, validateWalletAddress, NEUS_CONSTANTS } from './utils.js';
// Validation for supported verifiers
const validateVerifierData = (verifierId, data) => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Data object is required' };
  }

  // Validate wallet address if present
  // Validate owner/ownerAddress fields based on verifier type
  const ownerField =
    verifierId === 'nft-ownership' || verifierId === 'token-holding' ? 'ownerAddress' : 'owner';
  if (data[ownerField] && !validateWalletAddress(data[ownerField])) {
    return { valid: false, error: `Invalid ${ownerField} address` };
  }

  // Format validation for supported verifiers
  switch (verifierId) {
    case 'ownership-basic':
      if (!data.content) {
        return { valid: false, error: 'content is required' };
      }
      break;
    case 'nft-ownership':
      if (
        !data.ownerAddress ||
        !data.contractAddress ||
        data.tokenId == null ||
        typeof data.chainId !== 'number'
      ) {
        return {
          valid: false,
          error: 'ownerAddress, contractAddress, tokenId, and chainId are required'
        };
      }
      if (!validateWalletAddress(data.contractAddress)) {
        return { valid: false, error: 'Invalid contractAddress' };
      }
      break;
    case 'token-holding':
      if (
        !data.ownerAddress ||
        !data.contractAddress ||
        data.minBalance == null ||
        typeof data.chainId !== 'number'
      ) {
        return {
          valid: false,
          error: 'ownerAddress, contractAddress, minBalance, and chainId are required'
        };
      }
      if (!validateWalletAddress(data.contractAddress)) {
        return { valid: false, error: 'Invalid contractAddress' };
      }
      break;
    case 'ownership-licensed':
      if (!data.content) {
        return { valid: false, error: 'content is required for ownership-licensed' };
      }
      if (!data.owner && !data.license?.ownerAddress) {
        return { valid: false, error: 'owner or license.ownerAddress is required' };
      }
      if (!data.license) {
        return { valid: false, error: 'license object is required' };
      }
      if (!data.license.contractAddress || !validateWalletAddress(data.license.contractAddress)) {
        return { valid: false, error: 'license.contractAddress must be a valid Ethereum address' };
      }
      if (!data.license.tokenId) {
        return { valid: false, error: 'license.tokenId is required' };
      }
      if (typeof data.license.chainId !== 'number') {
        return { valid: false, error: 'license.chainId must be a number' };
      }
      if (!data.license.ownerAddress || !validateWalletAddress(data.license.ownerAddress)) {
        return { valid: false, error: 'license.ownerAddress must be a valid Ethereum address' };
      }
      break;
  }

  return { valid: true };
};

export class NeusClient {
  constructor(config = {}) {
    this.config = {
      timeout: 30000,
      enableLogging: false,
      allowPublicFallback: false,
      ...config
    };

    // NEUS Network API
    this.baseUrl = this.config.apiUrl || 'https://api.neus.network';
    // Enforce HTTPS for neus.network domains to satisfy CSP and normalize URLs
    try {
      const url = new URL(this.baseUrl);
      if (url.hostname.endsWith('neus.network') && url.protocol === 'http:') {
        url.protocol = 'https:';
      }
      // Always remove trailing slash for consistency
      this.baseUrl = url.toString().replace(/\/$/, '');
    } catch (error) {
      // If invalid URL string, leave as-is
      this.logger?.debug('URL parsing failed, using as-is:', error.message);
    }
    // Normalize apiUrl on config
    this.config.apiUrl = this.baseUrl;
    // Default headers for API requests
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Neus-Sdk': 'js'
    };

    // Optional app-level identification
    if (typeof this.config.appId === 'string' && this.config.appId.trim().length > 0) {
      this.defaultHeaders['X-Neus-App'] = this.config.appId.trim();
    }
    try {
      // Attach origin in browser environments
      if (typeof window !== 'undefined' && window.location && window.location.origin) {
        this.defaultHeaders['X-Client-Origin'] = window.location.origin;
      }
    } catch (error) {
      // Ignore origin detection errors
    }

    this._log('NEUS Network Client initialized');
  }

  // ============================================================================
  // CORE VERIFICATION METHODS
  // ============================================================================

  /**
   * VERIFY - Canonical verification (auto or manual)
   *
   * Create proofs with complete control over the verification process.
   * If signature and walletAddress are omitted but verifier/content are provided,
   * this method performs the wallet flow inline (no aliases, no secondary methods).
   *
   * @param {Object} params - Verification parameters
   * @param {Array<string>} [params.verifierIds] - Array of verifier IDs (manual path)
   * @param {Object} [params.data] - Verification data object (manual path)
   * @param {string} [params.walletAddress] - Wallet address that signed the request (manual path)
   * @param {string} [params.signature] - EIP-191 signature (manual path)
   * @param {number} [params.signedTimestamp] - Unix timestamp when signature was created (manual path)
   * @param {number} [params.chainId] - Chain ID for verification context (optional, managed by protocol)
   * @param {Object} [params.options] - Additional options
   * @param {string} [params.verifier] - Verifier ID (auto path)
   * @param {string} [params.content] - Content/description (auto path)
   * @param {Object} [params.wallet] - Optional injected wallet/provider (auto path)
   * @returns {Promise<Object>} Verification result with qHash
   *
   * @example
   * const proof = await client.verify({
   *   verifierIds: ['ownership-basic'],
   *   data: {
   *     content: "My content",
   *     owner: walletAddress, // or ownerAddress for nft-ownership/token-holding
   *     reference: { type: 'content', id: 'my-unique-identifier' }
   *   },
   *   walletAddress: '0x...',
   *   signature: '0x...',
   *   signedTimestamp: Date.now(),
   *   options: { targetChains: [421614, 11155111] }
   * });
   */
  /**
   * Create a verification proof
   *
   * @param {Object} params - Verification parameters
   * @param {string} [params.verifier] - Verifier ID (e.g., 'ownership-basic')
   * @param {string} [params.content] - Content to verify
   * @param {Object} [params.data] - Structured verification data
   * @param {Object} [params.wallet] - Wallet provider
   * @param {Object} [params.options] - Additional options
   * @returns {Promise<Object>} Verification result with qHash
   *
   * @example
   * // Simple ownership proof
   * const proof = await client.verify({
   *   verifier: 'ownership-basic',
   *   content: 'Hello World',
   *   wallet: window.ethereum
   * });
   */
  async verify(params) {
    // Auto path: if no manual signature fields but auto fields are provided, perform inline wallet flow
    if (
      (!params?.signature || !params?.walletAddress) &&
      (params?.verifier || params?.content || params?.data)
    ) {
      const {
        content,
        verifier = 'ownership-basic',
        data = null,
        wallet = null,
        options = {}
      } = params;

      if (verifier === 'ownership-basic' && (!content || typeof content !== 'string')) {
        throw new ValidationError('content is required and must be a string');
      }

      const validVerifiers = [
        'ownership-basic',
        'nft-ownership',
        'token-holding',
        'ownership-licensed'
      ];
      if (!validVerifiers.includes(verifier)) {
        throw new ValidationError(
          `Invalid verifier '${verifier}'. Must be one of: ${validVerifiers.join(', ')}`
        );
      }

      // Auto-detect wallet and get address
      let walletAddress, provider;
      if (wallet) {
        walletAddress = wallet.address || wallet.selectedAddress;
        provider = wallet.provider || wallet;
      } else {
        if (typeof window === 'undefined' || !window.ethereum) {
          throw new ConfigurationError(
            'No Web3 wallet detected. Please install MetaMask or provide wallet parameter.'
          );
        }
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = window.ethereum;
        const accounts = await provider.request({ method: 'eth_accounts' });
        walletAddress = accounts[0];
      }

      // Prepare verification data based on verifier type
      let verificationData;
      if (verifier === 'ownership-basic') {
        verificationData = {
          content: content,
          owner: walletAddress,
          reference: { type: 'content', id: content.substring(0, 32) }
        };
      } else if (verifier === 'ownership-licensed') {
        if (!data?.license && (!data?.contractAddress || !data?.tokenId)) {
          throw new ValidationError(
            'ownership-licensed requires either license object or contractAddress + tokenId'
          );
        }
        verificationData = {
          content: content || 'Licensed content',
          owner: walletAddress,
          license: data?.license || {
            contractAddress: data?.contractAddress,
            tokenId: data?.tokenId,
            chainId: data?.chainId,
            ownerAddress: walletAddress,
            type: data?.licenseType || 'erc721'
          }
        };
      } else if (verifier === 'token-holding') {
        verificationData = {
          ownerAddress: walletAddress,
          contractAddress: data?.contractAddress,
          minBalance: data?.minBalance,
          chainId: data?.chainId
        };
      } else if (verifier === 'nft-ownership') {
        verificationData = {
          ownerAddress: walletAddress,
          contractAddress: data?.contractAddress,
          tokenId: data?.tokenId,
          chainId: data?.chainId,
          tokenType: data?.tokenType || 'erc721'
        };
      } else {
        // Default structure for unknown verifiers
        verificationData = data
          ? {
              content,
              owner: walletAddress,
              ...data
            }
          : {
              content,
              owner: walletAddress
            };
      }

      const signedTimestamp = Date.now();
      const verifierIds = [verifier];
      const message = constructVerificationMessage({
        walletAddress,
        signedTimestamp,
        data: verificationData,
        verifierIds,
        chainId: NEUS_CONSTANTS.HUB_CHAIN_ID // Protocol-managed chain
      });

      let signature;
      try {
        signature = await provider.request({
          method: 'personal_sign',
          params: [message, walletAddress]
        });
      } catch (error) {
        if (error.code === 4001) {
          throw new ValidationError(
            'User rejected the signature request. Signature is required to create proofs.'
          );
        }
        throw new ValidationError(`Failed to sign verification message: ${error.message}`);
      }

      return this.verify({
        verifierIds,
        data: verificationData,
        walletAddress,
        signature,
        signedTimestamp,
        options
      });
    }

    const {
      verifierIds,
      data,
      walletAddress,
      signature,
      signedTimestamp,
      chainId = NEUS_CONSTANTS.HUB_CHAIN_ID,
      options = {}
    } = params;

    // Normalize verifier IDs
    const normalizeVerifierId = id => {
      if (typeof id !== 'string') return id;
      const match = id.match(/^(.*)@\d+$/);
      return match ? match[1] : id;
    };
    const normalizedVerifierIds = Array.isArray(verifierIds)
      ? verifierIds.map(normalizeVerifierId)
      : [];

    // Validate required parameters
    if (!normalizedVerifierIds || normalizedVerifierIds.length === 0) {
      throw new ValidationError('verifierIds array is required');
    }
    if (!data || typeof data !== 'object') {
      throw new ValidationError('data object is required');
    }
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/i.test(walletAddress)) {
      throw new ValidationError('Valid walletAddress is required');
    }
    if (!signature) {
      throw new ValidationError('signature is required');
    }
    if (!signedTimestamp || typeof signedTimestamp !== 'number') {
      throw new ValidationError('signedTimestamp is required');
    }
    if (typeof chainId !== 'number') {
      throw new ValidationError('chainId must be a number');
    }

    // Validate verifier data
    for (const verifierId of normalizedVerifierIds) {
      const validation = validateVerifierData(verifierId, data);
      if (!validation.valid) {
        throw new ValidationError(
          `Validation failed for verifier '${verifierId}': ${validation.error}`
        );
      }
    }

    const requestData = {
      verifierIds: normalizedVerifierIds,
      data,
      walletAddress,
      signature,
      signedTimestamp,
      chainId,
      options: {
        ...options,
        targetChains: options?.targetChains || [],
        // Privacy and storage options
        privacyLevel: options?.privacyLevel || 'private',
        publicDisplay: options?.publicDisplay || false,
        storeOriginalContent: options?.storeOriginalContent || false,
        enableIpfs: options?.enableIpfs || false,
        forceZK: options?.forceZK || false
      }
    };

    const response = await this._makeRequest('POST', '/api/v1/verification', requestData, {
      Authorization: `Bearer ${signature}`
    });

    if (!response.success) {
      throw new ApiError(
        `Verification failed: ${response.error?.message || 'Unknown error'}`,
        response.error
      );
    }

    return this._formatResponse(response);
  }

  // ============================================================================
  // STATUS AND UTILITY METHODS
  // ============================================================================

  /**
   * Get verification status
   *
   * @param {string} qHash - Verification ID (qHash or proofId)
   * @param {Object} auth - Optional authentication for private proofs
   * @returns {Promise<Object>} Verification status and data
   *
   * @example
   * const result = await client.getStatus('0x...');
   * console.log('Status:', result.status);
   */
  async getStatus(qHash, auth = undefined) {
    if (!qHash || typeof qHash !== 'string') {
      throw new ValidationError('qHash is required');
    }

    const headers = {};
    if (auth?.signature && auth?.walletAddress) {
      headers.Authorization = `Bearer ${auth.signature}`;
    }

    const response = await this._makeRequest(
      'GET',
      `/api/v1/verification/status/${qHash}`,
      null,
      headers
    );

    if (!response.success) {
      throw new ApiError(
        `Failed to get status: ${response.error?.message || 'Unknown error'}`,
        response.error
      );
    }

    return this._formatResponse(response);
  }

  /**
   * Get private proof status with wallet signature
   *
   * @param {string} qHash - Verification ID
   * @param {Object} wallet - Wallet provider (window.ethereum or ethers Wallet)
   * @returns {Promise<Object>} Private verification status and data
   *
   * @example
   * // Access private proof
   * const privateData = await client.getPrivateStatus(qHash, window.ethereum);
   */
  async getPrivateStatus(qHash, wallet = null) {
    if (!qHash || typeof qHash !== 'string') {
      throw new ValidationError('qHash is required');
    }

    // Auto-detect wallet if not provided
    if (!wallet) {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new ConfigurationError('No wallet provider available');
      }
      wallet = window.ethereum;
    }

    let walletAddress, provider;

    // Handle different wallet types
    if (wallet.address) {
      // ethers Wallet
      walletAddress = wallet.address;
      provider = wallet;
    } else if (wallet.selectedAddress || wallet.request) {
      // Browser provider (MetaMask, etc.)
      provider = wallet;
      if (wallet.selectedAddress) {
        walletAddress = wallet.selectedAddress;
      } else {
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
          throw new ConfigurationError('No wallet accounts available');
        }
        walletAddress = accounts[0];
      }
    } else {
      throw new ConfigurationError('Invalid wallet provider');
    }

    const signedTimestamp = Date.now();

    // Use existing working message format
    const message = `Access private proof: ${qHash}`;

    let signature;
    try {
      if (provider.signMessage) {
        // ethers Wallet
        signature = await provider.signMessage(message);
      } else {
        // Browser provider
        signature = await provider.request({
          method: 'personal_sign',
          params: [message, walletAddress]
        });
      }
    } catch (error) {
      if (error.code === 4001) {
        throw new ValidationError('User rejected signature request');
      }
      throw new ValidationError(`Failed to sign message: ${error.message}`);
    }

    // Make request with signature headers
    const response = await this._makeRequest('GET', `/api/v1/verification/status/${qHash}`, null, {
      'x-wallet-address': walletAddress,
      'x-signature': signature,
      'x-signed-timestamp': signedTimestamp.toString()
    });

    if (!response.success) {
      throw new ApiError(
        `Failed to access private proof: ${response.error?.message || 'Unauthorized'}`,
        response.error
      );
    }

    return this._formatResponse(response);
  }

  /**
   * Check API health
   *
   * @returns {Promise<boolean>} True if API is healthy
   */
  async isHealthy() {
    try {
      const response = await this._makeRequest('GET', '/api/v1/health');
      return response.success === true;
    } catch {
      return false;
    }
  }

  /**
   * List available verifiers
   *
   * @returns {Promise<string[]>} Array of verifier IDs
   */
  async getVerifiers() {
    const response = await this._makeRequest('GET', '/api/v1/verification/verifiers');
    if (!response.success) {
      throw new ApiError(
        `Failed to get verifiers: ${response.error?.message || 'Unknown error'}`,
        response.error
      );
    }
    return Array.isArray(response.data) ? response.data : [];
  }

  /**
   * POLL PROOF STATUS - Wait for verification completion
   *
   * Polls the verification status until it reaches a terminal state (completed or failed).
   * Useful for providing real-time feedback to users during verification.
   *
   * @param {string} qHash - Verification ID to poll
   * @param {Object} [options] - Polling options
   * @param {number} [options.interval=5000] - Polling interval in ms
   * @param {number} [options.timeout=120000] - Total timeout in ms
   * @param {Function} [options.onProgress] - Progress callback function
   * @returns {Promise<Object>} Final verification status
   *
   * @example
   * const finalStatus = await client.pollProofStatus(qHash, {
   *   interval: 3000,
   *   timeout: 60000,
   *   onProgress: (status) => {
   *     console.log('Current status:', status.status);
   *     if (status.crosschain) {
   *       console.log(`Cross-chain: ${status.crosschain.finalized}/${status.crosschain.totalChains}`);
   *     }
   *   }
   * });
   */
  async pollProofStatus(qHash, options = {}) {
    const { interval = 5000, timeout = 120000, onProgress } = options;

    if (!qHash || typeof qHash !== 'string') {
      throw new ValidationError('qHash is required');
    }

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const status = await this.getStatus(qHash);

        // Call progress callback if provided
        if (onProgress && typeof onProgress === 'function') {
          onProgress(status.data || status);
        }

        // Check for terminal states
        const currentStatus = status.data?.status || status.status;
        if (this._isTerminalStatus(currentStatus)) {
          this._log('Verification completed', {
            status: currentStatus,
            duration: Date.now() - startTime
          });
          return status;
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        this._log('Status poll error', error.message);
        // Continue polling unless it's a validation error
        if (error instanceof ValidationError) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new NetworkError(`Polling timeout after ${timeout}ms`, 'POLLING_TIMEOUT');
  }

  /**
   * DETECT CHAIN ID - Get current wallet chain
   *
   * @returns {Promise<number>} Current chain ID
   */
  async detectChainId() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new ConfigurationError('No Web3 wallet detected');
    }

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      return parseInt(chainId, 16);
    } catch (error) {
      throw new NetworkError(`Failed to detect chain ID: ${error.message}`);
    }
  }

  // ============================================================================
  // SPECIALIZED VERIFIER METHODS
  // ============================================================================

  /** Revoke your own proof (owner-signed) */
  async revokeOwnProof(qHash, wallet) {
    if (!qHash || typeof qHash !== 'string') {
      throw new ValidationError('qHash is required');
    }
    const address = wallet?.address || (await this._getWalletAddress());
    const signedTimestamp = Date.now();
    const hubChainId = NEUS_CONSTANTS.HUB_CHAIN_ID;

    const message = constructVerificationMessage({
      walletAddress: address,
      signedTimestamp,
      data: { action: 'revoke_proof', qHash },
      verifierIds: ['ownership-basic'],
      chainId: hubChainId
    });

    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address]
    });

    const res = await fetch(`${this.config.apiUrl}/api/v1/proofs/${qHash}/revoke-self`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${signature}` },
      body: JSON.stringify({ walletAddress: address, signature, signedTimestamp })
    });
    const json = await res.json();
    if (!json.success) {
      throw new ApiError(json.error?.message || 'Failed to revoke proof', json.error);
    }
    return true;
  }

  // ============================================================================
  // PRIVATE UTILITY METHODS
  // ============================================================================

  /**
   * Get connected wallet address
   * @private
   */
  async _getWalletAddress() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new ConfigurationError('No Web3 wallet detected');
    }

    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts || accounts.length === 0) {
      throw new ConfigurationError('No wallet accounts available');
    }

    return accounts[0];
  }

  /**
   * Make HTTP request to API
   * @private
   */
  async _makeRequest(method, endpoint, data = null, headersOverride = null) {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    const options = {
      method,
      headers: { ...this.defaultHeaders, ...(headersOverride || {}) },
      signal: controller.signal
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    this._log(`${method} ${endpoint}`, data ? { requestBodyKeys: Object.keys(data) } : {});

    try {
      let response = await fetch(url, options);
      // Fallback: if local baseUrl is misconfigured and returns 404/405, retry against public API
      if (
        this.config.allowPublicFallback &&
        !response.ok &&
        (response.status === 404 || response.status === 405)
      ) {
        const isLocalBase =
          this.baseUrl.includes('localhost') ||
          (typeof window !== 'undefined' && this.baseUrl.startsWith(window.location.origin));
        const publicBase = 'https://api.neus.network';
        if (isLocalBase && this.baseUrl !== publicBase && endpoint.startsWith('/api/v1/')) {
          this._log('Local API not found, retrying against public API', { endpoint });
          response = await fetch(`${publicBase}${endpoint}`, options);
        }
      }
      clearTimeout(timeoutId);

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = { error: { message: 'Invalid JSON response' } };
      }

      if (!response.ok) {
        throw ApiError.fromResponse(response, responseData);
      }

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new NetworkError(`Request timeout after ${this.config.timeout}ms`);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new NetworkError(`Network error: ${error.message}`);
    }
  }

  /**
   * Format API response for consistent structure
   * @private
   */
  _formatResponse(response) {
    const qHash =
      response?.data?.qHash ||
      response?.qHash ||
      response?.data?.resource?.qHash ||
      response?.data?.id;

    const status =
      response?.data?.status ||
      response?.status ||
      response?.data?.resource?.status ||
      (response?.success ? 'completed' : 'unknown');

    return {
      success: response.success,
      qHash,
      status,
      data: response.data,
      message: response.message,
      timestamp: Date.now(),
      statusUrl: qHash ? `${this.baseUrl}/api/v1/verification/status/${qHash}` : null
    };
  }

  /**
   * Check if status is terminal (completed or failed)
   * @private
   */
  _isTerminalStatus(status) {
    const terminalStates = [
      'verified',
      'verified_crosschain_propagated',
      'completed_all_successful',
      'failed',
      'error',
      'rejected',
      'cancelled'
    ];
    return typeof status === 'string' && terminalStates.some(state => status.includes(state));
  }

  /**
   * Internal logging
   * @private
   */
  _log(message, _data = {}) {
    if (this.config.enableLogging) {
      // Logging disabled in production builds
    }
  }
}

// Export the constructVerificationMessage function for advanced use
export { constructVerificationMessage };
