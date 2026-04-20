# HTTP API example

**Prefer [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify), the [JavaScript SDK](https://docs.neus.network/quickstart), or widgets** so end users are not pushed through manual signing steps.

**Use this sample when** you want zero SDK dependency, you are prototyping in curl, or you need to see the exact signing string the API expects before porting to another language.

You get the same outcome as the SDK: a **`proofId`** you can store, look up, and reuse in gate checks.

## Create a proof

### 1. Ask the API for the exact string to sign

Do not hand-assemble the signing string in production. Raw HTTP uses a strict two-phase handshake: call `/standardize` first, then sign the returned `signerString`.

```bash
curl -X POST https://api.neus.network/api/v1/verification/standardize \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1111111111111111111111111111111111111111",
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

The response contains `data.signerString`. Sign that exact string with the same wallet you submit in `walletAddress`.

### 2. Sign with your wallet

Get a signature from MetaMask, ethers, viem, or your wallet provider over `data.signerString`.

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

Omit `options` to use defaults (**private**, unlisted, **original content stored**). For reusable gates without owner-authenticated access, add `options` with `privacyLevel: "public"` and `publicDisplay: false` (public unlisted; still public to anyone with the proof id). Set `storeOriginalContent: false` only for hash-only retention.

**Response:**

```json
{
  "success": true,
  "data": {
    "proofId": "0x57ef6af456233537b63a9afe43dedd02b17d00e0...",
    "qHash": "0x57ef6af456233537b63a9afe43dedd02b17d00e0...",
    "status": "verified"
  }
}
```

### 4. Check status

```bash
# proof ID (`proofId`) returned by NEUS
curl https://api.neus.network/api/v1/proofs/0x{proofId}
```

## Troubleshooting

### Get exact signing string

Use the `/standardize` request above and verify that the submitted body matches the same wallet, verifier IDs, `signedTimestamp`, and data payload you signed.

### Common errors

| Error | Solution |
| --- | --- |
| `SIGNATURE_INVALID` | Use `/standardize` endpoint |
| `SIGNATURE_EXPIRED` | Timestamp within 5 minutes |
| `INVALID_WALLET_ADDRESS` | Check address format |

## Next steps

- [Node.js example](../nodejs-basic/) - programmatic signing
- [API reference](https://docs.neus.network/api/overview) - HTTP endpoints and patterns
- [JavaScript SDK](../../sdk/README.md) - `@neus/sdk`
