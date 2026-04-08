/**
 * NEUS SDK TypeScript Definitions
 */

declare module '@neus/sdk' {
  /**
   * Minimal EIP-1193 provider interface (browser wallets like MetaMask).
   * The SDK also supports other wallet objects; use this for typing in integrations.
   */
  export interface Eip1193Provider {
    request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
  }

  /**
   * Wallet/provider object accepted by SDK methods that require signing.
   * Prefer passing an EIP-1193 provider in browser environments.
   */
  export type WalletLike = Eip1193Provider | { address?: string } | { getAddress?: () => Promise<string> } | { signMessage?: (message: string) => Promise<string> };

  /**
   * Main NEUS SDK client for creating and verifying proofs
   */
  export class NeusClient {
    constructor(config?: NeusClientConfig);
    
    /**
     * Create verification proof
     * @param params - Verification parameters
     * @returns Promise resolving to verification result
     */
    verify(params: VerifyParams): Promise<VerificationResult>;
    
    /**
     * Get proof record by receipt ID.
     * @param proofId - Proof receipt ID (0x + 64 hex).
     */
    getProof(proofId: string): Promise<StatusResult>;
    
    /**
     * Get private proof record (owner-signed)
     * @param proofId - Proof receipt ID.
     * @param wallet - Optional injected wallet/provider (MetaMask/ethers Wallet)
     */
    getPrivateProof(proofId: string, wallet?: WalletLike | GatePrivateAuth): Promise<StatusResult>;
    
    /**
     * Check API health
     * @returns Promise resolving to health status
     */
    isHealthy(): Promise<boolean>;
    
    /** List available verifiers */
    getVerifiers(): Promise<string[]>;
    
  /**
   * Poll verification status until completion
   * @param proofId - Proof ID to poll.
   * @param options - Polling configuration options
   * @returns Promise resolving to final status
   * @example
   * const finalStatus = await client.pollProofStatus(proofId, {
   *   interval: 3000,
   *   onProgress: (status) => {
   *     // Handle status updates
   *   }
   * });
   */
   pollProofStatus(proofId: string, options?: PollOptions): Promise<StatusResult>;
    
    /** Revoke own proof (owner-signed) */
    revokeOwnProof(proofId: string, wallet?: { address: string }): Promise<boolean>;

    // ═══════════════════════════════════════════════════════════════
    // PROOFS & GATING METHODS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get proofs by wallet address
     * @param walletAddress - Target wallet address
     * @param options - Filter options
     * @returns Promise resolving to proofs result
     */
    getProofsByWallet(walletAddress: string, options?: GetProofsOptions): Promise<ProofsResult>;

    /**
     * Get proofs by wallet or DID (owner access)
     * Requests private proofs using owner signature headers.
     */
    getPrivateProofsByWallet(walletAddress: string, options?: GetProofsOptions, wallet?: WalletLike): Promise<ProofsResult>;

    /**
     * Minimal eligibility check against public + unlisted proofs by default (API-backed).
     * Prefer this for server-side integrations that do not need full proof payloads.
     */
    gateCheck(params: GateCheckApiParams): Promise<GateCheckApiResponse>;

    /**
     * Pre-sign owner auth payload for repeated includePrivate gate checks (single prompt).
     */
    createGatePrivateAuth(params: {
      address: string;
      wallet?: WalletLike;
      chain?: string;
      signatureMethod?: string;
    }): Promise<GatePrivateAuth>;

    /**
     * Evaluate gate requirements against existing proofs
     * Returns whether wallet satisfies all requirements, with missing items listed
     * @param params - Gate check parameters
     * @returns Promise resolving to gate evaluation result
     * @example
     * const result = await client.checkGate({
     *   walletAddress: '0x...',
     *   requirements: [
     *     { verifierId: 'nft-ownership', maxAgeMs: 3600000, match: { contractAddress: '0x...' } },
     *     { verifierId: 'token-holding', maxAgeMs: 3600000, match: { contractAddress: '0x...' } },
     *   ],
     * });
     * if (result.satisfied) { /* allow access *\/ }
     */
    checkGate(params: CheckGateParams): Promise<CheckGateResult>;

  }

  /**
   * Privacy level options for verification data
   */
  export type PrivacyLevel = 'public' | 'private';

  /**
   * Configuration options for NeusClient
   */
  export interface NeusClientConfig {
    /** API endpoint URL (defaults to hosted public API) */
    apiUrl?: string;
    /** Optional API key (server-side only; do not embed in browser apps) */
    apiKey?: string;
    /** Optional public app attribution ID (maps to X-Neus-App) */
    appId?: string;
    /** Optional sponsor capability token (maps to X-Sponsor-Grant) */
    sponsorGrant?: string;
    /** Optional x402 receipt token for retry calls (maps to PAYMENT-SIGNATURE) */
    paymentSignature?: string;
    /** Optional extra passthrough headers for advanced integrations */
    extraHeaders?: Record<string, string>;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Optional chain override used by some app integrations */
    hubChainId?: number;
    /** Enable SDK logging */
    enableLogging?: boolean;
  }

