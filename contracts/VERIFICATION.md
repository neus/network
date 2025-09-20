# NEUS Network Contract Verification

Verified smart contract deployments with explorer links.

## Hub Chain (Base Sepolia - 84532)

| Contract | Address | Explorer |
|----------|---------|----------|
| NEUSVerifierRegistry | `0x728Ba14b52d4811e2eDcE37c7e419AB47B0A17Df` | [View](https://sepolia.basescan.org/address/0x728Ba14b52d4811e2eDcE37c7e419AB47B0A17Df) |
| NEUSVoucherHub | `0xD524bd93e51b29C63b921994BF2BA61f8f49FB6C` | [View](https://sepolia.basescan.org/address/0xD524bd93e51b29C63b921994BF2BA61f8f49FB6C) |
| NEUSToken | `0xBe5F4fe3ba4C28DBfB5d9518b6F68F68844e3854` | [View](https://sepolia.basescan.org/address/0xBe5F4fe3ba4C28DBfB5d9518b6F68F68844e3854) |

No mainnet token. NEUSToken listed here is testnet-only (MIT) on Base Sepolia.

## Cross-Chain Storage Spokes

| Chain | Contract | Address | Explorer |
|-------|----------|---------|----------|
| Ethereum Sepolia (11155111) | NEUSVoucherSpoke | `0x4eE5346a253bA26508FC99FAa49932561205359C` | [View](https://sepolia.etherscan.io/address/0x4eE5346a253bA26508FC99FAa49932561205359C) |
| Polygon Amoy (80002) | NEUSVoucherSpoke | `0x5746f86E6BC6AcCF34286Bc8E8803CcAc4a0306d` | [View](https://www.oklink.com/amoy/address/0x5746f86E6BC6AcCF34286Bc8E8803CcAc4a0306d) |
| Arbitrum Sepolia (421614) | NEUSVoucherSpoke | `0x0095E6e6A1CA0E05e56920aeaDc0c8bDDEADcdC1` | [View](https://sepolia.arbiscan.io/address/0x0095E6e6A1CA0E05e56920aeaDc0c8bDDEADcdC1) |
| Optimism Sepolia (11155420) | NEUSVoucherSpoke | `0x24f9Af19693D163576ac49DF3b7a75934bB3B1b4` | [View](https://sepolia-optimism.etherscan.io/address/0x24f9Af19693D163576ac49DF3b7a75934bB3B1b4) |

## Contract ABIs

- [`../abis/NEUSVerifierRegistry.json`](../abis/NEUSVerifierRegistry.json)
- [`../abis/NEUSVoucherHub.json`](../abis/NEUSVoucherHub.json)  
- [`../abis/NEUSVoucherSpoke.json`](../abis/NEUSVoucherSpoke.json)
- [`../abis/NEUSToken.json`](../abis/NEUSToken.json)

## Source Code

- [`NEUSVerifierRegistry.sol`](./NEUSVerifierRegistry.sol) - Main verification registry
- [`NEUSVoucherHub.sol`](./NEUSVoucherHub.sol) - Cross-chain hub
- [`NEUSVoucherSpoke.sol`](./NEUSVoucherSpoke.sol) - Cross-chain spoke
- [`NEUSToken.sol`](./NEUSToken.sol) - Protocol token
- [`INEUSVerifierRegistry.sol`](./INEUSVerifierRegistry.sol) - Registry interface
- [`IVoucherHub.sol`](./IVoucherHub.sol) - Hub interface
