# ownership-basic

Content ownership verification with origin lock and optional provenance

- **Access:** `public`
- **Category:** `ownership`
- **Flow:** `instant`
- **Expiry:** `permanent`
- **Schema:** [./schemas/ownership-basic.json](./schemas/ownership-basic.json) — JSON Schema for the `data` field

## Full payload (required and optional)

_Fields in the `data` object for the completed verification request (after signatures or hosted steps as required)._

### Required fields

- `owner` (`string format universal-address min 1`): Owner identifier (must match request walletAddress). Supports EVM (0x..), Solana (base58), NEAR (account IDs), and other universal address formats depending on chain context.

### Optional fields

- `content` (`string max 50000`): Content being claimed (max 50KB inline)
- `contentHash` (`string pattern ^0x[a-fA-F0-9]{64}$`): Pre-computed verifier content hash (32-byte hex). Treated as the standardized verifierContentHash for ownership-basic; if content is also provided, the verifier integrity-checks that they match.
- `contentType` (`string max 100`): MIME type hint
- `reference` (`object`)
- `provenance` (`object`)

- **Compatible with:** `ownership-basic`, `agent-identity`, `proof-of-human`, `ai-content-moderation`

## Example

_Illustrative values only. Use real addresses and tokens from your integration._

```javascript
await client.verify({
  verifier: 'ownership-basic',
  data: {
    "owner": "0x1111111111111111111111111111111111111111",
    "reference": {
      "type": "url",
      "id": "https://example.com/resource"
    },
    "content": "Example content",
    "provenance": {
      "declaredKind": "human"
    }
  }
});

// Request shape (illustrative)
{
  "verifierIds": [
    "ownership-basic"
  ],
  "data": {
    "owner": "0x1111111111111111111111111111111111111111",
    "reference": {
      "type": "url",
      "id": "https://example.com/resource"
    },
    "content": "Example content",
    "provenance": {
      "declaredKind": "human"
    }
  },
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "signature": "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001",
  "signedTimestamp": 1700000000000,
  "chainId": 84532
}
```

## Next steps

- Use this verifier in `requiredVerifiers` for `VerifyGate` or in `verifierIds` for API gate checks.
- For hosted-only verifiers, use hosted checkout (`hostedCheckoutUrl`) where applicable.
- Return to the [Verifier Catalog](./README.md).
