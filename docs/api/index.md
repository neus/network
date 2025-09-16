---
title: API Reference
---

# NEUS Network API

**Single HTTP call verification with wallet signatures.**

## Core Concept

1. **Sign a standard message** with your wallet
2. **Submit one HTTP request** with your signature
3. **Get a cryptographic proof** that can't be faked

## Authentication

**Wallet signatures only** - No accounts, passwords, or API keys required.

## Available Operations

- **Create verification proofs** - Ownership, assets, content, credentials
- **Check proof status** - Real-time verification status
- **List verifier types** - See all available verification types

## Standard Message Format

Sign this exact 6-line structure with your wallet:

```
NEUS Verification Request
Wallet: {lowercase_address}
Chain: 84532
Verifiers: {verifier_id}
Data: {deterministic_json}
Timestamp: {unix_ms}
```

## Main Endpoints

### Create Verification
```
POST /api/v1/verification
```

### Check Status
```
GET /api/v1/verification/status/{qHash}
```

### List Verifiers
```
GET /api/v1/verification/verifiers
```

## Quick Example

```bash
curl -X POST https://api.neus.network/api/v1/verification \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db",
    "signature": "0x...",
    "verifierIds": ["ownership-basic"],
    "data": {"content": "Hello NEUS", "owner": "0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db"},
    "signedTimestamp": 1678886400000,
    "chainId": 84532
  }'
```

---

## Technical Details

### Signature Requirements
- **EIP-191** for standard wallets, **EIP-1271/6492** for contract wallets
- **5-minute** timestamp validity window
- **Lowercase** wallet address in message
- **Deterministic** JSON formatting
- **Replay protection** enforced

### Troubleshooting

**Having signature issues?**

1. Use `/api/v1/verification/diagnose` to debug signature problems
2. Use `/api/v1/verification/standardize` to get exact message format
3. Check: lowercase address, LF newlines, fresh timestamp

**For Node.js**: Use the SDK. **For other languages**: Build the standard six-line message format.

### Message Format Example

**Standard Signing String:**
```
NEUS Verification Request
Wallet: 0x742d35cc6634c0532925a3b8d82ab78c0d73c3db
Chain: 84532
Verifiers: ownership-basic
Data: {"content":"Hello NEUS","owner":"0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db"}
Timestamp: 1678886400000
```

**Key Requirements:**
- Wallet address must be lowercase in message
- Data must be deterministic JSON (keys sorted)
- Timestamp must be fresh (within 5 minutes)
- Chain must be 84532 (Base Sepolia hub)

## API Endpoints

### Main Endpoints

| Endpoint | What It Does | When To Use |
|----------|--------------|-------------|
| `POST /api/v1/verification` | **Create a proof** | When user wants to verify something |
| `GET /api/v1/verification/status/{qHash}` | **Check proof status** | To see if a proof is valid |
| `GET /api/v1/verification/verifiers` | **List available verifiers** | To see what you can verify |

### Troubleshooting Endpoints

| Endpoint | What It Does | When To Use |
|----------|--------------|-------------|
| `POST /api/v1/verification/diagnose` | **Debug signature issues** | When signatures fail (any environment) |
| `POST /api/v1/verification/standardize` | **Get exact signing format** | Helper for message format issues |

### Additional Endpoints

| Endpoint | What It Does |
|----------|--------------|
| `POST /api/v1/proofs/{qHash}/revoke-self` | Revoke your own proof |
| `GET /api/v1/health` | Check if the API is working |

### Flow
1. List verifiers
2. Create proof
3. Read result (200) or poll (202)
4. Optional: revoke own proof

### Response Types
- **200 Success**: Verification completed immediately (hub-only, no cross-chain)
- **202 Accepted**: Verification accepted for processing (cross-chain or async verification)
  - Use the `statusUrl` to poll for completion
  - Status progression: `processing_verifiers` → `verified` → `verified_crosschain_propagated`

### Multi-verifier requests

You can request multiple verifiers in a single proof. Provide all IDs in `verifierIds` and pass a namespaced `data` object keyed by verifier ID.

```json
{
  "verifierIds": ["nft-ownership", "token-holding"],
  "data": {
    "nft-ownership": {
      "ownerAddress": "0x...",
      "contractAddress": "0x...",
      "tokenId": "1234",
      "chainId": 1
    },
    "token-holding": {
      "ownerAddress": "0x...",
      "contractAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      "minBalance": "100.0",
      "chainId": 1
    }
  },
  "walletAddress": "0x...",
  "signature": "0x...",
  "signedTimestamp": 1730000000000,
  "chainId": 84532,
  "options": { "privacyLevel": "private", "targetChains": [421614] }
}
```

Response contains `verifiedVerifiers[]` (one per verifier). Consider success when required verifiers return `verified: true`.