  /**
   * Verification options for privacy and storage control
   */
  export interface VerificationOptions {
    /** Privacy level for verification data */
    privacyLevel?: PrivacyLevel;
    /** Enable IPFS storage for public proofs */
    enableIpfs?: boolean;
    /** Store original content in proof (privacy consideration) */
    storeOriginalContent?: boolean;
    /** Target chains for cross-chain propagation (testnet chains for proof storage) */
    targetChains?: number[];
    /** Allow public display contexts */
    publicDisplay?: boolean;
    /** Metadata for public presentation */
    meta?: Record<string, any>;
    /** Verifier-specific options */
    verifierOptions?: Record<string, any>;
  }
  
  /**
   * Parameters for manual verification
   */
  export interface VerifyParams {
    /** Auto path (recommended): single verifier */
    verifier?: VerifierId;
    /** Auto path: human-readable description */
    content?: string;
    /** Auto path: optional verifier-specific data */
    data?: VerificationData;
    /** Auto path: optional options */
    options?: VerifyOptions;

    /** Advanced/manual path: list of verifier IDs */
    verifierIds?: VerifierId[];
    /** Advanced/manual path: user's wallet address */
    walletAddress?: string;
    /** Advanced/manual path: EIP-191 signature */
    signature?: string;
    /** Advanced/manual path: signed timestamp */
    signedTimestamp?: number;
    /** Advanced/optional. EVM signing-context hint; auto-resolved to protocol hub chain when omitted. For chain-specific asset claims (NFT, token, contract), set chainId inside verifier data instead. */
    chainId?: number;
    /** CAIP-2 chain reference for universal mode (e.g. eip155:1, solana:mainnet) */
    chain?: string;
    /** Signature method hint for universal mode (eip191, ed25519, ...) */
    signatureMethod?: string;
    /** Auto path: optional wallet instance (browser/provider) */
    wallet?: WalletLike;
  }
    
  /**
   * Result from proof creation
   */
  export interface ProofResult {
    /** Proof receipt ID */
    proofId: string;
    /** HTTP wire field for the proof receipt ID. */
    qHash: string;
    /** Current status */
    status: string;
    /** Wallet address that created proof */
    walletAddress?: string;
    /** Stable URL for GET proof record */
    proofUrl?: string;
    /** Cross-chain enabled */
    crossChain?: boolean;
  }
  
  /**
   * Verification result
   */
  export interface VerificationResult {
    /** Proof receipt ID */
    proofId: string;
    /** HTTP wire field for the proof receipt ID. */
    qHash: string;
    /** Current status */
    status: VerificationStatus;
    /** Whether verification succeeded */
    success: boolean;
    /** Verification data */
    data?: VerificationData;
  }
  
  /**
   * Status check result
   */
  export interface StatusResult {
    /** Proof receipt ID */
    proofId?: string;
    /** HTTP wire field for the proof receipt ID. */
    qHash?: string;
    /** Stable URL for GET proof record */
    proofUrl?: string | null;
    /** Whether verification succeeded */
    success: boolean;
    /** Current status */
    status: VerificationStatus;
    /** Full verification data */
    data?: {
      proofId?: string;
      /** HTTP wire field for the proof receipt ID. */
      qHash?: string;
      status: string;
      walletAddress: string;
      verifierIds?: string[];
      targetChains?: number[];
      verifiedVerifiers?: Array<{
        verifierId: string;
        verified: boolean;
        data: any;
        status: string;
        zkInfo?: {
          zkStatus: string;
        };
      }>;
      crosschain?: {
        status: string;
        hubTxHash?: string;
        initiated?: number;
        completed?: number;
        totalChains?: number;
        finalized?: number;
        relayResults?: Record<string, {
          success: boolean;
          transactionHash?: string;
          completedAt?: number;
          chainId: number;
          status: string;
          gasUsed?: string;
          blockNumber?: string;
          voucherId?: string;
        }>;
        createdVouchers?: string[];
      };
      hubTransaction?: {
        txHash: string;
        timestamp: number;
        chainId: number;
        status: string;
      };
      ipfs?: {
        cid: string;
        gateway: string;
        createdAt: number;
        size: number;
      };
      options?: {
        enableIpfs?: boolean;
        publicDisplay?: boolean;
        storeOriginalContent?: boolean;
        verifierOptions?: object;
        privacyLevel?: 'private' | 'public';
        meta?: object;
      };
      meta?: {
        privacyLevel: 'private' | 'public';
        publiclyAccessible: boolean;
      };
      createdAt?: number;
      completedAt?: number;
      lastUpdated?: number;
    };
  }
  
