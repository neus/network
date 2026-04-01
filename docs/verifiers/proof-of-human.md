# proof-of-human

Unique human verification for sybil resistance

- **Access:** `public`
- **Category:** `identity`
- **Flow:** `interactive`
- **Expiry:** `expiring`
- **Schema:** [./schemas/proof-of-human.json](./schemas/proof-of-human.json)

## Required fields

- `proofs` (`array`)
- `queryResult` (`object`)

## Optional fields

- `provider` (`string enum: zkpassport`)
- `scope` (`string pattern ^[a-zA-Z0-9_-]{1,64}$`)

- **Compatible with:** `ownership-basic`, `ownership-social`, `ai-content-moderation`

## Example

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
      "requestId": "abc123"
    },
    "scope": "neus-v1"
  }
});

// HTTP request envelope
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
      "requestId": "abc123"
    },
    "scope": "neus-v1"
  },
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "signature": "0xsignature",
  "signedTimestamp": 1700000000000,
  "chainId": 84532
}
```

## Next steps

- Use this verifier in `requiredVerifiers` for `VerifyGate` or in `verifierIds` for API gate checks.
- For interactive verifiers, use hosted checkout (`hostedCheckoutUrl`).
- Return to the [Verifier Catalog](./README.md).
