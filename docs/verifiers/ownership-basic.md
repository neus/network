# ownership-basic

**Prove ownership of words, artifacts, or pointers—and lock them to a wallet.**  
Instant verifier: sign, attach inline text and/or a reference, optional provenance. For the product story and “where does my saved text live?”, read **[Ownership and Provenance](../verification/ownership-basic)** first; this page is the technical catalog entry.

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

| Field | What it is |
|-------|------------|
| `content` | The text you’re proving (up to ~50 KB). |
| `reference` | Stable link to the thing (`type` + `id`). Not fetched by NEUS. |
| `contentHash` | NEUS verifier hash only (`0x` + 64 hex). Skip it unless you already have it; otherwise send `content` and use the hash NEUS returns—not a generic file SHA256. |
| `contentType` | MIME hint. |
| `provenance` | Optional human/AI note. |

### After verify

To keep the exact `content` on the receipt, use **`storeOriginalContent: true`** when you need it (defaults vary by public vs private—[Security and trust](../platform/security-and-trust)).

Read back saved text from **`proof.publicContent.content`**. The receipt’s verifier row holds hashes and `reference`, not the long body.

Full walkthrough: **[Ownership and Provenance](../verification/ownership-basic)**.

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