  /**
   * Polling options for status monitoring
   */
  export interface PollOptions {
    /** Polling interval in milliseconds (default: 5000) */
    interval?: number;
    /** Total timeout in milliseconds (default: 120000) */
    timeout?: number;
    /** Progress callback function */
    onProgress?: (status: any) => void;
  }
  
  /**
   * Validation result for verifier data
   */
  export interface ValidationResult {
    /** Whether validation passed */
    valid: boolean;
    /** Error message if validation failed */
    error?: string;
    /** Missing required fields */
    missing?: string[];
    /** Validation warnings */
    warnings?: string[];
  }
  
  /**
   * Core verifier identifiers
   * Built-in verifier identifiers
   */
  export type CoreVerifierId =
    // Public verifiers (auto-path via verify())
    | 'ownership-basic'
    | 'ownership-social'       // Hosted OAuth social ownership
    | 'ownership-pseudonym'    // Pseudonymous identity verification
    | 'ownership-org-oauth'    // Hosted OAuth organization ownership
    | 'nft-ownership'
    | 'token-holding'
    | 'ownership-dns-txt'
    | 'wallet-link'
    | 'contract-ownership'
    | 'wallet-risk'            // Wallet risk assessment
    | 'proof-of-human'         // Hosted ZK personhood verification
    // AI & Agent verifiers (portable, protocol-agnostic)
    | 'agent-identity'
    | 'agent-delegation'
    | 'ai-content-moderation'
    | string; // Allow custom verifier IDs

  /**
   * Available verifier identifiers (built-in)
   * Alias for CoreVerifierId - use CoreVerifierId for type safety
   * For custom verifiers, use string type with buildVerificationRequest()
   */
  export type VerifierId = CoreVerifierId;
  
  /**
   * Verification status values (standard PROOF_STATUSES)
   */
  export type VerificationStatus =
    | 'processing_verifiers'
    | 'processing_zk_proofs'
    | 'verified'
    | 'verified_no_verifiers'
    | 'verified_crosschain_initiated'
    | 'verified_crosschain_propagating'
    | 'verified_crosschain_propagated'
    | 'partially_verified'
    | 'verified_propagation_failed'
    | 'rejected'
    | 'rejected_verifier_failure'
    | 'rejected_zk_initiation_failure'
    | 'error_processing_exception'
    | 'error_initialization'
    | 'error_storage_unavailable'
    | 'error_storage_query'
    | 'not_found';
  
  // ============================================================================
  // UTILITY EXPORTS
  // ============================================================================
  
  /**
   * Construct verification message for manual signing
   */
  export function constructVerificationMessage(params: {
    walletAddress: string;
    signedTimestamp: number;
    data: any;
    verifierIds: VerifierId[];
    chainId?: number;
    chain?: string;
  }): string;
  
  /**
   * Validate Ethereum wallet address
   */
  export function validateWalletAddress(address: string): boolean;

  /**
   * Validate universal wallet address format (EVM/non-EVM).
   */
  export function validateUniversalAddress(address: string, chain?: string): boolean;
  
  /**
   * Validate timestamp freshness
   */
  export function validateTimestamp(timestamp: number, maxAgeMs?: number): boolean;
  
  /**
   * Validate Proof ID format (`qHash` wire alias)
   */
  export function validateQHash(qHash: string): boolean;
  
  /**
   * Normalize wallet address to lowercase
   */
  export function normalizeAddress(address: string): string;

  /**
   * Resolve DID from wallet identity via profile resolver endpoint.
   * EVM wallets auto-resolve to the protocol hub chain; chainId is optional.
   * Use `chain` (CAIP-2) for non-EVM wallets (e.g. `solana:mainnet`).
   */
  export function resolveDID(
    params: {
      walletAddress?: string;
      chainId?: number;
      chain?: string;
    },
    options?: {
      endpoint?: string;
      apiUrl?: string;
      credentials?: 'omit' | 'same-origin' | 'include';
      headers?: Record<string, string>;
    }
  ): Promise<{
    did: string;
    data: unknown;
    raw: unknown;
  }>;

  /**
   * Build a server-standardized signing payload.
   */
  export function standardizeVerificationRequest(
    params: Record<string, any>,
    options?: {
      endpoint?: string;
      apiUrl?: string;
      credentials?: 'omit' | 'same-origin' | 'include';
      headers?: Record<string, string>;
    }
  ): Promise<any>;

  /**
   * Resolve ZK Passport default configuration.
   */
  export function resolveZkPassportConfig(overrides?: Record<string, any>): {
    provider: string;
    scope: string;
    checkSanctions: boolean;
    requireFaceMatch: boolean;
    faceMatchMode: string;
    [key: string]: any;
  };

  /**
   * Convert a UTF-8 message string to a 0x-prefixed hex payload.
   */
  export function toHexUtf8(message: string): string;

