# ownership-org-oauth

Organizational OAuth verification

- **Access:** `public`
- **Category:** `ownership`
- **Flow:** `interactive`
- **Expiry:** `permanent`
- **Schema:** [./schemas/ownership-org-oauth.json](./schemas/ownership-org-oauth.json)

## Required fields

- `provider` (`string enum: google, microsoft`)
- `internalSocialToken` (`string`) — **issued by NEUS** via hosted OAuth exchange (do not generate or store third-party OAuth tokens in your app)

## Optional fields

- `walletAddress` (`string format universal-address`)
- `expectedOrgDomain` (`string format hostname`)

- **Compatible with:** `agent-delegation`

## Example (schema-validated)

```javascript
// Recommended: use hosted checkout for interactive verifiers.
// Your app receives a proofId after the user completes OAuth in the NEUS UI.
//
// <VerifyGate requiredVerifiers={['ownership-org-oauth']} hostedCheckoutUrl="https://neus.network/verify" />

// HTTP request envelope
{
  "verifierIds": [
    "ownership-org-oauth"
  ],
  "data": {
    "provider": "google",
    "internalSocialToken": "<issued_by_neus_hosted_oauth_exchange>",
    "walletAddress": "0x4444444444444444444444444444444444444444",
    "expectedOrgDomain": "example.com"
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
