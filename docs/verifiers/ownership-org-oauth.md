# ownership-org-oauth

Organizational OAuth verification

- **Access:** `public`
- **Category:** `ownership`
- **Flow:** `interactive`
- **Expiry:** `permanent`
- **Schema:** [./schemas/ownership-org-oauth.json](./schemas/ownership-org-oauth.json) — JSON Schema for the `data` field

## How to use

This is a **hosted-only** verifier. Your app redirects the user to hosted verify; you never call the API directly with `ownership-org-oauth`.

```javascript
import { getHostedCheckoutUrl } from '@neus/sdk';

window.location.href = getHostedCheckoutUrl({
  verifiers: ['ownership-org-oauth'],
  returnUrl: 'https://myapp.com/auth/callback',
});
```

The hosted flow handles OAuth with the organization provider and populates all required fields automatically.

## Hosted verification (initial input)

_What you pass to start the flow._

### Required fields

- `provider` (`string enum: google, microsoft`): Identity provider for workspace or org sign-in.

### Optional fields

- `expectedOrgDomain` (`string format hostname`): Optional DNS hostname for the organization (e.g. company.com) to match against the IdP directory.

- **Compatible with:** `agent-delegation`

## Complete payload (validated on submit)

_Fields in the `data` object after the hosted step completes. The `internalSocialToken` is populated by the hosted flow — do not supply it in API calls._

### Required fields

- `provider` (`string enum: google, microsoft`): Identity provider for workspace or org sign-in.
- `internalSocialToken` (`string`): Opaque token from the hosted org sign-in session. **Populated by the hosted flow; do not supply.**

### Optional fields

- `walletAddress` (`string format universal-address`): Wallet to associate with the verified org identity.
- `expectedOrgDomain` (`string format hostname`): Optional DNS hostname for the organization (e.g. company.com) to match against the IdP directory.

## Example

_Redirect to hosted verify (recommended):_

```javascript
import { getHostedCheckoutUrl } from '@neus/sdk';

window.location.href = getHostedCheckoutUrl({
  verifiers: ['ownership-org-oauth'],
  returnUrl: 'https://myapp.com/auth/callback',
});
```

_After redirect, read `qHash` from your callback URL._

## Next steps

- Use this verifier in `requiredVerifiers` for `VerifyGate` or in `verifierIds` for API gate checks.
- For hosted-only verifiers, use hosted checkout (`hostedCheckoutUrl`) where applicable.
- Return to the [Verifier Catalog](./README.md).