  /**
   * Sign a message with an injected/provider wallet.
   * Uses `personal_sign` and retries with UTF-8 hex payloads when providers
   * report encoding/non-hex input issues (common with some embedded wallets).
   */
  export function signMessage(params: {
    provider?: any;
    message: string;
    walletAddress?: string;
    chain?: string;
  }): Promise<string>;

  /**
   * Validate a verifier payload for basic structural integrity
   */
  export function validateVerifierPayload(verifierId: string, data: any): ValidationResult;

  /**
   * Build a standard verification request and signing message
   */
  export function buildVerificationRequest(params: {
    verifierIds: string[];
    data: any;
    walletAddress: string;
    chainId?: number;
    chain?: string;
    options?: any;
    signedTimestamp?: number;
  }): { message: string; request: { verifierIds: string[]; data: any; walletAddress: string; signedTimestamp: number; chainId?: number; chain?: string; options?: any } };
  
  /**
   * Check if status is terminal (complete)
   */
  export function isTerminalStatus(status: VerificationStatus): boolean;
  
  /**
   * Check if status indicates success
   */
  export function isSuccessStatus(status: VerificationStatus): boolean;
  
  /**
   * Check if status indicates failure
   */
  export function isFailureStatus(status: VerificationStatus): boolean;
  
  /**
   * Format status for display
   */
  export function formatVerificationStatus(status: VerificationStatus): {
    label: string;
    description: string;
    color: string;
    category: string;
  };
  
  /**
   * Status polling utility
   */
  export class StatusPoller {
    constructor(client: NeusClient, proofId: string, options?: { interval?: number; maxAttempts?: number; exponentialBackoff?: boolean; maxInterval?: number });
    poll(): Promise<StatusResult>;
  }
  
  /**
   * Format timestamp to human readable string
   */
  export function formatTimestamp(timestamp: number): string;
  
  /**
   * Check if chain ID is supported for cross-chain propagation
   */
  export function isSupportedChain(chainId: number): boolean;
  
  /**
   * Create a delay/sleep function
   */
  export function delay(ms: number): Promise<void>;
  
