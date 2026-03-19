# ownership-dns-txt

Domain ownership verification via DNS TXT records

- **Access:** `public`
- **Category:** `ownership`
- **Flow:** `external_lookup`
- **Expiry:** `point_in_time`
- **Schema:** [./schemas/ownership-dns-txt.json](./schemas/ownership-dns-txt.json)

## Required fields

- `domain` (`string format hostname min 1`)

## Optional fields

- `walletAddress` (`string format universal-address`)

- **Compatible with:** `ownership-basic`, `agent-identity`

## Example (schema-validated)

```javascript
await client.verify({
  verifier: 'ownership-dns-txt',
  data: {
    "domain": "example.com",
    "walletAddress": "0x3333333333333333333333333333333333333333"
  }
});

// HTTP request envelope
{
  "verifierIds": [
    "ownership-dns-txt"
  ],
  "data": {
    "domain": "example.com",
    "walletAddress": "0x3333333333333333333333333333333333333333"
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