Note: For multi‑verifier requests, the OpenAPI models `data` as a generic object. Validation is enforced per‑key server‑side based on each verifier ID.

## Rate Limits

- **Verification creation**: Strict per-wallet limits with progressive throttling
- **Status checks**: Per-IP rate limiting with automatic back-off
- **Health checks**: Unrestricted  
## Error Handling

All errors return this standard format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_WALLET_ADDRESS",
    "message": "Invalid wallet address format", 
    "type": "ValidationError"
  },
  "timestamp": 1730000000000,
  "requestId": "..."
}
```

**Common error codes**:
- `INVALID_WALLET_ADDRESS` - Wallet address format is wrong
- `SIGNATURE_INVALID` - Wallet signature verification failed
- `VERIFIER_NOT_FOUND` - Verifier ID doesn't exist

## Verification patterns

- 200 Success: immediate (hub-only)
- 202 Accepted: async (cross-chain or longer processing). Poll `/api/v1/verification/status/{qHash}`.

### Getting Results Without Polling

For immediate results, check the response status:
```javascript
const response = await fetch('/api/v1/verification', { /* request */ });
const result = await response.json();

if (response.status === 200) {
  // Verification completed immediately
  console.log('Verified:', result.data.verifiedVerifiers[0].verified);
} else if (response.status === 202) {
  // Need to poll for completion
  const finalResult = await pollStatus(result.data.qHash);
}
```

Examples:

## Real API Response Examples

### Basic Ownership Verification (Hub Only)

**Request**: `ownership-basic` verifier, no cross-chain propagation

```json
{
  "success": true,
  "data": {
    "qHash": "0x57ef6af456233537b63a9afe43dedd02b17d00e0a94b764cf96115bce5260329",
    "status": "verified",
    "walletAddress": "0x742d35cc6d1ec9c5b5d89cb2d5d8d86e34b0f743",
    "verifierIds": ["ownership-basic"],
    "verifiedVerifiers": [
      {
        "verifierId": "ownership-basic",
        "verified": true,
        "data": {
          "owner": "0x742d35cc6d1ec9c5b5d89cb2d5d8d86e34b0f743",
          "reference": {
            "type": "content", 
            "id": "https://example.com/my-content"
          },
          "verifierContentHash": "0x1a2b3c4d5e6f...",
          "timestamp": 1755700135798,
          "chainId": 84532
        },
        "status": "origin-authenticated",
        "zkInfo": {
          "zkStatus": "zk_not_required"
        }
      }
    ],
    "options": {
      "enableIpfs": false,
      "forceZK": false,
      "publicDisplay": false,
      "storeOriginalContent": false,
      "verifierOptions": {},
      "privacyLevel": "private",
      "meta": {}
    },
    "createdAt": 1755700135798,
    "completedAt": 1755700136000,
    "lastUpdated": 1755700136000
  }
}
```

### NFT Ownership with Cross-Chain Propagation

**Request**: `nft-ownership` verifier with `targetChains: [421614, 11155111, 80002]`

```json
{
  "success": true,
  "data": {
    "qHash": "0x89abc123def456789abc123def456789abc123def456789abc123def456789ab",
    "status": "verified_crosschain_propagated",
    "walletAddress": "0x742d35cc6d1ec9c5b5d89cb2d5d8d86e34b0f743",
    "verifierIds": ["nft-ownership"],
    "targetChains": [421614, 11155111, 80002],
    "verifiedVerifiers": [
      {
        "verifierId": "nft-ownership", 
        "verified": true,
        "data": {
          "input": {
            "ownerAddress": "0x742d35cc6d1ec9c5b5d89cb2d5d8d86e34b0f743",
            "contractAddress": "0x60e4d786628fea6478f785a6d7e704777c86a7c6",
            "tokenId": "1234",
            "chainId": 1,
            "tokenType": "erc721"
          },
          "onChainData": {
            "actualOwner": "0x742d35cc6d1ec9c5b5d89cb2d5d8d86e34b0f743"
          },
          "verificationTimestamp": 1755700135798
        },
        "status": "nft_ownership_verified",
        "zkInfo": {
          "zkStatus": "zk_not_required"
        }
      }
    ],
    "crosschain": {
      "status": "completed_all_successful",
      "hubTxHash": "0xabc123def456...",
      "initiated": 1755700140000,
      "completed": 1755700150000,
      "totalChains": 3,
      "finalized": 3,
      "relayResults": {
        "421614": {
          "success": true,
          "transactionHash": "0xdef456abc789...",
          "completedAt": 1755700145000,
          "chainId": 421614,
          "status": "relayed_final_on_spoke",
          "gasUsed": "21000",
          "blockNumber": "8673563",
          "voucherId": "0x456def789abc..."
        },
        "11155111": {
          "success": true,
          "transactionHash": "0x789abc123def...",
          "completedAt": 1755700147000,
          "chainId": 11155111,
          "status": "relayed_final_on_spoke", 
          "gasUsed": "21000",
          "blockNumber": "2845391",
          "voucherId": "0x123abc456def..."
        },
        "80002": {
          "success": true,
          "transactionHash": "0x321fed654cba...",
          "completedAt": 1755700149000,
          "chainId": 80002,
          "status": "relayed_final_on_spoke",
          "gasUsed": "21000", 
          "blockNumber": "1234567",
          "voucherId": "0x987fed321cba..."
        }
      },
      "createdVouchers": ["0x456def789abc...", "0x123abc456def...", "0x987fed321cba..."]
    },
    "options": {
      "enableIpfs": false,
      "forceZK": false,
      "publicDisplay": false,
      "storeOriginalContent": false,
      "verifierOptions": {},
      "privacyLevel": "private",
      "meta": {}
    },
    "createdAt": 1755700135798,
    "completedAt": 1755700150000,
    "lastUpdated": 1755700150000
  }
}
```

Notes:
- Status progression: `processing_verifiers` → `verified` → `verified_crosschain_propagated`
- `hubTransaction` is included for hub details
- `crosschain` is present only when `targetChains` are set

## Privacy

```javascript
{
  "options": {
    "privacyLevel": "public",       // "public" or "private"
    "publicDisplay": true,          // Enable social previews and public UI display
    "enableIpfs": true,             // Create IPFS snapshot after verification
    "storeOriginalContent": true,   // Store original content (enables public access when privacyLevel=public)
    "targetChains": [421614, 11155111] // Testnet chains for proof storage
  }
}
```

Levels:
- `public`
- `private`

### Zero‑knowledge proofs (ZK)
Some verifiers are ZK‑capable. You may request ZK by setting `options.forceZK: true`. ZK availability depends on deployed circuits and access. When ZK is not available for a given verifier, the system proceeds without ZK and includes a `zkInfo` object indicating actual behavior (e.g., `zk_not_required`, `zk_unavailable`).

## Network

- Asset checks: mainnet data (e.g., chainId 1)
- Verification hub: Base Sepolia (84532)
- Optional storage spokes (testnets): 11155111, 80002, 421614, 11155420
- Do not include 84532 in `targetChains`

## Manual signing

The SDK exposes helpers to build the Standard Signing String. Deviations will fail validation.

```javascript
import { buildVerificationRequest } from '@neus/sdk';