  /**
   * Retry utility with exponential backoff
   */
  export function withRetry<T>(fn: () => Promise<T>, options?: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  }): Promise<T>;
  
  // ============================================================================
  // CONSTANTS & REGISTRY
  // ============================================================================

  /**
   * Build `agent-delegation` maxSpend from a display decimal (e.g. USDC `"100.50"` with six decimal places).
   * Returns a whole-number string in token base units (no decimal point) for the verifier API.
   */
  export function toAgentDelegationMaxSpend(
    humanAmount: string | number,
    decimals: number
  ): string;
  
  /**
   * NEUS Network constants
   */
  export const DEFAULT_HOSTED_VERIFY_URL: string;

  export function getHostedCheckoutUrl(opts?: {
    gateId?: string;
    returnUrl?: string;
    verifiers?: string[];
    preset?: string;
    mode?: string;
    intent?: string;
    origin?: string;
    oauthProvider?: string;
    baseUrl?: string;
  }): string;

  export const NEUS_CONSTANTS: {
    HUB_CHAIN_ID: number;
    TESTNET_CHAINS: number[];
    API_BASE_URL: string;
    API_VERSION: string;
    SIGNATURE_MAX_AGE_MS: number;
    REQUEST_TIMEOUT_MS: number;
    DEFAULT_VERIFIERS: VerifierId[];
  };
  
  // ============================================================================
  // ERROR CLASSES
  // ============================================================================
  
  /**
   * Base SDK error class
   */
  export class SDKError extends Error {
    code: string;
    details: any;
  }
  
  /**
   * API error class
   */
  export class ApiError extends SDKError {
    statusCode: number;
    response: any;
  }
  
  /**
   * Validation error class
   */
  export class ValidationError extends SDKError {
    field?: string;
    value?: any;
  }
  
  /**
   * Network error class
   */
  export class NetworkError extends SDKError {
    originalError?: Error;
  }
  
  /**
   * Configuration error class
   */
  export class ConfigurationError extends SDKError {
    configKey?: string;
  }
  
  /**
   * Verification error class
   */
  export class VerificationError extends SDKError {
    verifierId?: string;
  }
  
  /**
   * Authentication error class
   */
  export class AuthenticationError extends SDKError {}
  
  // ============================================================================
  // PROOFS & GATING TYPES
  // ============================================================================

  /**
   * Options for getProofsByWallet
   */
  export interface GetProofsOptions {
    /** Limit results */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
    /** CAIP-2 signer chain for owner-signed private access (non-EVM) */
    chain?: string;
    /** Signature method hint for owner-signed private access (eip191, ed25519, ...) */
    signatureMethod?: string;
  }

  /**
   * Result from getProofsByWallet
   */
  export interface ProofsResult {
    success: boolean;
    proofs: any[];
    totalCount: number;
    hasMore: boolean;
    nextOffset?: number | null;
  }

  /**
   * Single gate requirement
   */
  export interface GateRequirement {
    /** Verifier ID */
    verifierId: CoreVerifierId;
    /** Maximum age for proof (ms) - if set, proof older than this is expired */
    maxAgeMs?: number;
    /** Is this requirement optional? */
    optional?: boolean;
    /** Minimum count of proofs with this verifier (default: 1) */
    minCount?: number;
    /** Verifier-specific match criteria */
    match?: Record<string, any>;
  }

  /**
   * Parameters for checkGate
   */
  export interface CheckGateParams {
    /** Wallet address to check */
    walletAddress: string;
    /** Gate requirements */
    requirements: GateRequirement[];
    /** Pre-fetched proofs (skip API call) */
    proofs?: any[];
  }

  /**
   * Result from checkGate
   */
  export interface CheckGateResult {
    /** All requirements satisfied? */
    satisfied: boolean;
    /** Requirements not met (missing or expired) */
    missing: GateRequirement[];
    /** Existing proofs keyed by verifierId */
    existing: Record<string, any>;
    /** All proofs evaluated */
    allProofs: any[];
  }

  /**
   * Parameters for gateCheck() (API-backed).
   * Mirrors `GET /api/v1/proofs/check` query parameters.
   */
  export interface GateCheckApiParams {
    /** Wallet identity to check (EVM/Solana/NEAR) */
    address: string;
    /** Verifier IDs to match (array or comma-separated string) */
    verifierIds?: string[] | string;
    /** Require all verifierIds to be present on a single proof */
    requireAll?: boolean;
    /** Minimum number of matching proofs (default: 1) */
    minCount?: number;
    /** Optional time window in days */
    sinceDays?: number;
    /** Optional unix timestamp in milliseconds (lower bound) */
    since?: number;
    /** Max rows to scan (server may clamp) */
    limit?: number;
    /** Include private proofs for owner/controller-authorized checks */
    includePrivate?: boolean;
    /** Include matched qHashes in response (minimal identifiers only) */
    includeQHashes?: boolean;
    /** Optional wallet/provider used to sign includePrivate owner checks */
    wallet?: WalletLike;
    /** CAIP-2 signer chain for universal owner signatures (e.g. solana:mainnet) */
    chain?: string;
    /** Signature method hint for universal owner signatures (eip191, ed25519, ...) */
    signatureMethod?: string;
    /** Optional pre-signed owner auth payload to reuse across multiple gateCheck calls */
    privateAuth?: GatePrivateAuth;

    // Common match filters
    referenceType?: string;
    referenceId?: string;
    tag?: string;
    tags?: string[] | string;
    contentType?: string;
    content?: string;
    contentHash?: string;

    // Asset/ownership filters — chainId here is the chain where the asset lives (e.g. 8453 for Base, 1 for Ethereum)
    contractAddress?: string;
    tokenId?: string;
    /** EVM chain ID of the asset (e.g. 1, 8453). Required for nft-ownership, token-holding, contract-ownership. */
    chainId?: number;
    domain?: string;
    minBalance?: string;

    // Wallet filters
    /** Risk assessment provider hint. Known value: webacy. */
    provider?: string;
    ownerAddress?: string;
    riskLevel?: string;
    sanctioned?: boolean;
    poisoned?: boolean;
    primaryWalletAddress?: string;
    secondaryWalletAddress?: string;
    verificationMethod?: string;
  }

  export interface GatePrivateAuth {
    walletAddress: string;
    signature: string;
    signedTimestamp: number;
    chain?: string;
    signatureMethod?: string;
  }

  export interface GateCheckApiResponse {
    success: boolean;
    data?: {
      eligible: boolean;
      matchedCount?: number;
      matchedQHashes?: string[];
      /** @deprecated matchedProofIds is a compatibility alias of matchedQHashes (same values when provided). */
      matchedProofIds?: string[];
      matchedTags?: string[];
      projections?: Array<Record<string, any>> | null;
      criteria?: Record<string, any>;
    };
    error?: any;
  }


  export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: any;
    status?: string;
    timestamp?: number;
  }

  // ============================================================================
  // GATE RECIPE EXPORTS (Examples, NOT defaults)
  // ============================================================================

  /** Time constant: 1 hour in milliseconds */
  export const HOUR: number;
  /** Time constant: 1 day in milliseconds */
  export const DAY: number;
  /** Time constant: 1 week in milliseconds */
  export const WEEK: number;
  /** Time constant: 1 month (30 days) in milliseconds */
  export const MONTH: number;
  /** Time constant: 1 year (365 days) in milliseconds */
  export const YEAR: number;

  /** NFT holder gate (add match.contractAddress when using) */
  export const GATE_NFT_HOLDER: GateRequirement[];
  /** Token holder gate (add match.contractAddress, minBalance when using) */
  export const GATE_TOKEN_HOLDER: GateRequirement[];
  /** Contract admin gate: requires recent contract ownership (1h TTL) */
  export const GATE_CONTRACT_ADMIN: GateRequirement[];
  /** Domain owner gate: requires DNS TXT verification */
  export const GATE_DOMAIN_OWNER: GateRequirement[];
  /** Linked wallets gate: requires wallet linking */
  export const GATE_LINKED_WALLETS: GateRequirement[];
  /** Agent identity gate: requires verified agent identity */
  export const GATE_AGENT_IDENTITY: GateRequirement[];
  /** Agent delegation gate: requires delegation proof (7-day TTL) */
  export const GATE_AGENT_DELEGATION: GateRequirement[];
  /** Content moderation gate: requires recent moderation proof */
  export const GATE_CONTENT_MODERATION: GateRequirement[];
  /** Wallet risk gate: provider-backed risk signal */
  export const GATE_WALLET_RISK: GateRequirement[];
  /** Pseudonym gate: requires pseudonymous identity proof */
  export const GATE_PSEUDONYM: GateRequirement[];

  /**
   * Create a custom gate from verifier IDs or requirement objects
   * @param requirements - Array of verifier IDs or requirement objects
   */
  export function createGate(
    requirements: Array<CoreVerifierId | GateRequirement>
  ): GateRequirement[];

  /**
   * Combine multiple gates (union of requirements)
   * @param gates - Gate arrays to combine
   */
  export function combineGates(
    ...gates: GateRequirement[][]
  ): GateRequirement[];

  // ============================================================================
  // SUPPORTING TYPES
  // ============================================================================
  
  type OwnershipBasicData = {
    owner: string;
    content?: string;
    contentHash?: string;
    contentType?: string;
    reference?: {
      type:
        | 'ipfs'
        | 'ipfs-hash'
        | 'url'
        | 'license-nft'
        | 'contract'
        | 'qhash'
        | 'ethereum-tx'
        | 'on-chain-tx'
        | 'tx'
        | 'file'
        | 'doc'
        | 'media'
        | 'username-claim'
        | 'other';
      id?: string;
      title?: string;
      description?: string;
      mime?: string;
      name?: string;
      size?: number;
    };
    provenance?: {
      declaredKind?: 'human' | 'ai' | 'mixed' | 'unknown';
      aiContext?: {
        generatorType?: 'local' | 'saas' | 'agent';
        provider?: string;
        model?: string;
        runId?: string;
      };
    };
    [key: string]: any;
  };

  type OwnershipPseudonymData = {
    pseudonymId: string;
    namespace?: string;
    displayName?: string;
    metadata?: Record<string, any>;
    [key: string]: any;
  };

  type OwnershipDnsTxtData = {
    domain: string;
    walletAddress?: string;
    [key: string]: any;
  };

  type ContractOwnershipData = {
    contractAddress: string;
    chainId: number;
    walletAddress?: string;
    method?: 'owner' | 'admin' | 'accessControl';
    [key: string]: any;
  };

  type NftOwnershipData = {
    ownerAddress?: string;
    contractAddress: string;
    tokenId: string;
    tokenType?: 'erc721' | 'erc1155';
    chainId: number;
    blockNumber?: number;
    [key: string]: any;
  };

  type TokenHoldingData = {
    ownerAddress?: string;
    contractAddress: string;
    minBalance: string;
    chainId: number;
    blockNumber?: number;
    [key: string]: any;
  };

  type WalletRiskData = {
    /** Risk assessment provider hint. Known value: webacy. */
    provider?: string;
    walletAddress?: string;
    chainId?: number;
    includeDetails?: boolean;
    [key: string]: any;
  };

  type WalletLinkData = {
    primaryWalletAddress: string;
    secondaryWalletAddress: string;
    signature: string;
    chain: string;
    signatureMethod: string;
    signedTimestamp: number;
    relationshipType?: 'primary' | 'personal' | 'org' | 'affiliate' | 'agent' | 'linked';
    label?: string;
    [key: string]: any;
  };

  type AiContentModerationData = {
    content: string;
    contentType:
      | 'image/jpeg'
      | 'image/png'
      | 'image/webp'
      | 'image/gif'
      | 'text/plain'
      | 'text/markdown'
      | 'text/x-markdown'
      | 'application/json'
      | 'application/xml';
    provider?: 'google-vision' | 'google-perspective';
    [key: string]: any;
  };

  type AgentIdentityData = {
    agentId: string;
    agentWallet: string;
    agentLabel?: string;
    agentType?: 'ai' | 'bot' | 'service' | 'automation' | 'agent';
    description?: string;
    capabilities?: any[];
    instructions?: string;
    skills?: string[];
    services?: Array<{
      name: string;
      endpoint: string;
      version?: string;
    }>;
    [key: string]: any;
  };

  type AgentDelegationData = {
    controllerWallet: string;
    agentWallet: string;
    agentId?: string;
    scope?: string;
    permissions?: any[];
    /** Whole-number string, token base units (1–78 digits, no decimal point). Build via `toAgentDelegationMaxSpend`. */
    maxSpend?: string;
    allowedPaymentTypes?: string[];
    receiptDisclosure?: 'none' | 'summary' | 'full';
    expiresAt?: number;
    instructions?: string;
    skills?: string[];
    [key: string]: any;
  };

  type CoreVerificationData =
    | OwnershipBasicData
    | OwnershipPseudonymData
    | OwnershipDnsTxtData
    | ContractOwnershipData
    | NftOwnershipData
    | TokenHoldingData
    | WalletRiskData
    | WalletLinkData
    | AiContentModerationData
    | AgentIdentityData
    | AgentDelegationData;

  type VerificationData =
    | CoreVerificationData
    | Record<string, CoreVerificationData>
    | Record<string, any>;

  
  
  interface VerifyOptions {
    /** Target chain IDs for cross-chain propagation (testnet chains for proof storage) */
    targetChains?: number[];
    /** Store sanitized snapshot on IPFS */
    enableIpfs?: boolean;
    /** Privacy level for public exposure and IPFS snapshots */
    privacyLevel?: 'private' | 'public';
    /** Allow public display contexts (UI showcases) */
    publicDisplay?: boolean;
    /** Include full original content in IPFS snapshot (only when privacy is public) */
    storeOriginalContent?: boolean;
    /** Metadata for public presentation, attribution, and discovery */
    meta?: {
      // Core display
      title?: string;
      description?: string;
      displayName?: string;
      contentText?: string;
      // Content metadata
      contentType?: string;
      contentDescription?: string;
      // Legal & licensing
      license?: string;
      publicContentLicense?: string;
      publicContentDisclaimer?: string;
      legal?: string;
      // Attribution & campaigns
      source?: string;
      campaign?: string;
      // Categorization
      tags?: string[];
      category?: string;
    };
    /** Reference to external content or file */
    reference?: {
      type:
        | 'ipfs'
        | 'ipfs-hash'
        | 'url'
        | 'license-nft'
        | 'contract'
        | 'qhash'
        | 'ethereum-tx'
        | 'on-chain-tx'
        | 'tx'
        | 'file'
        | 'doc'
        | 'media'
        | 'username-claim'
        | 'other';
      /** Optional reference identifier (required only for reference-only proofs). */
      id?: string;
      title?: string;
      description?: string;
      mime?: string;
      name?: string;
      size?: number;
    };
    /** Verifier-specific overrides */
    verifierOptions?: Record<string, any>;
    /** Optional user-presentable identity overrides */
    identity?: { pseudonym?: string; socials?: Record<string, string> };
  }
  
  
}

