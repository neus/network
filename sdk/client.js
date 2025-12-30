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
  const ownerField = (verifierId === 'nft-ownership' || verifierId === 'token-holding') ? 'ownerAddress' : 'owner';
  if (data[ownerField] && !validateWalletAddress(data[ownerField])) {
    return { valid: false, error: `Invalid ${ownerField} address` };
  }
  
  // Format validation for supported verifiers
  switch (verifierId) {
    case 'ownership-basic':
      // Required: owner (must match request walletAddress).
      // Reference is optional when content/contentHash is provided.
      // If neither content nor contentHash is provided, reference.id is required (reference-only proof).
      if (!data.owner || !validateWalletAddress(data.owner)) {
        return { valid: false, error: 'owner (wallet address) is required' };
      }
      if (data.reference !== undefined) {
        if (!data.reference || typeof data.reference !== 'object') {
          return { valid: false, error: 'reference must be an object when provided' };
        }
        if (!data.reference.type || typeof data.reference.type !== 'string') {
          // Only required when reference object is present (or when doing reference-only proofs).
          // Server requires reference.type when reference is used for traceability.
          return { valid: false, error: 'reference.type is required when reference is provided' };
        }
      }
      if (!data.content && !data.contentHash) {
        if (!data.reference || typeof data.reference !== 'object') {
          return { valid: false, error: 'reference is required when neither content nor contentHash is provided' };
        }
        if (!data.reference.id || typeof data.reference.id !== 'string') {
          return { valid: false, error: 'reference.id is required when neither content nor contentHash is provided' };
        }
        if (!data.reference.type || typeof data.reference.type !== 'string') {
          return { valid: false, error: 'reference.type is required when neither content nor contentHash is provided' };
        }
      }
      break;
    case 'nft-ownership':
      // ownerAddress is optional; server injects from request walletAddress when omitted.
      if (
        !data.contractAddress ||
        data.tokenId === null ||
        data.tokenId === undefined ||
        typeof data.chainId !== 'number'
      ) {
        return { valid: false, error: 'contractAddress, tokenId, and chainId are required' };
      }
      if (data.tokenType !== undefined && data.tokenType !== null) {
        const tt = String(data.tokenType).toLowerCase();
        if (tt !== 'erc721' && tt !== 'erc1155') {
          return { valid: false, error: 'tokenType must be one of: erc721, erc1155' };
        }
      }
      if (data.blockNumber !== undefined && data.blockNumber !== null && !Number.isInteger(data.blockNumber)) {
        return { valid: false, error: 'blockNumber must be an integer when provided' };
      }
      if (data.ownerAddress && !validateWalletAddress(data.ownerAddress)) {
        return { valid: false, error: 'Invalid ownerAddress' };
      }
      if (!validateWalletAddress(data.contractAddress)) {
        return { valid: false, error: 'Invalid contractAddress' };
      }
      break;
    case 'token-holding':
      // ownerAddress is optional; server injects from request walletAddress when omitted.
      if (
        !data.contractAddress ||
        data.minBalance === null ||
        data.minBalance === undefined ||
        typeof data.chainId !== 'number'
      ) {
        return { valid: false, error: 'contractAddress, minBalance, and chainId are required' };
      }
      if (data.blockNumber !== undefined && data.blockNumber !== null && !Number.isInteger(data.blockNumber)) {
        return { valid: false, error: 'blockNumber must be an integer when provided' };
      }
      if (data.ownerAddress && !validateWalletAddress(data.ownerAddress)) {
        return { valid: false, error: 'Invalid ownerAddress' };
      }
      if (!validateWalletAddress(data.contractAddress)) {
        return { valid: false, error: 'Invalid contractAddress' };
      }
      break;
    case 'ownership-dns-txt':
      if (!data.domain || typeof data.domain !== 'string') {
        return { valid: false, error: 'domain is required' };
      }
      if (data.walletAddress && !validateWalletAddress(data.walletAddress)) {
        return { valid: false, error: 'Invalid walletAddress' };
      }
      break;
    case 'wallet-link':
      if (!data.primaryWalletAddress || !validateWalletAddress(data.primaryWalletAddress)) {
        return { valid: false, error: 'primaryWalletAddress is required' };
      }
      if (!data.secondaryWalletAddress || !validateWalletAddress(data.secondaryWalletAddress)) {
        return { valid: false, error: 'secondaryWalletAddress is required' };
      }
      if (!data.signature || typeof data.signature !== 'string') {
        return { valid: false, error: 'signature is required (signed by secondary wallet)' };
      }
      if (typeof data.chainId !== 'number') {
        return { valid: false, error: 'chainId is required' };
      }
      if (typeof data.signedTimestamp !== 'number') {
        return { valid: false, error: 'signedTimestamp is required' };
      }
      break;
    case 'contract-ownership':
      if (!data.contractAddress || !validateWalletAddress(data.contractAddress)) {
        return { valid: false, error: 'contractAddress is required' };
      }
      if (data.walletAddress && !validateWalletAddress(data.walletAddress)) {
        return { valid: false, error: 'Invalid walletAddress' };
      }
      if (typeof data.chainId !== 'number') {
        return { valid: false, error: 'chainId is required' };
      }
      break;
    case 'agent-identity':
      if (!data.agentId || typeof data.agentId !== 'string' || data.agentId.length < 1 || data.agentId.length > 128) {
        return { valid: false, error: 'agentId is required (1-128 chars)' };
      }
      if (!data.agentWallet || !validateWalletAddress(data.agentWallet)) {
        return { valid: false, error: 'agentWallet is required' };
      }
      if (data.agentType && !['ai', 'bot', 'service', 'automation', 'agent'].includes(data.agentType)) {
        return { valid: false, error: 'agentType must be one of: ai, bot, service, automation, agent' };
      }
      break;
    case 'agent-delegation':
      if (!data.controllerWallet || !validateWalletAddress(data.controllerWallet)) {
        return { valid: false, error: 'controllerWallet is required' };
      }
      if (!data.agentWallet || !validateWalletAddress(data.agentWallet)) {
        return { valid: false, error: 'agentWallet is required' };
      }
      if (data.scope && (typeof data.scope !== 'string' || data.scope.length > 128)) {
        return { valid: false, error: 'scope must be a string (max 128 chars)' };
      }
      if (data.expiresAt && (typeof data.expiresAt !== 'number' || data.expiresAt < Date.now())) {
        return { valid: false, error: 'expiresAt must be a future timestamp' };
      }
      break;
    case 'ai-content-moderation':
      if (!data.content || typeof data.content !== 'string') {
        return { valid: false, error: 'content is required' };
      }
      if (!data.contentType || typeof data.contentType !== 'string') {
        return { valid: false, error: 'contentType (MIME type) is required' };
      }
      {
        // Only allow content types that are actually moderated (no "verified but skipped" bypass).
        const contentType = String(data.contentType).split(';')[0].trim().toLowerCase();
        const validTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'text/plain',
          'text/markdown',
          'text/x-markdown',
          'application/json',
          'application/xml'
        ];
        if (!validTypes.includes(contentType)) {
          return { valid: false, error: `contentType must be one of: ${validTypes.join(', ')}` };
        }
      }
      if (data.content.length > 13653334) {
        return { valid: false, error: 'content exceeds 10MB limit' };
      }
      break;
    case 'ownership-pseudonym':
      if (!data.pseudonymId || typeof data.pseudonymId !== 'string') {
        return { valid: false, error: 'pseudonymId is required' };
      }
      // Validate handle format (3-64 chars, lowercase alphanumeric with ._-)
      if (!/^[a-z0-9._-]{3,64}$/.test(data.pseudonymId.trim().toLowerCase())) {
        return { valid: false, error: 'pseudonymId must be 3-64 characters, lowercase alphanumeric with dots, underscores, or hyphens' };
      }
      // Validate namespace if provided (1-64 chars)
      if (data.namespace && typeof data.namespace === 'string') {
        if (!/^[a-z0-9._-]{1,64}$/.test(data.namespace.trim().toLowerCase())) {
          return { valid: false, error: 'namespace must be 1-64 characters, lowercase alphanumeric with dots, underscores, or hyphens' };
        }
      }
      // Note: signature is not required - envelope signature provides authentication
      break;
    case 'wallet-risk':
      if (data.walletAddress && !validateWalletAddress(data.walletAddress)) {
        return { valid: false, error: 'Invalid walletAddress' };
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
    } catch {
      // If invalid URL string, leave as-is
    }
    // Normalize apiUrl on config
    this.config.apiUrl = this.baseUrl;
    // Default headers for API requests
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Neus-Sdk': 'js'
    };

    // Optional API key (server-side only; do not embed in browser apps)
    if (typeof this.config.apiKey === 'string' && this.config.apiKey.trim().length > 0) {
      this.defaultHeaders['Authorization'] = `Bearer ${this.config.apiKey.trim()}`;
    }
    try {
      // Attach origin in browser environments
      if (typeof window !== 'undefined' && window.location && window.location.origin) {
        this.defaultHeaders['X-Client-Origin'] = window.location.origin;
      }
    } catch {
      // ignore: optional browser metadata header
    }
  }

  // ============================================================================
  // CORE VERIFICATION METHODS
  // ============================================================================

  /**
   * VERIFY - Standard verification (auto or manual)
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
    if ((!params?.signature || !params?.walletAddress) && (params?.verifier || params?.content || params?.data)) {
      const { content, verifier = 'ownership-basic', data = null, wallet = null, options = {} } = params;

      // ownership-basic: content required for simple mode, but data param mode allows contentHash or reference
      if (verifier === 'ownership-basic' && !data && (!content || typeof content !== 'string')) {
        throw new ValidationError('content is required and must be a string (or use data param with owner + reference)');
      }

      const validVerifiers = [
        'ownership-basic',
        'ownership-pseudonym',  // Pseudonymous identity (public)
        'nft-ownership',
        'token-holding',
        'ownership-dns-txt',
        'wallet-link',
        'contract-ownership',
        'wallet-risk',          // Wallet risk assessment (public)
        // AI & Agent verifiers (ERC-8004 aligned)
        'agent-identity',
        'agent-delegation',
        'ai-content-moderation'
      ];
      if (!validVerifiers.includes(verifier)) {
        throw new ValidationError(`Invalid verifier '${verifier}'. Must be one of: ${validVerifiers.join(', ')}.`);
      }
      
      // These verifiers require explicit data parameter (no auto-path)
      const requiresDataParam = [
        'ownership-dns-txt', 
        'wallet-link', 
        'contract-ownership',
        'ownership-pseudonym',
        'wallet-risk',
        'agent-identity',
        'agent-delegation',
        'ai-content-moderation'
      ];
      if (requiresDataParam.includes(verifier)) {
        if (!data || typeof data !== 'object') {
          throw new ValidationError(`${verifier} requires explicit data parameter. Cannot use auto-path.`);
        }
      }

      // Auto-detect wallet and get address
      let walletAddress, provider;
      if (wallet) {
        walletAddress = wallet.address || wallet.selectedAddress;
        provider = wallet.provider || wallet;
      } else {
        if (typeof window === 'undefined' || !window.ethereum) {
          throw new ConfigurationError('No Web3 wallet detected. Please install MetaMask or provide wallet parameter.');
        }
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = window.ethereum;
        const accounts = await provider.request({ method: 'eth_accounts' });
        walletAddress = accounts[0];
      }

      // Prepare verification data based on verifier type
      let verificationData;
      if (verifier === 'ownership-basic') {
        if (data && typeof data === 'object') {
          // Data param mode: use provided data, inject owner if missing
          verificationData = {
            owner: data.owner || walletAddress,
            reference: data.reference,
            ...(data.content && { content: data.content }),
            ...(data.contentHash && { contentHash: data.contentHash }),
            ...(data.provenance && { provenance: data.provenance })
          };
        } else {
          // Simple content mode: derive reference from content
          verificationData = {
            content: content,
            owner: walletAddress,
            reference: { type: 'other' }
          };
        }
      } else if (verifier === 'token-holding') {
        if (!data?.contractAddress) {
          throw new ValidationError('token-holding requires contractAddress in data parameter');
        }
        if (data?.minBalance === null || data?.minBalance === undefined) {
          throw new ValidationError('token-holding requires minBalance in data parameter');
        }
        if (typeof data?.chainId !== 'number') {
          throw new ValidationError('token-holding requires chainId (number) in data parameter');
        }
        verificationData = {
          ownerAddress: walletAddress,
          contractAddress: data.contractAddress,
          minBalance: data.minBalance,
          chainId: data.chainId
        };
      } else if (verifier === 'nft-ownership') {
        if (!data?.contractAddress) {
          throw new ValidationError('nft-ownership requires contractAddress in data parameter');
        }
        if (data?.tokenId === null || data?.tokenId === undefined) {
          throw new ValidationError('nft-ownership requires tokenId in data parameter');
        }
        if (typeof data?.chainId !== 'number') {
          throw new ValidationError('nft-ownership requires chainId (number) in data parameter');
        }
        verificationData = {
          ownerAddress: walletAddress,
          contractAddress: data.contractAddress,
          tokenId: data.tokenId,
          chainId: data.chainId,
          tokenType: data?.tokenType || 'erc721'
        };
      } else if (verifier === 'ownership-dns-txt') {
        if (!data?.domain) {
          throw new ValidationError('ownership-dns-txt requires domain in data parameter');
        }
        verificationData = {
          domain: data.domain,
          walletAddress: walletAddress
        };
      } else if (verifier === 'wallet-link') {
        if (!data?.secondaryWalletAddress) {
          throw new ValidationError('wallet-link requires secondaryWalletAddress in data parameter');
        }
        if (!data?.signature) {
          throw new ValidationError('wallet-link requires signature in data parameter (signed by secondary wallet)');
        }
        if (typeof data?.chainId !== 'number') {
          throw new ValidationError('wallet-link requires chainId (number) in data parameter');
        }
        verificationData = {
          primaryWalletAddress: walletAddress,
          secondaryWalletAddress: data.secondaryWalletAddress,
          signature: data.signature,
          chainId: data.chainId,
          signedTimestamp: data?.signedTimestamp || Date.now()
        };
      } else if (verifier === 'contract-ownership') {
        if (!data?.contractAddress) {
          throw new ValidationError('contract-ownership requires contractAddress in data parameter');
        }
        if (typeof data?.chainId !== 'number') {
          throw new ValidationError('contract-ownership requires chainId (number) in data parameter');
        }
        verificationData = {
          contractAddress: data.contractAddress,
          walletAddress: walletAddress,
          chainId: data.chainId,
          ...(data?.method && { method: data.method })
        };
      } else if (verifier === 'agent-identity') {
        if (!data?.agentId) {
          throw new ValidationError('agent-identity requires agentId in data parameter');
        }
        verificationData = {
          agentId: data.agentId,
          agentWallet: data?.agentWallet || walletAddress,
          ...(data?.agentLabel && { agentLabel: data.agentLabel }),
          ...(data?.agentType && { agentType: data.agentType }),
          ...(data?.description && { description: data.description }),
          ...(data?.capabilities && { capabilities: data.capabilities })
        };
      } else if (verifier === 'agent-delegation') {
        if (!data?.agentWallet) {
          throw new ValidationError('agent-delegation requires agentWallet in data parameter');
        }
        verificationData = {
          controllerWallet: data?.controllerWallet || walletAddress,
          agentWallet: data.agentWallet,
          ...(data?.agentId && { agentId: data.agentId }),
          ...(data?.scope && { scope: data.scope }),
          ...(data?.permissions && { permissions: data.permissions }),
          ...(data?.maxSpend && { maxSpend: data.maxSpend }),
          ...(data?.expiresAt && { expiresAt: data.expiresAt })
        };
      } else if (verifier === 'ai-content-moderation') {
        if (!data?.content) {
          throw new ValidationError('ai-content-moderation requires content (base64) in data parameter');
        }
        if (!data?.contentType) {
          throw new ValidationError('ai-content-moderation requires contentType (MIME type) in data parameter');
        }
        verificationData = {
          content: data.content,
          contentType: data.contentType,
          ...(data?.provider && { provider: data.provider })
        };
      } else if (verifier === 'ownership-pseudonym') {
        if (!data?.pseudonymId) {
          throw new ValidationError('ownership-pseudonym requires pseudonymId in data parameter');
        }
        verificationData = {
          pseudonymId: data.pseudonymId,
          ...(data?.namespace && { namespace: data.namespace }),
          ...(data?.displayName && { displayName: data.displayName }),
          ...(data?.metadata && { metadata: data.metadata })
        };
      } else if (verifier === 'wallet-risk') {
        // wallet-risk defaults to verifying the connected wallet
        verificationData = {
          walletAddress: data?.walletAddress || walletAddress,
          ...(data?.provider && { provider: data.provider }),
          // Mainnet-first semantics: if caller doesn't provide chainId, default to Ethereum mainnet (1).
          // This avoids accidental testnet semantics for risk providers.
          chainId: (typeof data?.chainId === 'number' && Number.isFinite(data.chainId)) ? data.chainId : 1,
          ...(data?.includeDetails !== undefined && { includeDetails: data.includeDetails })
        };
      } else {
        // Default structure for unknown verifiers (should not reach here with validVerifiers check)
        verificationData = data ? {
          content,
          owner: walletAddress,
          ...data
        } : {
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
        // UNIFIED SIGNING: Matches utils/core.ts personalSignUniversal exactly
        const toHexUtf8 = (s) => {
          try {
            const enc = new TextEncoder();
            const bytes = enc.encode(s);
            let hex = '0x';
            for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
            return hex;
          } catch {
            let hex = '0x';
            for (let i = 0; i < s.length; i++) hex += s.charCodeAt(i).toString(16).padStart(2, '0');
            return hex;
          }
        };
        
        // Detect Farcaster wallet - requires hex-encoded messages FIRST
        const isFarcasterWallet = (() => {
          if (typeof window === 'undefined') return false;
          try {
            const w = window;
            const fc = w.farcaster;
            if (!fc || !fc.context) return false;
            const fcProvider = fc.provider || fc.walletProvider || (fc.context && fc.context.walletProvider);
            if (fcProvider === provider) return true;
            if (w.mini && w.mini.wallet === provider && fc && fc.context) return true;
            if (w.ethereum === provider && fc && fc.context) return true;
          } catch {
            // ignore: optional Farcaster detection
          }
          return false;
        })();
        
        if (isFarcasterWallet) {
          try {
            const hexMsg = toHexUtf8(message);
            signature = await provider.request({ method: 'personal_sign', params: [hexMsg, walletAddress] });
          } catch (e) {
            // Fall through
          }
        }
        
        if (!signature) {
          try {
            signature = await provider.request({ method: 'personal_sign', params: [message, walletAddress] });
          } catch (e) {
            const msg = String(e && (e.message || e.reason) || e || '').toLowerCase();
            const errCode = (e && (e.code || (e.error && e.error.code))) || null;
            const needsHex = /byte|bytes|invalid byte sequence|encoding|non-hex/i.test(msg);
            
            const methodUnsupported = (
              /method.*not.*supported|unsupported|not implemented|method not found|unknown method|does not support/i.test(msg) ||
              errCode === -32601 ||
              errCode === 4200 ||
              (msg.includes('personal_sign') && msg.includes('not')) ||
              (msg.includes('request method') && msg.includes('not supported'))
            );
            
            if (methodUnsupported) {
              this._log('personal_sign not supported; attempting eth_sign fallback');
              try {
                const enc = new TextEncoder();
                const bytes = enc.encode(message);
                const prefix = `\x19Ethereum Signed Message:\n${bytes.length}`;
                const full = new Uint8Array(prefix.length + bytes.length);
                for (let i = 0; i < prefix.length; i++) full[i] = prefix.charCodeAt(i);
                full.set(bytes, prefix.length);
                let payloadHex = '0x';
                for (let i = 0; i < full.length; i++) payloadHex += full[i].toString(16).padStart(2, '0');
                try {
                  if (typeof window !== 'undefined') window.__NEUS_ALLOW_ETH_SIGN__ = true;
                } catch {
                  // ignore
                }
                signature = await provider.request({ method: 'eth_sign', params: [walletAddress, payloadHex], neusAllowEthSign: true });
                try {
                  if (typeof window !== 'undefined') delete window.__NEUS_ALLOW_ETH_SIGN__;
                } catch {
                  // ignore
                }
              } catch (fallbackErr) {
                this._log('eth_sign fallback failed', { message: fallbackErr?.message || String(fallbackErr) });
                try {
                  if (typeof window !== 'undefined') delete window.__NEUS_ALLOW_ETH_SIGN__;
                } catch {
                  // ignore
                }
                throw e;
              }
            } else if (needsHex) {
              this._log('Retrying personal_sign with hex-encoded message');
              const hexMsg = toHexUtf8(message);
              signature = await provider.request({ method: 'personal_sign', params: [hexMsg, walletAddress] });
            } else {
              throw e;
            }
          }
        }
      } catch (error) {
        if (error.code === 4001) {
          throw new ValidationError('User rejected the signature request. Signature is required to create proofs.');
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
      chainId,
      chain,
      signatureMethod,
      options = {}
    } = params;

    const resolvedChainId = chainId || (chain ? null : NEUS_CONSTANTS.HUB_CHAIN_ID);

    // Normalize verifier IDs
    const normalizeVerifierId = (id) => {
      if (typeof id !== 'string') return id;
      const match = id.match(/^(.*)@\d+$/);
      return match ? match[1] : id;
    };
    const normalizedVerifierIds = Array.isArray(verifierIds) ? verifierIds.map(normalizeVerifierId) : [];

    // Validate required parameters
    if (!normalizedVerifierIds || normalizedVerifierIds.length === 0) {
      throw new ValidationError('verifierIds array is required');
    }
    if (!data || typeof data !== 'object') {
      throw new ValidationError('data object is required');
    }
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new ValidationError('walletAddress is required');
    }
    if (!signature) {
      throw new ValidationError('signature is required');
    }
    if (!signedTimestamp || typeof signedTimestamp !== 'number') {
      throw new ValidationError('signedTimestamp is required');
    }
    if (resolvedChainId !== null && typeof resolvedChainId !== 'number') {
      throw new ValidationError('chainId must be a number');
    }

    // Validate verifier data
    for (const verifierId of normalizedVerifierIds) {
      const validation = validateVerifierData(verifierId, data);
      if (!validation.valid) {
        throw new ValidationError(`Validation failed for verifier '${verifierId}': ${validation.error}`);
      }
    }

    // Build options payload (public surface)
    const optionsPayload = {
      ...(options && typeof options === 'object' ? options : {}),
      targetChains: Array.isArray(options?.targetChains) ? options.targetChains : [],
      // Privacy and storage options (defaults)
      privacyLevel: options?.privacyLevel || 'private',
      publicDisplay: options?.publicDisplay || false,
      storeOriginalContent: options?.storeOriginalContent || false
    };
    if (typeof options?.enableIpfs === 'boolean') optionsPayload.enableIpfs = options.enableIpfs;

    const requestData = {
      verifierIds: normalizedVerifierIds,
      data,
      walletAddress,
      signature,
      signedTimestamp,
      ...(resolvedChainId !== null && { chainId: resolvedChainId }),
      ...(chain && { chain }),
      ...(signatureMethod && { signatureMethod }),
      options: optionsPayload
    };

    // SECURITY: Do not send proof signatures in Authorization headers.
    // Signatures belong in the request body only (they are not bearer tokens).
    const response = await this._makeRequest('POST', '/api/v1/verification', requestData);

    if (!response.success) {
      throw new ApiError(`Verification failed: ${response.error?.message || 'Unknown error'}`, response.error);
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
   * @returns {Promise<Object>} Verification status and data
   *
   * @example
   * const result = await client.getStatus('0x...');
   * console.log('Status:', result.status);
   */
  async getStatus(qHash) {
    if (!qHash || typeof qHash !== 'string') {
      throw new ValidationError('qHash is required');
    }
    const response = await this._makeRequest('GET', `/api/v1/verification/status/${qHash}`);

    if (!response.success) {
      throw new ApiError(`Failed to get status: ${response.error?.message || 'Unknown error'}`, response.error);
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

    // IMPORTANT: This must match the server's Standard Signing String owner-access check:
    // data.action='access_private_proof' + data.qHash, verifierIds=['ownership-basic'], chainId=default chainId.
    const message = constructVerificationMessage({
      walletAddress,
      signedTimestamp,
      data: { action: 'access_private_proof', qHash },
      verifierIds: ['ownership-basic'],
      chainId: NEUS_CONSTANTS.HUB_CHAIN_ID
    });

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

    // Make request with signature headers (server reads x-wallet-address/x-signature/x-signed-timestamp)
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
      throw new ApiError(`Failed to get verifiers: ${response.error?.message || 'Unknown error'}`, response.error);
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
    const {
      interval = 5000,
      timeout = 120000,
      onProgress
    } = options;

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
          this._log('Verification completed', { status: currentStatus, duration: Date.now() - startTime });
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

  /** Revoke your own proof (owner-signed) */
  async revokeOwnProof(qHash, wallet) {
    if (!qHash || typeof qHash !== 'string') {
      throw new ValidationError('qHash is required');
    }
    const address = wallet?.address || await this._getWalletAddress();
    const signedTimestamp = Date.now();
    const hubChainId = NEUS_CONSTANTS.HUB_CHAIN_ID;

    const message = constructVerificationMessage({
      walletAddress: address,
      signedTimestamp,
      data: { action: 'revoke_proof', qHash },
      verifierIds: ['ownership-basic'],
      chainId: hubChainId
    });

    let signature;
    try {
      // UNIFIED SIGNING: Match utils/core.ts fallback order
      const toHexUtf8 = (s) => {
        const enc = new TextEncoder();
        const bytes = enc.encode(s);
        let hex = '0x';
        for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
        return hex;
      };
      
      // Detect Farcaster wallet - requires hex-encoded messages FIRST
      const isFarcasterWallet = (() => {
        if (typeof window === 'undefined') return false;
        try {
          const w = window;
          const fc = w.farcaster;
          if (!fc || !fc.context) return false;
          const fcProvider = fc.provider || fc.walletProvider || (fc.context && fc.context.walletProvider);
          if (fcProvider === w.ethereum) return true;
          if (w.mini && w.mini.wallet === w.ethereum && fc && fc.context) return true;
          if (w.ethereum && fc && fc.context) return true;
        } catch {
          // ignore: optional Farcaster detection
        }
        return false;
      })();
      
      if (isFarcasterWallet) {
        try {
          const hexMsg = toHexUtf8(message);
          signature = await window.ethereum.request({ method: 'personal_sign', params: [hexMsg, address] });
        } catch {
          // ignore: fall through to standard signing
        }
      }
      
      if (!signature) {
          signature = await window.ethereum.request({ method: 'personal_sign', params: [message, address] });
      }
    } catch (error) {
      if (error.code === 4001) {
        throw new ValidationError('User rejected revocation signature');
      }
      throw new ValidationError(`Failed to sign revocation: ${error.message}`);
    }

    const res = await fetch(`${this.config.apiUrl}/api/v1/proofs/${qHash}/revoke-self`, {
      method: 'POST',
      // SECURITY: Do not put proof signatures into Authorization headers.
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address, signature, signedTimestamp })
    });
    const json = await res.json();
    if (!json.success) {
      throw new ApiError(json.error?.message || 'Failed to revoke proof', json.error);
    }
    return true;
  }

  // ============================================================================
  // GATE & LOOKUP METHODS
  // ============================================================================

  /**
   * GET PROOFS BY WALLET - Fetch proofs for a wallet address
   * 
   * @param {string} walletAddress - Wallet address (0x...) or DID (did:pkh:...)
   * @param {Object} [options] - Filter options
   * @param {number} [options.limit] - Max results (default: 50; higher limits require owner access)
   * @param {number} [options.offset] - Pagination offset (default: 0)
   * @returns {Promise<Object>} Proofs result
   * 
   * @example
   * const result = await client.getProofsByWallet('0x...', {
   *   limit: 50,
   *   offset: 0
   * });
   */
  async getProofsByWallet(walletAddress, options = {}) {
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new ValidationError('walletAddress is required');
    }

    const id = walletAddress.trim();
    const pathId = /^0x[a-fA-F0-9]{40}$/i.test(id) ? id.toLowerCase() : id;

    const qs = [];
    if (options.limit) qs.push(`limit=${encodeURIComponent(String(options.limit))}`);
    if (options.offset) qs.push(`offset=${encodeURIComponent(String(options.offset))}`);

    const query = qs.length ? `?${qs.join('&')}` : '';
    const response = await this._makeRequest(
      'GET',
      `/api/v1/proofs/byWallet/${encodeURIComponent(pathId)}${query}`
    );

    if (!response.success) {
      throw new ApiError(`Failed to get proofs: ${response.error?.message || 'Unknown error'}`, response.error);
    }

    // Normalize response structure
    const proofs = response.data?.proofs || response.data || response.proofs || [];
    return {
      success: true,
      proofs: Array.isArray(proofs) ? proofs : [],
      totalCount: response.data?.totalCount ?? proofs.length,
      hasMore: Boolean(response.data?.hasMore),
      nextOffset: response.data?.nextOffset ?? null
    };
  }

  /**
   * Get proofs by wallet (owner access)
   *
   * Signs an owner-access intent and requests private proofs via signature headers.
   *
   * @param {string} walletAddress - Wallet address (0x...) or DID (did:pkh:...)
   * @param {Object} [options]
   * @param {number} [options.limit] - Max results (server enforces caps)
   * @param {number} [options.offset] - Pagination offset
   * @param {Object} [wallet] - Optional injected wallet/provider (MetaMask/ethers Wallet)
   */
  async getPrivateProofsByWallet(walletAddress, options = {}, wallet = null) {
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new ValidationError('walletAddress is required');
    }

    const id = walletAddress.trim();
    const pathId = /^0x[a-fA-F0-9]{40}$/i.test(id) ? id.toLowerCase() : id;

    // Auto-detect wallet if not provided
    if (!wallet) {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new ConfigurationError('No wallet provider available');
      }
      wallet = window.ethereum;
    }

    let signerWalletAddress, provider;
    if (wallet.address) {
      signerWalletAddress = wallet.address;
      provider = wallet;
    } else if (wallet.selectedAddress || wallet.request) {
      provider = wallet;
      if (wallet.selectedAddress) {
        signerWalletAddress = wallet.selectedAddress;
      } else {
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
          throw new ConfigurationError('No wallet accounts available');
        }
        signerWalletAddress = accounts[0];
      }
    } else {
      throw new ConfigurationError('Invalid wallet provider');
    }

    const signedTimestamp = Date.now();
    const message = constructVerificationMessage({
      walletAddress: signerWalletAddress,
      signedTimestamp,
      data: { action: 'access_private_proofs_by_wallet', walletAddress: signerWalletAddress.toLowerCase() },
      verifierIds: ['ownership-basic'],
      chainId: NEUS_CONSTANTS.HUB_CHAIN_ID
    });

    let signature;
    try {
      if (provider.signMessage) {
        signature = await provider.signMessage(message);
      } else {
        signature = await provider.request({
          method: 'personal_sign',
          params: [message, signerWalletAddress]
        });
      }
    } catch (error) {
      if (error.code === 4001) {
        throw new ValidationError('User rejected signature request');
      }
      throw new ValidationError(`Failed to sign message: ${error.message}`);
    }

    const qs = [];
    if (options.limit) qs.push(`limit=${encodeURIComponent(String(options.limit))}`);
    if (options.offset) qs.push(`offset=${encodeURIComponent(String(options.offset))}`);
    const query = qs.length ? `?${qs.join('&')}` : '';

    const response = await this._makeRequest('GET', `/api/v1/proofs/byWallet/${encodeURIComponent(pathId)}${query}`, null, {
      'x-wallet-address': signerWalletAddress,
      'x-signature': signature,
      'x-signed-timestamp': signedTimestamp.toString()
    });

    if (!response.success) {
      throw new ApiError(`Failed to get proofs: ${response.error?.message || 'Unauthorized'}`, response.error);
    }

    const proofs = response.data?.proofs || response.data || response.proofs || [];
    return {
      success: true,
      proofs: Array.isArray(proofs) ? proofs : [],
      totalCount: response.data?.totalCount ?? proofs.length,
      hasMore: Boolean(response.data?.hasMore),
      nextOffset: response.data?.nextOffset ?? null
    };
  }

  /**
   * LOOKUP MODE (API) - Non-persistent server-to-server checks
   *
   * Runs `external_lookup` verifiers without minting/storing a proof.
   * Requires an enterprise API key (server-side only).
   *
   * @param {Object} params
   * @param {string} params.apiKey - Enterprise API key (sk_live_... or sk_test_...)
   * @param {Array<string>} params.verifierIds - Verifiers to run (external_lookup only)
   * @param {string} params.targetWalletAddress - Wallet to evaluate
   * @param {Object} [params.data] - Verifier input data (e.g., contractAddress/tokenId/chainId)
   * @returns {Promise<Object>} API response ({ success, data })
   */
  async lookup(params = {}) {
    const apiKey = (params.apiKey || '').toString().trim();
    if (!apiKey || !(apiKey.startsWith('sk_live_') || apiKey.startsWith('sk_test_'))) {
      throw new ValidationError('lookup requires apiKey (sk_live_* or sk_test_*)');
    }

    const verifierIds = Array.isArray(params.verifierIds)
      ? params.verifierIds.map(v => String(v).trim()).filter(Boolean)
      : [];
    if (verifierIds.length === 0) {
      throw new ValidationError('lookup requires verifierIds (non-empty array)');
    }

    const targetWalletAddress = (params.targetWalletAddress || '').toString().trim();
    if (!targetWalletAddress || !/^0x[a-fA-F0-9]{40}$/i.test(targetWalletAddress)) {
      throw new ValidationError('lookup requires a valid targetWalletAddress (0x...)');
    }

    const body = {
      verifierIds,
      targetWalletAddress,
      data: (params.data && typeof params.data === 'object') ? params.data : {}
    };

    const response = await this._makeRequest('POST', '/api/v1/verification/lookup', body, {
      Authorization: `Bearer ${apiKey}`
    });

    if (!response.success) {
      throw new ApiError(`Lookup failed: ${response.error?.message || 'Unknown error'}`, response.error);
    }

    return response;
  }

  /**
   * GATE CHECK (API) - Minimal eligibility check
   *
   * Calls the public gate endpoint and returns a **minimal** yes/no response
   * against **public + discoverable** proofs only.
   *
   * Prefer this over `checkGate()` for server-side integrations that want the
   * smallest, most stable surface area (and do NOT need full proof payloads).
   *
   * @param {Object} params - Gate check query params
   * @param {string} params.address - Wallet address to check (0x...)
   * @param {Array<string>|string} [params.verifierIds] - Verifier IDs to match (array or comma-separated)
   * @param {boolean} [params.requireAll] - Require all verifierIds on a single proof
   * @param {number} [params.minCount] - Minimum number of matching proofs
   * @param {number} [params.sinceDays] - Optional time window in days
   * @param {number} [params.since] - Optional unix timestamp in ms (lower bound)
   * @param {number} [params.limit] - Max rows to scan (server may clamp)
   * @param {string} [params.select] - Comma-separated projections (handle,provider,profileUrl,traits.<key>)
   * @returns {Promise<Object>} API response ({ success, data })
   */
  async gateCheck(params = {}) {
    const address = (params.address || '').toString();
    if (!address || !/^0x[a-fA-F0-9]{40}$/i.test(address)) {
      throw new ValidationError('Valid address is required');
    }

    // Build query string safely (stringify all values; allow arrays for common fields)
    const qs = new URLSearchParams();
    qs.set('address', address);

    const setIfPresent = (key, value) => {
      if (value === undefined || value === null) return;
      const str = typeof value === 'string' ? value : String(value);
      if (str.length === 0) return;
      qs.set(key, str);
    };

    const setBoolIfPresent = (key, value) => {
      if (value === undefined || value === null) return;
      qs.set(key, value ? 'true' : 'false');
    };

    const setCsvIfPresent = (key, value) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        const items = value.map(v => String(v).trim()).filter(Boolean);
        if (items.length) qs.set(key, items.join(','));
        return;
      }
      setIfPresent(key, value);
    };

    // Common filters
    setCsvIfPresent('verifierIds', params.verifierIds);
    setBoolIfPresent('requireAll', params.requireAll);
    setIfPresent('minCount', params.minCount);
    setIfPresent('sinceDays', params.sinceDays);
    setIfPresent('since', params.since);
    setIfPresent('limit', params.limit);
    setCsvIfPresent('select', params.select);

    // Common match filters (optional)
    setIfPresent('referenceType', params.referenceType);
    setIfPresent('referenceId', params.referenceId);
    setIfPresent('tag', params.tag);
    setCsvIfPresent('tags', params.tags);
    setIfPresent('contentType', params.contentType);
    setIfPresent('content', params.content);
    setIfPresent('contentHash', params.contentHash);

    // Asset/ownership filters
    setIfPresent('contractAddress', params.contractAddress);
    setIfPresent('tokenId', params.tokenId);
    setIfPresent('chainId', params.chainId);
    setIfPresent('domain', params.domain);
    setIfPresent('minBalance', params.minBalance);

    // Social / identity / wallet filters
    setIfPresent('provider', params.provider);
    setIfPresent('handle', params.handle);
    setIfPresent('ownerAddress', params.ownerAddress);
    setIfPresent('riskLevel', params.riskLevel);
    setBoolIfPresent('sanctioned', params.sanctioned);
    setBoolIfPresent('poisoned', params.poisoned);
    setIfPresent('primaryWalletAddress', params.primaryWalletAddress);
    setIfPresent('secondaryWalletAddress', params.secondaryWalletAddress);
    setIfPresent('verificationMethod', params.verificationMethod);

    // Trait checks
    setIfPresent('traitPath', params.traitPath);
    setIfPresent('traitGte', params.traitGte);

    const response = await this._makeRequest('GET', `/api/v1/proofs/gate/check?${qs.toString()}`);
    if (!response.success) {
      throw new ApiError(`Gate check failed: ${response.error?.message || 'Unknown error'}`, response.error);
    }
    return response;
  }

  /**
   * CHECK GATE - Evaluate requirements against existing proofs
   * 
   * Gate-first verification: checks if wallet has valid proofs satisfying requirements.
   * Returns which requirements are missing/expired.
   * 
   * @param {Object} params - Gate check parameters
   * @param {string} params.walletAddress - Target wallet
   * @param {Array<Object>} params.requirements - Array of gate requirements
   * @param {string} params.requirements[].verifierId - Required verifier ID
   * @param {number} [params.requirements[].maxAgeMs] - Max proof age in ms (TTL)
   * @param {boolean} [params.requirements[].optional] - If true, not required for gate satisfaction
   * @param {number} [params.requirements[].minCount] - Minimum proofs needed (default: 1)
   * @param {Object} [params.requirements[].match] - Verifier data match criteria
   *   Supports nested fields: 'reference.type', 'reference.id', 'content', 'contentHash', 'input.*', 'license.*'
   *   Supports verifier-specific:
   *     - NFT/Token: 'contractAddress', 'tokenId', 'chainId', 'ownerAddress', 'minBalance'
   *     - DNS: 'domain', 'walletAddress'
   *     - Wallet-link: 'primaryWalletAddress', 'secondaryWalletAddress', 'chainId'
   *     - Contract-ownership: 'contractAddress', 'chainId', 'owner', 'verificationMethod'
   *   Note: contentHash matching uses approximation in SDK; for exact SHA-256 matching, use backend API
   * @param {Array} [params.proofs] - Pre-fetched proofs (skip API call)
   * @returns {Promise<Object>} Gate result with satisfied, missing, existing
   * 
   * @example
   * // Basic gate check
   * const result = await client.checkGate({
   *   walletAddress: '0x...',
   *   requirements: [
   *     { verifierId: 'nft-ownership', match: { contractAddress: '0x...' } }
   *   ]
   * });
   */
  async checkGate(params) {
    const { walletAddress, requirements, proofs: preloadedProofs } = params;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/i.test(walletAddress)) {
      throw new ValidationError('Valid walletAddress is required');
    }
    if (!Array.isArray(requirements) || requirements.length === 0) {
      throw new ValidationError('requirements array is required and must not be empty');
    }

    // Use preloaded proofs or fetch from API
    let proofs = preloadedProofs;
    if (!proofs) {
      const result = await this.getProofsByWallet(walletAddress, { limit: 100 });
      proofs = result.proofs;
    }

    const now = Date.now();
    const existing = {};
    const missing = [];

    for (const req of requirements) {
      const { verifierId, maxAgeMs, optional = false, minCount = 1, match } = req;

      // Find matching proofs for this verifier
      const matchingProofs = (proofs || []).filter(proof => {
        // Must have this verifier and be verified
        const verifiedVerifiers = proof.verifiedVerifiers || [];
        const verifier = verifiedVerifiers.find(
          v => v.verifierId === verifierId && v.verified === true
        );
        if (!verifier) return false;

        // Check proof is not revoked
        if (proof.revokedAt) return false;

        // Check TTL if specified
        if (maxAgeMs) {
          const proofTimestamp = proof.createdAt || proof.signedTimestamp || 0;
          const proofAge = now - proofTimestamp;
          if (proofAge > maxAgeMs) return false;
        }

        // Check custom match criteria if specified
        if (match && typeof match === 'object') {
          const data = verifier.data || {};
          const input = data.input || {}; // NFT/token verifiers store fields in input
          // No license support in public SDK
          
          for (const [key, expected] of Object.entries(match)) {
            let actualValue = null;
            
            // Handle nested field access
            if (key.includes('.')) {
              const parts = key.split('.');
              let current = data;
              
              if (parts[0] === 'input' && input) {
                current = input;
                parts.shift();
              }
              
              for (const part of parts) {
                if (current && typeof current === 'object' && part in current) {
                  current = current[part];
                } else {
                  current = undefined;
                  break;
                }
              }
              actualValue = current;
            } else {
              actualValue = input[key] || data[key];
            }
            
            if (key === 'content' && actualValue === undefined) {
              actualValue = data.reference?.id || data.content;
            }
            
            // Special handling for verifier-specific fields
            if (actualValue === undefined) {
              if (key === 'contractAddress') {
                actualValue = input.contractAddress || data.contractAddress;
              } else if (key === 'tokenId') {
                actualValue = input.tokenId || data.tokenId;
              } else if (key === 'chainId') {
                actualValue = input.chainId || data.chainId;
              } else if (key === 'ownerAddress') {
                actualValue = input.ownerAddress || data.owner || data.walletAddress;
              } else if (key === 'minBalance') {
                actualValue = input.minBalance || data.onChainData?.requiredMinBalance || data.minBalance;
              } else if (key === 'primaryWalletAddress') {
                actualValue = data.primaryWalletAddress;
              } else if (key === 'secondaryWalletAddress') {
                actualValue = data.secondaryWalletAddress;
              } else if (key === 'verificationMethod') {
                actualValue = data.verificationMethod;
              } else if (key === 'domain') {
                actualValue = data.domain;
              }
            }
            
            // Content hash check (approximation)
            if (key === 'contentHash' && actualValue === undefined && data.content) {
              try {
                // Simple hash approximation for non-crypto envs
                let hash = 0;
                const str = String(data.content);
                for (let i = 0; i < str.length; i++) {
                  const char = str.charCodeAt(i);
                  hash = ((hash << 5) - hash) + char;
                  hash = hash & hash;
                }
                actualValue = '0x' + Math.abs(hash).toString(16).padStart(64, '0').substring(0, 66);
              } catch {
                actualValue = String(data.content);
              }
            }
            
            let normalizedActual = actualValue;
            let normalizedExpected = expected;
            
            if (actualValue === undefined || actualValue === null) {
              return false;
            }
            
            if (key === 'chainId' || (key === 'tokenId' && (typeof actualValue === 'number' || !isNaN(Number(actualValue))))) {
              normalizedActual = Number(actualValue);
              normalizedExpected = Number(expected);
              if (isNaN(normalizedActual) || isNaN(normalizedExpected)) return false;
            }
            else if (typeof actualValue === 'string' && (actualValue.startsWith('0x') || actualValue.length > 20)) {
              normalizedActual = actualValue.toLowerCase();
              normalizedExpected = typeof expected === 'string' ? String(expected).toLowerCase() : expected;
            }
            else {
              normalizedActual = actualValue;
              normalizedExpected = expected;
            }
            
            if (normalizedActual !== normalizedExpected) {
              return false;
            }
          }
        }

        return true;
      });

      if (matchingProofs.length >= minCount) {
        const sorted = matchingProofs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        existing[verifierId] = sorted[0];
      } else if (!optional) {
        missing.push(req);
      }
    }

    return {
      satisfied: missing.length === 0,
      missing,
      existing,
      allProofs: proofs
    };
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
      const response = await fetch(url, options);
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
    const qHash = response?.data?.qHash || 
                  response?.qHash || 
                  response?.data?.resource?.qHash ||
                  response?.data?.id;
                  
    const status = response?.data?.status || 
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

  /** SDK logging (opt-in via config.enableLogging) */
  _log(message, data = {}) {
    if (this.config.enableLogging) {
      try {
        const prefix = '[neus/sdk]';
        if (data && Object.keys(data).length > 0) {
          // eslint-disable-next-line no-console
          console.log(prefix, message, data);
        } else {
          // eslint-disable-next-line no-console
          console.log(prefix, message);
        }
      } catch {
        // ignore logging failures
      }
    }
  }
}

// Export the constructVerificationMessage function for advanced use
export { constructVerificationMessage };
