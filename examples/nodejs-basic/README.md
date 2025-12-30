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
# macOS / Linux
export TEST_WALLET_PRIVATE_KEY=0x...
```

```powershell
# Windows PowerShell
$env:TEST_WALLET_PRIVATE_KEY="0x..."
```

Use a test wallet only. Do not use production keys.

## How It Works

### Build signing message

```javascript
function buildSigningMessage({ walletAddress, verifierIds, data, signedTimestamp, chainId = 84532 }) {
  const normalizedAddress = walletAddress.toLowerCase();
  const verifiersString = verifierIds.join(',');
  const dataString = deterministicStringify(data);
  
  return [
    'NEUS Verification Request',
    `Wallet: ${normalizedAddress}`,
    `Chain: ${chainId}`,
    `Verifiers: ${verifiersString}`,
    `Data: ${dataString}`,
    `Timestamp: ${signedTimestamp}`
  ].join('\n');
}
```

Note: `chainId` is part of the signed message. It must match what you submit in the request body.

### Sign and submit

```javascript
const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY);
const message = buildSigningMessage({ ... });
const signature = await wallet.signMessage(message);

const response = await fetch('https://api.neus.network/api/v1/verification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress,
    verifierIds: ['ownership-basic'],
    data: { content: 'Hello NEUS', owner: walletAddress, reference: { type: 'url', id: 'https://example.com' } },
    signedTimestamp: Date.now(),
    chainId: 84532,
    signature
  })
});
```

## Deterministic JSON

```javascript
function deterministicStringify(obj) {
  if (obj === null) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(deterministicStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const parts = keys.map(k => 
    JSON.stringify(k) + ':' + deterministicStringify(obj[k])
  );
  return '{' + parts.join(',') + '}';
}
```

JSON must have sorted keys and no extra whitespace.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Signature invalid | Address lowercase, JSON deterministic |
| Expired | Timestamp within 5 minutes |
| Private key error | Check `TEST_WALLET_PRIVATE_KEY` format |

## Next Steps

- [SDK](../../sdk/README.md) — JavaScript SDK (easier)
- [API Reference](../../docs/api/README.md) — Complete API docs
- [HTTP Example](../curl-minimal/) — Direct API calls

