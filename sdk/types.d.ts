declare module '@neus/sdk' {
  export interface Eip1193Provider {
    request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
  }

  export type WalletLike = Eip1193Provider | { address?: string } | { getAddress?: () => Promise<string> } | { signMessage?: (message: string) => Promise<string> };

  export class NeusClient {
    constructor(config?: NeusClientConfig);
    
    verify(params: VerifyParams): Promise<VerificationResult>;
    
    getProof(proofId: string): Promise<StatusResult>;
    
    getPrivateProof(proofId: string, wallet?: WalletLike | GatePrivateAuth): Promise<StatusResult>;
    
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

    pollProofStatus(proofId: string, options?: PollOptions): Promise<StatusResult>;

    revokeOwnProof(proofId: string, wallet?: { address: string }): Promise<boolean>;

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

  }

  export type PrivacyLevel = 'public' | 'private';

  export interface NeusClientConfig {
    apiUrl?: string;
    apiKey?: string;
    appId?: string;
    paymentSignature?: string;
    extraHeaders?: Record<string, string>;
    timeout?: number;
    hubChainId?: number;
    enableLogging?: boolean;
  }

  export interface VerificationOptions {
    privacyLevel?: PrivacyLevel;
    enableIpfs?: boolean;
    storeOriginalContent?: boolean;
    targetChains?: number[];
    publicDisplay?: boolean;
    meta?: Record<string, any>;
    verifierOptions?: Record<string, any>;
  }

  export interface VerifierCatalogMetadataEntry {
    category?: string;
    description?: string;
    flowType?: 'instant' | 'interactive' | 'external_lookup' | string;
    expiryType?: 'permanent' | 'point_in_time' | 'expiring' | string;
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
    wallet?: WalletLike;
  }
    
  export interface ProofResult {
    proofId: string;
    qHash: string;
    status: string;
    walletAddress?: string;
    proofUrl?: string;
    crossChain?: boolean;
  }
  
  export interface VerificationResult {
    proofId: string;
    qHash: string;
    status: VerificationStatus;
    success: boolean;
    data?: VerificationData;
  }
  
  export interface StatusResult {
    proofId?: string;
    qHash?: string;
    proofUrl?: string | null;
    success: boolean;
    status: VerificationStatus;
    data?: {
      proofId?: string;
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
    constructor(client: NeusClient, proofId: string, options?: { interval?: number; maxAttempts?: number; exponentialBackoff?: boolean; maxInterval?: number });
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
    methods: string[];
    appliesTo: string;
    executionOrder?: string;
    recipient?: string;
  };

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
    chain?: string;
    signatureMethod?: string;
  }

  export interface ProofsResult {
    success: boolean;
    proofs: any[];
    totalCount: number;
    hasMore: boolean;
    nextOffset?: number | null;
  }

  export interface GateRequirement {
    verifierId: CoreVerifierId;
    maxAgeMs?: number;
    optional?: boolean;
    minCount?: number;
    match?: Record<string, any>;
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
    targetChains?: number[];
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
    requiredVerifiers?: string[];
    onVerified?: (result: {
      proofId: string;
      qHash: string;
      proofIds?: string[];
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
    verifierOptions?: Record<string, any>;
    verifierData?: Record<string, any>;
    proofOptions?: Record<string, any>;
    strategy?: 'reuse-or-create' | 'reuse' | 'fresh';
    checkExisting?: boolean;
    maxProofAgeMs?: number;
    allowPrivateReuse?: boolean;
    showBrand?: boolean;
    disabled?: boolean;
    buttonText?: string;
    mode?: 'create' | 'access';
    proofId?: string | null;
    qHash?: string | null;
    wallet?: WalletLike | any;
    chain?: string;
    signatureMethod?: string;
    onStateChange?: (state: string) => void;
    onError?: (error: Error) => void;
  }

  export function VerifyGate(props: VerifyGateProps): any;

  export interface ProofBadgeProps {
    proofId?: string;
    qHash?: string;
    proofUrlPattern?: string;
    size?: 'sm' | 'md';
    uiLinkBase?: string;
    apiUrl?: string;
    proof?: any;
    showChains?: boolean;
    showLabel?: boolean;
    logoUrl?: string;
    onClick?: (data: { proofId: string; qHash: string; status: string; chainCount?: number }) => void;
    className?: string;
  }

  export function ProofBadge(props: ProofBadgeProps): any;

  export interface SimpleProofBadgeProps {
    proofId?: string;
    qHash?: string;
    proofUrlPattern?: string;
    uiLinkBase?: string;
    apiUrl?: string;
    size?: 'sm' | 'md';
    label?: string;
    logoUrl?: string;
    proof?: any;
    onClick?: (data: { proofId: string; qHash: string; status: string }) => void;
    className?: string;
  }

  export function SimpleProofBadge(props: SimpleProofBadgeProps): any;

  export interface NeusPillLinkProps {
    proofId?: string;
    qHash?: string;
    proofUrlPattern?: string;
    uiLinkBase?: string;
    label?: string;
    size?: 'sm' | 'md';
    logoUrl?: string;
    onClick?: (data: { proofId?: string; qHash?: string }) => void;
    className?: string;
  }

  export function NeusPillLink(props: NeusPillLinkProps): any;

  export interface VerifiedIconProps {
    proofId?: string;
    qHash?: string;
    proofUrlPattern?: string;
    uiLinkBase?: string;
    size?: number;
    logoUrl?: string;
    tooltip?: string;
    onClick?: (data: { proofId?: string; qHash?: string }) => void;
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
