# ownership-pseudonym

Pseudonymous identity - wallet ↔ handle binding

- **Access:** `public`
- **Category:** `ownership`
- **Flow:** `instant`
- **Expiry:** `expiring`
- **Schema:** [./schemas/ownership-pseudonym.json](./schemas/ownership-pseudonym.json)

## Required fields

- `pseudonymId` (`string pattern ^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$ max 32 min 3`)

## Optional fields

- `namespace` (`string pattern ^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$ max 64 min 1`)
- `displayName` (`string max 64`)
- `metadata` (`object`)

- **Compatible with:** `ownership-basic`

## Example (schema-validated)

```javascript
await client.verify({
  verifier: 'ownership-pseudonym',
  data: {
    "pseudonymId": "satoshi_2025",
    "namespace": "neus",
    "displayName": "Satoshi"
  }
});

// HTTP request envelope
{
  "verifierIds": [
    "ownership-pseudonym"
  ],
  "data": {
    "pseudonymId": "satoshi_2025",
    "namespace": "neus",
    "displayName": "Satoshi"
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
