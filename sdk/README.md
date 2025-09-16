# NEUS SDK

JavaScript client for NEUS Network. Handles wallet signing and API calls automatically.

## Installation

```bash
npm install @neus/sdk
```

## Quick Start

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS Network'
});

console.log('Proof created:', proof.qHash);
```

## Basic Usage

### Create Proof

```javascript
// Content ownership
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'My original content'
});

// NFT ownership  
const proof = await client.verify({
  verifier: 'nft-ownership',
  data: {
    ownerAddress: walletAddress,
    contractAddress: '0x...',
    tokenId: '1234',
    chainId: 1
  }
});

// Token holdings
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

### Check Status

```javascript
// Public proof status
const status = await client.getStatus(proof.qHash);
console.log('Verified:', status.success);

// Private proof access (requires wallet signature)
const privateStatus = await client.getPrivateStatus(proof.qHash, wallet);
```

### Monitor Progress

```javascript
// Poll until completion
const finalStatus = await client.pollProofStatus(proof.qHash, {
  interval: 3000,
  onProgress: (status) => console.log('Current status:', status.status)
});
```

## Configuration

```javascript
const client = new NeusClient({
  apiUrl: 'https://api.neus.network', // Default
  timeout: 30000                      // Request timeout
});
```

## Privacy Controls

```javascript
// Public proof - publicly accessible verification details
const publicProof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Public content',
  options: { privacyLevel: 'public' }
});

// Private proof - restricted access; details require wallet authentication
const privateProof = await client.verify({
  verifier: 'ownership-basic', 
  content: 'Private content',
  options: { privacyLevel: 'private' }
});
```

## Cross-Chain Storage

Store proofs on multiple testnets:

```javascript
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Multi-chain proof',
  options: {
    targetChains: [11155111, 80002, 421614] // Testnet chains
  }
});
```

## Error Handling

```javascript
try {
  const proof = await client.verify({
    verifier: 'ownership-basic',
    content: 'Hello NEUS'
  });
} catch (error) {
  if (error.code === 4001) {
    console.log('User cancelled verification');
  } else {
    console.error('Verification failed:', error.message);
  }
}
```

## API Methods

### `verify(params)`

Create verification proof.

**Parameters:**
- `verifier` (string) - Verifier ID
- `content` (string) - Content to verify (for ownership-basic)
- `data` (object) - Verifier-specific data
- `options` (object) - Privacy and storage options

**Returns:** `{ qHash, status, data }`

### `getStatus(qHash)`

Get proof status.

**Parameters:**
- `qHash` (string) - Proof identifier

**Returns:** `{ success, status, data }`

### `getPrivateStatus(qHash, wallet)`

Access private proof with wallet signature.

**Parameters:**
- `qHash` (string) - Proof identifier  
- `wallet` (object) - Wallet provider

**Returns:** `{ success, status, data }`

### `pollProofStatus(qHash, options)`

Poll until verification completes.

**Parameters:**
- `qHash` (string) - Proof identifier
- `options` (object) - Polling configuration
  - `interval` (number) - Polling interval in ms
  - `timeout` (number) - Total timeout in ms
  - `onProgress` (function) - Progress callback

**Returns:** `{ success, status, data }`

### `isHealthy()`

Check API connectivity.

**Returns:** `boolean`

### `getVerifiers()`

List available verifiers.

**Returns:** `string[]`

## Requirements

- **Node.js**: 18+ 
- **Browser**: Modern browser with Web3 wallet
- **Wallet**: MetaMask, WalletConnect, or ethers.js Wallet

## Links

- **[Complete Reference](https://github.com/neus/network/tree/main/docs/REFERENCE.md)** - Full API and verifier documentation
- **[Available Verifiers](https://github.com/neus/network/tree/main/docs/VERIFIERS.md)** - All verification types
- **[GitHub Issues](https://github.com/neus/network/issues)** - Community support