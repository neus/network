# ownership-social

Social media account ownership via OAuth

- **Access:** `public`
- **Category:** `ownership`
- **Flow:** `interactive`
- **Expiry:** `permanent`
- **Schema:** [./schemas/ownership-social.json](./schemas/ownership-social.json) — JSON Schema for the `data` field

## How to use

This is a **hosted-only** verifier. Your app redirects the user to hosted verify; you never call the API directly with `ownership-social`.

```javascript
import { getHostedCheckoutUrl } from '@neus/sdk';

window.location.href = getHostedCheckoutUrl({
  verifiers: ['ownership-social'],
  returnUrl: 'https://myapp.com/auth/callback',
});
```

The hosted flow handles OAuth with the social provider and populates all required fields automatically.

## Hosted verification (initial input)

_What you pass to start the flow._

### Required fields

- `provider` (`string enum: discord, github, facebook, x, farcaster, linkedin, telegram, coinbase`): OAuth provider to verify against.

### Optional fields

- None

- **Compatible with:** `ownership-basic`

## Complete payload (validated on submit)

_Fields in the `data` object after the hosted step completes. The `internalSocialToken` is populated by the hosted flow — do not supply it in API calls._

### Required fields

- `provider` (`string enum: discord, github, facebook, x, farcaster, linkedin, telegram, coinbase`): OAuth provider to verify against.
- `internalSocialToken` (`string`): Opaque token from the hosted link session after the user authorizes. **Populated by the hosted flow; do not supply.**

### Optional fields

- `walletAddress` (`string format universal-address`): Wallet bound to the social account when applicable.

## Example

_Redirect to hosted verify (recommended):_

```javascript
import { getHostedCheckoutUrl } from '@neus/sdk';

window.location.href = getHostedCheckoutUrl({
  verifiers: ['ownership-social'],
  returnUrl: 'https://myapp.com/auth/callback',
});
```

_After redirect, read `qHash` from your callback URL._

## Next steps

- Use this verifier in `requiredVerifiers` for `VerifyGate` or in `verifierIds` for API gate checks.
- For hosted-only verifiers, use hosted checkout (`hostedCheckoutUrl`) where applicable.
- Return to the [Verifier Catalog](./README.md).
