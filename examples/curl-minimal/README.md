# HTTP API Example

Create verification proofs using direct HTTP requests.

## Create a Proof

### 1. Build the signing message

```
NEUS Verification Request
Wallet: 0x1111111111111111111111111111111111111111
Chain: 84532
Verifiers: ownership-basic
Data: {"content":"Hello NEUS","owner":"0x1111111111111111111111111111111111111111","reference":{"id":"https://example.com","type":"url"}}
Timestamp: 1678886400000
```

**Requirements:**

- Wallet address lowercase in message
- JSON sorted keys, no extra whitespace
- Timestamp Unix milliseconds, within 5 minutes
- Chain must match what you submit (`chainId`).

### 2. Sign with your wallet

Get signature from MetaMask or other wallet.

### 3. Submit verification

```bash
curl -X POST https://api.neus.network/api/v1/verification \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1111111111111111111111111111111111111111",
    "signature": "0x...",
    "verifierIds": ["ownership-basic"],
    "data": {
      "content": "Hello NEUS",
      "owner": "0x1111111111111111111111111111111111111111",
      "reference": { "type": "url", "id": "https://example.com" }
    },
    "signedTimestamp": 1678886400000,
    "chainId": 84532
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "qHash": "0x57ef6af456233537b63a9afe43dedd02b17d00e0...",
    "status": "verified"
  }
}
```

### 4. Check status

```bash
# Proof ID (qHash): use the qHash field from the create response
curl https://api.neus.network/api/v1/verification/status/0x{qHash}
```

## Troubleshooting

### Get exact signing string

```bash
curl -X POST https://api.neus.network/api/v1/verification/standardize \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1111111111111111111111111111111111111111",
    "verifierIds": ["ownership-basic"],
    "data": {"content":"Hello NEUS","owner":"0x1111111111111111111111111111111111111111"},
    "signedTimestamp": 1678886400000,
    "chainId": 84532
  }'
```

### Common errors

| Error | Solution |
|-------|----------|
| `SIGNATURE_INVALID` | Use `/standardize` endpoint |
| `SIGNATURE_EXPIRED` | Timestamp within 5 minutes |
| `INVALID_WALLET_ADDRESS` | Check address format |

## Next Steps

- [Node.js Example](../nodejs-basic/) — Programmatic signing
- [API Reference](../../docs/api/README.md) — Complete API docs
- [SDK](../../sdk/README.md) — JavaScript SDK

