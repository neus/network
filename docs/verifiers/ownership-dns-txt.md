# ownership-dns-txt

Domain ownership verification via DNS TXT records

- **Access:** `public`
- **Category:** `ownership`
- **Flow:** `external_lookup`
- **Expiry:** `point_in_time`
- **Schema:** [./schemas/ownership-dns-txt.json](./schemas/ownership-dns-txt.json) — JSON Schema for the `data` field

## Full payload (required and optional)

_Fields in the `data` object for the completed verification request (after signatures or hosted steps as required)._

### Required fields

- `domain` (`string format hostname min 1`)

### Optional fields

- `walletAddress` (`string format universal-address`)

- **Compatible with:** `ownership-basic`, `agent-identity`

## Example

_Illustrative values only. Use real addresses and tokens from your integration._

```javascript
await client.verify({
  verifier: 'ownership-dns-txt',
  data: {
    "domain": "example.com",
    "walletAddress": "0x3333333333333333333333333333333333333333"
  }
});

// Request shape (illustrative)
{
  "verifierIds": [
    "ownership-dns-txt"
  ],
  "data": {
    "domain": "example.com",
    "walletAddress": "0x3333333333333333333333333333333333333333"
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
