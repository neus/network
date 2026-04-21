# ownership-social

Social media account ownership via OAuth

- **Access:** `public`
- **Category:** `ownership`
- **Flow:** `interactive`
- **Expiry:** `permanent`
- **Schema:** [./schemas/ownership-social.json](./schemas/ownership-social.json) — JSON Schema for the `data` field

## Full payload (required and optional)

_Fields in the `data` object for the completed verification request (after signatures or hosted steps as required)._

### Required fields

- `provider` (`string enum: discord, github, facebook, x, farcaster, linkedin, telegram, coinbase`): OAuth provider to verify against.
- `internalSocialToken` (`string`): Opaque token from the hosted link session after the user authorizes; not your app API key.

### Optional fields

- `walletAddress` (`string format universal-address`): Wallet bound to the social account when applicable.

## Hosted verification (initial input)

_What you pass to start the flow. The hosted step supplies tokens and proofs; the full payload above is what is validated on submit._

### Required fields

- `provider` (`string enum: discord, github, facebook, x, farcaster, linkedin, telegram, coinbase`): OAuth provider to verify against.

### Optional fields

- None

- **Compatible with:** `ownership-basic`

## Example

_Illustrative values only. Use real addresses and tokens from your integration._

```javascript
await client.verify({
  verifier: 'ownership-social',
  data: {
    "provider": "discord",
    "internalSocialToken": "opaque-oauth-token",
    "walletAddress": "0x2222222222222222222222222222222222222222"
  }
});

// Request shape (illustrative)
{
  "verifierIds": [
    "ownership-social"
  ],
  "data": {
    "provider": "discord",
    "internalSocialToken": "opaque-oauth-token",
    "walletAddress": "0x2222222222222222222222222222222222222222"
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
