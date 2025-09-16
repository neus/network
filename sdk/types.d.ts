/**
 * NEUS SDK TypeScript Definitions
 */

declare module '@neus/sdk' {
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
     * Get verification status by proof ID
     * @param qHash - The proof's unique identifier
     * @param auth - Optional authentication for private proofs
     * @returns Promise resolving to current status
     */
    getStatus(qHash: string, auth?: { signature: string; walletAddress: string }): Promise<StatusResult>;
    
    /**
     * Get private proof status with wallet signature
     * @param qHash - The proof's unique identifier  
     * @param wallet - Wallet provider (window.ethereum or ethers Wallet)
     * @returns Promise resolving to private proof data
     */
    getPrivateStatus(qHash: string, wallet?: any): Promise<StatusResult>;
    
    /**
     * Check API health
     * @returns Promise resolving to health status
     */
    isHealthy(): Promise<boolean>;
    
    /** List available verifiers */
    getVerifiers(): Promise<string[]>;
    
    /**
     * Poll verification status until completion
     * @param qHash - The proof's unique identifier
     * @param options - Polling configuration options
     * @returns Promise resolving to final status
     * @example
     * const finalStatus = await client.pollProofStatus(qHash, {
     *   interval: 3000,
     *   onProgress: (status) => {
     *     // Handle status updates
     *   }
     * });
     */
    pollProofStatus(qHash: string, options?: PollOptions): Promise<StatusResult>;
    
    /** Revoke own proof (owner-signed) */
    revokeOwnProof(qHash: string, wallet?: { address: string }): Promise<boolean>;
  }

  // React widgets have been moved to @neus/widgets package
  
  /**
   * Privacy level options for verification data
   */
  export type PrivacyLevel = 'public' | 'unlisted' | 'private';

  /**
   * Configuration options for NeusClient
   */
  export interface NeusClientConfig {
    /** API endpoint URL (defaults to hosted public API) */
    apiUrl?: string;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Enable debug logging */
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
    /** Force ZK proof generation (requires partner access) */
    forceZK?: boolean;
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

    /** Advanced/manual path: list of verifier IDs (power users only) */
    verifierIds?: VerifierId[];
    /** Advanced/manual path: user's wallet address */
    walletAddress?: string;
    /** Advanced/manual path: EIP-191 signature */
    signature?: string;
    /** Advanced/manual path: signed timestamp */
    signedTimestamp?: number;
    /** Advanced/manual path: chain ID for verification context; optional, managed by protocol */
    chainId?: number;
    /** Auto path: optional wallet instance (browser/provider) */
    wallet?: any;
  }
    
  /**
   * Result from proof creation
   */
  export interface ProofResult {
    /** Unique proof identifier (qHash) */
    qHash: string;
    /** Current status */
    status: string;
    /** Wallet address that created proof */
    walletAddress?: string;
    /** Status check URL */
    statusUrl?: string;
    /** Cross-chain enabled */
    crossChain?: boolean;
  }
  
  /**
   * Verification result
   */
  export interface VerificationResult {
    /** Proof identifier (qHash) */
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
    /** Whether verification succeeded */
    success: boolean;
    /** Current status */
    status: VerificationStatus;
    /** Full verification data */
    data?: {
      qHash: string;
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
        forceZK?: boolean;
        publicDisplay?: boolean;
        storeOriginalContent?: boolean;
        verifierOptions?: object;
        privacyLevel?: 'private' | 'unlisted' | 'public';
        meta?: object;
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
   * Available verifier identifiers (built-in)
   * For custom verifiers, use string type with buildVerificationRequest()
   */
  export type VerifierId = 
    | 'ownership-basic'
    | 'nft-ownership'
    | 'token-holding'
    | 'ownership-licensed'
    | string; // Allow custom verifier IDs
  
  /**
   * Verification status values (canonical PROOF_STATUSES)
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
    chainId: number;
  }): string;
  
  /**
   * Validate Ethereum wallet address
   */
  export function validateWalletAddress(address: string): boolean;
  
  /**
   * Validate timestamp freshness
   */
  export function validateTimestamp(timestamp: number, maxAgeMs?: number): boolean;
  
  /**
   * Validate qHash format
   */
  export function validateQHash(qHash: string): boolean;
  
  /**
   * Normalize wallet address to lowercase
   */
  export function normalizeAddress(address: string): string;

  /**
   * Validate a verifier payload for basic structural integrity
   */
  export function validateVerifierPayload(verifierId: string, data: any): ValidationResult;

  /**
   * Build a canonical verification request and signing message
   */
  export function buildVerificationRequest(params: {
    verifierIds: string[];
    data: any;
    walletAddress: string;
    chainId?: number;
    options?: any;
    signedTimestamp?: number;
  }): { message: string; request: { verifierIds: string[]; data: any; walletAddress: string; signedTimestamp: number; chainId: number; options?: any } };
  
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
    constructor(client: NeusClient, qHash: string, options?: { interval?: number; maxAttempts?: number; exponentialBackoff?: boolean; maxInterval?: number });
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
  
  /**
   * Quick proof verification (convenience)
   */
  export function verifyProof(qHash: string): Promise<StatusResult>;
  
  /**
   * Check proof status (convenience)
   */
  export function checkProofStatus(proofId: string): Promise<StatusResult>;
  
  // IPFS helpers
  export const IPFS_GATEWAY: string;
  export function toIpfsUrl(cid: string): string;
  export function resolveIpfsUrl(cid: string): string;

  
  // ============================================================================
  // CONSTANTS & REGISTRY
  // ============================================================================
  
  /**
   * NEUS Network constants
   */
  export const NEUS_CONSTANTS: {
    HUB_CHAIN_ID: 84532;
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
  // SCHEMA ACCESS
  // ============================================================================
  
  
  
  // ============================================================================
  // INTERNAL TYPES
  // ============================================================================
  
  interface VerifierMetadata {
    id: VerifierId;
    name: string;
    description: string;
    category: string;
    accessLevel: string;
    estimatedDuration: number;
    requiresData: boolean;
    dataSchema?: any;
  }
  
  interface VerificationData {
    content?: string;
    owner: string;
    reference?: {
      type: string;
      id: string;
    };
    [key: string]: any;
  }

  
  
  interface VerifyOptions {
    /** Target chain IDs for cross-chain propagation (testnet chains for proof storage) */
    targetChains?: number[];
    /** Store sanitized snapshot on IPFS */
    enableIpfs?: boolean;
    /** Privacy level for public exposure and IPFS snapshots */
    privacyLevel?: 'private' | 'unlisted' | 'public';
    /** Enable social previews and public UI display (requires privacyLevel=public) */
    publicDisplay?: boolean;
    /** Store original content (enables public access when combined with privacyLevel=public) */
    storeOriginalContent?: boolean;
    /** Metadata for public presentation and licensing */
    meta?: {
      publicTitle?: string;
      contentType?: string;
      contentDescription?: string;
      publicContentLicense?: string;
      publicContentDisclaimer?: string;
      tags?: string[];
      displayName?: string;
    };
    /** Force ZK when supported by verifier (requires partner access) */
    forceZK?: boolean;
    /** Verifier-specific overrides */
    verifierOptions?: Record<string, any>;
    /** Optional user-presentable identity overrides */
    identity?: { pseudonym?: string; socials?: Record<string, string> };
  }
  
  
}