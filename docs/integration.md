# Integration

This is the recommended end-to-end path for a production NEUS integration.

## Standard flow

1. **Check gate eligibility** with `GET /api/v1/proofs/check` (or `client.gateCheck(...)`).
   - Optionally include `X-Neus-App: <appId>` for attribution (non-secret).
2. If not eligible, **run verification**:
   - Instant / lookup verifiers: submit verification request.
   - Interactive verifiers: use hosted checkout via `VerifyGate`.
3. **Poll status** until terminal state for async verifiers.
4. **Unlock access** when eligible and persist the returned `proofId`.

## Verification modes

- **Reuse-first gating**: `strategy="reuse-or-create"` for standard UX.
- **Fresh proof required**: `strategy="fresh"` for high-stakes actions.
- **Read-only check**: `strategy="reuse"` when you do not want to create new proofs.

## Session-first integration

For lowest friction: use hosted verify + auth code exchange. Redirect users to `https://neus.network/verify?intent=login&returnUrl=...`. After sign-in, the page returns an auth `code`. Partner server calls `POST https://api.neus.network/api/v1/auth/code/exchange` with the code and partner API key to obtain session/token. Subsequent API calls use cookie/Bearer — no per-request signing.

## Hosted checkout requirements

Interactive verifiers (`ownership-social`, `ownership-org-oauth`, `proof-of-human`) require hosted checkout.

- Default checkout URL: `https://neus.network/verify` (or use SDK `getHostedCheckoutUrl()`)
- Sponsored flows should include `X-Neus-App` (public appId) and `X-Sponsor-Grant` when your backend is covering verification costs.

See the hosted checkout integration flow (popup + callback) in [Gating](./concepts/gating.md#hosted-checkout-interactive-verifiers).

## Policy-based gate checks

For backend policy enforcement, use `gateCheck` with explicit recency:

- `since` for exact timestamp windows.
- `sinceDays` for coarse policy windows.
- Tight windows are recommended for point-in-time state verifiers.

## Privacy and access model

- Private-by-default proofs are recommended.
- Public + discoverable proofs support broad reuse and discovery.
- Private proof reads require owner-authenticated access or explicit grant-based sharing.

## Verify Widget (Script Tag)

The easiest integration path for non-React or non-framework sites. One script tag, one HTML attribute, no build step:

```html
<script src="https://verify.neus.network/widget.js"></script>
<div data-neus-proof="qHash123"></div>
```

The badge auto-renders on page load. Clicking it links to the proof on `neus.network`.

**CORS:** The widget calls `GET https://api.neus.network/api/v1/verification/status/:qHash` which responds with `Access-Control-Allow-Origin: *`. No configuration needed.

**Optional attributes:**

| Attribute               | Description                                         |
|-------------------------|-----------------------------------------------------|
| `data-neus-proof`       | qHash / proofId (required)                          |
| `data-neus-api-url`     | Custom API base (default: `https://api.neus.network`)|
| `data-neus-ui-base`     | Custom viewer base (default: `https://neus.network`) |
| `data-neus-size`        | `sm` (default) or `md`                              |
| `data-neus-show-chains` | `true` to show chain count                          |

**Manual JS API:** `NeusWidget.mount(el, opts)` / `NeusWidget.mountAll(root?)` / `NeusWidget.unmount(el)`.

See [SDK Widgets README](../sdk/widgets/README.md) for full reference.

## Related references

- [Hub Integrator Setup](./guides/hub-integrator-setup.md)
- [Gating](./concepts/gating.md)
- [Signing](./concepts/signing.md)
- [API Reference](./api/README.md)
- [Verifier Catalog](./verifiers/README.md)
