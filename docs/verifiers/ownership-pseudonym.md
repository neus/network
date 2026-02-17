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

## Expiry and namespace behavior

- The verifier response includes `expiresAt` (unix milliseconds). Integrators should enforce `Date.now() <= expiresAt`.
- `namespace: "neus"` claims are paid username claims and include tier-based expiry.
- Non-`neus` namespace claims are supported and still include `expiresAt` (long-lived by default unless policy changes).

## Integrator claim flow (production)

1. Check handle availability with `GET /api/v1/profile/pseudonym-availability?name=<handle>`.
2. Optional ownership lookup with `GET /api/v1/profile/pseudonym-lookup/{handleOrNamespace:handle}`.
3. If claiming in `neus` namespace, payment is handled by NEUS (hosted claim/checkout flow). If you support **on-chain payment** inside your app, provide the on-chain payment proof in `options` when calling `POST /api/v1/verification`:
   - `options.paymentTxHash` (on-chain)
4. Submit verification request with `verifierIds: ["ownership-pseudonym"]` and signed envelope.

### Payment proof fields (request options)

- `paymentTxHash` (`string`) for on-chain settlement
- `paymentProof.chainId` (`integer`) is required for on-chain claims (Base mainnet `8453`)

## Next steps

- Use this verifier in `requiredVerifiers` for `VerifyGate` or in `verifierIds` for API gate checks.
- For interactive verifiers, use hosted checkout (`hostedCheckoutUrl`).
- Return to the [Verifier Catalog](./README.md).
