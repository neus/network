import { ApiError, ValidationError, NetworkError, ConfigurationError } from './errors.js';
import {
  PORTABLE_PROOF_SIGNER_HEADER,
  constructVerificationMessage,
  validateWalletAddress,
  validateUniversalAddress,
  signMessage,
  NEUS_CONSTANTS
} from './utils.js';

const FALLBACK_PUBLIC_VERIFIER_CATALOG = {
  'ownership-basic': { supportsDirectApi: true },
  'ownership-pseudonym': { supportsDirectApi: true },
  'ownership-dns-txt': { supportsDirectApi: true },
  'ownership-social': { supportsDirectApi: false },
  'ownership-org-oauth': { supportsDirectApi: false },
  'contract-ownership': { supportsDirectApi: true },
  'nft-ownership': { supportsDirectApi: true },
  'token-holding': { supportsDirectApi: true },
  'wallet-link': { supportsDirectApi: true },
  'wallet-risk': { supportsDirectApi: true },
  'proof-of-human': { supportsDirectApi: false },
  'agent-identity': { supportsDirectApi: true },
  'agent-delegation': { supportsDirectApi: true },
  'ai-content-moderation': { supportsDirectApi: true }
};

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const WALLET_LINK_RELATIONSHIP_TYPES = new Set(['primary', 'personal', 'org', 'affiliate', 'agent', 'linked']);

function normalizeWalletLinkRelationshipType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return WALLET_LINK_RELATIONSHIP_TYPES.has(normalized) ? normalized : 'linked';
}

/**
 * @param {unknown} raw
 * @returns {string | null} Non-empty trimmed string, or null if the provider value is not a valid string identity.
 */
function normalizeBrowserSignerString(raw) {
  if (raw == null) {
    return null;
  }
  if (typeof raw === 'string') {
    const t = raw.trim();
    return t.length > 0 ? t : null;
  }
  return null;
}

