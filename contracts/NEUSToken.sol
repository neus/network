// SPDX-License-Identifier: MIT
// Copyright (c) 2025 NEUS Network Inc.
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NEUS Token (Testnet)
 * @author NEUS
 * @notice ERC-20 utility token for the NEUS verification ecosystem.
 * @dev Fixed-supply, burnable token. Full supply is minted at deployment to the
 *      designated owner. No post-deployment minting capability.
 * @custom:version 1.0.0
 * @custom:total-supply 1000000000
 */
contract NEUSToken is ERC20, ERC20Burnable, Ownable {
    // Tokenomics constants
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 Billion NEUS tokens
    
    /**
     * @dev Mints the initial supply to the owner and sets ownership.
     * @param initialOwner Address receiving the initial supply and ownership.
     * @param initialSupply Initial token supply to mint (must equal TOTAL_SUPPLY).
     */
    constructor(
        address initialOwner,
        uint256 initialSupply // Should be TOTAL_SUPPLY (1B) for full deployment
    )
        ERC20("NEUS", "NEUS")
        Ownable(initialOwner)
    {
        require(initialSupply == TOTAL_SUPPLY, "Initial supply must equal max supply");

        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
        }
    }

    /**
     * @notice Returns the maximum token supply.
     * @return The maximum total supply in wei.
     */
    function maxTotalSupply() external pure returns (uint256) {
        return TOTAL_SUPPLY;
    }
}