const { message, request } = buildVerificationRequest({
  verifierIds: ['ownership-basic'],
  data: { content: 'Hello NEUS' },
  walletAddress: myAddress,
  options: {
    privacyLevel: 'private',
    // IMPORTANT: Target chains are TESTNET spokes for storage only.
    // NEVER include the hub chain here.
    targetChains: [11155111]
  }
});

const signature = await wallet.signMessage(message);

await fetch(`${API_URL}/api/v1/verification`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ ...request, signature })
});
```

### Debugging Signature Issues

If you're getting `SIGNATURE_INVALID` errors, use the API troubleshooting endpoints:

#### For Non-Node.js Environments
```bash
# Get the exact Standard Signing String
curl -X POST https://api.neus.network/api/v1/verification/standardize \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x...","verifierIds":["ownership-basic"],"data":{"content":"Hello"},"signedTimestamp":1755700135798}'

# If still failing, diagnose the issue
curl -X POST https://api.neus.network/api/v1/verification/diagnose \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x...","signature":"0x...","signedMessage":"...","verifierIds":["ownership-basic"],"data":{"content":"Hello"},"signedTimestamp":1755700135798}'
```

See `../signing/` for Python, C#, Go, and no-code platform implementations.

Common issues:
- Address not lowercase
- Non-deterministic JSON
- Stale timestamp
- Wrong chainId (must be 84532)

### Quick Fix Guide

**`SIGNATURE_VERIFICATION_FAILED`**: Call `/standardize` → sign returned string → submit

**Still failing**: Call `/diagnose` → check `reason` → fix issue

## Verifiers
```bash
# Get list of all verifiers
GET /api/v1/verification/verifiers
```

Public verifiers:
- `ownership-basic`
- `nft-ownership`
- `token-holding`
- `ownership-licensed`

<!-- Partner or enterprise verifiers are not part of the public API reference -->

---

## Next Steps

### Start
- SDK: `../../sdk/README.md`
- Getting started: See [5-Minute Tutorial](../QUICKSTART.md)

### Need Help?
- **[GitHub Issues](https://github.com/neus/network/issues)** - Community support
- **[Enterprise Support](mailto:info@neus.network)** - Business inquiries

**OpenAPI specification**: See `../openapi.json` for detailed request/response schemas