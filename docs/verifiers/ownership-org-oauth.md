# ownership-org-oauth

Organizational OAuth verification

- **Access:** `public`
- **Category:** `ownership`
- **Flow:** `interactive`
- **Expiry:** `permanent`
- **Schema:** [./schemas/ownership-org-oauth.json](./schemas/ownership-org-oauth.json) — JSON Schema for the `data` field

## Full payload (required and optional)

_Fields in the `data` object for the completed verification request (after signatures or hosted steps as required)._

### Required fields

- `provider` (`string enum: google, microsoft`): Identity provider for workspace or org sign-in.
- `internalSocialToken` (`string`): Opaque token from the hosted org sign-in session; not your app API key.

### Optional fields

- `walletAddress` (`string format universal-address`): Wallet to associate with the verified org identity.
- `expectedOrgDomain` (`string format hostname`): Optional DNS hostname for the organization (e.g. company.com) to match against the IdP directory.

## Hosted verification (initial input)

_What you pass to start the flow. The hosted step supplies tokens and proofs; the full payload above is what is validated on submit._

### Required fields

- `provider` (`string enum: google, microsoft`): Identity provider for workspace or org sign-in.

### Optional fields

- `expectedOrgDomain` (`string format hostname`): Optional DNS hostname for the organization (e.g. company.com) to match against the IdP directory.

- **Compatible with:** `agent-delegation`

## Example

_Illustrative values only. Use real addresses and tokens from your integration._

```javascript
await client.verify({
  verifier: 'ownership-org-oauth',
  data: {
    "provider": "google",
    "internalSocialToken": "opaque-oauth-token",
    "walletAddress": "0x4444444444444444444444444444444444444444",
    "expectedOrgDomain": "example.com"
  }
});

// Request shape (illustrative)
{
  "verifierIds": [
    "ownership-org-oauth"
  ],
  "data": {
    "provider": "google",
    "internalSocialToken": "opaque-oauth-token",
    "walletAddress": "0x4444444444444444444444444444444444444444",
    "expectedOrgDomain": "example.com"
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