declare module '@neus/sdk/widgets' {
  export interface VerifyGateProps {
    /** Array of verifier IDs required for access */
    requiredVerifiers?: string[];
    /** Callback when verification completes successfully */
    onVerified?: (result: {
      proofId: string;
      /** HTTP wire field for the proof receipt ID. */
      qHash: string;
      proofIds?: string[];
      /** HTTP wire fields for proof receipt IDs. */
      qHashes?: string[];
      address?: string;
      txHash?: string | null;
      verifierIds: string[];
      verifiedVerifiers?: any[];
      proofUrl?: string | null;
      existing?: boolean;
      eligible?: boolean;
      mode?: 'create' | 'access';
      data?: any;
      results?: Array<{
        verifierId: string;
        proofId: string;
        /** HTTP wire field for the proof receipt ID. */
        qHash: string;
        address?: string;
        txHash?: string | null;
        verifiedVerifiers?: any[];
        proofUrl?: string | null;
      }>;
      proofsByVerifierId?: Record<string, any>;
    }) => void;
    /** Custom API endpoint URL */
    apiUrl?: string;
    /** Optional public app attribution ID (maps to X-Neus-App) */
    appId?: string;
    /** Optional sponsor capability token (maps to X-Sponsor-Grant) */
    sponsorGrant?: string;
    /** Optional x402 receipt token for retry calls (maps to PAYMENT-SIGNATURE) */
    paymentSignature?: string;
    /** Optional extra passthrough headers for advanced integrations */
    extraHeaders?: Record<string, string>;
    /** Hosted checkout URL for interactive verifiers (default: https://neus.network/verify) */
    hostedCheckoutUrl?: string;
    /** Optional OAuth provider id to pre-select for social/org verifiers (hosted flow) */
    oauthProvider?: string;
    /** Custom inline styles */
    style?: Record<string, any>;
    /** Child content to show when verified */
    children?: any;
    /** Verifier-specific options */
    verifierOptions?: Record<string, any>;
    /** Pre-built verifier data for each verifier */
    verifierData?: Record<string, any>;
    /** Proof creation options (defaults: private, publicDisplay false, storeOriginalContent true) */
    proofOptions?: Record<string, any>;
    /** Proof reuse strategy */
    strategy?: 'reuse-or-create' | 'reuse' | 'fresh';
    /** Check for existing proofs before verification */
    checkExisting?: boolean;
    /** Optional max age override (ms) for proof reuse */
    maxProofAgeMs?: number;
    /** Allow owner-signed lookups for private proof reuse */
    allowPrivateReuse?: boolean;
    /** Show NEUS branding */
    showBrand?: boolean;
    /** Disable interaction */
    disabled?: boolean;
    /** Custom button text */
    buttonText?: string;
    /** Mode: 'create' for new verification, 'access' for private proof access */
    mode?: 'create' | 'access';
    /** proofId for private proof access (required when mode='access') */
    proofId?: string | null;
    /** HTTP wire field for callers that receive API-shaped proof records. */
    qHash?: string | null;
    /** Optional injected wallet/provider for signing flows */
    wallet?: WalletLike | any;
    /** Optional CAIP-2 chain context for non-EVM owner signatures */
    chain?: string;
    /** Optional signature method hint for non-EVM owner signatures */
    signatureMethod?: string;
    /** Callback for state changes */
    onStateChange?: (state: string) => void;
    /** Callback for errors */
    onError?: (error: Error) => void;
  }

