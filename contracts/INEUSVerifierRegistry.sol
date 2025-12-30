// SPDX-License-Identifier: Business Source License 1.1
// Copyright (c) 2025 NEUS
pragma solidity ^0.8.20;

/**
 * @title INEUSVerifierRegistry
 * @author NEUS (Network for Extensible Universal Security)
 * @notice Interface for the NEUS verification registry.
 * @dev Defines the standard functions and events for managing verification records
 *      and cross-chain propagation in the NEUS ecosystem.
 *      
 *      This interface establishes the contract between verification verifiers,
 *      the registry implementation, and cross-chain voucher systems.
 *      
 *      Repository: https://github.com/neusnetwork/neus-network
 * 
 * @custom:version 1.0.0-showcase
 * @custom:security-contact security@neus.network
 */
interface INEUSVerifierRegistry {
    // Enums
    enum ProofStatus { // Note: This enum is for conceptual reference, not directly used in current contract interfaces for status fields.
        PENDING_HUB_CONFIRMATION,
        CONFIRMED_ON_HUB,
        RELAYED_TO_SPOKES,
        FULLY_CONFIRMED
    }

    // Structs
    struct Verification {
        address verifier;
        bool verified;
        uint256 timestamp;
        uint256 blockNumber;
        string proofId;
        string verificationType;
        uint256 nonce;
    }

    // Verifier Registry Structs - MINIMAL VERSION
    struct VerifierInfo {
        bool isActive;
        uint256 registeredAt;
    }

    // Core Verification Events
    event VerificationRequested(address indexed verifier, address indexed relayer, bytes32 indexed qHash);
    event VerificationSuccessful(bytes32 indexed qHash, address indexed verifier, uint256[] targetChainIds, string proofId, string verificationType, bytes32[] voucherIds);
    event VerificationSubmitted(string indexed proofId, bytes32 indexed qHash, address indexed verifier, uint256[] targetChainIds, uint256 fee, uint256 timestamp, bytes32[] voucherIds);
    event ChainVerificationConfirmed(bytes32 indexed qHash, uint256 indexed chainId, address indexed confirmer, uint256 timestamp);
    
    // Verifier Registry Events
    event VerifierRegistered(
        bytes32 indexed verifierId,
        string indexed verificationType
    );
    event VerifierUpdated(
        bytes32 indexed verifierId,
        bool isActive,
        address indexed updatedBy,
        uint256 timestamp
    );
    event VerifierDeactivated(
        bytes32 indexed verifierId,
        address indexed deactivatedBy,
        uint256 timestamp,
        string reason
    );
    event VerifierReactivated(
        bytes32 indexed verifierId,
        address indexed reactivatedBy,
        uint256 timestamp
    );
    
    // Administrative Events
    event TrustedRelayerAdded(address indexed relayer, uint256 timestamp);
    event TrustedRelayerRemoved(address indexed relayer, uint256 timestamp);
    event VoucherHubUpdated(address indexed oldHub, address indexed newHub, uint256 timestamp);
    event FeeUpdated(uint256 oldFee, uint256 newFee, uint256 timestamp); // Note: Relates to old fee model, might be deprecated if fees are only verificationFee + crossChainFeePerChain
    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector, uint256 timestamp);
    event FeesWithdrawn(address indexed to, uint256 amount, uint256 timestamp);
    event FeeDistributed(address indexed from, address indexed treasuryWallet, uint256 treasuryAmount, uint256 timestamp);
    event FeeBurned(address indexed from, uint256 burnAmount, uint256 timestamp);
    event TreasurySplitUpdated(
        uint256 treasuryBps,
        address treasuryWallet,
        address burnWallet,
        uint256 timestamp,
        uint256 oldTreasuryBps,
        address oldTreasuryWallet,
        address oldBurnWallet
    );
    
    // Debug events for troubleshooting
    event DebugStep(string step, bytes32 indexed qHash, address indexed user);
    event DebugValue(string name, uint256 value);
    event DebugAddress(string name, address addr);
    event DebugBoolean(string name, bool value);

    // Credit-based fee system events
    event CreditBasedFeesToggled(bool enabled, address indexed admin, uint256 timestamp);
    event RelayerCreditsDeposited(address indexed relayer, uint256 amount, uint256 totalCredits, uint256 timestamp);
    event UserCreditsAllocated(address indexed relayer, address indexed user, uint256 amount, uint256 userTotalCredits, uint256 timestamp);
    event FeePaidWithCredits(address indexed user, address indexed relayer, uint256 feeAmount, uint256 treasuryShare, uint256 burnShare, uint256 timestamp);

    // Core Verification Functions
    function verifyData(
        address userAddress,
        bytes32 qHash,
        uint256[] calldata targetChainIds,
        string calldata proofId,
        string calldata verificationType
    ) external returns (bytes32 primaryVoucherId); // Changed name for clarity

    function getVerification(bytes32 qHash) external view returns (Verification memory);
    function isVerifiedOnChain(bytes32 qHash, uint256 chainId) external view returns (bool);
    function confirmChainVerification(bytes32 qHash, uint256 chainId) external;
    function confirmChainVerificationBatch(bytes32[] calldata qHashes, uint256[] calldata chainIds) external;
    function getVerificationFee(uint256 targetChainCount) external view returns (uint256 totalFee);

    // Verifier Registry Functions - SIMPLIFIED
    function registerVerifier(
        string calldata verificationType
    ) external returns (bytes32 verifierId);

    function updateVerifier(
        bytes32 verifierId,
        bool isActive
    ) external;

    function deactivateVerifier(bytes32 verifierId, string calldata reason) external;
    function reactivateVerifier(bytes32 verifierId) external;
    function getVerifierInfo(bytes32 verifierId) external view returns (VerifierInfo memory);
    function getVerifierByType(string calldata verificationType) external view returns (VerifierInfo memory);
    function isVerifierActive(bytes32 verifierId) external view returns (bool);
    function getActiveVerifierCount() external view returns (uint256);


    // Errors
    error InsufficientFee(uint256 required, uint256 sent);
    error FeeTransferFailed();
    error VerificationNotFound(bytes32 qHash);
    error ChainNotTargeted(bytes32 qHash, uint256 chainId);
    error InvalidChainId(uint256 chainId);
    error TimelockNotExpired(bytes32 proposalId, uint256 requiredTimestamp);
    error InvalidProposalId(bytes32 proposalId);
    error InvalidBasisPoints(uint256 bps);
    error InvalidAddress(address addr);
    error DuplicateChainId(uint256 chainId);
    error TooManyRelayers();
    error RelayerAlreadyTrusted(address relayer);
    error RelayerNotTrusted(address relayer);
    error FeeCalculationOverflow();
    error BatchSizeMismatch();
    error EmptyBatch();
    error AlreadyVerified(bytes32 qHash, uint256 chainId);
    
    // Verifier Registry Errors
    error VerifierAlreadyExists(bytes32 verifierId);
    error VerifierNotFound(bytes32 verifierId);
    error VerifierNotActive(bytes32 verifierId);
    error InvalidVerificationType(string verificationType);
    error InvalidMetadataURI(string metadataURI);
    error UnauthorizedVerifierOperation(address caller);
} 