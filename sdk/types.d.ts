declare module '@neus/sdk' {
  export interface Eip1193Provider {
    request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
  }

  export type WalletLike = Eip1193Provider | { address?: string } | { getAddress?: () => Promise<string> } | { signMessage?: (message: string) => Promise<string> };

  export class NeusClient {
    constructor(config?: NeusClientConfig);

    verifyFromApp(params: VerifyFromAppParams): Promise<VerificationResult>;

    verify(params: VerifyParams): Promise<VerificationResult>;
    
    getProof(qHash: string): Promise<StatusResult>;

    getPrivateProof(qHash: string, wallet?: WalletLike | GatePrivateAuth): Promise<StatusResult>;
    
    isHealthy(): Promise<boolean>;
    
    getVerifiers(): Promise<string[]>;

    getVerifierCatalog(): Promise<VerifierCatalog>;

    createWalletLinkData(params: {
      primaryWalletAddress: string;
      secondaryWalletAddress: string;
      wallet?: WalletLike;
      chain?: string;
      signedTimestamp?: number;
      relationshipType?: 'primary' | 'personal' | 'org' | 'affiliate' | 'agent' | 'linked';
      label?: string;
    }): Promise<WalletLinkData>;

    pollProofStatus(qHash: string, options?: PollOptions): Promise<StatusResult>;

    revokeOwnProof(qHash: string, wallet?: { address: string }): Promise<boolean>;

    getProofsByWallet(walletAddress: string, options?: GetProofsOptions): Promise<ProofsResult>;

    getPrivateProofsByWallet(walletAddress: string, options?: GetProofsOptions, wallet?: WalletLike): Promise<ProofsResult>;

    gateCheck(params: GateCheckApiParams): Promise<GateCheckApiResponse>;

    createGatePrivateAuth(params: {
      address: string;
      wallet?: WalletLike;
      chain?: string;
      signatureMethod?: string;
    }): Promise<GatePrivateAuth>;

    checkGate(params: CheckGateParams): Promise<CheckGateResult>;

    /** Public gate snapshot (requirements, charge, schedule — never the secret reward value). */
    getGate(gateId: string): Promise<PublicGateSnapshot>;

    /** Post-verify reward delivery for hosted gate checkout (session or wallet-bound). */
    fulfillGate(params: FulfillGateParams): Promise<GateFulfillmentResponse>;

  }

  export type PrivacyLevel = 'public' | 'private';

  export interface NeusClientConfig {
    apiUrl?: string;
    /** Optional server profile key; MCP/CI only. Not required for VerifyGate or gateCheck. */
    apiKey?: string;
    /** Public app attribution id (non-secret). */
    appId?: string;
    /** Advanced server/app sponsor wallet. Published gate checkout resolves billing from gateId. */
    billingWallet?: string;
    /** Alias for billingWallet. */
    sponsorOrgWallet?: string;
    orgWallet?: string;
    /** Site origin used when issuing billing authorization (defaults to browser origin). */
    appOrigin?: string;
    /** Advanced server path only; not required for published gate checkout. */
    appLinkQHash?: string;
    paymentSignature?: string;
    extraHeaders?: Record<string, string>;
    timeout?: number;
    hubChainId?: number;
    enableLogging?: boolean;
  }

  export interface FetchSponsorGrantParams {
    apiUrl?: string;
    appId: string;
    orgWallet: string;
    verifierIds?: string[];
    targetChains?: number[];
    origin?: string;
    expiresInSeconds?: number;
  }

  export interface FetchSponsorGrantResult {
    sponsorGrant: string;
    exp?: number;
    orgWallet: string;
    appId: string;
    maxCredits?: number;
  }

  export function fetchSponsorGrant(params: FetchSponsorGrantParams): Promise<FetchSponsorGrantResult>;

  export interface VerificationOptions {
    privacyLevel?: PrivacyLevel;
    enableIpfs?: boolean;
    storeOriginalContent?: boolean;
    targetChains?: number[];
    /** Anchor the receipt on the hub registry chain. Defaults to false (receipts persist offchain). */
    publishToHub?: boolean;
    publicDisplay?: boolean;
    meta?: Record<string, any>;
    verifierOptions?: Record<string, any>;
  }

  export interface VerifierCatalogMetadataEntry {
    category?: string;
    description?: string;
    accessLevel?: 'public' | 'pro' | 'custom' | 'admin' | string;
    flowType?: 'instant' | 'interactive' | 'external_lookup' | string;
    expiryType?: 'permanent' | 'point_in_time' | 'expiring' | string;
    allowsDelegatedSubject?: boolean;
    compatibleWith?: string[];
    conflictsWith?: string[];
    supportsDirectApi?: boolean;
    supportsHostedVerify?: boolean;
    dataSchema?: Record<string, any>;
    requiredFields?: string[];
    optionalFields?: string[];
  }

  export interface VerifierCatalog {
    data: string[];
    metadata: Record<string, VerifierCatalogMetadataEntry>;
    meta?: Record<string, any>;
  }
  
  export interface VerifyFromAppParams {
    user: {
      walletAddress?: string;
      address?: string;
      identity?: string;
    };
    verifier?: VerifierId;
    content?: string | Record<string, any>;
    data?: VerificationData;
    options?: VerifyOptions;
  }

  export interface VerifyParams {
    verifier?: VerifierId;
    content?: string;
    data?: VerificationData;
    options?: VerifyOptions;

    verifierIds?: VerifierId[];
    walletAddress?: string;
    signature?: string;
    signedTimestamp?: number;
    chainId?: number;
    chain?: string;
    signatureMethod?: string;
    delegationQHash?: string;
    wallet?: WalletLike;
  }
    
  export interface ProofResult {
    qHash: string;
    status: string;
    walletAddress?: string;
    proofUrl?: string;
    crossChain?: boolean;
  }

  export interface VerificationResult {
    qHash: string;
    status: VerificationStatus;
    success: boolean;
    data?: VerificationData;
  }
  
  export interface StatusResult {
    qHash?: string;
    proofUrl?: string | null;
    success: boolean;
    status: VerificationStatus;
    data?: {
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
  
  export interface PollOptions {
    interval?: number;
    timeout?: number;
    onProgress?: (status: any) => void;
  }
  
  export interface ValidationResult {
    valid: boolean;
    error?: string;
    missing?: string[];
    warnings?: string[];
  }
  
  export type CoreVerifierId =
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
    | 'agent-identity'
    | 'agent-delegation'
    | 'ai-content-moderation'
    | string; // Allow custom verifier IDs

  export type VerifierId = CoreVerifierId;
  
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
  
  
  export function constructVerificationMessage(params: {
    walletAddress: string;
    signedTimestamp: number;
    data: any;
    verifierIds: VerifierId[];
    chainId?: number;
    chain?: string;
  }): string;

  export const PORTABLE_PROOF_SIGNER_HEADER: string;
  
  export function validateWalletAddress(address: string): boolean;

  export function validateUniversalAddress(address: string, chain?: string): boolean;
  
  export function validateTimestamp(timestamp: number, maxAgeMs?: number): boolean;
  
  export function validateQHash(qHash: string): boolean;
  
  export function normalizeAddress(address: string): string;

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

  export function standardizeVerificationRequest(
    params: Record<string, any>,
    options?: {
      endpoint?: string;
      apiUrl?: string;
      credentials?: 'omit' | 'same-origin' | 'include';
      headers?: Record<string, string>;
    }
  ): Promise<any>;

  export function resolveZkPassportConfig(overrides?: Record<string, any>): {
    provider: string;
    scope: string;
    checkSanctions: boolean;
    requireFaceMatch: boolean;
    faceMatchMode: string;
    [key: string]: any;
  };

  export function toHexUtf8(message: string): string;

  export function signMessage(params: {
    provider?: any;
    message: string;
    walletAddress?: string;
    chain?: string;
  }): Promise<string>;

  export function validateVerifierPayload(verifierId: string, data: any): ValidationResult;

  export function buildVerificationRequest(params: {
    verifierIds: string[];
    data: any;
    walletAddress: string;
    chainId?: number;
    chain?: string;
    options?: any;
    signedTimestamp?: number;
  }): { message: string; request: { verifierIds: string[]; data: any; walletAddress: string; signedTimestamp: number; chainId?: number; chain?: string; options?: any } };
  
  export function isTerminalStatus(status: VerificationStatus): boolean;
  
  export function isSuccessStatus(status: VerificationStatus): boolean;
  
  export function isFailureStatus(status: VerificationStatus): boolean;
  
  export function formatVerificationStatus(status: VerificationStatus): {
    label: string;
    description: string;
    color: string;
    category: string;
  };
  
  export class StatusPoller {
    constructor(client: NeusClient, qHash: string, options?: { interval?: number; maxAttempts?: number; exponentialBackoff?: boolean; maxInterval?: number });
    poll(): Promise<StatusResult>;
  }
  
  export function formatTimestamp(timestamp: number): string;
  
  export function isSupportedChain(chainId: number): boolean;
  
  export function delay(ms: number): Promise<void>;
  
  export function withRetry<T>(fn: () => Promise<T>, options?: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  }): Promise<T>;
  

  export function toAgentDelegationMaxSpend(
    humanAmount: string | number,
    decimals: number
  ): string;
  
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

  export type NeusPublicGateCharge = {
    enabled: boolean;
    scheme: string;
    label: string;
    amountUsd: number;
    /** Payment methods offered to visitors: 'usdc' and/or 'stripe' (card). */
    methods: Array<'usdc' | 'stripe' | string>;
    /** True when the owner can receive card payouts (Stripe Connect ready). */
    cardPayoutReady?: boolean;
    appliesTo: string;
    /** 'verifyThenCharge' (default) or 'chargeThenVerify'. */
    executionOrder?: string;
    recipient?: string;
  };

  /** One gate requirement row on the wire (protocol shape used by published gates). */
  export interface GateMatchRowWire {
    path: string;
    op?: 'eq' | 'gte' | 'lte' | string;
    value: string;
  }

  export interface GateRequirementWire {
    verifierId: string;
    match?: GateMatchRowWire[];
    optional?: boolean;
    minCount?: number;
    maxAgeMs?: number;
  }

  /** Public snapshot returned by GET /api/v1/profile/gates/{gateId} — never includes the secret reward value. */
  export interface PublicGateSnapshot {
    schemaVersion: number;
    gateId: string;
    name?: string;
    status?: string;
    version?: number;
    requirements: GateRequirementWire[];
    policy?: {
      visibility?: string;
      gateFreshnessHours?: number;
    };
    monetization?: {
      charge?: NeusPublicGateCharge | null;
    };
    checkout?: {
      mode?: string;
      flowPlan?: {
        batches?: number;
        hasInteractive?: boolean;
        hasBackground?: boolean;
      };
      description?: string;
      successReturnUrl?: string;
    };
    marketplaceTemplate?: {
      templateId: string;
      label?: string;
      tags?: string[];
    };
    schedule?: {
      startsAt?: string;
      endsAt?: string;
    };
    artifact?: {
      type: string;
      label?: string;
    };
  }

  export interface FulfillGateParams {
    gateId: string;
    /** Verified proof receipt id for this checkout. */
    qHash: string;
    /** Required when no session cookie binds the wallet. */
    walletAddress?: string;
    /** Stripe checkout session id for paid gates (card rail). */
    paymentCheckoutSessionId?: string;
    /** USDC payment transaction hash for paid gates (wallet rail). */
    paymentTxHash?: string;
  }

  export interface GateFulfillmentResult {
    delivery: 'access_granted' | 'redirect' | 'download' | 'reveal' | string;
    type?: string;
    value?: string;
    label?: string;
    message?: string;
  }

  export interface GateFulfillmentResponse {
    success: boolean;
    data?: {
      gateId: string;
      qHash: string;
      fulfillment: GateFulfillmentResult;
      successReturnUrl?: string;
    };
    error?: any;
  }

  export const NEUS_CONSTANTS: {
    HUB_CHAIN_ID: number;
    TESTNET_CHAINS: number[];
    API_BASE_URL: string;
    API_VERSION: string;
    SIGNATURE_MAX_AGE_MS: number;
    REQUEST_TIMEOUT_MS: number;
    DEFAULT_VERIFIERS: VerifierId[];
  };
  
  
  export class SDKError extends Error {
    code: string;
    details: any;
  }
  
  export class ApiError extends SDKError {
    statusCode: number;
    response: any;
  }
  
  export class ValidationError extends SDKError {
    field?: string;
    value?: any;
  }
  
  export class NetworkError extends SDKError {
    originalError?: Error;
  }
  
  export class ConfigurationError extends SDKError {
    configKey?: string;
  }
  
  export class VerificationError extends SDKError {
    verifierId?: string;
  }
  
  export class AuthenticationError extends SDKError {}
  

  export interface GetProofsOptions {
    limit?: number;
    offset?: number;
    cursor?: string;
    chain?: string;
    signatureMethod?: string;
    q?: string;
    qHash?: string;
    verifierId?: string;
    verifierIds?: string;
    tags?: string;
    tagPrefix?: string;
    tagContains?: string;
    tagPrefixesAll?: string;
    status?: string;
    appId?: string;
    chainCoverage?: 'hub-only' | 'cross-chain';
    privacyLevel?: 'public' | 'private';
    includeHistory?: boolean;
    includeFacets?: string;
    visibility?: 'public';
    isPublicRead?: boolean;
  }

  export interface ProofsResult {
    success: boolean;
    proofs: any[];
    totalCount: number | null;
    hasMore: boolean;
    nextOffset?: number | null;
    /** Keyset continuation when the API returns cursor paging (preferred over deep offsets). */
    nextCursor?: string | null;
    facets?: {
      tags?: string[];
      truncated?: boolean;
    } | null;
  }

  export interface GateRequirement {
    verifierId: CoreVerifierId;
    maxAgeMs?: number;
    optional?: boolean;
    minCount?: number;
    /**
     * Either the protocol wire shape (array of { path, op, value } rows — what
     * published gates store) or a flat { path: value } map for client-side checks.
     */
    match?: GateMatchRowWire[] | Record<string, any>;
  }

  export interface CheckGateParams {
    walletAddress: string;
    requirements: GateRequirement[];
    proofs?: any[];
  }

  export interface CheckGateResult {
    satisfied: boolean;
    missing: GateRequirement[];
    existing: Record<string, any>;
    allProofs: any[];
  }

  export interface GateCheckApiParams {
    address: string;
    /** Published gate handle; resolves checks server-side (preferred public path). */
    gateId?: string;
    verifierIds?: string[] | string;
    requireAll?: boolean;
    minCount?: number;
    sinceDays?: number;
    since?: number;
    limit?: number;
    includePrivate?: boolean;
    includeQHashes?: boolean;
    wallet?: WalletLike;
    chain?: string;
    signatureMethod?: string;
    privateAuth?: GatePrivateAuth;

    referenceType?: string;
    referenceId?: string;
    tag?: string;
    tags?: string[] | string;
    contentType?: string;
    content?: string;
    contentHash?: string;

    contractAddress?: string;
    tokenId?: string;
    chainId?: number;
    domain?: string;
    minBalance?: string;

    provider?: string;
    handle?: string;
    namespace?: string;
    ownerAddress?: string;
    riskLevel?: string;
    sanctioned?: boolean;
    poisoned?: boolean;
    primaryWalletAddress?: string;
    secondaryWalletAddress?: string;
    verificationMethod?: string;
    /** Personhood ID for proof-of-human sybil resistance matching (0x-prefixed 64-hex-char SHA-256 digest) */
    neusPersonhoodId?: string;
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
      matchedTags?: string[];
      projections?: Array<Record<string, any>> | null;
      criteria?: Record<string, any>;
      /**
       * Per-requirement gate evaluation — present whenever `gateId` was passed.
       * `allRequiredSatisfied === true` is the ONLY readiness signal for gate
       * checkout; `eligible`/`matchedCount` alone are not sufficient.
       */
      gate?: {
        gateId: string | null;
        allRequiredSatisfied: boolean;
        satisfiedVerifierIds: string[];
        missingVerifierIds: string[];
        /** verifierId → qHash map for `options.reusedVerifierProofs` on submit (requires includeQHashes=true). */
        reusedVerifierProofs?: Record<string, string>;
        /** Per-requirement rows (requires includeQHashes=true). */
        rows?: Array<{
          verifierId: string;
          satisfied: boolean;
          qHashes?: string[];
        }>;
      };
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


  export const HOUR: number;
  export const DAY: number;
  export const WEEK: number;
  export const MONTH: number;
  export const YEAR: number;

  export const GATE_NFT_HOLDER: GateRequirement[];
  export const GATE_TOKEN_HOLDER: GateRequirement[];
  export const GATE_CONTRACT_ADMIN: GateRequirement[];
  export const GATE_DOMAIN_OWNER: GateRequirement[];
  export const GATE_LINKED_WALLETS: GateRequirement[];
  export const GATE_AGENT_IDENTITY: GateRequirement[];
  export const GATE_AGENT_DELEGATION: GateRequirement[];
  export const GATE_CONTENT_MODERATION: GateRequirement[];
  export const GATE_WALLET_RISK: GateRequirement[];
  export const GATE_PSEUDONYM: GateRequirement[];

  export function createGate(
    requirements: Array<CoreVerifierId | GateRequirement>
  ): GateRequirement[];

  export function combineGates(
    ...gates: GateRequirement[][]
  ): GateRequirement[];

  
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
        | 'job'
        | 'job-status'
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
    chainId?: number;
    chain?: string;
    blockNumber?: number;
    [key: string]: any;
  };

  type TokenHoldingData = {
    ownerAddress?: string;
    contractAddress: string;
    minBalance: string;
    chainId?: number;
    chain?: string;
    blockNumber?: number;
    [key: string]: any;
  };

  type WalletRiskData = {
    walletAddress: string;
    provider?: string;
    chainId?: number;
    chain?: string;
    [key: string]: any;
  };

  type WalletLinkData = {
    primaryWalletAddress?: string;
    secondaryWalletAddress?: string;
    primaryAccountId?: string;
    secondaryAccountId?: string;
    primaryChainRef?: string;
    secondaryChainRef?: string;
    signature: string;
    chain?: string;
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

  type AgentSkillRef = {
    id: string;
    label?: string;
    version?: string;
    provider?: string;
    kind?: 'native' | 'integration' | 'plugin' | 'mcp' | 'toolkit';
    configId?: string;
    enabled?: boolean;
  };

  type AgentIdentityData = {
    agentId: string;
    agentWallet: string;
    agentChainRef: string;
    agentAccountId?: string;
    agentLabel?: string;
    agentType?: 'ai' | 'bot' | 'service' | 'automation' | 'agent';
    avatar?: string;
    description?: string;
    defaultRuntime?: {
      provider?: string;
      model?: string;
      mode?: string;
    };
    capabilities?: Record<string, boolean>;
    instructions?: string;
    skills?: AgentSkillRef[];
    services?: Array<{
      name: string;
      endpoint: string;
      version?: string;
    }>;
  };

  type AgentDelegationData = {
    controllerWallet: string;
    controllerChainRef: string;
    agentWallet: string;
    agentChainRef: string;
    controllerAccountId?: string;
    agentAccountId?: string;
    agentId?: string;
    scope?: string;
    permissions?: string[];
    maxSpend?: string;
    allowedPaymentTypes?: string[];
    receiptDisclosure?: 'none' | 'summary' | 'full';
    expiresAt?: number;
    instructions?: string;
    skills?: AgentSkillRef[];
    model?: string;
    provider?: string;
    runtimePolicy?: {
      allowedProviders?: string[];
      allowedModelClasses?: string[];
      requiresHumanApproval?: boolean;
      secretsExposedToReceipt?: boolean;
    };
    allowedActions?: string[];
    deniedActions?: string[];
    approvalPolicy?: {
      humanApprovalRequiredForNewClaims?: boolean;
      preApprovedContentOnly?: boolean;
    };
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
    targetChains?: number[];
    /** Anchor the receipt on the hub registry chain. Defaults to false (receipts persist offchain). */
    publishToHub?: boolean;
    enableIpfs?: boolean;
    privacyLevel?: 'private' | 'public';
    publicDisplay?: boolean;
    storeOriginalContent?: boolean;
    meta?: {
      title?: string;
      description?: string;
      displayName?: string;
      contentText?: string;
      contentType?: string;
      contentDescription?: string;
      license?: string;
      publicContentLicense?: string;
      publicContentDisclaimer?: string;
      legal?: string;
      source?: string;
      campaign?: string;
      tags?: string[];
      category?: string;
    };
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
        | 'job'
        | 'job-status'
        | 'other';
      id?: string;
      title?: string;
      description?: string;
      mime?: string;
      name?: string;
      size?: number;
    };
    verifierOptions?: Record<string, any>;
    identity?: { pseudonym?: string; socials?: Record<string, string> };
  }
  
  
}

declare module '@neus/sdk/widgets' {
  export interface VerifyGateProps {
    /** Published gate checkout handle (default integration path). */
    gateId?: string;
    requiredVerifiers?: string[];
    onVerified?: (result: {
      qHash: string;
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
        qHash: string;
        address?: string;
        txHash?: string | null;
        verifiedVerifiers?: any[];
        proofUrl?: string | null;
      }>;
      proofsByVerifierId?: Record<string, any>;
    }) => void;
    apiUrl?: string;
    appId?: string;
    paymentSignature?: string;
    extraHeaders?: Record<string, string>;
    hostedCheckoutUrl?: string;
    oauthProvider?: string;
    style?: Record<string, any>;
    children?: any;
    strategy?: 'reuse-or-create' | 'reuse' | 'fresh';
    checkExisting?: boolean;
    allowPrivateReuse?: boolean;
    showBrand?: boolean;
    disabled?: boolean;
    buttonText?: string;
    mode?: 'create' | 'access';
    qHash?: string | null;
    wallet?: WalletLike | any;
    chain?: string;
    signatureMethod?: string;
    onStateChange?: (state: string) => void;
    onError?: (error: Error) => void;
  }

  export function VerifyGate(props: VerifyGateProps): any;

  export interface ProofBadgeProps {
    qHash?: string;
    proofUrlPattern?: string;
    size?: 'sm' | 'md';
    uiLinkBase?: string;
    apiUrl?: string;
    proof?: any;
    showChains?: boolean;
    showLabel?: boolean;
    logoUrl?: string;
    onClick?: (data: { qHash: string; status: string; chainCount?: number }) => void;
    className?: string;
  }

  export function ProofBadge(props: ProofBadgeProps): any;

  export interface SimpleProofBadgeProps {
    qHash?: string;
    proofUrlPattern?: string;
    uiLinkBase?: string;
    apiUrl?: string;
    size?: 'sm' | 'md';
    label?: string;
    logoUrl?: string;
    proof?: any;
    onClick?: (data: { qHash: string; status: string }) => void;
    className?: string;
  }

  export function SimpleProofBadge(props: SimpleProofBadgeProps): any;

  export interface NeusPillLinkProps {
    qHash?: string;
    proofUrlPattern?: string;
    uiLinkBase?: string;
    label?: string;
    size?: 'sm' | 'md';
    logoUrl?: string;
    onClick?: (data: { qHash?: string }) => void;
    className?: string;
  }

  export function NeusPillLink(props: NeusPillLinkProps): any;

  export interface VerifiedIconProps {
    qHash?: string;
    proofUrlPattern?: string;
    uiLinkBase?: string;
    size?: number;
    logoUrl?: string;
    tooltip?: string;
    onClick?: (data: { qHash?: string }) => void;
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

declare module '@neus/sdk/mcp-hosts' {
  export type McpInstallClient = 'claude' | 'codex' | 'cursor' | 'vscode';
  export type McpInstallHost = 'cursor' | 'claude' | 'codex';

  export const NEUS_MCP_SERVER_NAME: string;
  export const NEUS_MCP_URL: string;
  export const NEUS_SETUP_CLI: string;
  export const NEUS_AUTH_CLI: string;
  export const NEUS_MCP_SETUP_DOCS_URL: string;
  export const MCP_INSTALL_CLIENTS: McpInstallClient[];
  export const MCP_INSTALL_HOSTS: McpInstallHost[];
  export const IDE_HOST_LABELS: Record<McpInstallHost, string>;
  export const IDE_HOST_BRAND_LOGOS: Record<McpInstallHost, string>;

  export function buildNeusMcpHttpConfig(accessKey?: string | null): {
    type: 'http';
    url: string;
    headers?: { Authorization: string };
  };

  export function buildCursorMcpInstallUrl(accessKey?: string | null): string;
  export function buildVsCodeMcpInstallUrl(accessKey?: string | null): string;
  export function buildAuthCommandForClient(client: McpInstallClient): string;
  export function buildSetupCommandForClient(client: McpInstallClient, accessKey?: string | null): string;
  export function buildSetupCommandForHost(host: McpInstallHost, accessKey?: string | null): string;
  export function supportsMcpInstallDeeplink(host: McpInstallHost): boolean;
}

declare module '@neus/sdk/runtime-mount' {
  export const RUNTIME_MOUNT_SCHEMA: 'neus.runtime-mount.v1';

  export interface RuntimeBundleTrust {
    identityQHash?: string;
    delegationQHash?: string;
    identityUrl?: string;
    delegationUrl?: string;
  }

  export interface RuntimeBundleIdentity {
    agentId: string;
    agentWallet: string;
    displayName?: string;
    capabilities?: string[];
    identityQHash?: string;
  }

  export interface RuntimeBundleDelegation {
    delegationQHash?: string;
    controllerWallet?: string;
    allowedActions?: string[];
    deniedActions?: string[];
    expiresAt?: number | null;
  }

  export interface RuntimeBundle {
    schema: typeof RUNTIME_MOUNT_SCHEMA;
    mountedAt: string;
    trust: RuntimeBundleTrust;
    identity: RuntimeBundleIdentity;
    delegation: RuntimeBundleDelegation;
    effectiveRuntime?: Record<string, unknown>;
    tools?: string[];
    secretBindings?: Array<Record<string, unknown>>;
    enforce?: Record<string, unknown>;
    contextPack?: Record<string, unknown>;
  }

  export function normalizeWallet(value: string | null | undefined): string;
  export function isDelegationExpired(expiresAt: number | null | undefined): boolean;
  export function pickIdentity(
    identities: Array<Record<string, unknown>>,
    selector: { agentId?: string; agentWallet?: string; identityQHash?: string },
  ): Record<string, unknown> | null;
  export function pickActiveDelegation(
    delegations: Array<Record<string, unknown>>,
    controllerWallet: string,
    agentWallet: string,
    agentId: string,
  ): Record<string, unknown> | null;
  export function extractAgentContextFromProofs(proofs: unknown): {
    identities: Array<Record<string, unknown>>;
    delegations: Array<Record<string, unknown>>;
  };
  export function buildRuntimeBundle(input: Record<string, unknown>): RuntimeBundle;
  export function resolveRuntimeBundleFromMcp(
    mcpClient: { callTool: (name: string, args?: Record<string, unknown>) => Promise<unknown> },
    selector: { agentId?: string; agentWallet?: string; identityQHash?: string }
  ): Promise<RuntimeBundle>;

  export function evaluateMountFileHealth(
    manifest: RuntimeBundle | Record<string, unknown> | null | undefined
  ): {
    mountFileValid: boolean;
    missingDelegation: boolean;
    delegationExpired: boolean;
    needsRefresh: boolean;
    reason: string | null;
  };
}

declare module '@neus/sdk/runtime-adapters' {
  import type { RuntimeBundle } from '@neus/sdk/runtime-mount';

  export type RuntimeAdapterHost = 'cursor' | 'claude' | 'codex';

  export interface ApplyRuntimeBundleResult {
    mountPath: string;
    adapterFiles: string[];
  }

  export function applyRuntimeBundle(
    host: RuntimeAdapterHost,
    bundle: RuntimeBundle,
    projectRoot: string
  ): Promise<ApplyRuntimeBundleResult>;
}