  export function VerifyGate(props: VerifyGateProps): any;

  export interface ProofBadgeProps {
    /** Proof receipt ID. */
    proofId?: string;
    /** HTTP wire field for callers that receive API-shaped proof records. Prefer proofId. */
    qHash?: string;
    /** URL path pattern for proof links. Supports :proofId. */
    proofUrlPattern?: string;
    /** Badge size */
    size?: 'sm' | 'md';
    /** UI platform base URL */
    uiLinkBase?: string;
    /** API base URL for status fetching */
    apiUrl?: string;
    /** Optional proof object to skip API fetch */
    proof?: any;
    /** Show chain count */
    showChains?: boolean;
    /** Show status label (default: true) */
    showLabel?: boolean;
    /** Logo URL override (defaults to bundled NEUS logo) */
    logoUrl?: string;
    /** Custom click handler */
    onClick?: (data: { proofId: string; qHash: string; status: string; chainCount?: number }) => void;
    /** Additional CSS class */
    className?: string;
  }

  export function ProofBadge(props: ProofBadgeProps): any;

  export interface SimpleProofBadgeProps {
    proofId?: string;
    /** HTTP wire field for callers that receive API-shaped proof records. Prefer proofId. */
    qHash?: string;
    /** URL path pattern for proof links. Supports :proofId. */
    proofUrlPattern?: string;
    uiLinkBase?: string;
    apiUrl?: string;
    size?: 'sm' | 'md';
    /** Label text (default: 'Verified') */
    label?: string;
    /** Logo URL override (defaults to bundled NEUS logo) */
    logoUrl?: string;
    proof?: any;
    onClick?: (data: { proofId: string; qHash: string; status: string }) => void;
    className?: string;
  }

