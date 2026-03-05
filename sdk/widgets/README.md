# NEUS Widgets (VerifyGate + ProofBadge)

React components for NEUS verification and access gating, plus a standalone script-tag embed for any site.

## Script Tag (No Framework Required)

The fastest way to add a "Verified by NEUS" badge to any page:

```html
<script src="https://verify.neus.network/widget.js"></script>

<!-- Place this where you want the badge to appear -->
<div data-neus-proof="qHash123"></div>
```

The widget auto-scans the page on load and renders a badge for each `data-neus-proof` element.

### Data attributes

| Attribute              | Required | Default                          | Description                         |
|------------------------|----------|----------------------------------|-------------------------------------|
| `data-neus-proof`      | Yes      | —                                | qHash / proofId                     |
| `data-neus-api-url`    | No       | `https://api.neus.network`       | Override API base URL               |
| `data-neus-ui-base`    | No       | `https://neus.network`           | Override proof viewer base URL      |
| `data-neus-size`       | No       | `sm`                             | `sm` or `md`                        |
| `data-neus-show-chains`| No       | `false`                          | `true` to show chain count          |

### Manual API

```html
<script src="https://verify.neus.network/widget.js"></script>
<script>
  // Mount a badge into a specific element
  NeusWidget.mount(document.getElementById('my-badge'), { proofId: 'qHash123' });

  // Re-scan a subtree (e.g. after dynamic content loads)
  NeusWidget.mountAll(document.querySelector('.content-area'));

  // Remove a badge
  NeusWidget.unmount(document.getElementById('my-badge'));
</script>
```

### CSS theming

The badge uses CSS variables so it inherits your site's typography and can be themed:

```css
:root {
  --neus-badge-bg:     rgba(148, 163, 184, 0.06);
  --neus-badge-border: rgba(148, 163, 184, 0.2);
  --neus-badge-text:   #94a3b8;
  --neus-badge-font:   inherit;
}
```

### CORS

The widget fetches `GET https://api.neus.network/api/v1/verification/status/:qHash`. This endpoint responds with `Access-Control-Allow-Origin: *` for unauthenticated reads — no CORS setup required on your end.

### Deploy

From the `sdk/` directory: `npm run deploy:widget`. See [DEPLOY-WIDGET.md](../DEPLOY-WIDGET.md).

---

## React Install

```bash
npm install @neus/sdk react react-dom
```

## VerifyGate

Gate UI behind verification requirements.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

export function Page() {
  return (
    <VerifyGate
      requiredVerifiers={['nft-ownership']}
      verifierData={{
        'nft-ownership': { contractAddress: '0x...', tokenId: '1', chainId: 8453 }
      }}
      appId="neus-network"
    >
      <div>Unlocked</div>
    </VerifyGate>
  );
}
```

### Key props

- `requiredVerifiers`: `string[]` (default: `['ownership-basic']`)
- `verifierData`: object keyed by verifier id
- `strategy`: `'reuse-or-create' | 'reuse' | 'fresh'` (default: `'reuse-or-create'`)
- `proofOptions`: `{ privacyLevel, publicDisplay, storeOriginalContent, enableIpfs? }` (defaults: private)
- `mode`: `'create' | 'access'` (default: `'create'`)
- `proofId`: string (required for `mode="access"`)
- `maxProofAgeMs`: `number` (optional) - max proof age override in milliseconds for reuse checks
- `onError`: `(error: Error) => void` (optional) - called when verification/gating errors occur
- `apiUrl`: protocol API base URL (optional)
- `appId`: public app attribution identifier (optional, recommended)
- `sponsorGrant`: sponsor JWT for sponsored proof creation/checks (optional)
- `hostedCheckoutUrl`: hosted verify page URL (optional, recommended when `apiUrl` is custom)

Notes:
- Reuse without prompting can only see **public + discoverable** proofs.
- Reusing private proofs requires an **owner signature** (wallet grants read access).
- Interactive verifiers (`ownership-social`, `ownership-org-oauth`, `proof-of-human`) use NEUS hosted checkout automatically when required.
- If you set a custom `apiUrl`, also set `hostedCheckoutUrl` to your hosted verify UI (for example `https://neus.network/verify`).
  `apiUrl` is used for API calls; `hostedCheckoutUrl` is used for popup checkout routing.
- `sponsorGrant` is used when your app is sponsoring credits for users (for example after Hub “Link app” sponsor authorization).

### Sponsored hosted checkout example

```jsx
<VerifyGate
  requiredVerifiers={['ownership-social']}
  appId="neus-network"
  sponsorGrant={sponsorGrantJwt}
  hostedCheckoutUrl="https://neus.network/verify"
>
  <button>Continue</button>
</VerifyGate>
```

## ProofBadge

Display verification status by Proof ID (`proofId`).

```jsx
import { ProofBadge } from '@neus/sdk/widgets';

<ProofBadge proofId="0x..." showChains />
```

Notes:
- Widgets default to a bundled NEUS logo asset (inlined at build time), so no external logo fetch is required.
- You can override with `logoUrl` in `ProofBadge`, `SimpleProofBadge`, `NeusPillLink`, and `VerifiedIcon`.
