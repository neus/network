// SPDX-License-Identifier: Business Source License 1.1
// Copyright (c) 2025 NEUS
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./INEUSVerifierRegistry.sol";
import "./NEUSToken.sol";
import "./IVoucherHub.sol";
import "./lib/NeusTimelocks.sol";

/**
 * @title NEUSVerifierRegistry
 * @author NEUS (Network for Extensible Universal Security)
 * @notice Hub contract for NEUS verification system.
 * @dev Manages verification records, fee distribution, and initiates cross-chain voucher creation.
 *      Implements a 30%/70% burn/treasury fee split mechanism for NEUS token economics.
 *      
 *      Key Features:
 *      - Quantum-resistant hash (qHash) based verification tracking
 *      - Modular verifier system for extensible verification types
 *      - Cross-chain propagation via voucher creation
 *      - Built-in fee burning mechanism for deflationary tokenomics
 *      - Timelock-protected critical parameter updates
 *      
 *      Repository: https://github.com/neusnetwork/neus-network
 *      Documentation: https://docs.neus.network
 * 
 * @custom:version 1.0.0-showcase
 * @custom:security-contact security@neus.network
 */
contract NEUSVerifierRegistry is INEUSVerifierRegistry, Ownable, Pausable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    // Contract Metadata and Version Tracking
    string public constant CONTRACT_NAME = "NEUSVerifierRegistry";
    string public constant CONTRACT_VERSION = "1.0.0-showcase";
    uint256 public immutable DEPLOYMENT_TIMESTAMP;
    uint256 public immutable DEPLOYMENT_BLOCK;
    bytes32 public immutable DEPLOYMENT_CODEHASH;

    // Emergency Controls
    bool public crossChainPaused = false;

    // Constants
    uint256 public constant MAX_BASIS_POINTS = 10000; // Used for fee split calculations (100% = 10000)

    // --- State Variables ---
    NEUSToken public neusToken;
    IVoucherHub public voucherHub;
    uint256 public verificationFee; // Fee in NEUS tokens
    uint256 public crossChainFeePerChain; // Fee per target spoke chain
    
    // Fee split configuration (30% burn / 70% treasury)
    uint256 public treasuryBps = 7000; // 70% to treasury by default
    address public treasuryWallet; // Treasury wallet for ecosystem funding
    address public burnWallet; // Burn wallet for deflationary mechanism

    // Trusted relayer management for cross-chain operations
    mapping(address => bool) public trustedRelayers;
    mapping(address => bool) public isRelayer; // For onlyRelayer modifier
    uint256 public relayerCount;
    uint256 public constant MAX_RELAYERS = 10;

    // Credit-based fee payment system
    mapping(address => mapping(address => uint256)) public userCredits; // relayer => user => credits
    mapping(address => uint256) public relayerCredits; // relayer => total credits
    bool public creditBasedFeesEnabled = true; // Enable credit-based fees by default

    // Verification Records
    mapping(bytes32 => Verification) public proofs;
    mapping(bytes32 => uint256[]) public targetChains; // qHash => target chain IDs
    mapping(bytes32 => mapping(uint256 => bool)) private _isVerifiedOnChain; // qHash => chainId => bool
    uint256 public totalVerifications;

    // Nonce tracking for replay protection
    mapping(address => uint256) public nonces;

    // Timelock for critical upgrades
    mapping(bytes32 => uint256) public timelocks; // proposalId => unlockTimestamp
    address public pendingVoucherHub;
    uint256 public pendingVerificationFee;
    uint256 public pendingCrossChainFee;
    
    // Pending fee split updates
    uint256 public pendingTreasuryBps;
    address public pendingTreasuryWallet;
    address public pendingBurnWallet;

    // Verifier Registry Storage - SIMPLIFIED
    mapping(bytes32 => VerifierInfo) public verifierRegistry; // verifierId => VerifierInfo
    mapping(string => bytes32) public verifierTypeToId; // verificationType => verifierId
    uint256 public activeVerifierCount;

    // Additional events not in interface
    event FeesUpdated(uint256 newVerificationFee, uint256 newCrossChainFee, uint256 timestamp);
    event UpgradeScheduled(bytes32 indexed proposalId, uint256 unlockTimestamp);
    event UpgradeExecuted(bytes32 indexed proposalId);
    event RelayerSet(address indexed relayer, bool isAuthorized);
    event FeeConfigurationUpdated(address newTreasuryAddress, address newBurnAddress, uint256 newTreasuryBps);
    event FeePaid(
        address indexed userAddress,
        address indexed relayerAddress,
        uint256 totalFee,
        uint256 treasuryShare,
        uint256 burnShare
    );
    event BatchChainVerificationConfirmed(bytes32[] qHashes, uint256[] chainIds, address indexed relayer, uint256 timestamp);
    
    // Enhanced events for better debugging and monitoring
    event CrossChainPausedStateChanged(bool paused, address indexed admin, uint256 timestamp, string reason);
    event VoucherCreationFailed(bytes32 indexed qHash, uint256[] targetChainIds, string reason, uint256 timestamp);
    event FeePaymentProcessed(address indexed user, address indexed relayer, uint256 totalFee, uint256 treasuryShare, uint256 burnShare, uint256 timestamp);
    
    // Emergency and Administrative Events
    event EmergencyAction(string indexed action, address indexed admin, uint256 timestamp, string details);
    
    // Verifier Registry Implementation Events (additional to interface)
    // event VerifierRegistryEnabled(bool enabled, address indexed admin, uint256 timestamp);
    
    // Errors are defined in INEUSVerifierRegistry interface

    // Modifiers
    modifier onlyTrustedRelayer() {
        if (!trustedRelayers[msg.sender]) revert RelayerNotTrusted(msg.sender);
        _;
    }

    modifier onlyRelayer() {
        require(isRelayer[msg.sender], "NVR: Caller is not an authorized relayer");
        _;
    }

    // --- Constructor ---
    constructor(
        address _initialOwner,
        address _tokenAddress,
        address _voucherHubAddress,
        address _burnWallet,
        address _treasuryWallet,
        uint256 _treasuryBps,
        uint256 _initialVerificationFee, // e.g., 1 ether (1 NEUS)
        uint256 _initialCrossChainFee   // e.g., 0.1 ether (0.1 NEUS)
    ) Ownable(_initialOwner) {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_voucherHubAddress != address(0), "Invalid voucher hub address");
        // Burn wallet can be zero address to enable burning tokens
        require(_treasuryWallet != address(0), "Invalid treasury wallet address");

        neusToken = NEUSToken(_tokenAddress);
        voucherHub = IVoucherHub(_voucherHubAddress);
        burnWallet = _burnWallet;
        treasuryWallet = _treasuryWallet;
        
        // Validate treasury BPS and set with proper bounds
        if (_treasuryBps > MAX_BASIS_POINTS) {
            revert InvalidBasisPoints(_treasuryBps);
        }
        treasuryBps = _treasuryBps;
        
        verificationFee = _initialVerificationFee;
        crossChainFeePerChain = _initialCrossChainFee;

        // @dev: 'isRelayer' governs who can call verifyData()
        //       'trustedRelayers' governs who can confirm cross-chain proofs
        //       These can overlap or be managed independently
        isRelayer[_initialOwner] = true;
        trustedRelayers[_initialOwner] = true;
        relayerCount = 1;
        emit RelayerSet(_initialOwner, true);

        // Initialize DEPLOYMENT_TIMESTAMP, DEPLOYMENT_BLOCK, and DEPLOYMENT_CODEHASH
        DEPLOYMENT_TIMESTAMP = block.timestamp;
        DEPLOYMENT_BLOCK = block.number;
        DEPLOYMENT_CODEHASH = keccak256(abi.encodePacked(address(this).code));
    }

    // --- External Functions ---

    /**
     * @notice Submits content for verification and cross-chain propagation.
     * @dev Takes NEUS token fee, records verification, and creates a voucher via the VoucherHub.
     * @param qHash The quantum-resistant hash (commitment to arbitrary data) to be verified.
     * @param targetChainIds Array of spoke chain IDs (uint256) to propagate verification to.
     * @param proofId Optional identifier for off-chain proof data.
     * @param verificationType Optional string describing the verification type (e.g., content, identity).
     */
    function verifyData(
        address userAddress,
        bytes32 qHash,
        uint256[] calldata targetChainIds,
        string calldata proofId,
        string calldata verificationType
    ) external override onlyRelayer returns (bytes32 primaryVoucherId) {
        require(userAddress != address(0), "Invalid user address");
        require(qHash != bytes32(0), "Invalid qHash");
        require(bytes(proofId).length > 0, "Invalid proof ID");
        require(!proofs[qHash].verified, "Already verified");
        
        // Verifier validation is handled off-chain by the sophisticated validation system

        // Check if cross-chain functionality is paused
        if (targetChainIds.length > 0 && crossChainPaused) {
            emit VoucherCreationFailed(qHash, targetChainIds, "Cross-chain functionality paused", block.timestamp);
            revert("Cross-chain functionality is temporarily paused");
        }

        uint256 totalFee = getVerificationFee(targetChainIds.length);
        _processFeePayment(userAddress, totalFee);

        proofs[qHash] = Verification({
            verifier: userAddress,
            verified: true,
            timestamp: block.timestamp,
            blockNumber: block.number,
            proofId: proofId,
            verificationType: verificationType,
            nonce: _generateNonce(userAddress)
        });
        targetChains[qHash] = targetChainIds;

        // Create a single voucher for all target chains
        primaryVoucherId = _createVouchersForChains(qHash, targetChainIds, userAddress, verificationType);

        // For event consistency, wrap the single voucherId in an array
        bytes32[] memory allVoucherIds = new bytes32[](targetChainIds.length > 0 ? 1 : 0);
        if (targetChainIds.length > 0) {
            allVoucherIds[0] = primaryVoucherId;
        }

        emit VerificationSuccessful(qHash, userAddress, targetChainIds, proofId, verificationType, allVoucherIds);

        totalVerifications++;

        return primaryVoucherId;
    }

    /**
     * @notice Called by a trusted relayer to confirm that a verification has been successfully processed on a spoke chain.
     * @param qHash The quantum-resistant hash of the verified data.
     * @param chainId The spoke chain ID where verification is confirmed.
     */
    function confirmChainVerification(
        bytes32 qHash,
        uint256 chainId
    ) external override whenNotPaused nonReentrant onlyTrustedRelayer {
        nonces[msg.sender]++;
        
        Verification storage v = proofs[qHash];
        if (v.timestamp == 0) revert VerificationNotFound(qHash);

        uint256[] storage targetChainIds = targetChains[qHash];
        bool isTarget = false;
        for (uint i = 0; i < targetChainIds.length; i++) {
            if (targetChainIds[i] == chainId) {
                isTarget = true;
                break;
            }
        }
        if (!isTarget) revert ChainNotTargeted(qHash, chainId);

        if (_isVerifiedOnChain[qHash][chainId]) revert AlreadyVerified(qHash, chainId);

        _isVerifiedOnChain[qHash][chainId] = true;
        emit ChainVerificationConfirmed(qHash, chainId, msg.sender, block.timestamp);
    }

    /**
     * @notice Batch confirm multiple verification-chain pairs in a single transaction
     * @param qHashes Array of quantum-resistant hashes
     * @param chainIds Array of spoke chain IDs where verifications are confirmed
     * @dev Arrays must be same length. Saves 80-90% gas for bulk confirmations
     */
    function confirmChainVerificationBatch(
        bytes32[] calldata qHashes,
        uint256[] calldata chainIds
    ) external whenNotPaused nonReentrant onlyTrustedRelayer {
        if (qHashes.length == 0) revert EmptyBatch();
        if (qHashes.length != chainIds.length) revert BatchSizeMismatch();
        
        nonces[msg.sender]++;
        
        for (uint256 i = 0; i < qHashes.length; i++) {
            bytes32 qHash = qHashes[i];
            uint256 chainId = chainIds[i];
            
            Verification storage v = proofs[qHash];
            if (v.timestamp == 0) revert VerificationNotFound(qHash);

            uint256[] storage targetChainIds = targetChains[qHash];
            bool isTarget = false;
            for (uint j = 0; j < targetChainIds.length; j++) {
                if (targetChainIds[j] == chainId) {
                    isTarget = true;
                    break;
                }
            }
            if (!isTarget) revert ChainNotTargeted(qHash, chainId);

            if (!_isVerifiedOnChain[qHash][chainId]) {
                _isVerifiedOnChain[qHash][chainId] = true;
                emit ChainVerificationConfirmed(qHash, chainId, msg.sender, block.timestamp);
            }
        }
        emit BatchChainVerificationConfirmed(qHashes, chainIds, msg.sender, block.timestamp);
    }

    // --- Relayer Management Functions ---

    /**
     * @notice Add or remove a relayer for both general and trusted operations.
     * @param _relayer Address of the relayer to manage
     * @param _isAuthorized True to add/authorize, false to remove/deauthorize
     */
    function setRelayer(address _relayer, bool _isAuthorized) external onlyOwner {
        require(_relayer != address(0), "NVR: Relayer address cannot be zero");

        if (_isAuthorized) {
            if (isRelayer[_relayer]) revert RelayerAlreadyTrusted(_relayer); // Using existing error for simplicity
            if (relayerCount >= MAX_RELAYERS) revert TooManyRelayers();
            isRelayer[_relayer] = true;
            trustedRelayers[_relayer] = true; // Consolidating logic: a relayer is both general and trusted
            relayerCount++;
        } else {
            if (!isRelayer[_relayer]) revert RelayerNotTrusted(_relayer); // Using existing error for simplicity
            require(relayerCount > 1, "Cannot remove last relayer");
            isRelayer[_relayer] = false;
            trustedRelayers[_relayer] = false;
            relayerCount--;
        }
        emit RelayerSet(_relayer, _isAuthorized);
    }

    // --- View Functions ---

    /**
     * @notice Calculates the total verification fee in NEUS tokens.
     * @param targetChainCount The number of spoke chains to propagate to.
     * @return totalFee The total fee required.
     */
    function getVerificationFee(uint256 targetChainCount) public view override returns (uint256 totalFee) {
        totalFee = verificationFee;
        
        if (targetChainCount > 0) {
            if (crossChainFeePerChain > 0 && targetChainCount > type(uint256).max / crossChainFeePerChain) {
                revert FeeCalculationOverflow();
            }
            uint256 crossChainTotal = crossChainFeePerChain * targetChainCount;
            
            if (totalFee > type(uint256).max - crossChainTotal) {
                revert FeeCalculationOverflow();
            }
            totalFee += crossChainTotal;
        }
    }

    /**
     * @notice Checks if content is verified on a specific chain (hub or spoke).
     * @param qHash The quantum-resistant hash (commitment to arbitrary data).
     * @param chainId The chain ID to check.
     * @return True if verified on the specified chain, false otherwise.
     */
    function isVerifiedOnChain(bytes32 qHash, uint256 chainId) external view override returns (bool) {
        return _isVerifiedOnChain[qHash][chainId];
    }

    /**
     * @notice Retrieves the full verification record for a given content hash.
     * @dev Returns the core details, excluding the chain-specific status map.
     * @param qHash The quantum-resistant hash (commitment to arbitrary data).
     * @return Verification memory The verification record.
     */
    function getVerification(bytes32 qHash) external view override returns (Verification memory) {
        Verification storage storedVerification = proofs[qHash];
        if (storedVerification.timestamp == 0) revert VerificationNotFound(qHash);

        return Verification({
            verifier: storedVerification.verifier,
            verified: storedVerification.verified,
            timestamp: storedVerification.timestamp,
            blockNumber: storedVerification.blockNumber,
            proofId: storedVerification.proofId,
            verificationType: storedVerification.verificationType,
            nonce: storedVerification.nonce
        });
    }

    /**
     * @notice Get current nonce for an address
     * @param addr Address to get nonce for
     * @return Current nonce
     */
    function getNonce(address addr) external view returns (uint256) {
        return nonces[addr];
    }

    /**
     * @notice Check if an address is a trusted relayer (safe view function)
     * @param relayer Address to check
     * @return True if the address is a trusted relayer, false otherwise
     */
    function isTrusted(address relayer) external view returns (bool) {
        return trustedRelayers[relayer];
    }

    // --- Admin Functions ---

    /**
     * @notice Schedules an update to the VoucherHub address.
     * @param _newVoucherHub The address of the new VoucherHub contract.
     */
    function scheduleVoucherHubUpdate(address _newVoucherHub) external onlyOwner {
        require(_newVoucherHub != address(0), "Invalid address");
        bytes32 proposalId = keccak256(abi.encode("updateVoucherHub", _newVoucherHub));
        timelocks[proposalId] = block.timestamp + NeusTimelocks.REGISTRY_TIMELOCK_DELAY;
        pendingVoucherHub = _newVoucherHub;
        emit UpgradeScheduled(proposalId, timelocks[proposalId]);
    }

    /**
     * @notice Executes the scheduled VoucherHub update after the timelock delay.
     */
    function executeVoucherHubUpdate() external onlyOwner {
        bytes32 proposalId = keccak256(abi.encode("updateVoucherHub", pendingVoucherHub));
        if (timelocks[proposalId] == 0) revert InvalidProposalId(proposalId);
        if (block.timestamp < timelocks[proposalId]) revert TimelockNotExpired(proposalId, timelocks[proposalId]);

        address oldHub = address(voucherHub);
        voucherHub = IVoucherHub(pendingVoucherHub);

        delete timelocks[proposalId];
        pendingVoucherHub = address(0);

        emit VoucherHubUpdated(oldHub, address(voucherHub), block.timestamp);
        emit UpgradeExecuted(proposalId);
    }

    /**
     * @notice Schedules an update to the verification fees.
     * @param _newVerificationFee The new base verification fee.
     * @param _newCrossChainFee The new per-chain cross-chain fee.
     */
    function scheduleFeesUpdate(uint256 _newVerificationFee, uint256 _newCrossChainFee) external onlyOwner {
        bytes32 proposalId = keccak256(abi.encode("updateFees", _newVerificationFee, _newCrossChainFee));
        timelocks[proposalId] = block.timestamp + NeusTimelocks.REGISTRY_TIMELOCK_DELAY;
        pendingVerificationFee = _newVerificationFee;
        pendingCrossChainFee = _newCrossChainFee;
        emit UpgradeScheduled(proposalId, timelocks[proposalId]);
    }

    /**
     * @notice Executes the scheduled fee update after the timelock delay.
     */
    function executeFeesUpdate() external onlyOwner {
        bytes32 proposalId = keccak256(abi.encode("updateFees", pendingVerificationFee, pendingCrossChainFee));
        if (timelocks[proposalId] == 0) revert InvalidProposalId(proposalId);
        if (block.timestamp < timelocks[proposalId]) revert TimelockNotExpired(proposalId, timelocks[proposalId]);

        verificationFee = pendingVerificationFee;
        crossChainFeePerChain = pendingCrossChainFee;

        delete timelocks[proposalId];
        pendingVerificationFee = 0;
        pendingCrossChainFee = 0;

        emit FeesUpdated(verificationFee, crossChainFeePerChain, block.timestamp);
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
     * @notice Emergency pause for cross-chain functionality only
     * @param reason Human-readable reason for the pause
     */
    function emergencyPauseCrossChain(string calldata reason) external onlyOwner {
        require(!crossChainPaused, "Cross-chain already paused");
        crossChainPaused = true;
        emit CrossChainPausedStateChanged(true, msg.sender, block.timestamp, reason);
        emit EmergencyAction("CROSS_CHAIN_PAUSE", msg.sender, block.timestamp, reason);
    }

    /**
     * @notice Resume cross-chain functionality
     * @param reason Human-readable reason for resuming
     */
    function resumeCrossChain(string calldata reason) external onlyOwner {
        require(crossChainPaused, "Cross-chain not paused");
        crossChainPaused = false;
        emit CrossChainPausedStateChanged(false, msg.sender, block.timestamp, reason);
        emit EmergencyAction("CROSS_CHAIN_RESUME", msg.sender, block.timestamp, reason);
    }

    /**
     * @notice Withdraws any NEUS tokens accidentally sent to this contract.
     * @dev Distributes any accumulated tokens according to the current split configuration.
     *      This is a recovery mechanism; primary fee flow is direct transfer from user.
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = neusToken.balanceOf(address(this));
        if (balance > 0) {
            uint256 treasuryShare = (balance * treasuryBps) / MAX_BASIS_POINTS;
            uint256 burnShare = balance - treasuryShare;

            if (treasuryShare > 0) {
                if (treasuryWallet == address(0)) {
                    neusToken.burn(treasuryShare);
                    emit FeeBurned(address(this), treasuryShare, block.timestamp);
                } else {
                    require(neusToken.transfer(treasuryWallet, treasuryShare), "Transfer to treasury failed");
                    emit FeeDistributed(address(this), treasuryWallet, treasuryShare, block.timestamp);
                }
            }

            if (burnShare > 0) {
                if (burnWallet == address(0)) {
                    neusToken.burn(burnShare);
                    emit FeeBurned(address(this), burnShare, block.timestamp);
                } else {
                    require(neusToken.transfer(burnWallet, burnShare), "Transfer to burn wallet failed");
                    emit FeeDistributed(address(this), burnWallet, burnShare, block.timestamp);
                }
            }
            
            emit FeesWithdrawn(address(this), balance, block.timestamp);
        }
    }

    // --- Fee Split Functions ---

    // Fee split management functions with timelock protection

    /**
     * @notice Schedules an update to the treasury split configuration.
     * @param _newTreasuryBps The new treasury basis points.
     * @param _newTreasuryWallet The new treasury wallet address.
     * @param _newBurnWallet The new burn wallet address.
     */
    function scheduleTreasurySplitUpdate(
        uint256 _newTreasuryBps,
        address _newTreasuryWallet,
        address _newBurnWallet
    ) external onlyOwner {
        if (_newTreasuryBps > MAX_BASIS_POINTS) revert InvalidBasisPoints(_newTreasuryBps);
        bytes32 proposalId = keccak256(abi.encode("updateTreasurySplit", _newTreasuryBps, _newTreasuryWallet, _newBurnWallet));
        timelocks[proposalId] = block.timestamp + NeusTimelocks.REGISTRY_TIMELOCK_DELAY;
        
        pendingTreasuryBps = _newTreasuryBps;
        pendingTreasuryWallet = _newTreasuryWallet;
        pendingBurnWallet = _newBurnWallet;
        
        emit UpgradeScheduled(proposalId, timelocks[proposalId]);
    }

    /**
     * @notice Executes the scheduled treasury split update after the timelock delay.
     */
    function executeTreasurySplitUpdate() external onlyOwner {
        bytes32 proposalId = keccak256(abi.encode(
            "updateTreasurySplit", 
            pendingTreasuryBps, 
            pendingTreasuryWallet, 
            pendingBurnWallet
        ));
        
        if (timelocks[proposalId] == 0) revert InvalidProposalId(proposalId);
        if (block.timestamp < timelocks[proposalId]) revert TimelockNotExpired(proposalId, timelocks[proposalId]);

        uint256 oldTreasuryBps = treasuryBps;
        address oldTreasuryWallet = treasuryWallet;
        address oldBurnWallet = burnWallet;
        
        treasuryBps = pendingTreasuryBps;
        treasuryWallet = pendingTreasuryWallet;
        burnWallet = pendingBurnWallet;

        delete timelocks[proposalId];
        pendingTreasuryBps = 0;
        pendingTreasuryWallet = address(0);
        pendingBurnWallet = address(0);

        emit UpgradeExecuted(proposalId);
        emit TreasurySplitUpdated(
            treasuryBps, 
            treasuryWallet, 
            burnWallet, 
            block.timestamp, 
            oldTreasuryBps, 
            oldTreasuryWallet, 
            oldBurnWallet
        );
    }

    function _processFeePayment(address _userAddress, uint256 _feeAmount) internal {
        if (_feeAmount == 0) {
            return; // No fee to process
        }

        address relayerAddress = msg.sender; // The relayer (msg.sender of verifyData) facilitates the fee payment
        uint256 treasuryShare = (_feeAmount * treasuryBps) / MAX_BASIS_POINTS;
        uint256 burnShare = _feeAmount - treasuryShare;

        // Try credit-based payment first if enabled
        if (creditBasedFeesEnabled && _tryProcessCreditPayment(_userAddress, relayerAddress, _feeAmount, treasuryShare, burnShare)) {
            return; // Credit payment successful
        }

        // Fallback to direct user payment (legacy method)
        uint256 currentAllowance = neusToken.allowance(_userAddress, address(this));
        require(currentAllowance >= _feeAmount, "NVR: Insufficient NEUS allowance from user");

        if (treasuryShare > 0) {
            // Transfer from user to treasuryWallet
            IERC20(address(neusToken)).safeTransferFrom(_userAddress, treasuryWallet, treasuryShare);
            emit FeeDistributed(_userAddress, treasuryWallet, treasuryShare, block.timestamp);
        }
        
        if (burnShare > 0) {
            address actualBurnRecipient = burnWallet == address(0) ? address(0x000000000000000000000000000000000000dEaD) : burnWallet;
            // Transfer from user to burnWallet/DEAD_ADDRESS
            IERC20(address(neusToken)).safeTransferFrom(_userAddress, actualBurnRecipient, burnShare);
            emit FeeBurned(_userAddress, burnShare, block.timestamp);
        }
        emit FeePaid(_userAddress, relayerAddress, _feeAmount, treasuryShare, burnShare);
    }

    function _tryProcessCreditPayment(address _userAddress, address _relayerAddress, uint256 _feeAmount, uint256 _treasuryShare, uint256 _burnShare) internal returns (bool) {
        // Check if user has sufficient credits with this relayer
        if (userCredits[_relayerAddress][_userAddress] >= _feeAmount) {
            // Deduct from user's credits
            userCredits[_relayerAddress][_userAddress] -= _feeAmount;
            
            // Use tokens from contract balance (from relayer deposits) for fee distribution
            if (_treasuryShare > 0) {
                require(neusToken.transfer(treasuryWallet, _treasuryShare), "Transfer to treasury failed");
                emit FeeDistributed(_userAddress, treasuryWallet, _treasuryShare, block.timestamp);
            }
            
            if (_burnShare > 0) {
                address actualBurnRecipient = burnWallet == address(0) ? address(0x000000000000000000000000000000000000dEaD) : burnWallet;
                require(neusToken.transfer(actualBurnRecipient, _burnShare), "Transfer to burn wallet failed");
                emit FeeBurned(_userAddress, _burnShare, block.timestamp);
            }
            
            emit FeePaidWithCredits(_userAddress, _relayerAddress, _feeAmount, _treasuryShare, _burnShare, block.timestamp);
            return true;
        }
        
        return false; // Insufficient credits, fall back to direct payment
    }

    // --- Voucher Logic ---

    function _generateNonce(address user) private returns (uint256) {
        return ++nonces[user];
    }

    function _createVouchersForChains(
        bytes32 qHash,
        uint256[] calldata targetChainIds,
        address userAddress,
        string calldata verificationType
    ) private returns (bytes32) { // Return a single voucherId
        
        if (address(voucherHub) == address(0) || targetChainIds.length == 0) {
            if (targetChainIds.length == 0) return bytes32(0);
            // Fallback if no hub: generate a local, deterministic ID.
            return keccak256(abi.encodePacked(qHash, userAddress, block.timestamp, verificationType, "no_hub_fallback"));
        }

        bytes32 verifierId = keccak256(bytes(verificationType)); // Derive verifierId

        try voucherHub.createVoucher(qHash, targetChainIds, verifierId) returns (bytes32 voucherId) {
            return voucherId;
        } catch Error(string memory reason) {
            // Return a generated voucher ID even if hub creation fails for tracking.
            return keccak256(abi.encodePacked(qHash, userAddress, block.timestamp, reason));
        } catch (bytes memory /*lowLevelData*/) {
            // Catch low-level errors (e.g., Panic)
            return keccak256(abi.encodePacked(qHash, userAddress, block.timestamp, "hub_panic_fallback"));
        }
    }

    // --- Verifier Registry Functions ---

    /**
     * @notice Register a new verifier in the registry - SIMPLIFIED
     * @param verificationType Unique string identifier for the verification type
     * @return verifierId The generated unique identifier for this verifier
     */
    function registerVerifier(
        string calldata verificationType
    ) external override onlyOwner returns (bytes32 verifierId) {
        require(bytes(verificationType).length > 0, "Verification type cannot be empty");
        
        // Generate verifierId from verificationType for consistency with existing logic
        verifierId = keccak256(bytes(verificationType));
        
        // Check if verifier already exists
        if (verifierTypeToId[verificationType] != bytes32(0)) {
            revert VerifierAlreadyExists(verifierId);
        }
        
        // Create minimal verifier info
        VerifierInfo storage newVerifier = verifierRegistry[verifierId];
        newVerifier.isActive = true;
        newVerifier.registeredAt = block.timestamp;
        
        // Update mappings and counters
        verifierTypeToId[verificationType] = verifierId;
        activeVerifierCount++;
        
        emit VerifierRegistered(
            verifierId,
            verificationType
        );
        
        return verifierId;
    }

    /**
     * @notice Update an existing verifier's status - SIMPLIFIED
     * @param verifierId The ID of the verifier to update
     * @param isActive New active status
     */
    function updateVerifier(
        bytes32 verifierId,
        bool isActive
    ) external override onlyOwner {
        require(verifierTypeToId[""] != verifierId, "Invalid verifier ID"); // Basic check
        
        VerifierInfo storage verifier = verifierRegistry[verifierId];
        bool wasActive = verifier.isActive;
        verifier.isActive = isActive;
        
        // Update active count
        if (wasActive && !isActive) {
            activeVerifierCount--;
        } else if (!wasActive && isActive) {
            activeVerifierCount++;
        }
        
        emit VerifierUpdated(
            verifierId,
            isActive,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Deactivate a verifier (makes it unavailable for new verifications)
     * @param verifierId The ID of the verifier to deactivate
     * @param reason Human-readable reason for deactivation
     */
    function deactivateVerifier(bytes32 verifierId, string calldata reason) external override onlyOwner {
        VerifierInfo storage verifier = verifierRegistry[verifierId];
        
        if (!verifier.isActive) {
            revert VerifierNotActive(verifierId);
        }
        
        verifier.isActive = false;
        activeVerifierCount--;
        
        emit VerifierDeactivated(verifierId, msg.sender, block.timestamp, reason);
    }

    /**
     * @notice Reactivate a previously deactivated verifier
     * @param verifierId The ID of the verifier to reactivate
     */
    function reactivateVerifier(bytes32 verifierId) external override onlyOwner {
        VerifierInfo storage verifier = verifierRegistry[verifierId];
        
        if (verifier.isActive) {
            return; // Already active, no-op
        }
        
        verifier.isActive = true;
        activeVerifierCount++;
        
        emit VerifierReactivated(verifierId, msg.sender, block.timestamp);
    }

    /**
     * @notice Get minimal information about a verifier
     * @param verifierId The ID of the verifier
     * @return VerifierInfo struct containing minimal verifier details
     */
    function getVerifierInfo(bytes32 verifierId) external view override returns (VerifierInfo memory) {
        VerifierInfo storage verifier = verifierRegistry[verifierId];
        if (verifier.registeredAt == 0) {
            revert VerifierNotFound(verifierId);
        }
        return verifier;
    }

    /**
     * @notice Get verifier information by verification type string
     * @param verificationType The verification type string
     * @return VerifierInfo struct containing minimal verifier details
     */
    function getVerifierByType(string calldata verificationType) external view override returns (VerifierInfo memory) {
        bytes32 verifierId = verifierTypeToId[verificationType];
        if (verifierId == bytes32(0)) {
            revert VerifierNotFound(verifierId);
        }
        return verifierRegistry[verifierId];
    }

    /**
     * @notice Check if a verifier is currently active
     * @param verifierId The ID of the verifier
     * @return True if the verifier exists and is active
     */
    function isVerifierActive(bytes32 verifierId) external view override returns (bool) {
        return verifierRegistry[verifierId].isActive;
    }

    /**
     * @notice Get the total number of active verifiers
     * @return The count of currently active verifiers
     */
    function getActiveVerifierCount() external view override returns (uint256) {
        return activeVerifierCount;
    }

    /**
     * @notice Check if a verification type is registered and active
     * @param verificationType The verification type to check
     * @return True if registered and active
     */
    function isVerificationTypeActive(string calldata verificationType) external view returns (bool) {
        bytes32 verifierId = verifierTypeToId[verificationType];
        if (verifierId == bytes32(0)) {
            return false;
        }
        return verifierRegistry[verifierId].isActive;
    }

    // --- Credit-Based Fee Management ---

    /**
     * @notice Enable or disable credit-based fee system
     * @param enabled True to enable credit-based fees, false to use direct user payments
     */
    function setCreditBasedFeesEnabled(bool enabled) external onlyOwner {
        creditBasedFeesEnabled = enabled;
        emit CreditBasedFeesToggled(enabled, msg.sender, block.timestamp);
    }

    /**
     * @notice Deposit NEUS tokens as credits for a relayer
     * @param amount Amount of NEUS tokens to deposit as credits
     */
    function depositRelayerCredits(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        require(isRelayer[msg.sender], "Only relayers can deposit credits");
        
        // Transfer tokens from relayer to this contract
        IERC20(address(neusToken)).safeTransferFrom(msg.sender, address(this), amount);
        
        relayerCredits[msg.sender] += amount;
        emit RelayerCreditsDeposited(msg.sender, amount, relayerCredits[msg.sender], block.timestamp);
    }

    /**
     * @notice Allocate credits to a user from relayer's credit pool
     * @param userAddress User to allocate credits to
     * @param amount Amount of credits to allocate
     */
    function allocateUserCredits(address userAddress, uint256 amount) external {
        require(userAddress != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than zero");
        require(isRelayer[msg.sender], "Only relayers can allocate credits");
        require(relayerCredits[msg.sender] >= amount, "Insufficient relayer credits");
        
        relayerCredits[msg.sender] -= amount;
        userCredits[msg.sender][userAddress] += amount;
        
        emit UserCreditsAllocated(msg.sender, userAddress, amount, userCredits[msg.sender][userAddress], block.timestamp);
    }

    /**
     * @notice Get user's available credits with a specific relayer
     * @param relayer Relayer address
     * @param user User address
     * @return Available credits
     */
    function getUserCredits(address relayer, address user) external view returns (uint256) {
        return userCredits[relayer][user];
    }

    /**
     * @notice Get relayer's total available credits
     * @param relayer Relayer address
     * @return Available credits
     */
    function getRelayerCredits(address relayer) external view returns (uint256) {
        return relayerCredits[relayer];
    }
}