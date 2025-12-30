// SPDX-License-Identifier: MIT
// Copyright (c) 2025 NEUS
pragma solidity ^0.8.20;

/**
 * @title IVoucherHub
 * @author NEUS (Network for Extensible Universal Security)
 * @notice Interface for the NEUS Voucher Hub, compatible with ERC-7683 concepts.
 * @dev Defines the standard functions and events for creating and managing
 *      cross-chain verification vouchers on the hub chain.
 *      
 *      This interface establishes the contract between the verification registry
 *      and the voucher propagation system, enabling seamless cross-chain
 *      verification distribution through an event-driven architecture.
 *      
 *      Repository: https://github.com/neusnetwork/neus-network
 * 
 * @custom:version 2.0.2-minimal_batch_finalized
 * @custom:security-contact security@neus.network
 */
interface IVoucherHub {
    /**
     * @notice Emitted when a new verification voucher is created.
     * @param voucherId Unique identifier for the voucher.
     * @param qHash The quantum-resistant hash (commitment to arbitrary data) being verified.
     * @param targetChainIds Array of chain IDs where the verification should be propagated. 
     *                       For vouchers created via createMinimalVoucherBatch, this will contain a single chainId.
     * @param verifierId Identifier for the verifier related to this voucher's context (used in voucherId generation).
     * @param timestamp The time the voucher was created on the Hub.
     */
    event VoucherCreated(
        bytes32 indexed voucherId,
        bytes32 indexed qHash,
        uint256[] targetChainIds, // Remains an array for event consistency, will hold one element for minimal batch
        bytes32 indexed verifierId,        // New indexed field
        uint256 timestamp
    );

    /**
     * @notice Emitted when a voucher is marked as fulfilled on the Hub chain for a specific target chain.
     * @param voucherId Unique identifier for the voucher.
     * @param qHash The quantum-resistant hash (commitment to arbitrary data) being verified.
     * @param chainId The target chain ID for which fulfillment is confirmed on the Hub.
     * @param timestamp The time the fulfillment was recorded on the Hub.
     */
    event VoucherFulfilledOnHub(
        bytes32 indexed voucherId,
        bytes32 indexed qHash,
        uint256 indexed chainId,
        uint256 timestamp
    );

    /**
     * @notice Struct representing a verification voucher's stored data.
     * @param qHash The quantum-resistant hash (commitment to arbitrary data) being verified.
     * @param targetChainIds Array of chain IDs for propagation (will contain one ID if created via minimal batch).
     * @param verifierId Identifier for the verifier related to this voucher.
     * @param timestamp Creation timestamp on the Hub.
     * @param isActive Indicates if the voucher is still active (e.g., not cancelled).
     * @param creator Address that initiated the voucher creation (e.g., the registry).
     */
    struct Voucher {
        bytes32 qHash;
        uint256[] targetChainIds;
        bytes32 verifierId; // New field
        uint256 timestamp;
        bool isActive;
        address creator;
    }

    /**
     * @notice Input parameters for creating a voucher with minimal calldata, targeting a single chain per entry.
     * @param qHash The quantum-resistant hash of the verified content.
     * @param targetChainId The specific target chain ID for this voucher instance.
     * @param verifierId Identifier for the verifier context, used in voucherId generation.
     */
    struct MinimalVoucherParams {
        bytes32 qHash;
        uint256 targetChainId;
        bytes32 verifierId;
    }

    /**
     * @notice Creates new verification vouchers in batch using minimal parameters.
     * @dev Each entry in `params` results in a unique voucherId.
     *      The voucherId is deterministically generated using qHash, targetChainId, verifierId, and a nonce.
     * @param params Array of MinimalVoucherParams structs.
     * @return voucherIds Array of unique identifiers for the created vouchers.
     * @custom:deprecated This function is inefficient and will be removed. Use createVoucher instead.
     */
    function createMinimalVoucherBatch(
        MinimalVoucherParams[] calldata params
    ) external returns (bytes32[] memory voucherIds);

    /**
     * @notice Creates a new verification voucher for multiple target chains.
     * @dev This is the preferred method for creating vouchers.
     * @param qHash The quantum-resistant hash of the verified content.
     * @param targetChainIds Array of chain IDs where the verification should be propagated.
     * @param verifierId Identifier for the verifier context.
     * @return voucherId The unique identifier for the created voucher.
     */
    function createVoucher(
        bytes32 qHash,
        uint256[] calldata targetChainIds,
        bytes32 verifierId
    ) external returns (bytes32 voucherId);

    /**
     * @notice Retrieves the details of a specific voucher.
     * @param voucherId The unique identifier of the voucher.
     * @return The Voucher struct containing its details.
     */
    function getVoucher(bytes32 voucherId) external view returns (Voucher memory);

    /**
     * @notice Checks if a voucher has been marked as fulfilled on the Hub chain for a specific target chain.
     * @param voucherId The unique identifier of the voucher.
     * @param chainId The target chain ID to check fulfillment for on the Hub.
     * @return True if the voucher is marked as fulfilled on the Hub for the given chain, false otherwise.
     */
    function isVoucherFulfilledOnHub(bytes32 voucherId, uint256 chainId) external view returns (bool);
} 