const validateVerifierData = (verifierId, data) => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Data object is required' };
  }

  switch (verifierId) {
  case 'ownership-basic':
    if (!data.owner || !validateUniversalAddress(data.owner, typeof data.chain === 'string' ? data.chain : undefined)) {
      return { valid: false, error: 'owner (universal wallet address) is required' };
    }
    if (data.content !== undefined && data.content !== null) {
      if (typeof data.content !== 'string') {
        return { valid: false, error: 'content must be a string when provided' };
      }
      if (data.content.length > 50000) {
        return { valid: false, error: 'content exceeds 50KB inline limit' };
      }
    }
    if (data.contentHash !== undefined && data.contentHash !== null) {
      if (typeof data.contentHash !== 'string' || !/^0x[a-fA-F0-9]{64}$/.test(data.contentHash)) {
        return { valid: false, error: 'contentHash must be a 32-byte hex string (0x + 64 hex chars) when provided' };
      }
    }
    if (data.contentType !== undefined && data.contentType !== null) {
      if (typeof data.contentType !== 'string' || data.contentType.length > 100) {
        return { valid: false, error: 'contentType must be a string (max 100 chars) when provided' };
      }
      const base = String(data.contentType).split(';')[0].trim().toLowerCase();
      if (!base || base.includes(' ') || !base.includes('/')) {
        return { valid: false, error: 'contentType must be a valid MIME type when provided' };
      }
    }
    if (data.provenance !== undefined && data.provenance !== null) {
      if (!data.provenance || typeof data.provenance !== 'object' || Array.isArray(data.provenance)) {
        return { valid: false, error: 'provenance must be an object when provided' };
      }
      const dk = data.provenance.declaredKind;
      if (dk !== undefined && dk !== null) {
        const allowed = ['human', 'ai', 'mixed', 'unknown'];
        if (typeof dk !== 'string' || !allowed.includes(dk)) {
          return { valid: false, error: `provenance.declaredKind must be one of: ${allowed.join(', ')}` };
        }
      }
      const ai = data.provenance.aiContext;
      if (ai !== undefined && ai !== null) {
        if (typeof ai !== 'object' || Array.isArray(ai)) {
          return { valid: false, error: 'provenance.aiContext must be an object when provided' };
        }
        if (ai.generatorType !== undefined && ai.generatorType !== null) {
          const allowed = ['local', 'saas', 'agent'];
          if (typeof ai.generatorType !== 'string' || !allowed.includes(ai.generatorType)) {
            return { valid: false, error: `provenance.aiContext.generatorType must be one of: ${allowed.join(', ')}` };
          }
        }
        if (ai.provider !== undefined && ai.provider !== null) {
          if (typeof ai.provider !== 'string' || ai.provider.length > 64) {
            return { valid: false, error: 'provenance.aiContext.provider must be a string (max 64 chars) when provided' };
          }
        }
        if (ai.model !== undefined && ai.model !== null) {
          if (typeof ai.model !== 'string' || ai.model.length > 128) {
            return { valid: false, error: 'provenance.aiContext.model must be a string (max 128 chars) when provided' };
          }
        }
        if (ai.runId !== undefined && ai.runId !== null) {
          if (typeof ai.runId !== 'string' || ai.runId.length > 128) {
            return { valid: false, error: 'provenance.aiContext.runId must be a string (max 128 chars) when provided' };
          }
        }
      }
    }
    if (data.reference !== undefined) {
      if (!data.reference || typeof data.reference !== 'object') {
        return { valid: false, error: 'reference must be an object when provided' };
      }
      if (!data.reference.type || typeof data.reference.type !== 'string') {
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
    if (!data.primaryWalletAddress || !validateUniversalAddress(data.primaryWalletAddress, data.chain)) {
      return { valid: false, error: 'primaryWalletAddress is required' };
    }
    if (!data.secondaryWalletAddress || !validateUniversalAddress(data.secondaryWalletAddress, data.chain)) {
      return { valid: false, error: 'secondaryWalletAddress is required' };
    }
    if (!data.signature || typeof data.signature !== 'string') {
      return { valid: false, error: 'signature is required (signed by secondary wallet)' };
    }
    if (typeof data.chain !== 'string' || !/^[a-z0-9]+:[^\s]+$/.test(data.chain)) {
      return { valid: false, error: 'chain is required (namespace:reference)' };
    }
    if (typeof data.signatureMethod !== 'string' || !data.signatureMethod.trim()) {
      return { valid: false, error: 'signatureMethod is required' };
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
      const isTextual = contentType.startsWith('text/') || contentType.includes('markdown');
      if (isTextual) {
        try {
          const maxBytes = 50 * 1024;
          const bytes = (typeof TextEncoder !== 'undefined')
            ? new TextEncoder().encode(data.content).length
            : String(data.content).length;
          if (bytes > maxBytes) {
            return {
              valid: false,
              error: `content exceeds ${maxBytes} bytes limit for ai-content-moderation verifier (text)`
            };
          }
        } catch {
        }
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
    if (!/^[a-z0-9._-]{3,64}$/.test(data.pseudonymId.trim().toLowerCase())) {
      return { valid: false, error: 'pseudonymId must be 3-64 characters, lowercase alphanumeric with dots, underscores, or hyphens' };
    }
    if (data.namespace && typeof data.namespace === 'string') {
      if (!/^[a-z0-9._-]{1,64}$/.test(data.namespace.trim().toLowerCase())) {
        return { valid: false, error: 'namespace must be 1-64 characters, lowercase alphanumeric with dots, underscores, or hyphens' };
      }
    }
    break;
  case 'wallet-risk':
    if (data.walletAddress && !validateUniversalAddress(data.walletAddress, data.chain)) {
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

    this.baseUrl = this.config.apiUrl || 'https://api.neus.network';
    try {
      const url = new URL(this.baseUrl);
      if (url.hostname.endsWith('neus.network') && url.protocol === 'http:') {
        url.protocol = 'https:';
      }
      this.baseUrl = url.toString().replace(/\/$/, '');
    } catch {
    }
    this.config.apiUrl = this.baseUrl;


    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Neus-Sdk': 'js'
    };

    if (typeof this.config.apiKey === 'string' && this.config.apiKey.trim().length > 0) {
      this.defaultHeaders['Authorization'] = `Bearer ${this.config.apiKey.trim()}`;
    }
    if (typeof this.config.appId === 'string' && this.config.appId.trim().length > 0) {
      this.defaultHeaders['X-Neus-App'] = this.config.appId.trim();
    }
    if (typeof this.config.paymentSignature === 'string' && this.config.paymentSignature.trim().length > 0) {
      this.defaultHeaders['PAYMENT-SIGNATURE'] = this.config.paymentSignature.trim();
    }
    if (this.config.extraHeaders && typeof this.config.extraHeaders === 'object') {
      for (const [k, v] of Object.entries(this.config.extraHeaders)) {
        if (!k || v === undefined || v === null) continue;
        const key = String(k).trim();
        const value = String(v).trim();
        if (!key || !value) continue;
        this.defaultHeaders[key] = value;
      }
    }
    try {
      if (typeof window !== 'undefined' && window.location && window.location.origin) {
        this.defaultHeaders['X-Client-Origin'] = window.location.origin;
      }
    } catch {
    }
  }

  _getHubChainId() {
    const configured = Number(this.config?.hubChainId);
    if (Number.isFinite(configured) && configured > 0) return Math.floor(configured);
    return NEUS_CONSTANTS.HUB_CHAIN_ID;
  }

  _normalizeIdentity(value) {
    let raw = String(value || '').trim();
    if (!raw) return '';
    const didMatch = raw.match(/^did:pkh:([^:]+):([^:]+):(.+)$/i);
    if (didMatch && didMatch[3]) {
      raw = String(didMatch[3]).trim();
    }
    return EVM_ADDRESS_RE.test(raw) ? raw.toLowerCase() : raw;
  }

  _inferChainForAddress(address, explicitChain) {
    if (typeof explicitChain === 'string' && explicitChain.includes(':')) return explicitChain.trim();
    const raw = String(address || '').trim();
    const didMatch = raw.match(/^did:pkh:([^:]+):([^:]+):(.+)$/i);
    if (didMatch && didMatch[1] && didMatch[2]) {
      return `${didMatch[1]}:${didMatch[2]}`;
    }
    if (EVM_ADDRESS_RE.test(raw)) {
      return `eip155:${this._getHubChainId()}`;
    }
    return 'solana:mainnet';
  }

  async _resolveWalletSigner(wallet) {
    if (!wallet) {
      throw new ConfigurationError('No wallet provider available');
    }

    if (wallet.address != null) {
      const s = normalizeBrowserSignerString(
        typeof wallet.address === 'string' ? wallet.address : null
      );
      if (s) {
        return { signerWalletAddress: s, provider: wallet };
      }
    }
    if (wallet.publicKey && typeof wallet.publicKey.toBase58 === 'function') {
      const b58 = wallet.publicKey.toBase58();
      const s = normalizeBrowserSignerString(typeof b58 === 'string' ? b58 : null);
      if (s) {
        return { signerWalletAddress: s, provider: wallet };
      }
    }
    if (typeof wallet.getAddress === 'function') {
      const got = await wallet.getAddress().catch(() => null);
      const s = normalizeBrowserSignerString(
        got == null ? null : (typeof got === 'string' ? got : null)
      );
      if (s) {
        return { signerWalletAddress: s, provider: wallet };
      }
    }
    if (wallet.selectedAddress || wallet.request) {
      const provider = wallet;
      if (wallet.selectedAddress) {
        const s = normalizeBrowserSignerString(
          typeof wallet.selectedAddress === 'string' ? wallet.selectedAddress : null
        );
        if (s) {
          return { signerWalletAddress: s, provider };
        }
      }
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        throw new ConfigurationError('No wallet accounts available');
      }
      const s = normalizeBrowserSignerString(accounts[0]);
      if (!s) {
        throw new ConfigurationError('No wallet accounts available');
      }
      return { signerWalletAddress: s, provider };
    }

    throw new ConfigurationError('Invalid wallet provider');
  }

  _getDefaultBrowserWallet() {
    if (typeof window === 'undefined') return null;
    return window.ethereum || window.solana || (window.phantom && window.phantom.solana) || null;
  }

  async _buildPrivateGateAuth({ address, wallet, chain, signatureMethod } = {}) {
    const providerWallet = wallet || this._getDefaultBrowserWallet();
    const { signerWalletAddress, provider } = await this._resolveWalletSigner(providerWallet);
    if (!signerWalletAddress || typeof signerWalletAddress !== 'string') {
      throw new ConfigurationError('No wallet accounts available');
    }

    const normalizedSigner = this._normalizeIdentity(signerWalletAddress);
    const normalizedAddress = this._normalizeIdentity(address);
    if (!normalizedSigner || normalizedSigner !== normalizedAddress) {
      throw new ValidationError('wallet must match address when includePrivate=true');
    }

    const signerIsEvm = EVM_ADDRESS_RE.test(normalizedSigner);
    const resolvedChain = this._inferChainForAddress(normalizedSigner, chain);
    const resolvedSignatureMethod = (typeof signatureMethod === 'string' && signatureMethod.trim())
      ? signatureMethod.trim()
      : (signerIsEvm ? 'eip191' : 'ed25519');

    const signedTimestamp = Date.now();
    const message = constructVerificationMessage({
      walletAddress: signerWalletAddress,
      signedTimestamp,
      data: { action: 'gate_check_private_proofs', walletAddress: normalizedAddress },
      verifierIds: ['ownership-basic'],
      ...(signerIsEvm ? { chainId: this._getHubChainId() } : { chain: resolvedChain })
    });

    let signature;
    try {
      signature = await signMessage({
        provider,
        message,
        walletAddress: signerWalletAddress,
        ...(signerIsEvm ? {} : { chain: resolvedChain })
      });
    } catch (error) {
      if (error.code === 4001) {
        throw new ValidationError('User rejected signature request');
      }
      throw new ValidationError(`Failed to sign message: ${error.message}`);
    }

    return {
      walletAddress: signerWalletAddress,
      signature,
      signedTimestamp,
      ...(signerIsEvm ? {} : { chain: resolvedChain, signatureMethod: resolvedSignatureMethod })
    };
  }

  async createGatePrivateAuth(params = {}) {
    const address = (params.address || '').toString();
    if (!validateUniversalAddress(address, params.chain)) {
      throw new ValidationError('Valid address is required');
    }
    return this._buildPrivateGateAuth({
      address,
      wallet: params.wallet,
      chain: params.chain,
      signatureMethod: params.signatureMethod
    });
  }

  async createWalletLinkData(params = {}) {
    const normalizedPrimary = this._normalizeIdentity(params.primaryWalletAddress);
    const normalizedSecondary = this._normalizeIdentity(params.secondaryWalletAddress);

    if (!EVM_ADDRESS_RE.test(normalizedPrimary)) {
      throw new ValidationError('wallet-link requires a valid primaryWalletAddress');
    }
    if (!EVM_ADDRESS_RE.test(normalizedSecondary)) {
      throw new ValidationError('wallet-link requires a valid secondaryWalletAddress');
    }
    if (normalizedPrimary === normalizedSecondary) {
      throw new ValidationError('wallet-link secondaryWalletAddress must differ from primaryWalletAddress');
    }

    const providerWallet = params.wallet || this._getDefaultBrowserWallet();
    const { signerWalletAddress, provider } = await this._resolveWalletSigner(providerWallet);
    const normalizedSigner = this._normalizeIdentity(signerWalletAddress);
    if (!EVM_ADDRESS_RE.test(normalizedSigner)) {
      throw new ValidationError('wallet-link requires an EVM wallet/provider for the secondary wallet');
    }
    if (normalizedSigner !== normalizedSecondary) {
      throw new ValidationError('wallet-link wallet/provider must be connected to secondaryWalletAddress');
    }

    const resolvedChain = (() => {
      const raw = String(params.chain || '').trim();
      if (!raw) return `eip155:${this._getHubChainId()}`;
      if (!/^eip155:\d+$/.test(raw)) {
        throw new ValidationError('wallet-link requires chain in the form eip155:<chainId>');
      }
      return raw;
    })();
    const signedTimestamp = Number.isFinite(Number(params.signedTimestamp)) && Number(params.signedTimestamp) > 0
      ? Number(params.signedTimestamp)
      : Date.now();
    const linkData = {
      primaryAccountId: `${resolvedChain}:${normalizedPrimary}`,
      secondaryAccountId: `${resolvedChain}:${normalizedSecondary}`,
      primaryWalletAddress: normalizedPrimary,
      secondaryWalletAddress: normalizedSecondary
    };
    const message = constructVerificationMessage({
      walletAddress: normalizedSecondary,
      signedTimestamp,
      data: linkData,
      verifierIds: ['wallet-link'],
      chain: resolvedChain
    });

    let signature;
    try {
      signature = await signMessage({
        provider,
        message,
        walletAddress: signerWalletAddress
      });
    } catch (error) {
      if (error?.code === 4001) {
        throw new ValidationError('User rejected wallet-link signature request');
      }
      throw new ValidationError(`Failed to sign wallet-link message: ${error?.message || String(error)}`);
    }

    const label = String(params.label || '').trim().slice(0, 64);
    return {
      primaryWalletAddress: normalizedPrimary,
      secondaryWalletAddress: normalizedSecondary,
      signature,
      chain: resolvedChain,
      signatureMethod: 'eip191',
      signedTimestamp,
      relationshipType: normalizeWalletLinkRelationshipType(params.relationshipType),
      ...(label ? { label } : {})
    };
  }

  async verify(params) {
    if ((!params?.signature || !params?.walletAddress) && (params?.verifier || params?.content || params?.data)) {
      const { content, verifier = 'ownership-basic', data = null, wallet = null, options = {} } = params;

      if (verifier === 'ownership-basic' && !data && (!content || typeof content !== 'string')) {
        throw new ValidationError('content is required and must be a string (or use data param with owner + reference)');
      }

      let verifierCatalog = FALLBACK_PUBLIC_VERIFIER_CATALOG;
      try {
        const discovered = await this.getVerifierCatalog();
        if (discovered && discovered.metadata && Object.keys(discovered.metadata).length > 0) {
          verifierCatalog = discovered.metadata;
        }
      } catch {
      }
      const validVerifiers = Object.keys(verifierCatalog);
      if (!validVerifiers.includes(verifier)) {
        throw new ValidationError(`Invalid verifier '${verifier}'. Must be one of: ${validVerifiers.join(', ')}.`);
      }

      if (verifierCatalog?.[verifier]?.supportsDirectApi === false) {
        const hostedCheckoutUrl = options?.hostedCheckoutUrl || 'https://neus.network/verify';
        throw new ValidationError(
          `${verifier} requires hosted interactive checkout. Use VerifyGate or redirect to ${hostedCheckoutUrl}.`
        );
      }

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

      let walletAddress, provider;
      if (wallet) {
        walletAddress =
          wallet.address ||
          wallet.selectedAddress ||
          wallet.walletAddress ||
          (typeof wallet.getAddress === 'function' ? await wallet.getAddress().catch(() => null) : null);
        provider = wallet.provider || wallet;
        if (!walletAddress && provider && typeof provider.request === 'function') {
          let accounts = await provider.request({ method: 'eth_accounts' });
          walletAddress = Array.isArray(accounts) && accounts.length > 0 ? accounts[0] : null;
          if (!walletAddress) {
            await provider.request({ method: 'eth_requestAccounts' });
            accounts = await provider.request({ method: 'eth_accounts' });
            walletAddress = Array.isArray(accounts) && accounts.length > 0 ? accounts[0] : null;
          }
        }
      } else {
        if (typeof window === 'undefined' || !window.ethereum) {
          throw new ConfigurationError('No Web3 wallet detected. Please install MetaMask or provide wallet parameter.');
        }
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = window.ethereum;
        const accounts = await provider.request({ method: 'eth_accounts' });
        walletAddress = accounts[0];
      }

      {
        const normalized = normalizeBrowserSignerString(
          typeof walletAddress === 'string' ? walletAddress : null
        );
        if (!normalized) {
          throw new ConfigurationError('No wallet accounts available. Connect a wallet to continue.');
        }
        walletAddress = normalized;
      }

      let verificationData;
      if (verifier === 'ownership-basic') {
        if (data && typeof data === 'object') {
          verificationData = {
            owner: data.owner || walletAddress,
            reference: data.reference,
            ...(data.content && { content: data.content }),
            ...(data.contentHash && { contentHash: data.contentHash }),
            ...(data.contentType && { contentType: data.contentType }),
            ...(data.provenance && { provenance: data.provenance })
          };
        } else {
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
        if (typeof data?.chain !== 'string' || !/^[a-z0-9]+:[^\s]+$/.test(data.chain)) {
          throw new ValidationError('wallet-link requires chain (namespace:reference) in data parameter');
        }
        if (typeof data?.signatureMethod !== 'string' || !data.signatureMethod.trim()) {
          throw new ValidationError('wallet-link requires signatureMethod in data parameter');
        }
        verificationData = {
          primaryWalletAddress: walletAddress,
          secondaryWalletAddress: data.secondaryWalletAddress,
          signature: data.signature,
          chain: data.chain,
          signatureMethod: data.signatureMethod,
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
          ...(data?.capabilities && { capabilities: data.capabilities }),
          ...(data?.instructions && { instructions: data.instructions }),
          ...(data?.skills && { skills: data.skills }),
          ...(data?.services && { services: data.services })
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
          ...(data?.allowedPaymentTypes && { allowedPaymentTypes: data.allowedPaymentTypes }),
          ...(data?.receiptDisclosure && { receiptDisclosure: data.receiptDisclosure }),
          ...(data?.expiresAt && { expiresAt: data.expiresAt }),
          ...(data?.instructions && { instructions: data.instructions }),
          ...(data?.skills && { skills: data.skills })
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
        verificationData = {
          walletAddress: data?.walletAddress || walletAddress,
          ...(data?.provider && { provider: data.provider }),
          chainId: (typeof data?.chainId === 'number' && Number.isFinite(data.chainId)) ? data.chainId : 1,
          ...(data?.includeDetails !== undefined && { includeDetails: data.includeDetails })
        };
      } else {
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
        chainId: this._getHubChainId()
      });

      let signature;
      try {
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
          }
          return false;
        })();

        if (isFarcasterWallet) {
          try {
            const hexMsg = toHexUtf8(message);
            signature = await provider.request({ method: 'personal_sign', params: [hexMsg, walletAddress] });
          } catch (e) {
          }
        }

        if (!signature) {
          try {
            signature = await provider.request({ method: 'personal_sign', params: [message, walletAddress] });
          } catch (e) {
            const msg = String(e && (e.message || e.reason) || e || '').toLowerCase();
            const errCode = (e && (e.code || (e.error && e.error.code))) || null;
            const needsHex = /byte|bytes|invalid byte sequence|encoding|non-hex/i.test(msg);

            const unsupportedRe =
              /method.*not.*supported|unsupported|not implemented|method not found|unknown method|does not support/i;
            const methodUnsupported = (
              unsupportedRe.test(msg) ||
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
                }
                signature = await provider.request({ method: 'eth_sign', params: [walletAddress, payloadHex], neusAllowEthSign: true });
                try {
                  if (typeof window !== 'undefined') delete window.__NEUS_ALLOW_ETH_SIGN__;
                } catch {
                }
              } catch (fallbackErr) {
                this._log('eth_sign fallback failed', { message: fallbackErr?.message || String(fallbackErr) });
                try {
                  if (typeof window !== 'undefined') delete window.__NEUS_ALLOW_ETH_SIGN__;
                } catch {
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

    const normalizeVerifierId = (id) => {
      if (typeof id !== 'string') return id;
      const match = id.match(/^(.*)@\d+$/);
      return match ? match[1] : id;
    };
    const normalizedVerifierIds = Array.isArray(verifierIds) ? verifierIds.map(normalizeVerifierId) : [];

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

    for (const verifierId of normalizedVerifierIds) {
      const validation = validateVerifierData(verifierId, data);
      if (!validation.valid) {
        throw new ValidationError(`Validation failed for verifier '${verifierId}': ${validation.error}`);
      }
    }

    const optionsPayload = {
      ...(options && typeof options === 'object' ? options : {}),
      targetChains: Array.isArray(options?.targetChains) ? options.targetChains : [],
      privacyLevel: options?.privacyLevel || 'private',
      publicDisplay: options?.publicDisplay || false,
      storeOriginalContent:
        typeof options?.storeOriginalContent === 'boolean' ? options.storeOriginalContent : true
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

    const response = await this._makeRequest('POST', '/api/v1/verification', requestData);

    if (!response.success) {
      throw new ApiError(`Verification failed: ${response.error?.message || 'Unknown error'}`, response.error);
    }

    return this._formatResponse(response);
  }

  async getProof(proofId) {
    if (!proofId || typeof proofId !== 'string') {
      throw new ValidationError('proofId is required');
    }
    const response = await this._makeRequest('GET', `/api/v1/proofs/${proofId}`);

    if (!response.success) {
      throw new ApiError(`Failed to get proof: ${response.error?.message || 'Unknown error'}`, response.error);
    }

    return this._formatResponse(response);
  }

  async getPrivateProof(proofId, wallet = null) {
    if (!proofId || typeof proofId !== 'string') {
      throw new ValidationError('proofId is required');
    }

    const isPreSignedAuth = wallet &&
      typeof wallet === 'object' &&
      typeof wallet.walletAddress === 'string' &&
      typeof wallet.signature === 'string' &&
      typeof wallet.signedTimestamp === 'number';
    if (isPreSignedAuth) {
      const auth = wallet;
      const headers = {
        'x-wallet-address': String(auth.walletAddress),
        'x-signature': String(auth.signature),
        'x-signed-timestamp': String(auth.signedTimestamp),
        ...(typeof auth.chain === 'string' && auth.chain.trim() ? { 'x-chain': auth.chain.trim() } : {}),
        ...(typeof auth.signatureMethod === 'string' && auth.signatureMethod.trim() ? { 'x-signature-method': auth.signatureMethod.trim() } : {})
      };
      const response = await this._makeRequest('GET', `/api/v1/proofs/${proofId}`, null, headers);
      if (!response.success) {
        throw new ApiError(
          `Failed to access private proof: ${response.error?.message || 'Unauthorized'}`,
          response.error
        );
      }
      return this._formatResponse(response);
    }

    const providerWallet = wallet || this._getDefaultBrowserWallet();
    const { signerWalletAddress: walletAddress, provider } = await this._resolveWalletSigner(providerWallet);
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new ConfigurationError('No wallet accounts available');
    }
    const signerIsEvm = EVM_ADDRESS_RE.test(this._normalizeIdentity(walletAddress));
    const chain = this._inferChainForAddress(walletAddress);
    const signatureMethod = signerIsEvm ? 'eip191' : 'ed25519';

    const signedTimestamp = Date.now();

    const message = constructVerificationMessage({
      walletAddress,
      signedTimestamp,
      data: { action: 'access_private_proof', qHash: proofId },
      verifierIds: ['ownership-basic'],
      ...(signerIsEvm ? { chainId: this._getHubChainId() } : { chain })
    });

    let signature;
    try {
      signature = await signMessage({
        provider,
        message,
        walletAddress,
        ...(signerIsEvm ? {} : { chain })
      });
    } catch (error) {
      if (error.code === 4001) {
        throw new ValidationError('User rejected signature request');
      }
      throw new ValidationError(`Failed to sign message: ${error.message}`);
    }

    const response = await this._makeRequest('GET', `/api/v1/proofs/${proofId}`, null, {
      'x-wallet-address': walletAddress,
      'x-signature': signature,
      'x-signed-timestamp': signedTimestamp.toString(),
      ...(signerIsEvm ? {} : { 'x-chain': chain, 'x-signature-method': signatureMethod })
    });

    if (!response.success) {
      throw new ApiError(
        `Failed to access private proof: ${response.error?.message || 'Unauthorized'}`,
        response.error
      );
    }

    return this._formatResponse(response);
  }

  async isHealthy() {
    try {
      const response = await this._makeRequest('GET', '/api/v1/health');
      return response.success === true;
    } catch {
      return false;
    }
  }

  async getVerifiers() {
    const catalog = await this.getVerifierCatalog();
    return Array.isArray(catalog?.data) ? catalog.data : [];
  }

  async getVerifierCatalog() {
    const response = await this._makeRequest('GET', '/api/v1/verification/verifiers');
    if (!response.success) {
      throw new ApiError(`Failed to get verifiers: ${response.error?.message || 'Unknown error'}`, response.error);
    }
    return {
      data: Array.isArray(response.data) ? response.data : [],
      metadata:
        response.metadata && typeof response.metadata === 'object' && !Array.isArray(response.metadata)
          ? response.metadata
          : {},
      meta:
        response.meta && typeof response.meta === 'object' && !Array.isArray(response.meta)
          ? response.meta
          : {}
    };
  }

  async pollProofStatus(proofId, options = {}) {
    const {
      interval = 5000,
      timeout = 120000,
      onProgress
    } = options;

    if (!proofId || typeof proofId !== 'string') {
      throw new ValidationError('proofId is required');
    }

    const startTime = Date.now();
    let consecutiveRateLimits = 0;

    while (Date.now() - startTime < timeout) {
      try {
        const status = await this.getProof(proofId);
        consecutiveRateLimits = 0;

        if (onProgress && typeof onProgress === 'function') {
          onProgress(status.data || status);
        }

        const currentStatus = status.data?.status || status.status;
        if (this._isTerminalStatus(currentStatus)) {
          this._log('Verification completed', { status: currentStatus, duration: Date.now() - startTime });
          return status;
        }

        await new Promise(resolve => setTimeout(resolve, interval));

      } catch (error) {
        this._log('Status poll error', error.message);
        if (error instanceof ValidationError) {
          throw error;
        }

        let nextDelay = interval;
        if (error instanceof ApiError && Number(error.statusCode) === 429) {
          consecutiveRateLimits += 1;
          const exp = Math.min(6, consecutiveRateLimits);
          const base = Math.max(500, Number(interval) || 0);
          const max = 30000;
          const backoff = Math.min(max, base * Math.pow(2, exp));
          const jitter = Math.floor(backoff * (0.5 + Math.random() * 0.5));
          nextDelay = jitter;
        }

        await new Promise(resolve => setTimeout(resolve, nextDelay));
      }
    }

    throw new NetworkError(`Polling timeout after ${timeout}ms`, 'POLLING_TIMEOUT');
  }

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

  async revokeOwnProof(proofId, wallet) {
    if (!proofId || typeof proofId !== 'string') {
      throw new ValidationError('proofId is required');
    }
    const providerWallet = wallet || this._getDefaultBrowserWallet();
    const { signerWalletAddress: address, provider } = await this._resolveWalletSigner(providerWallet);
    if (!address || typeof address !== 'string') {
      throw new ConfigurationError('No wallet accounts available');
    }
    const signerIsEvm = EVM_ADDRESS_RE.test(this._normalizeIdentity(address));
    const chain = this._inferChainForAddress(address);
    const signatureMethod = signerIsEvm ? 'eip191' : 'ed25519';
    const signedTimestamp = Date.now();

    const message = constructVerificationMessage({
      walletAddress: address,
      signedTimestamp,
      data: { action: 'revoke_proof', qHash: proofId },
      verifierIds: ['ownership-basic'],
      ...(signerIsEvm ? { chainId: this._getHubChainId() } : { chain })
    });

    let signature;
    try {
      signature = await signMessage({
        provider,
        message,
        walletAddress: address,
        ...(signerIsEvm ? {} : { chain })
      });
    } catch (error) {
      if (error.code === 4001) {
        throw new ValidationError('User rejected revocation signature');
      }
      throw new ValidationError(`Failed to sign revocation: ${error.message}`);
    }

    const res = await fetch(`${this.config.apiUrl}/api/v1/proofs/revoke-self/${proofId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: address,
        signature,
        signedTimestamp,
        ...(signerIsEvm ? {} : { chain, signatureMethod })
      })
    });
    const json = await res.json();
    if (!json.success) {
      throw new ApiError(json.error?.message || 'Failed to revoke proof', json.error);
    }
    return true;
  }

  async getProofsByWallet(walletAddress, options = {}) {
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new ValidationError('walletAddress is required');
    }

    const id = walletAddress.trim();
    const pathId = /^0x[a-fA-F0-9]{40}$/i.test(id) ? id.toLowerCase() : id;

    const qs = [];
    if (options.limit) qs.push(`limit=${encodeURIComponent(String(options.limit))}`);
    if (options.offset) qs.push(`offset=${encodeURIComponent(String(options.offset))}`);
    if (options.qHash) qs.push(`qHash=${encodeURIComponent(options.qHash.toLowerCase())}`);

    const query = qs.length ? `?${qs.join('&')}` : '';
    const response = await this._makeRequest(
      'GET',
      `/api/v1/proofs/by-wallet/${encodeURIComponent(pathId)}${query}`
    );

    if (!response.success) {
      throw new ApiError(`Failed to get proofs: ${response.error?.message || 'Unknown error'}`, response.error);
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

  async getPrivateProofsByWallet(walletAddress, options = {}, wallet = null) {
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new ValidationError('walletAddress is required');
    }

    const id = walletAddress.trim();
    const pathId = /^0x[a-fA-F0-9]{40}$/i.test(id) ? id.toLowerCase() : id;

    const requestedIdentity = this._normalizeIdentity(id);

    if (!wallet) {
      const defaultWallet = this._getDefaultBrowserWallet();
      if (!defaultWallet) {
        throw new ConfigurationError('No wallet provider available');
      }
      wallet = defaultWallet;
    }

    const { signerWalletAddress, provider } = await this._resolveWalletSigner(wallet);

    if (!signerWalletAddress || typeof signerWalletAddress !== 'string') {
      throw new ConfigurationError('No wallet accounts available');
    }

    const normalizedSigner = this._normalizeIdentity(signerWalletAddress);
    if (!normalizedSigner || normalizedSigner !== requestedIdentity) {
      throw new ValidationError('wallet must match walletAddress for private proof access');
    }

    const signerIsEvm = EVM_ADDRESS_RE.test(normalizedSigner);
    const chain = this._inferChainForAddress(normalizedSigner, options?.chain);
    const signatureMethod = (typeof options?.signatureMethod === 'string' && options.signatureMethod.trim())
      ? options.signatureMethod.trim()
      : (signerIsEvm ? 'eip191' : 'ed25519');

    const signedTimestamp = Date.now();
    const message = constructVerificationMessage({
      walletAddress: signerWalletAddress,
      signedTimestamp,
      data: { action: 'access_private_proofs_by_wallet', walletAddress: normalizedSigner },
      verifierIds: ['ownership-basic'],
      ...(signerIsEvm ? { chainId: this._getHubChainId() } : { chain })
    });

    let signature;
    try {
      signature = await signMessage({
        provider,
        message,
        walletAddress: signerWalletAddress,
        ...(signerIsEvm ? {} : { chain })
      });
    } catch (error) {
      if (error.code === 4001) {
        throw new ValidationError('User rejected signature request');
      }
      throw new ValidationError(`Failed to sign message: ${error.message}`);
    }

    const qs = [];
    if (options.limit) qs.push(`limit=${encodeURIComponent(String(options.limit))}`);
    if (options.offset) qs.push(`offset=${encodeURIComponent(String(options.offset))}`);
    if (options.qHash) qs.push(`qHash=${encodeURIComponent(options.qHash.toLowerCase())}`);
    const query = qs.length ? `?${qs.join('&')}` : '';

    const response = await this._makeRequest('GET', `/api/v1/proofs/by-wallet/${encodeURIComponent(pathId)}${query}`, null, {
      'x-wallet-address': signerWalletAddress,
      'x-signature': signature,
      'x-signed-timestamp': signedTimestamp.toString(),
      ...(signerIsEvm ? {} : { 'x-chain': chain, 'x-signature-method': signatureMethod })
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

  async gateCheck(params = {}) {
    const address = (params.address || '').toString();
    if (!validateUniversalAddress(address, params.chain)) {
      throw new ValidationError('Valid address is required');
    }

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

    setCsvIfPresent('verifierIds', params.verifierIds);
    setBoolIfPresent('requireAll', params.requireAll);
    setIfPresent('minCount', params.minCount);
    setIfPresent('sinceDays', params.sinceDays);
    setIfPresent('since', params.since);
    setIfPresent('limit', params.limit);
    setBoolIfPresent('includePrivate', params.includePrivate);
    setBoolIfPresent('includeQHashes', params.includeQHashes);

    setIfPresent('referenceType', params.referenceType);
    setIfPresent('referenceId', params.referenceId);
    setIfPresent('tag', params.tag);
    setCsvIfPresent('tags', params.tags);
    setIfPresent('contentType', params.contentType);
    setIfPresent('content', params.content);
    setIfPresent('contentHash', params.contentHash);

    setIfPresent('contractAddress', params.contractAddress);
    setIfPresent('tokenId', params.tokenId);
    setIfPresent('chainId', params.chainId);
    setIfPresent('domain', params.domain);
    setIfPresent('minBalance', params.minBalance);

    setIfPresent('provider', params.provider);
    setIfPresent('handle', params.handle);
    setIfPresent('namespace', params.namespace);
    setIfPresent('ownerAddress', params.ownerAddress);
    setIfPresent('riskLevel', params.riskLevel);
    setBoolIfPresent('sanctioned', params.sanctioned);
    setBoolIfPresent('poisoned', params.poisoned);
    setIfPresent('primaryWalletAddress', params.primaryWalletAddress);
    setIfPresent('secondaryWalletAddress', params.secondaryWalletAddress);
    setIfPresent('verificationMethod', params.verificationMethod);

    let headersOverride = null;
    if (params.includePrivate === true) {
      const provided = params.privateAuth && typeof params.privateAuth === 'object' ? params.privateAuth : null;
      let auth = provided;
      if (!auth) {
        const walletCandidate = params.wallet || this._getDefaultBrowserWallet();
        if (walletCandidate) {
          auth = await this._buildPrivateGateAuth({
            address,
            wallet: walletCandidate,
            chain: params.chain,
            signatureMethod: params.signatureMethod
          });
        }
      }
      if (!auth) {
      } else {
        const normalizedAuthWallet = this._normalizeIdentity(auth.walletAddress);
        const normalizedAddress = this._normalizeIdentity(address);
        if (!normalizedAuthWallet || normalizedAuthWallet !== normalizedAddress) {
          throw new ValidationError('privateAuth.walletAddress must match address when includePrivate=true');
        }
        const authChain = (typeof auth.chain === 'string' && auth.chain.includes(':')) ? auth.chain.trim() : null;
        const authSignatureMethod = (typeof auth.signatureMethod === 'string' && auth.signatureMethod.trim())
          ? auth.signatureMethod.trim()
          : null;
        headersOverride = {
          'x-wallet-address': String(auth.walletAddress),
          'x-signature': String(auth.signature),
          'x-signed-timestamp': String(auth.signedTimestamp),
          ...(authChain ? { 'x-chain': authChain } : {}),
          ...(authSignatureMethod ? { 'x-signature-method': authSignatureMethod } : {})
        };
      }
    }

    const response = await this._makeRequest('GET', `/api/v1/proofs/check?${qs.toString()}`, null, headersOverride);
    if (!response.success) {
      throw new ApiError(`Gate check failed: ${response.error?.message || 'Unknown error'}`, response.error);
    }
    return response;
  }

  async checkGate(params) {
    const { walletAddress, requirements, proofs: preloadedProofs } = params;

    if (!validateUniversalAddress(walletAddress)) {
      throw new ValidationError('Valid walletAddress is required');
    }
    if (!Array.isArray(requirements) || requirements.length === 0) {
      throw new ValidationError('requirements array is required and must not be empty');
    }

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

      const matchingProofs = (proofs || []).filter(proof => {
        const verifiedVerifiers = proof.verifiedVerifiers || [];
        const verifier = verifiedVerifiers.find(
          v => v.verifierId === verifierId && v.verified === true
        );
        if (!verifier) return false;

        if (proof.revokedAt) return false;

        if (maxAgeMs) {
          const proofTimestamp = proof.createdAt || proof.signedTimestamp || 0;
          const proofAge = now - proofTimestamp;
          if (proofAge > maxAgeMs) return false;
        }

        if (match && typeof match === 'object') {
          const data = verifier.data || {};
          const input = data.input || {};
          const matchObj = Array.isArray(match)
            ? Object.fromEntries(
              match
                .filter((m) => m && m.path && String(m.value ?? '').trim() !== '')
                .map((m) => [String(m.path).trim(), m.value])
            )
            : match;

          for (const [key, expected] of Object.entries(matchObj)) {
            let actualValue = null;

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

            if (actualValue === undefined) {
              const claims = data.claims || {};
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
              } else if (key === 'handle') {
                actualValue = data.handle || data.pseudonymId;
              } else if (key === 'namespace') {
                actualValue =
                  data.namespace !== undefined && data.namespace !== null && data.namespace !== ''
                    ? data.namespace
                    : 'neus';
              } else if (key === 'claims.sanctions_passed') {
                actualValue = claims.sanctions_passed ?? claims.sanctionsPassed;
              } else if (key === 'claims.age_min') {
                actualValue = claims.age_min ?? claims.ageMin;
              } else if (key === 'neusPersonhoodId') {
                actualValue = data.neusPersonhoodId;
              } else if (key === 'riskLevel') {
                actualValue = data.riskLevel;
              } else if (key === 'sanctioned') {
                actualValue = data.sanctioned;
              } else if (key === 'poisoned') {
                actualValue = data.poisoned;
              }
            }

            if (key === 'contentHash' && actualValue === undefined && data.content) {
              try {
                let hash = 0;
                const str = String(data.content);
                for (let i = 0; i < str.length; i++) {
                  const char = str.charCodeAt(i);
                  hash = ((hash << 5) - hash) + char;
                  hash = hash & hash;
                }
                actualValue = `0x${  Math.abs(hash).toString(16).padStart(64, '0').substring(0, 66)}`;
              } catch {
                actualValue = String(data.content);
              }
            }

            let normalizedActual = actualValue;
            let normalizedExpected = expected;

            if (actualValue === undefined || actualValue === null) {
              return false;
            }

            if (typeof actualValue === 'boolean' || (key && (key.includes('sanctions') || key.includes('sanctioned') || key.includes('poisoned')))) {
              const bActual = Boolean(actualValue);
              const bExpected = expected === true || expected === 'true' || String(expected).toLowerCase() === 'true';
              if (bActual !== bExpected) return false;
              continue;
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

  _formatResponse(response) {
    const proofId = response?.data?.proofId ||
                    response?.proofId ||
                    response?.data?.resource?.proofId ||
                    response?.data?.qHash ||
                    response?.qHash ||
                    response?.data?.resource?.qHash ||
                    response?.data?.id;
    const qHash = response?.data?.qHash ||
                  response?.qHash ||
                  response?.data?.resource?.qHash ||
                  proofId ||
                  response?.data?.id;
    const finalProofId = proofId || qHash || null;
    const finalQHash = qHash || proofId || finalProofId;

    const status = response?.data?.status ||
                   response?.status ||
                   response?.data?.resource?.status ||
                   (response?.success ? 'completed' : 'unknown');

    return {
      success: response.success,
      proofId: finalProofId,
      qHash: finalQHash,
      status,
      data: response.data,
      message: response.message,
      timestamp: Date.now(),
      proofUrl: finalProofId ? `${this.baseUrl}/api/v1/proofs/${finalProofId}` : null
    };
  }

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

  _log(message, data = {}) {
    if (this.config.enableLogging) {
      try {
        const prefix = '[neus/sdk]';
        if (data && Object.keys(data).length > 0) {
          console.log(prefix, message, data);
        } else {
          console.log(prefix, message);
        }
      } catch {
      }
    }
  }
}

export { PORTABLE_PROOF_SIGNER_HEADER, constructVerificationMessage };
