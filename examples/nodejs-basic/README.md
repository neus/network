# Node.js Example

Server-side verification with ethers.js.

## Setup

```bash
cd nodejs-basic
npm install
node index.js
```

Set `TEST_WALLET_PRIVATE_KEY` to a test wallet key:

```bash
export TEST_WALLET_PRIVATE_KEY=0x...
```

Use a test wallet only. Do not use production keys.

## How It Works

### 1. Build and sign
The NEUS protocol requires a cryptographic signature over the request data. This example uses the hub chain ID (`84532`) for the signing context.

```javascript
import { constructVerificationMessage } from '../../sdk/utils.js';

const message = constructVerificationMessage({
  walletAddress,
  verifierIds: ['ownership-basic'],
  data,
  signedTimestamp,
  chainId: 84532
});

const signature = await wallet.signMessage(message);
```

### 2. Submit to API
The signed request is submitted to the NEUS API.

```javascript
const response = await fetch('https://api.neus.network/api/v1/verification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress,
    verifierIds: ['ownership-basic'],
    data,
    signedTimestamp,
    chainId: 84532,
    signature
  })
});
```

## Next Steps

- [SDK](../../sdk/README.md) — JavaScript SDK (recommended)
- [API Reference](../../docs/api/README.md) — Complete API docs
