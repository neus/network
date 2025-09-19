# NEUS Network - Complete Reference

**Technical documentation for NEUS Network integration.**

## Table of Contents

- [SDK Reference](#sdk-reference)
- [HTTP API](#http-api)
- [Verifier Specifications](#verifier-specifications)
- [Privacy Controls](#privacy-controls)
- [Multi-Language Support](#multi-language-support)
- [React Widgets](#react-widgets)
- [Error Handling](#error-handling)
- [Contract Information](#contract-information)

---

## SDK Reference

### Installation

```bash
npm install @neus/sdk
```

### Basic Usage

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS'
});
// See also: Verifier pages → ./verifiers/ownership-basic.md
```

### Configuration

```javascript
const client = new NeusClient({
  apiUrl: 'https://api.neus.network', // Default
  timeout: 30000                      // Request timeout in ms
});
```

### Methods

#### `verify(params)`

Create verification proof.

**Auto Mode (Recommended):**
```javascript
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Content to verify'
});
// Pitfalls: address normalization and timestamp window; see ./api/index.md#troubleshooting
```

**Manual Mode (Advanced):**
```javascript
const proof = await client.verify({
  verifierIds: ['ownership-basic'],
  data: { content: 'Content', owner: walletAddress },
  walletAddress: '0x...',
  signature: '0x...',
  signedTimestamp: Date.now()
});
```

#### `getStatus(qHash)`

Get verification status.

```javascript
const status = await client.getStatus(qHash);
console.log('Success:', status.success);
console.log('Status:', status.data.status);
// See also: Polling helper → `pollProofStatus`
```

#### `getPrivateStatus(qHash, wallet)`

Access private proof with wallet signature.

```javascript
const privateData = await client.getPrivateStatus(qHash, window.ethereum);
```

#### `pollProofStatus(qHash, options)`

Wait for verification completion.

```javascript
const finalStatus = await client.pollProofStatus(qHash, {
  interval: 3000,
  timeout: 60000,
  onProgress: (status) => console.log('Status:', status.status)
});
// See also: API status endpoints → ./api/index.md
```

---

## HTTP API

### Authentication

All requests require wallet signatures (EIP-191).
See also: Message format and helpers → ./api/index.md#standard-message-format

### Standard Signing String Format

```
NEUS Verification Request
Wallet: {lowercase_wallet_address}
Chain: {chain_id_number}
Verifiers: {verifier1,verifier2,...}
Data: {deterministic_json_string}
Timestamp: {unix_milliseconds}
```

### Endpoints

#### Create Verification

```
POST /api/v1/verification
```

**Request:**
```json
{
  "verifierIds": ["ownership-basic"],
  "data": {"content": "Hello", "owner": "0x..."},
  "walletAddress": "0x...",
  "signature": "0x...",
  "signedTimestamp": 1678886400000,
  "chainId": 84532,
  "options": {"privacyLevel": "private"}
}
```
See also: Privacy and options → ./PRIVACY.md

#### Get Status

```
GET /api/v1/verification/status/{qHash}
```

#### Build Signing String (Helper)

```
POST /api/v1/verification/standardize
```

Optional helper to get the exact string format if needed for troubleshooting.

#### Diagnose Issues

```
POST /api/v1/verification/diagnose
```

Debug signature verification problems.

---

## Verifier Specifications

### ownership-basic

**Purpose:** Content ownership verification

**Required Fields:**
- `content` (string) - Content to verify
- `owner` (address) - Owner wallet address
- `reference` (object) - Reference information
  - `type` (string) - Reference type: url, ipfs, tx, other
  - `id` (string) - Reference identifier

**Example:**
```javascript
{
  verifier: 'ownership-basic',
  data: {
    content: 'My original article',
    owner: '0x...',
    reference: { type: 'url', id: 'https://example.com' }
  }
}
```

### nft-ownership

**Purpose:** NFT ownership verification

**Required Fields:**
- `ownerAddress` (address) - NFT owner wallet
- `contractAddress` (address) - NFT contract address
- `tokenId` (string) - NFT token ID
- `chainId` (number) - Blockchain chain ID

**Optional Fields:**
- `tokenType` (string) - 'erc721' or 'erc1155' (default: 'erc721')

**Example:**
```javascript
{
  verifier: 'nft-ownership',
  data: {
    ownerAddress: '0x...',
    contractAddress: '0x...',
    tokenId: '1234',
    chainId: 1
  }
}
```

### token-holding

**Purpose:** Token balance verification

**Required Fields:**
- `ownerAddress` (address) - Token holder wallet
- `contractAddress` (address) - ERC20 contract address
- `minBalance` (string) - Minimum balance (human-readable)
- `chainId` (number) - Blockchain chain ID

**Example:**
```javascript
{
  verifier: 'token-holding',
  data: {
    ownerAddress: '0x...',
    contractAddress: '0x...',
    minBalance: '100.0',
    chainId: 1
  }
}
```

 

---

## Privacy Controls

### Privacy Levels

- **`public`** - Anyone can see proof details
- **`private`** - Only wallet owner can access details

### Options

```javascript
{
  options: {
    privacyLevel: 'private',        // public | private
    publicDisplay: false,           // Enable public UI display
    storeOriginalContent: false,    // Store content in proof
    enableIpfs: false,              // Create IPFS snapshot
    targetChains: [11155111, 80002] // Cross-chain storage (testnet)
  }
}
```

### Accessing Private Proofs

```javascript
// Private proofs require a wallet signature from the proof owner
const privateData = await client.getPrivateStatus(qHash, wallet);
```

---

## Multi-Language Support

NEUS works with any programming language via HTTP API.

### Universal Flow

1. **Get Standard Signing String**
2. **Sign with your wallet library**
3. **Submit verification request**

### Language Examples

**Python:**
```python
# See: network/signing/python/
from neus_signer import build_standard_signing_string
signer_string = build_standard_signing_string(wallet, verifiers, data, timestamp)
```

**C#:**
```csharp
// See: network/signing/csharp/
var signerString = NeusStandardSigner.BuildStandardSigningString(
    walletAddress, verifierIds, data, signedTimestamp);
```

**Go:**
```go
// See: network/signing/go/
signerString, err := BuildStandardSigningString(walletAddress, verifierIds, data, signedTimestamp, 84532)
```

**No-Code Platforms:**
See `network/signing/nocode-apps/` for Logic Apps, Zapier, and Make.com implementations.

---

## React Widgets

### Installation

```bash
npm install @neus/widgets
```

### VerifyGate

Gate content behind verification requirements.

```jsx
import { VerifyGate } from '@neus/widgets';

<VerifyGate 
  requiredVerifiers={['nft-ownership']}
  onVerified={(result) => console.log('Verified:', result.qHash)}
>
  <PremiumContent />
</VerifyGate>
```

**Props:**
- `requiredVerifiers` - Array of verifier IDs
- `onVerified` - Callback when verification succeeds
- `disabled` - Disable verification button
- `style` - CSS styles for container

### ProofBadge

Display verification status with an optional status dot.

```jsx
import { ProofBadge } from '@neus/widgets';

<ProofBadge qHash="0x..." />
<ProofBadge qHash="0x..." size="md" showDot={false} />
<ProofBadge qHash="0x..." labelOverride="Verified Content" />
```

**Props:**
- `qHash` - Proof identifier (required)
- `size` - Badge size: 'sm' | 'md' (default: 'sm')
- `showDot` - Show status dot (default: true)
- `labelOverride` - Custom label text
- `uiLinkBase` - Base URL for proof links (default: 'https://neus.network')

---

## Error Handling

### Common Error Codes

- `4001` - User rejected wallet signature
- `INVALID_WALLET_ADDRESS` - Wallet address format incorrect
- `SIGNATURE_INVALID` - Signature verification failed
- `VERIFIER_NOT_FOUND` - Invalid verifier ID
- `RATE_LIMIT_EXCEEDED` - Too many requests

### Error Handling Pattern

```javascript
try {
  const proof = await client.verify({
    verifier: 'ownership-basic',
    content: 'My content'
  });
} catch (error) {
  if (error.code === 4001) {
    // User cancelled - handle gracefully
    console.log('User cancelled verification');
  } else {
    // Technical error - show user-friendly message
    console.error('Verification failed:', error.message);
  }
}
```

### Debugging Signatures

If getting signature errors:

1. Use `/verification/standardize` endpoint
2. Sign the exact returned string
3. Use `/verification/diagnose` if still failing

---

## Contract Information

### Deployments

**Base Sepolia (Hub Chain - 84532):**
- `NEUSVerifierRegistry`: `0x728Ba14b52d4811e2eDcE37c7e419AB47B0A17Df`
- `NEUSVoucherHub`: `0xD524bd93e51b29C63b921994BF2BA61f8f49FB6C`
- `NEUSToken`: `0x9e8387A563e124868aa6c6064E6f29c2ce745935`

**Cross-Chain Storage (Testnet):**
- Ethereum Sepolia (11155111): `0x4eE5346a253bA26508FC99FAa49932561205359C`
- Polygon Amoy (80002): `0x5746f86E6BC6AcCF34286Bc8E8803CcAc4a0306d`
- Arbitrum Sepolia (421614): `0x0095E6e6A1CA0E05e56920aeaDc0c8bDDEADcdC1`
- Optimism Sepolia (11155420): `0x24f9Af19693D163576ac49DF3b7a75934bB3B1b4`

### ABIs

Contract ABIs available at:
- `network/abis/NEUSVerifierRegistry.json`
- `network/abis/NEUSVoucherHub.json`
- `network/abis/NEUSVoucherSpoke.json`
- `network/abis/NEUSToken.json`

---

## Support

- **Community Questions & Ideas**: [GitHub Discussions](https://github.com/neus/network/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/neus/network/issues)
- **Technical Support**: dev@neus.network
- **Security Issues**: dev@neus.network

---

*For quick integration, start with [QUICKSTART.md](./QUICKSTART.md).*
