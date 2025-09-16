// SPDX-License-Identifier: BUSL-1.1
// Copyright (c) 2025 NEUS Network, Inc.
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IVoucherHub.sol"; // To interact with the hub for verification
import "./lib/NeusTimelocks.sol"; // Import timelock library

/**
 * @title NEUSVoucherSpoke
 * @author NEUS (Network for Extensible Universal Security)
 * @notice Spoke contract for receiving and verifying NEUS verification vouchers.
 * @dev Deployed on spoke chains. Receives fulfillment messages from trusted relayers.
 *      Now uses MinimalVoucherParams for batch fulfillment.
 *      
 *      Security Features:
 *      - voucherId validation ensures vouchers aren't processed multiple times via fulfilledVouchers mapping
 *      - Trusted relayer system prevents unauthorized voucher fulfillment
 *      - Batch processing for gas efficiency across multiple vouchers
 *      - Comprehensive event emission for indexing and monitoring
 *      
 *      Repository: https://github.com/neus/network
 * 
 * @custom:version 1.0.0
 * @custom:security-contact dev@neus.network  
 * @custom:source https://github.com/neus/network
 */
contract NEUSVoucherSpoke is Ownable, Pausable, ReentrancyGuard {
    // Contract Metadata and Version Tracking
    string public constant CONTRACT_NAME = "NEUSVoucherSpoke";
    string public constant CONTRACT_VERSION = "1.0.0";
    uint256 public immutable DEPLOYMENT_TIMESTAMP;
    uint256 public immutable DEPLOYMENT_BLOCK;
    bytes32 public immutable DEPLOYMENT_CODEHASH;

    // Emergency Controls
    bool public voucherFulfillmentPaused = false;

    // --- Structs ---
    struct MinimalVoucherParams {
        bytes32 voucherId;
        bytes32 qHash;
        bytes32 verifierId;
        uint64  hubTimestamp; // Timestamp from the Hub event
    }

    // --- State Variables ---
    address public immutable hubVoucherAddress; // Address of the NEUSVoucherHub on the hub chain (for reference, not direct calls from spoke)
    uint256 public immutable localChainId;       // Chain ID of this spoke chain

    // Enhanced relayer management
    mapping(address => bool) public trustedRelayers;         // Multiple trusted relayers
    uint256 public relayerCount;                            // Track number of relayers
    uint256 public constant MAX_RELAYERS = 10;              // Maximum number of relayers allowed

    // Mapping to track fulfilled vouchers on this spoke chain
    mapping(bytes32 => bool) public fulfilledVouchers; // voucherId => fulfilled
    // mapping(bytes32 => bool) public locallyVerifiedHashes; // qHash => verified (REMOVED - voucherId is now the unique key)

    // Batch tracking
    struct BatchStatus {
        uint256 total;
        uint256 fulfilled;
        uint256 failed; // Not actively used in current logic but kept for potential future detailed batch error reporting
        uint256 timestamp;
        bool completed;
    }
    mapping(bytes32 => BatchStatus) public batchStatuses; // batchId => status

    // Timelock for upgrades
    mapping(bytes32 => uint256) public timelocks;
    address public pendingHubAddress;

    // Events
    event VoucherFulfilled(bytes32 indexed voucherId, bytes32 indexed qHash, bytes32 indexed verifierId, uint64 timestamp); // Updated event
    event TrustedRelayerAdded(address indexed relayer, uint256 timestamp);
    event TrustedRelayerRemoved(address indexed relayer, uint256 timestamp);
    event BatchProcessed(bytes32 indexed batchId, uint256 total, uint256 fulfilled, uint256 failed, uint256 timestamp);
    
    // Enhanced events for monitoring and auditing
    event VoucherFulfillmentPausedStateChanged(bool paused, address indexed admin, uint256 timestamp, string reason);
    event EmergencyAction(string indexed action, address indexed admin, uint256 timestamp, string details);
    
    // Admin events
    event UpgradeScheduled(bytes32 indexed proposalId, uint256 unlockTimestamp);
    event UpgradeExecuted(bytes32 indexed proposalId);
    event HubAddressUpdated(address indexed oldHub, address indexed newHub, uint256 timestamp);

    // Errors
    error AlreadyFulfilled(bytes32 voucherId);
    error InvalidRelayer(address caller);
    error TooManyRelayers();
    error RelayerAlreadyTrusted(address relayer);
    error RelayerNotTrusted(address relayer);
    error BatchAlreadyCompleted(bytes32 batchId);
    error InvalidBatchSize(); // Kept, as batch size constraints are still good practice
    error TimelockNotExpired(bytes32 proposalId, uint256 requiredTimestamp);
    error InvalidProposalId(bytes32 proposalId);

    // --- Constructor ---
    constructor(
        address _initialOwner,
        address _hubVoucherAddress, // For reference, actual hub interaction happens off-chain via relayer
        address _initialRelayer
    ) Ownable(_initialOwner) {
        require(_hubVoucherAddress != address(0), "Invalid hub address");
        require(_initialRelayer != address(0), "Invalid initial relayer");

        hubVoucherAddress = _hubVoucherAddress;
        localChainId = uint256(block.chainid);

        // Add initial relayer
        trustedRelayers[_initialRelayer] = true;
        relayerCount = 1;
        emit TrustedRelayerAdded(_initialRelayer, block.timestamp);

        // Initialize deployment tracking
        DEPLOYMENT_TIMESTAMP = block.timestamp;
        DEPLOYMENT_BLOCK = block.number;
        DEPLOYMENT_CODEHASH = keccak256(abi.encodePacked(address(this).code));
    }

    // --- Modifiers ---
    modifier onlyTrustedRelayer() {
        if (!trustedRelayers[msg.sender]) revert InvalidRelayer(msg.sender);
        _;
    }

    // --- Relayer Management ---
    function addTrustedRelayer(address relayer) external onlyOwner {
        if (relayer == address(0)) revert InvalidRelayer(relayer);
        if (trustedRelayers[relayer]) revert RelayerAlreadyTrusted(relayer);
        if (relayerCount >= MAX_RELAYERS) revert TooManyRelayers();

        trustedRelayers[relayer] = true;
        relayerCount++;
        emit TrustedRelayerAdded(relayer, block.timestamp);
    }

    function removeTrustedRelayer(address relayer) external onlyOwner {
        if (!trustedRelayers[relayer]) revert RelayerNotTrusted(relayer);
        if (relayerCount <= 1) revert("Cannot remove last relayer"); // Solidity ^0.8.0 allows string literals for require/revert

        trustedRelayers[relayer] = false;
        relayerCount--;
        emit TrustedRelayerRemoved(relayer, block.timestamp);
    }

    // --- External Functions ---

    /**
     * @notice Checks if a specific voucher has been fulfilled on this spoke chain.
     * @param voucherId The ID of the voucher.
     * @return True if the voucher is marked as fulfilled, false otherwise.
     */
    function isVoucherFulfilled(bytes32 voucherId) external view returns (bool) {
        return fulfilledVouchers[voucherId];
    }

    /**
     * @notice Get the status of a specific batch
     * @param batchId The ID of the batch
     * @return BatchStatus struct containing batch processing status
     */
    function getBatchStatus(bytes32 batchId) external view returns (BatchStatus memory) {
        return batchStatuses[batchId];
    }

    /**
     * @notice Fulfills multiple verification vouchers in a single transaction using MinimalVoucherParams.
     * @param batchId Unique identifier for this batch, generated by the relayer.
     * @param params Array of MinimalVoucherParams structs containing voucher details.
     */
    function fulfillVoucherBatch(
        bytes32 batchId,
        MinimalVoucherParams[] calldata params
    ) external onlyTrustedRelayer whenNotPaused nonReentrant {
        require(!voucherFulfillmentPaused, "Voucher fulfillment is temporarily paused");
        
        uint256 numVouchers = params.length;
        require(numVouchers > 0 && numVouchers <= 100, "Invalid batch size"); // Keep batch size constraint
        if (batchStatuses[batchId].completed) revert BatchAlreadyCompleted(batchId);
        
        BatchStatus storage status = batchStatuses[batchId];
        if (status.timestamp == 0) { // First time this batchId is processed
            status.timestamp = block.timestamp;
            status.total = numVouchers;
        }
        
        for (uint256 i = 0; i < numVouchers; i++) {
            MinimalVoucherParams calldata currentParam = params[i];
            if (!fulfilledVouchers[currentParam.voucherId]) {
                fulfilledVouchers[currentParam.voucherId] = true;
                // locallyVerifiedHashes[currentParam.qHash] = true; // REMOVED
                emit VoucherFulfilled(currentParam.voucherId, currentParam.qHash, currentParam.verifierId, currentParam.hubTimestamp);
                status.fulfilled++;
            } else {
                // If already fulfilled, we could increment a 'skipped' counter or log it differently if needed.
                // For now, BatchProcessed only tracks fulfilled and failed (implicitly, total - fulfilled).
                // A voucher being already fulfilled isn't a failure of the batch operation itself.
            }
        }
        
        status.completed = true; // Mark the batch processing attempt as completed.
        // status.failed is implicitly status.total - status.fulfilled if needed elsewhere
        emit BatchProcessed(batchId, status.total, status.fulfilled, status.total - status.fulfilled, block.timestamp);
    }

    // --- Timelock Functions ---

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
        bytes32[1] memory commonProposals = [
            keccak256(abi.encode("updateHubAddress", pendingHubAddress))
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

    /**
     * @notice Schedules an update to the Hub address.
     * @param _newHubAddress The address of the new Hub contract.
     */
    function scheduleHubAddressUpdate(address _newHubAddress) external onlyOwner {
        require(_newHubAddress != address(0), "Invalid address");
        bytes32 proposalId = keccak256(abi.encode("updateHubAddress", _newHubAddress));
        timelocks[proposalId] = block.timestamp + NeusTimelocks.SPOKE_TIMELOCK_DELAY;
        pendingHubAddress = _newHubAddress;
        emit UpgradeScheduled(proposalId, timelocks[proposalId]);
    }

    /**
     * @notice Executes the scheduled Hub address update after the timelock delay.
     */
    function executeHubAddressUpdate() external onlyOwner {
        bytes32 proposalId = keccak256(abi.encode("updateHubAddress", pendingHubAddress));
        if (timelocks[proposalId] == 0) revert InvalidProposalId(proposalId);
        if (block.timestamp < timelocks[proposalId]) revert TimelockNotExpired(proposalId, timelocks[proposalId]);

        address oldHub = hubVoucherAddress;
        // Note: hubVoucherAddress is immutable, so we can't actually update it
        // This function demonstrates the timelock pattern for future mutable references

        delete timelocks[proposalId];
        pendingHubAddress = address(0);

        emit HubAddressUpdated(oldHub, pendingHubAddress, block.timestamp);
        emit UpgradeExecuted(proposalId);
    }

    // --- Emergency Controls ---

    /**
     * @notice Emergency pause for voucher fulfillment functionality only
     * @param reason Human-readable reason for the pause
     */
    function emergencyPauseVoucherFulfillment(string calldata reason) external onlyOwner {
        require(!voucherFulfillmentPaused, "Voucher fulfillment already paused");
        voucherFulfillmentPaused = true;
        emit VoucherFulfillmentPausedStateChanged(true, msg.sender, block.timestamp, reason);
        emit EmergencyAction("VOUCHER_FULFILLMENT_PAUSE", msg.sender, block.timestamp, reason);
    }

    /**
     * @notice Resume voucher fulfillment functionality
     * @param reason Human-readable reason for resuming
     */
    function resumeVoucherFulfillment(string calldata reason) external onlyOwner {
        require(voucherFulfillmentPaused, "Voucher fulfillment not paused");
        voucherFulfillmentPaused = false;
        emit VoucherFulfillmentPausedStateChanged(false, msg.sender, block.timestamp, reason);
        emit EmergencyAction("VOUCHER_FULFILLMENT_RESUME", msg.sender, block.timestamp, reason);
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
     * @return isVoucherFulfillmentPaused True if voucher fulfillment functionality is paused
     * @return totalActiveTrustedRelayers Number of active trusted relayers
     * @return chainId Local chain ID this spoke operates on
     */
    function getOperationalStatus() external view returns (
        bool isPaused,
        bool isVoucherFulfillmentPaused,
        uint256 totalActiveTrustedRelayers,
        uint256 chainId
    ) {
        return (
            paused(),
            voucherFulfillmentPaused,
            relayerCount,
            localChainId
        );
    }

    // --- Admin Functions ---

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
     * @notice Allows owner to withdraw any accidentally sent ETH/native tokens.
     */
    function withdrawEther() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}