# ownership-pseudonym

Pseudonymous identity - wallet ↔ handle binding

- **Access:** `public`
- **Category:** `ownership`
- **Flow:** `instant`
- **Expiry:** `expiring`
- **Schema:** [./schemas/ownership-pseudonym.json](./schemas/ownership-pseudonym.json) — JSON Schema for the `data` field

## Full payload (required and optional)

_Fields in the `data` object for the completed verification request (after signatures or hosted steps as required)._

### Required fields

- `pseudonymId` (`string pattern ^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$ max 32 min 3`): Stable handle for this identity within `namespace` (lowercase alphanumeric, dots, hyphens, underscores; 3–32 chars).

### Optional fields

- `namespace` (`string pattern ^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$ max 64 min 1`): Logical partition so the same `pseudonymId` can exist in different apps or communities. Omit to use the default namespace.
- `displayName` (`string max 64`): Optional display label for UX; omit or minimize PII if you do not need it.
- `metadata` (`object`): Optional app-defined structured fields (keep small; avoid secrets).

- **Compatible with:** `ownership-basic`

## Example

_Illustrative values only. Use real addresses and tokens from your integration._

```javascript
await client.verify({
  verifier: 'ownership-pseudonym',
  data: {
    "pseudonymId": "acme_creator_01",
    "namespace": "acme",
    "displayName": "Example user"
  }
});

// Request shape (illustrative)
{
  "verifierIds": [
    "ownership-pseudonym"
  ],
  "data": {
    "pseudonymId": "acme_creator_01",
    "namespace": "acme",
    "displayName": "Example user"
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
