# NEUS Network - 5-Minute Quickstart

Create your first NEUS proof in 5 minutes.

## Install

```bash
npm install @neus/sdk
```

## Create Your First Proof

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

// Create a content ownership proof
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'My original content'
});

console.log('Proof created:', proof.qHash);

// See also: Privacy controls and options → ./PRIVACY.md
// See also: API endpoints and message format → ./api/README.md
```

### Configure privacy and cross-chain (optional)

Add options when you need specific visibility settings, IPFS anchoring, or cross-chain propagation:
(Learn more: Privacy & options → ./PRIVACY.md; Standards → ./STANDARDS.md)

```javascript
// Full options example: privacy + IPFS + cross-chain
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'My original content',
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

## Check Proof Status

```javascript
const status = await client.getStatus(proof.qHash);
console.log('Verified:', status.success);
// See also: Polling and status flow → ./REFERENCE.md#pollproofstatus
```

## What You Can Verify

### Content Ownership
```javascript
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'My article content'
});
```

### NFT Ownership
```javascript
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

### Token Holdings
```javascript
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



## React Components

```bash
npm install @neus/widgets
```

```jsx
import { VerifyGate } from '@neus/widgets';

<VerifyGate requiredVerifiers={['nft-ownership']}>
  <PremiumContent />
</VerifyGate>
```

## Any Programming Language

Works everywhere via HTTP:

```bash
# Single API call - sign standard format and submit
# See also: Standard Signing String builder and troubleshooting → ./api/README.md#troubleshooting
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

**Message format to sign**:
```
NEUS Verification Request
Wallet: 0x742d35cc6634c0532925a3b8d82ab78c0d73c3db
Chain: 84532
Verifiers: ownership-basic
Data: {"content":"Hello NEUS","owner":"0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db"}
Timestamp: 1678886400000
```

## Privacy Controls

Configure who can access verification details:

```javascript
// Public - publicly accessible verification details
const publicProof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Public content',
  options: { privacyLevel: 'public' }
});

// Private - restricted access; details require wallet authentication  
const privateProof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Private content',
  options: { privacyLevel: 'private' }
});
```

## Error Handling

```javascript
try {
  const proof = await client.verify({
    verifier: 'ownership-basic',
    content: 'My content'
  });
} catch (error) {
  if (error.code === 4001) {
    console.log('User cancelled wallet signature');
  } else {
    console.error('Verification failed:', error.message);
  }
}
```

## Next Steps

- **[Complete Documentation](./REFERENCE.md)** - Technical reference
- **[Available Verifiers](./verifiers/README.md)** - All verification types
- **[Framework Examples](https://github.com/neus/network/tree/main/examples)** - React, Next.js, Node.js apps
- **[Contract Information](./DEPLOYMENTS.md)** - Network addresses and ABIs

## Support

- **Community Questions & Ideas**: [GitHub Discussions](https://github.com/neus/network/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/neus/network/issues)
- **Technical Support**: [dev@neus.network](mailto:dev@neus.network)

---

**Continue with the [Complete Reference](./REFERENCE.md) for advanced integration.**