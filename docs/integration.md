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

## Hosted checkout requirements

Interactive verifiers (`ownership-social`, `ownership-org-oauth`, `proof-of-human`) require hosted checkout.

- Default checkout URL: `https://neus.network/verify`

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

## Related references

- [Gating](./concepts/gating.md)
- [Signing](./concepts/signing.md)
- [API Reference](./api/README.md)
- [Verifier Catalog](./verifiers/README.md)
