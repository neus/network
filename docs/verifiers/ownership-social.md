# ownership-social

Social media account ownership via OAuth

- **Access:** `public`
- **Category:** `ownership`
- **Flow:** `interactive`
- **Expiry:** `permanent`
- **Schema:** [./schemas/ownership-social.json](./schemas/ownership-social.json)

## Required fields

- `provider` (`string enum: discord, github, facebook, x, farcaster, linkedin, telegram, coinbase`)
- `internalSocialToken` (`string`) — **issued by NEUS** via hosted OAuth exchange (do not generate or store third-party OAuth tokens in your app)

## Optional fields

- `walletAddress` (`string format universal-address`)

- **Compatible with:** `ownership-basic`

## Example (schema-validated)

```javascript
// Recommended: use hosted checkout for interactive verifiers.
// Your app receives a proofId after the user completes OAuth in the NEUS UI.
//
// <VerifyGate requiredVerifiers={['ownership-social']} hostedCheckoutUrl="https://neus.network/verify" />

// HTTP request envelope
{
  "verifierIds": [
    "ownership-social"
  ],
  "data": {
    "provider": "discord",
    "internalSocialToken": "<issued_by_neus_hosted_oauth_exchange>",
    "walletAddress": "0x2222222222222222222222222222222222222222"
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
