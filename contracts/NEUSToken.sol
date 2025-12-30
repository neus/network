// SPDX-License-Identifier: MIT
// Copyright (c) 2025 NEUS
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NEUSToken
 * @author NEUS (Network for Extensible Universal Security)
 * @notice Native token for the NEUS verification ecosystem.
 * @dev ERC-20 token with faucet functionality for testnet and burn capability
 *      for deflationary tokenomics in the verification fee system.
 *      
 *      Tokenomics Overview:
 *      - Total Supply: 1,000,000,000 NEUS (1 Billion tokens)
 *      - Faucet functionality for development and testing access
 *      - Burnable for fee-based deflationary mechanism (30% of fees burned)
 *      - Owner-controlled minting for initial distribution and ecosystem rewards
 *      - Standard ERC-20 compliance for broad DeFi ecosystem compatibility
 *      
 *      Repository: https://github.com/neusnetwork/neus-network
 *
 * @custom:version 1.0.0-testnet
 * @custom:total-supply 1000000000
 * @custom:deploy-context testnet-showcase
 */
contract NEUSToken is ERC20, ERC20Burnable, Ownable {
    // Tokenomics constants
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 Billion NEUS tokens
    
    // Faucet configuration for testnet
    uint256 public constant FAUCET_AMOUNT = 1000 ether; // 1000 NEUS tokens per claim
    uint256 public constant FAUCET_COOLDOWN = 1 days;
    mapping(address => uint256) public lastFaucetClaim;

    // Events
    event FaucetClaimed(address indexed recipient, uint256 amount, uint256 timestamp);

    /**
     * @dev Constructor
     * @param initialOwner The initial owner of the contract (usually the deployer)
     * @param initialSupply The initial token supply to mint (max: TOTAL_SUPPLY)
     */
    constructor(
        address initialOwner,
        uint256 initialSupply // Should be TOTAL_SUPPLY (1B) for full deployment
    )
        ERC20("NEUS", "NEUS") // Clean branding even for testnet showcase
        Ownable(initialOwner)
    {
        require(initialSupply <= TOTAL_SUPPLY, "Initial supply exceeds maximum");
        
        // Mint initial supply for the owner (e.g., for distribution or protocol use)
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
        }
    }

    /**
     * @notice Allows users to claim testnet NEUS tokens from the faucet.
     * @dev Users can claim `FAUCET_AMOUNT` tokens once per `FAUCET_COOLDOWN` period.
     *      This function is intended for testnet use only.
     */
    function claimFaucet() external {
        require(block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN, "Faucet cooldown not met");
        require(totalSupply() + FAUCET_AMOUNT <= TOTAL_SUPPLY, "Faucet would exceed total supply");
        
        _mint(msg.sender, FAUCET_AMOUNT);
        lastFaucetClaim[msg.sender] = block.timestamp;
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT, block.timestamp);
    }

    /**
     * @dev Mints tokens to a specified address. Can only be called by the owner.
     * @param to The address to mint tokens to.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= TOTAL_SUPPLY, "Mint would exceed total supply");
        _mint(to, amount);
    }

    /**
     * @notice Returns the maximum total supply of NEUS tokens.
     * @return The maximum total supply (1 billion tokens).
     */
    function maxTotalSupply() external pure returns (uint256) {
        return TOTAL_SUPPLY;
    }
}