# Message Signing Utilities

**Minimal utilities for building NEUS standard message format.**

Use these only if you need manual message construction for troubleshooting or custom environments.

## JavaScript Utility

```javascript
import { buildNeusMessage } from './message-builder.js';

const message = buildNeusMessage({
  walletAddress: '0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db',
  verifierIds: ['ownership-basic'],
  data: { content: 'Hello NEUS' },
  signedTimestamp: Date.now(),
  chainId: 84532
});

// Sign with your wallet library
const signature = await wallet.signMessage(message);
```

## Standard Message Format

```
NEUS Verification Request
Wallet: {lowercase_address}
Chain: 84532
Verifiers: {verifier_ids}
Data: {deterministic_json}
Timestamp: {unix_ms}
```

## When To Use

- **Troubleshooting** - When signature verification fails
- **Custom environments** - Non-standard JavaScript setups
- **Learning** - Understanding the message format

## Recommended Approach

**Use the SDK instead** for automatic handling:

```javascript
import { NeusClient } from '@neus/sdk';
const client = new NeusClient();
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS'
});
```

## Troubleshooting Helpers

If needed, the API provides helper endpoints:

- `/api/v1/verification/standardize` - Get exact message format
- `/api/v1/verification/diagnose` - Debug signature issues

See the [API Reference](../docs/api/index.md) for details.