  export function SimpleProofBadge(props: SimpleProofBadgeProps): any;

  export interface NeusPillLinkProps {
    proofId?: string;
    /** HTTP wire field for callers that receive API-shaped proof records. Prefer proofId. */
    qHash?: string;
    /** URL path pattern for proof links. Supports :proofId. */
    proofUrlPattern?: string;
    uiLinkBase?: string;
    label?: string;
    size?: 'sm' | 'md';
    /** Logo URL override (defaults to bundled NEUS logo) */
    logoUrl?: string;
    onClick?: (data: { proofId?: string; qHash?: string }) => void;
    className?: string;
  }

  export function NeusPillLink(props: NeusPillLinkProps): any;

  export interface VerifiedIconProps {
    /** Proof receipt ID for link */
    proofId?: string;
    /** HTTP wire field for callers that receive API-shaped proof records. Prefer proofId. */
    qHash?: string;
    /** URL path pattern for proof links. Supports :proofId. */
    proofUrlPattern?: string;
    /** UI platform base URL */
    uiLinkBase?: string;
    /** Icon size in pixels */
    size?: number;
    /** Logo URL override (defaults to bundled NEUS logo) */
    logoUrl?: string;
    /** Tooltip text */
    tooltip?: string;
    /** Custom click handler */
    onClick?: (data: { proofId?: string; qHash?: string }) => void;
    /** Additional CSS class */
    className?: string;
  }

  export function VerifiedIcon(props: VerifiedIconProps): any;
}

declare module '@neus/sdk/widgets/verify-gate' {
  export * from '@neus/sdk/widgets';
}

declare module '@neus/sdk/client' {
  export { NeusClient } from '@neus/sdk';
}
