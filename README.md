# NEUS Network

[![License](https://img.shields.io/badge/License-BUSL--1.1%20(contracts)%20%7C%20Apache--2.0%20(SDK)-blue)](./LICENSE)
[![npm](https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=@neus/sdk)](https://www.npmjs.com/package/%40neus%2Fsdk)


**NEUS is a proof-of-anything infrastructure—a secure, privacy-first verification network that works across all apps, chains, and identities.**

## Key Features

- **Wallet-based authentication** - No accounts or API keys
- **Cross-chain proofs** - Verify once, use everywhere  
- **Privacy controls** - Public or private verification options
- **Multiple verifiers** - Content, NFTs, tokens, licenses

⚠️ Disclaimer: Pilot Phase
Live and open for use, but **not recommended for production deployments**. 
NEUS is committed to non-disruptive changes and will communicate updates prior to release.

## Quick Start

### JavaScript SDK (Recommended)

```bash
npm install @neus/sdk
```

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS Network'
});

console.log('Proof created:', proof.qHash);
```

#### Configure privacy and cross-chain (optional)

Add options only when you need public visibility, IPFS anchoring, or cross-chain propagation:

```javascript
// Full options example: privacy + IPFS + cross-chain
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS Network',
  options: {
    // Privacy
    privacyLevel: 'private',        // 'private' or 'public'
    publicDisplay: false,           // Public UI previews (requires privacyLevel='public')
    storeOriginalContent: false,    // Include full plaintext in public snapshot (public only)

    // Distribution
    enableIpfs: true,               // Create privacy-aware IPFS snapshot
    targetChains: [11155111, 80002],// Propagate to Ethereum Sepolia + Polygon Amoy

    // Optional public metadata (used when privacyLevel='public')
    meta: {
      publicTitle: 'Ownership proof',
      contentType: 'text/plain',
      displayName: 'NEUS user'
    }
  }
});
```

### HTTP API (Any Language)

```bash
curl -X POST https://api.neus.network/api/v1/verification \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db",
    "signature": "0x...",
    "verifierIds": ["ownership-basic"],
    "data": {"content": "Hello NEUS", "owner": "0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db"},
    "options": {
      "privacyLevel": "private",
      "publicDisplay": false,
      "storeOriginalContent": false,
      "enableIpfs": true,
      "targetChains": [11155111, 80002]
    },
    "signedTimestamp": 1678886400000,
    "chainId": 84532
  }'
```

**Message to sign**:
```
NEUS Verification Request
Wallet: 0x742d35cc6634c0532925a3b8d82ab78c0d73c3db
Chain: 84532
Verifiers: ownership-basic
Data: {"content":"Hello NEUS","owner":"0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db"}
Timestamp: 1678886400000
```

## What You Can Verify

- **Content Ownership** - Prove authorship of content
- **NFT Ownership** - Verify ownership of specific NFTs  
- **Token Holdings** - Prove balances without revealing amounts
- **Licensed Content** - Verify content rights via licenses

## Use Cases

### Content Creators
```javascript
// Create a content ownership proof
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'My original article'
});
```

### NFT Communities  
```javascript
// Verify NFT ownership for exclusive access
const proof = await client.verify({
  verifier: 'nft-ownership',
  data: {
    ownerAddress: walletAddress,
    contractAddress: '0x...',
    tokenId: '1234',
    chainId: 1
  }
});
```

### DAO Governance
```javascript
// Verify token holdings for voting eligibility
const proof = await client.verify({
  verifier: 'token-holding', 
  data: {
    ownerAddress: walletAddress,
    contractAddress: '0x...',
    minBalance: '100.0',
    chainId: 1
  }
});
```

## Available Packages

### [@neus/sdk](./sdk/) - JavaScript SDK
```bash
npm install @neus/sdk
```

### [@neus/widgets](./widgets/) - React components
```bash
npm install @neus/widgets @neus/sdk
```

## Framework Examples

- **[React App](./examples/react-app/)** - Complete React integration
- **[Next.js App](./examples/nextjs-app/)** - App Router patterns
- **[Node.js Backend](./examples/nodejs-backend/)** - API integration
- **[Basic Examples](./examples/)** - cURL, Node.js, Safe wallets

## Documentation

- **[5-Minute Tutorial](./docs/QUICKSTART.md)** - Quick integration guide
- **[API Reference](./docs/api/index.md)** - HTTP API
- **[All Verifiers](./docs/verifiers/README.md)** - Verification types
- **[Complete Documentation](./docs/)** - Technical documentation
- **[Governance](./docs/GOVERNANCE.md)** - Governance model and DAO
- **[Legal Information](./docs/LEGAL.md)** - Terms, privacy, and legal framework

## Network Details

**API Endpoint**: https://api.neus.network  
**Hub Chain**: Base Sepolia (84532)  
**Contract Addresses**: [deployments.json](./deployments.json)

## Current Status

**Testnet**: Free verification services for development and testing

## Contributing

We welcome contributions to the NEUS Network ecosystem:

- **Bug Reports**: [GitHub Issues](https://github.com/neus/network/issues)
- **Ideas & Feature Requests**: [GitHub Discussions](https://github.com/neus/network/discussions)
- **New Verifiers**: See [Contributing Guidelines](./CONTRIBUTING.md) and open PRs to `verifier-staging`
- **Documentation Improvements**: Submit pull requests

## Support

- **Community Questions & Ideas**: [GitHub Discussions](https://github.com/neus/network/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/neus/network/issues)
- **Technical Questions**: dev@neus.network
- **Partnership Inquiries**: info@neus.network
- **Security Issues**: dev@neus.network

## Repository Structure

```
/sdk          # @neus/sdk - JavaScript client
/widgets      # @neus/widgets - React components  
/docs         # Developer documentation
/examples     # Integration examples
/contracts    # Smart contract source
/abis         # Contract ABIs
/signing      # Multi-language implementations
```

## License & Legal

- **Smart Contracts**: Business Source License 1.1 (converts to Apache 2.0 on August 1, 2028)
- **SDK & Developer Tools**: Apache 2.0 License (unrestricted commercial use)
- **ABIs**: Apache 2.0 (maximum interoperability for integrators)

**Legal Framework**: [Legal documentation](https://docs.neus.network/learn/legal/) | [Repository overview](./docs/LEGAL.md)

See [LICENSE](./LICENSE) for complete dual-license terms.

---

**NEUS Network | The Proof Layer**

© NEUS Network, Inc. All rights reserved. See LICENSE.