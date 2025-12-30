// SPDX-License-Identifier: Business Source License 1.1
// Copyright (c) 2025 NEUS
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// import "./INEUSVerifierRegistry.sol"; // No longer strictly needed as only address is stored
import "./IVoucherHub.sol";
import "./lib/NeusTimelocks.sol"; // Import the new library

/**
 * @title NEUSVoucherHub
 * @author NEUS (Network for Extensible Universal Security)
 * @notice Hub contract for creating and managing ERC-7683 style verification vouchers.
 * @dev Called by NEUSVerifierRegistry to initiate cross-chain propagation.
 *      
 *      Cross-Chain Architecture:
 *      - Vouchers are created on-chain and emit VoucherCreated events
 *      - Off-chain relayer services monitor these events for propagation
 *      - Relayers fulfill vouchers on target spoke chains automatically
 *      - No direct cross-chain messaging contracts required
 *      
 *      This approach provides flexibility, cost efficiency, and reliability
 *      while maintaining full decentralization through event-driven architecture.
 *      
 *      Repository: https://github.com/neusnetwork/neus-network
 * 
 * @custom:version 1.0.0-showcase
 * @custom:security-contact security@neus.network
 */
contract NEUSVoucherHub is IVoucherHub, Ownable, Pausable, ReentrancyGuard {
    // Contract Metadata and Version Tracking
    string public constant CONTRACT_NAME = "NEUSVoucherHub";
    string public constant CONTRACT_VERSION = "1.0.0-showcase";
    uint256 public immutable DEPLOYMENT_TIMESTAMP;
    uint256 public immutable DEPLOYMENT_BLOCK;
    bytes32 public immutable DEPLOYMENT_CODEHASH;

    // Emergency Controls
    bool public voucherCreationPaused = false;

    // --- State Variables ---
    address public verifierRegistryAddress; // Store address of the registry for onlyRegistry modifier

    address public feeCollector; // Optional: If hub collects separate fees
    uint256 public voucherCreationFee; // Optional: Fee in NEUS tokens

    // Voucher Storage (using IVoucherHub.Voucher struct, now includes verifierId)
    mapping(bytes32 => Voucher) public vouchers; // voucherId => Voucher (qHash inside)
    uint256 public totalVouchersCreated;

    // Mapping to track if a voucher is fulfilled on the Hub for a specific target chainId
    // voucherId => targetChainId => fulfilled
    mapping(bytes32 => mapping(uint256 => bool)) public voucherFulfillments;

    // Timelock for upgrades
    mapping(bytes32 => uint256) public timelocks;
    address public pendingRegistryAddress;
    address public pendingFeeCollector;
    uint256 public pendingVoucherFee;

    // Events (defined in IVoucherHub, plus admin events)
    event RegistryAddressUpdated(address indexed oldRegistryAddress, address indexed newRegistryAddress, uint256 timestamp);
    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector, uint256 timestamp);
    event VoucherFeeUpdated(uint256 oldFee, uint256 newFee, uint256 timestamp);
    event UpgradeScheduled(bytes32 indexed proposalId, uint256 unlockTimestamp);
    event UpgradeExecuted(bytes32 indexed proposalId);
    
    // Enhanced events for debugging and monitoring
    event VoucherCreationPausedStateChanged(bool paused, address indexed admin, uint256 timestamp, string reason);
    event EmergencyAction(string indexed action, address indexed admin, uint256 timestamp, string details);
    
    // VoucherCreated and VoucherFulfilledOnHub events are defined in IVoucherHub interface

    // Errors
    error NotVerifierRegistry();
    error VoucherNotFound(bytes32 voucherId);
    error InvalidFeeAmount(); // Kept for future use if hub manages its own fees
    error TimelockNotExpired(bytes32 proposalId, uint256 requiredTimestamp);
    error InvalidProposalId(bytes32 proposalId);

    // --- Constructor ---
    constructor(
        address _initialOwner,
        address _registryAddress,
        address _feeCollector,      // Can be address(0) if fees managed solely by registry
        uint256 _voucherCreationFee // Can be 0 if no separate fee
    ) Ownable(_initialOwner) {
        require(_registryAddress != address(0), "Invalid registry address");

        verifierRegistryAddress = _registryAddress;
        feeCollector = _feeCollector;
        voucherCreationFee = _voucherCreationFee;

        // Initialize deployment tracking
        DEPLOYMENT_TIMESTAMP = block.timestamp;
        DEPLOYMENT_BLOCK = block.number;
        DEPLOYMENT_CODEHASH = keccak256(abi.encodePacked(address(this).code));
    }

    // --- Modifiers ---
    modifier onlyRegistry() {
        if (msg.sender != verifierRegistryAddress) revert NotVerifierRegistry();
        _;
    }

    // --- External Functions (IVoucherHub Implementation) ---

    /**
     * @notice Creates new verification vouchers in batch using minimal parameters.
     * @dev Each entry in `params` results in a unique voucherId.
     *      The voucherId is deterministically generated using qHash, targetChainId, verifierId, block.timestamp, and a counter.
     * @param params Array of MinimalVoucherParams structs.
     * @return voucherIds Array of unique identifiers for the created vouchers.
     * @custom:deprecated This function is inefficient and will be removed. Use createVoucher instead.
     */
    function createMinimalVoucherBatch(
        MinimalVoucherParams[] calldata params
    ) external override onlyRegistry whenNotPaused nonReentrant returns (bytes32[] memory voucherIds) {
        require(!voucherCreationPaused, "Voucher creation is temporarily paused");
        
        uint256 batchSize = params.length;
        require(batchSize > 0, "Batch cannot be empty");
        voucherIds = new bytes32[](batchSize);

        for (uint256 i = 0; i < batchSize; i++) {
            MinimalVoucherParams calldata param = params[i];
            bytes32 qHash = param.qHash;
            uint256 targetChainId = param.targetChainId;
            bytes32 verifierId = param.verifierId;

            // Generate unique voucher ID
            bytes32 generatedVoucherId = keccak256(abi.encodePacked(qHash, targetChainId, verifierId, block.timestamp, totalVouchersCreated + i));
            require(vouchers[generatedVoucherId].timestamp == 0, "Voucher ID collision");

            voucherIds[i] = generatedVoucherId;

            // Store the voucher
            uint256[] memory singleTargetChainId = new uint256[](1);
            singleTargetChainId[0] = targetChainId;

            vouchers[generatedVoucherId] = Voucher({
                qHash: qHash,
                targetChainIds: singleTargetChainId,
                verifierId: verifierId, // Store verifierId
                timestamp: block.timestamp,
                isActive: true,
                creator: msg.sender // The registry address
            });

            emit VoucherCreated(generatedVoucherId, qHash, singleTargetChainId, verifierId, block.timestamp);
        }
        totalVouchersCreated += batchSize;
        return voucherIds;
    }

    /**
     * @notice Creates a new verification voucher for multiple target chains.
     * @dev This is the preferred, gas-efficient method for creating vouchers.
     * @param qHash The quantum-resistant hash of the verified content.
     * @param targetChainIds Array of chain IDs where the verification should be propagated.
     * @param verifierId Identifier for the verifier context.
     * @return voucherId The unique identifier for the created voucher.
     */
    function createVoucher(
        bytes32 qHash,
        uint256[] calldata targetChainIds,
        bytes32 verifierId
    ) external override onlyRegistry whenNotPaused nonReentrant returns (bytes32 voucherId) {
        require(!voucherCreationPaused, "Voucher creation is temporarily paused");
        require(targetChainIds.length > 0, "Target chains cannot be empty");

        // Generate a single unique voucher ID for the entire batch
        voucherId = keccak256(abi.encodePacked(qHash, verifierId, block.timestamp, totalVouchersCreated));
        require(vouchers[voucherId].timestamp == 0, "Voucher ID collision");

        // Store the voucher with all target chains
        vouchers[voucherId] = Voucher({
            qHash: qHash,
            targetChainIds: targetChainIds,
            verifierId: verifierId,
            timestamp: block.timestamp,
            isActive: true,
            creator: msg.sender // The registry address
        });

        totalVouchersCreated++;

        emit VoucherCreated(voucherId, qHash, targetChainIds, verifierId, block.timestamp);

        return voucherId;
    }
    
    /**
     * @notice Retrieves details for a specific voucher.
     * @param voucherId The ID of the voucher to query.
     * @return The Voucher struct (now includes verifierId).
     */
    function getVoucher(bytes32 voucherId) external view override returns (Voucher memory) {
        Voucher storage v = vouchers[voucherId];
        if (v.timestamp == 0) revert VoucherNotFound(voucherId);
        return v;
    }

    /**
     * @notice Checks if a voucher has been marked as fulfilled on the Hub for a specific target chain.
     * @param voucherId The unique identifier of the voucher.
     * @param chainId The target chain ID to check fulfillment for on the Hub.
     * @return True if the voucher is marked as fulfilled on the Hub for the given chain, false otherwise.
     */
    function isVoucherFulfilledOnHub(bytes32 voucherId, uint256 chainId) external view override returns (bool) {
        return voucherFulfillments[voucherId][chainId];
    }

    /**
     * @notice Get timelock information for a proposal
     * @param proposalId The proposal ID to check
     * @return unlockTime The timestamp when the proposal can be executed (0 if not scheduled)
     * @return isReady True if the proposal is ready to execute
     * @return timeRemaining Seconds remaining until unlock (0 if ready or not scheduled)
     */
    function getTimelockInfo(bytes32 proposalId) external view returns (
        uint256 unlockTime,
        bool isReady,
        uint256 timeRemaining
    ) {
        unlockTime = timelocks[proposalId];
        isReady = unlockTime != 0 && block.timestamp >= unlockTime;
        timeRemaining = (unlockTime != 0 && block.timestamp < unlockTime) ? 
            unlockTime - block.timestamp : 0;
    }

    /**
     * @notice Get all pending timelock proposals
     * @return proposalIds Array of proposal IDs that are scheduled but not executed
     * @return unlockTimes Array of corresponding unlock timestamps
     */
    function getPendingTimelocks() external view returns (
        bytes32[] memory proposalIds,
        uint256[] memory unlockTimes
    ) {
        // Count pending proposals
        uint256 count = 0;
        bytes32[] memory tempIds = new bytes32[](10); // Max 10 pending proposals
        uint256[] memory tempTimes = new uint256[](10);
        
        // Check common proposal types
        bytes32[3] memory commonProposals = [
            keccak256(abi.encode("updateRegistryAddress", pendingRegistryAddress)),
            keccak256(abi.encode("updateFeeCollector", pendingFeeCollector)),
            keccak256(abi.encode("updateVoucherFee", pendingVoucherFee))
        ];
        
        for (uint i = 0; i < commonProposals.length && count < 10; i++) {
            if (timelocks[commonProposals[i]] != 0) {
                tempIds[count] = commonProposals[i];
                tempTimes[count] = timelocks[commonProposals[i]];
                count++;
            }
        }
        
        // Create properly sized arrays
        proposalIds = new bytes32[](count);
        unlockTimes = new uint256[](count);
        for (uint i = 0; i < count; i++) {
            proposalIds[i] = tempIds[i];
            unlockTimes[i] = tempTimes[i];
        }
    }

    // --- External Functions (Hub Specific) ---

    /**
     * @notice Marks a voucher as fulfilled on the Hub for a specific target chain.
     * @dev Typically called by an off-chain relayer or service after observing fulfillment on the Spoke.
     *      This function is distinct from Spoke contract's local fulfillment.
     * @param voucherId The unique identifier of the voucher.
     * @param qHash The qHash of the voucher (for event emission and verification).
     * @param chainId The target chain ID for which fulfillment is being confirmed on the Hub.
     */
    function confirmVoucherFulfilledOnHub(
        bytes32 voucherId,
        bytes32 qHash, // qHash for event consistency
        uint256 chainId
    ) external whenNotPaused nonReentrant onlyRegistry { // Changed to onlyRegistry from onlyOwner for consistency
        Voucher storage v = vouchers[voucherId];
        if (v.timestamp == 0) revert VoucherNotFound(voucherId);
        
        bool found = false;
        for (uint i = 0; i < v.targetChainIds.length; i++) {
            if (v.targetChainIds[i] == chainId) {
                found = true;
                break;
            }
        }
        require(found, "ChainId not a target for this voucher");
        require(!voucherFulfillments[voucherId][chainId], "Already fulfilled on Hub for this chain");

        voucherFulfillments[voucherId][chainId] = true;
        emit VoucherFulfilledOnHub(voucherId, qHash, chainId, block.timestamp);
    }


    // --- Admin Functions ---

    /**
     * @notice Schedules an update to the Verifier Registry address.
     * @param _newRegistryAddress The address of the new Verifier Registry.
     */
    function scheduleRegistryAddressUpdate(address _newRegistryAddress) external onlyOwner {
        require(_newRegistryAddress != address(0), "Invalid address");
        bytes32 proposalId = keccak256(abi.encode("updateRegistryAddress", _newRegistryAddress));
        timelocks[proposalId] = block.timestamp + NeusTimelocks.HUB_TIMELOCK_DELAY; // USE LIBRARY CONSTANT
        pendingRegistryAddress = _newRegistryAddress;
        emit UpgradeScheduled(proposalId, timelocks[proposalId]);
    }

    /**
     * @notice Executes the scheduled Verifier Registry address update after the timelock delay.
     */
    function executeRegistryAddressUpdate() external onlyOwner {
        bytes32 proposalId = keccak256(abi.encode("updateRegistryAddress", pendingRegistryAddress));
        if (timelocks[proposalId] == 0) revert InvalidProposalId(proposalId);
        if (block.timestamp < timelocks[proposalId]) revert TimelockNotExpired(proposalId, timelocks[proposalId]);

        address oldRegistryAddress = verifierRegistryAddress;
        verifierRegistryAddress = pendingRegistryAddress;

        delete timelocks[proposalId];
        pendingRegistryAddress = address(0);

        emit RegistryAddressUpdated(oldRegistryAddress, verifierRegistryAddress, block.timestamp);
        emit UpgradeExecuted(proposalId);
    }

    /**
     * @notice Schedules an update to the Fee Collector address (if applicable).
     * @param _newFeeCollector The address of the new Fee Collector.
     */
    function scheduleFeeCollectorUpdate(address _newFeeCollector) external onlyOwner {
        // Allow address(0) if disabling hub fees
        bytes32 proposalId = keccak256(abi.encode("updateFeeCollector", _newFeeCollector));
        timelocks[proposalId] = block.timestamp + NeusTimelocks.HUB_TIMELOCK_DELAY; // USE LIBRARY CONSTANT
        pendingFeeCollector = _newFeeCollector;
        emit UpgradeScheduled(proposalId, timelocks[proposalId]);
    }

    /**
     * @notice Executes the scheduled Fee Collector update after the timelock delay.
     */
    function executeFeeCollectorUpdate() external onlyOwner {
        bytes32 proposalId = keccak256(abi.encode("updateFeeCollector", pendingFeeCollector));
        if (timelocks[proposalId] == 0) revert InvalidProposalId(proposalId);
        if (block.timestamp < timelocks[proposalId]) revert TimelockNotExpired(proposalId, timelocks[proposalId]);

        address oldCollector = feeCollector;
        feeCollector = pendingFeeCollector;

        delete timelocks[proposalId];
        pendingFeeCollector = address(0);

        emit FeeCollectorUpdated(oldCollector, feeCollector, block.timestamp);
        emit UpgradeExecuted(proposalId);
    }

    /**
     * @notice Schedules an update to the voucher creation fee (if applicable).
     * @param _newFee The new voucher creation fee.
     */
    function scheduleVoucherFeeUpdate(uint256 _newFee) external onlyOwner {
        bytes32 proposalId = keccak256(abi.encode("updateVoucherFee", _newFee));
        timelocks[proposalId] = block.timestamp + NeusTimelocks.HUB_TIMELOCK_DELAY; // USE LIBRARY CONSTANT
        pendingVoucherFee = _newFee;
        emit UpgradeScheduled(proposalId, timelocks[proposalId]);
    }

    /**
     * @notice Executes the scheduled voucher fee update after the timelock delay.
     */
    function executeVoucherFeeUpdate() external onlyOwner {
        bytes32 proposalId = keccak256(abi.encode("updateVoucherFee", pendingVoucherFee));
        if (timelocks[proposalId] == 0) revert InvalidProposalId(proposalId);
        if (block.timestamp < timelocks[proposalId]) revert TimelockNotExpired(proposalId, timelocks[proposalId]);

        uint256 oldFee = voucherCreationFee;
        voucherCreationFee = pendingVoucherFee;

        delete timelocks[proposalId];
        pendingVoucherFee = 0;

        emit VoucherFeeUpdated(oldFee, voucherCreationFee, block.timestamp);
        emit UpgradeExecuted(proposalId);
    }

    /**
     * @notice Pauses the contract. Only owner.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses the contract. Only owner.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency pause for voucher creation functionality only
     * @param reason Human-readable reason for the pause
     */
    function emergencyPauseVoucherCreation(string calldata reason) external onlyOwner {
        require(!voucherCreationPaused, "Voucher creation already paused");
        voucherCreationPaused = true;
        emit VoucherCreationPausedStateChanged(true, msg.sender, block.timestamp, reason);
        emit EmergencyAction("VOUCHER_CREATION_PAUSE", msg.sender, block.timestamp, reason);
    }

    /**
     * @notice Resume voucher creation functionality
     * @param reason Human-readable reason for resuming
     */
    function resumeVoucherCreation(string calldata reason) external onlyOwner {
        require(voucherCreationPaused, "Voucher creation not paused");
        voucherCreationPaused = false;
        emit VoucherCreationPausedStateChanged(false, msg.sender, block.timestamp, reason);
        emit EmergencyAction("VOUCHER_CREATION_RESUME", msg.sender, block.timestamp, reason);
    }

    /**
     * @notice Get contract deployment and version information
     * @return name Contract name
     * @return version Contract version
     * @return deploymentTimestamp When the contract was deployed
     * @return deploymentBlock Block number of deployment
     * @return codeHash Hash of the contract code at deployment
     */
    function getContractInfo() external view returns (
        string memory name,
        string memory version,
        uint256 deploymentTimestamp,
        uint256 deploymentBlock,
        bytes32 codeHash
    ) {
        return (
            CONTRACT_NAME,
            CONTRACT_VERSION,
            DEPLOYMENT_TIMESTAMP,
            DEPLOYMENT_BLOCK,
            DEPLOYMENT_CODEHASH
        );
    }

    /**
     * @notice Get current operational status
     * @return isPaused True if contract is paused
     * @return isVoucherCreationPaused True if voucher creation functionality is paused
     * @return totalVouchersProcessed Total number of vouchers created
     * @return registryAddress Current registry address
     */
    function getOperationalStatus() external view returns (
        bool isPaused,
        bool isVoucherCreationPaused,
        uint256 totalVouchersProcessed,
        address registryAddress
    ) {
        return (
            paused(),
            voucherCreationPaused,
            totalVouchersCreated,
            verifierRegistryAddress
        );
    }
    
    // --- Receive Ether --- (Optional: For receiving fees directly)
    receive() external payable {
        // Handle received Ether if necessary (e.g., for direct voucher fees)
    }
}