# Contract Deployments & Addresses

## Network Configuration

NEUS Network operates on a hub-and-spoke architecture with verification processing centralized on Base Sepolia and optional cross-chain proof storage on multiple testnet networks.

### Hub Chain - Base Sepolia (Chain ID: 84532)

All verification processing occurs on the hub chain:

| Contract | Address | Explorer |
|----------|---------|----------|
| **NEUSVerifierRegistry** | `0x728Ba14b52d4811e2eDcE37c7e419AB47B0A17Df` | [BaseScan](https://sepolia.basescan.org/address/0x728Ba14b52d4811e2eDcE37c7e419AB47B0A17Df) |
| **NEUSVoucherHub** | `0xD524bd93e51b29C63b921994BF2BA61f8f49FB6C` | [BaseScan](https://sepolia.basescan.org/address/0xD524bd93e51b29C63b921994BF2BA61f8f49FB6C) |
| **NEUSToken** | `0x9e8387A563e124868aa6c6064E6f29c2ce745935` | [BaseScan](https://sepolia.basescan.org/address/0x9e8387A563e124868aa6c6064E6f29c2ce745935) |

No mainnet token. NEUSToken listed here is testnet-only (MIT) on Base Sepolia.

### Cross-Chain Storage Spokes

Optional proof storage contracts on testnet networks:

| Network | Chain ID | Contract Address | Explorer |
|---------|----------|------------------|----------|
| **Ethereum Sepolia** | 11155111 | `0x4eE5346a253bA26508FC99FAa49932561205359C` | [Etherscan](https://sepolia.etherscan.io/address/0x4eE5346a253bA26508FC99FAa49932561205359C) |
| **Polygon Amoy** | 80002 | `0x5746f86E6BC6AcCF34286Bc8E8803CcAc4a0306d` | [OKLink](https://www.oklink.com/amoy/address/0x5746f86E6BC6AcCF34286Bc8E8803CcAc4a0306d) |
| **Arbitrum Sepolia** | 421614 | `0x0095E6e6A1CA0E05e56920aeaDc0c8bDDEADcdC1` | [Arbiscan](https://sepolia.arbiscan.io/address/0x0095E6e6A1CA0E05e56920aeaDc0c8bDDEADcdC1) |
| **Optimism Sepolia** | 11155420 | `0x24f9Af19693D163576ac49DF3b7a75934bB3B1b4` | [Etherscan](https://sepolia-optimism.etherscan.io/address/0x24f9Af19693D163576ac49DF3b7a75934bB3B1b4) |

## Genesis Pass Contract (Production)

### Base Mainnet (Chain ID: 8453)

| Contract | Address | Explorer |
|----------|---------|----------|
| **LicenseNFT (Genesis Pass)** | `0x056c50168C6754f7Dd03E283460B59e0438c5a79` | [BaseScan](https://basescan.org/address/0x056c50168C6754f7Dd03E283460B59e0438c5a79) |

## Contract ABIs

Complete contract ABIs are available in the open-source repository:

- [NEUSVerifierRegistry.json](../abis/NEUSVerifierRegistry.json)
- [NEUSVoucherHub.json](../abis/NEUSVoucherHub.json)
- [NEUSVoucherSpoke.json](../abis/NEUSVoucherSpoke.json)
- [NEUSToken.json](../abis/NEUSToken.json)

## Source Code

All smart contract source code is available under Business Source License 1.1:

- [Smart Contracts](../contracts/)
- [License Terms](../contracts/LICENSE)

Note: Core contracts are under BSL 1.1; the testnet NEUSToken is MIT-licensed.

## Verification Status

All deployed contracts have been verified on their respective blockchain explorers. Source code matches the deployed bytecode and can be independently verified.

## Network Status

Current deployment status: **Genesis Phase (Hybrid Mainnet/Testnet)**

### Production Components
- **Genesis Pass NFT**: Live on Base Mainnet (8453) - production ready
- **Asset Verification**: Uses mainnet blockchain data for all verifiers
- **Genesis Campaign**: Active on mainnet with 7-day mint window

### Development Components  
- **Hub Processing**: Base Sepolia (84532) - testnet for verification processing
- **Cross-chain Propagation**: Operational across all spoke testnets
- **Protocol Infrastructure**: Testnet contracts for development and testing

### Mainnet Migration
Protocol infrastructure (VerifierRegistry, VoucherHub, Token) will migrate to mainnet following successful Genesis campaign completion and community validation.

## Contact

For technical questions about deployments:
- **Technical Support**: dev@neus.network
- **General Inquiries**: info@neus.network

---

**Current Status**: Genesis Phase with hybrid mainnet/testnet deployment. Genesis Pass NFT is live on Base Mainnet. Protocol infrastructure operates on testnets during Genesis campaign.
