# Verifier Specification

Technical specification for building verifiers that integrate with NEUS Network.

## Verifier IDs

- Use kebab‑case: `[a-z0-9-]{1,48}` (e.g., `ownership-basic`, `nft-ownership`)
- ID maps on‑chain as: `bytes32 verifierId = keccak256(bytes(verificationType))`
- Use exact same string across SDK/API/docs

## Request Structure

```json
{
  "verifierIds": ["ownership-basic"],
  "data": { /* verifier-specific input */ },
  "walletAddress": "0x...",
  "signature": "0x...",
  "signedTimestamp": 1730000000000,
  "chainId": 84532,
  "options": {
    "privacyLevel": "private|public",
    "targetChains": [11155111, 80002], // TESTNET chains only
    "enableIpfs": false,
    "publicDisplay": false,
    "storeOriginalContent": false
  }
}
```

## Response Structure

```json
{
  "success": true,
  "status": "verified",
  "data": {
    "qHash": "0x...",
    "verifierIds": ["ownership-basic"],
    "verifiedVerifiers": [
      {
        "verifierId": "ownership-basic",
        "verified": true,
        "data": { /* verifier-specific result */ },
        "status": "verified",
        "zkInfo": { "zkStatus": "zk_not_required" }
      }
    ]
  }
}
```

## Verifier Schemas (current)

### ownership-basic

**Input:**
```json
{
  "content": "string (required)",
  "owner": "address (required)", 
  "reference": {
    "type": "string (required) - url|ipfs|tx|other",
    "id": "string (required)"
  }
}
```

**Output:**
```json
{
  "owner": "0x...",
  "reference": {"type": "content", "id": "..."},
  "verifierContentHash": "0x...",
  "timestamp": 1730000000000
}
```

### nft-ownership

**Input:**
```json
{
  "ownerAddress": "address (required)",
  "contractAddress": "address (required)",
  "tokenId": "string (required)",
  "chainId": "number (required) - 1|137|42161|10|8453",
  "tokenType": "string (optional) - erc721|erc1155"
}
```

**Output:**
```json
{
  "input": {
    "ownerAddress": "0x...",
    "contractAddress": "0x...",
    "tokenId": "1234",
    "chainId": 1,
    "tokenType": "erc721"
  },
  "onChainData": {
    "actualOwner": "0x..." // ERC721
  },
  "verificationTimestamp": 1730000000000
}
```

### token-holding

**Input:**
```json
{
  "ownerAddress": "address (required)",
  "contractAddress": "address (required)",
  "minBalance": "string (required) - human-readable format",
  "chainId": "number (required) - 1|137|42161|10|8453"
}
```

### ownership-licensed

**Input:**
```json
{
  "content": "string (required)",
  "owner": "address (required)",
  "license": {
    "contractAddress": "address (required)",
    "tokenId": "string (required)",
    "chainId": "number (required) - 1|137|42161|10|8453",
    "ownerAddress": "address (required)",
    "type": "string (optional) - erc721|erc1155"
  },
  "reference": {
    "type": "string (optional) - url|ipfs|tx|other",
    "id": "string (optional)"
  }
}
```

**Output:**
```json
{
  "content": "Pro Tools License",
  "license": {
    "contractAddress": "0x...",
    "tokenId": "1",
    "chainId": 1,
    "ownerAddress": "0x...",
    "type": "erc721"
  },
  "onChainData": {
    "actualOwner": "0x..."
  },
  "verificationTimestamp": 1730000000000
}
```

**Output:**
```json
{
  "input": {
    "ownerAddress": "0x...",
    "contractAddress": "0x...",
    "minBalance": "100.0",
    "chainId": 1
  },
  "onChainData": {
    "requiredMinBalance": "100.0"
  },
  "verificationTimestamp": 1730000000000
}
```



## Manual Signing

```javascript
import { buildVerificationRequest } from '@neus/sdk';

const { message, request } = buildVerificationRequest({
  verifierIds: ['ownership-basic'],
  data: { content: 'Hello' },
  walletAddress: '0x...',
  options: { targetChains: [11155111] } // TESTNET storage only
});

const signature = await wallet.signMessage(message);

await fetch('/api/v1/verification', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ ...request, signature })
});
```

## Validation

```javascript
import { validateVerifierPayload } from '@neus/sdk';

const validation = validateVerifierPayload('verifier-id', data);
if (!validation.valid) {
  console.error('Validation failed:', validation.error);
}
```

## Network Configuration

- **Asset verification**: Use mainnet chains (1, 137, 42161, 10, 8453)
- **Proof storage**: Use testnet chains (11155111, 80002, 421614, 11155420)  
- **Hub chain**: 84532 (Base Sepolia) - never include in targetChains

## Contributing

See [contributing.md](./contributing.md) for submission process and review criteria.