# proof-of-human

Unique human verification for sybil resistance

- **Access:** `public`
- **Category:** `identity`
- **Flow:** `interactive`
- **Expiry:** `expiring`
- **Schema:** [./schemas/proof-of-human.json](./schemas/proof-of-human.json) — JSON Schema for the `data` field

## Full payload (required and optional)

_Fields in the `data` object for the completed verification request (after signatures or hosted steps as required)._

### Required fields

- `proofs` (`array`)
- `queryResult` (`object`)

### Optional fields

- `provider` (`string enum: zkpassport`)
- `scope` (`string pattern ^[a-zA-Z0-9_-]{1,64}$`)

## Hosted verification (initial input)

_What you pass to start the flow. The hosted step supplies tokens and proofs; the full payload above is what is validated on submit._

### Required fields

- `provider` (`string enum: zkpassport`)

### Optional fields

- `scope` (`string pattern ^[a-zA-Z0-9_-]{1,64}$`)

- **Compatible with:** `ownership-basic`, `ownership-social`, `ai-content-moderation`

## Example

_Illustrative values only. Use real addresses and tokens from your integration._

```javascript
await client.verify({
  verifier: 'proof-of-human',
  data: {
    "provider": "zkpassport",
    "proofs": [
      {
        "proof": "0xproof"
      }
    ],
    "queryResult": {
      "requestId": "req_example_01"
    },
    "scope": "verify-scope-01"
  }
});

// Request shape (illustrative)
{
  "verifierIds": [
    "proof-of-human"
  ],
  "data": {
    "provider": "zkpassport",
    "proofs": [
      {
        "proof": "0xproof"
      }
    ],
    "queryResult": {
      "requestId": "req_example_01"
    },
    "scope": "verify-scope-01"
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
