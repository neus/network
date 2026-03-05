# API Reference

The NEUS Public API provides an interface for creating and resolving cryptographic proofs.

## Endpoints

Integrators should use the following base URL for all requests:

`https://api.neus.network`

## Authentication

Authentication is handled via request-bound wallet signatures following the [NEUS Standard Signing String](../concepts/signing.md), or via a valid NEUS session in first-party Hub flows. This ensures verification requests are cryptographically bound to user intent while allowing low-friction session-first UX on the NEUS Hub.

- **Proof Creation (generic/public callers)**: Typically requires a valid EIP-191 or universal signature in the request body.
- **Proof Creation (Hub / first-party session-first)**: A valid authenticated session for the same wallet may satisfy the proof-envelope auth requirement; verifier-specific subject-control signatures may still be required.
- **Status Checks**: Public proofs are globally readable; private proofs require owner authentication headers.

## Session-first integration (lowest friction)

For integrators embedding hosted verify: redirect users to `https://neus.network/verify?intent=login&returnUrl=...`. After sign-in, the page returns an auth `code` via postMessage or redirect. Partner server exchanges the code at `POST https://api.neus.network/api/v1/auth/code/exchange` (with partner API key) to obtain session/token. Subsequent API calls use cookie/Bearer — no per-request signing required.

## Recommended integration flows

The following endpoints are covered in [`public-api.json`](public-api.json):

- **Create a proof**: `POST /api/v1/verification` (SDK: `client.verify(...)`)
- **Poll status**: `GET /api/v1/verification/status/{proofId}` (SDK: `client.getStatus(...)` / `client.pollProofStatus(...)`)
- **Discover verifiers**: `GET /api/v1/verification/verifiers` (use this to discover what is currently available)
- **Gate access (minimal)**: `GET /api/v1/proofs/check` (SDK: `client.gateCheck(...)`)
- **Revoke a proof (owner-signed)**: `POST /api/v1/proofs/{proofId}/revoke-self` (SDK: `client.revokeOwnProof(...)`)

The following endpoints are available on the API but not yet in the OpenAPI spec:

- **Grant private-proof access**: `POST /api/v1/verification/access/grant` — owner signs a capability allowing a specific viewer wallet to read a private proof. Body: `{ qHash, ownerWallet, viewerWallet, signature, signedTimestamp, expiresInSeconds? }`.
- **Pseudonym availability check**: `GET /api/v1/profile/pseudonym-availability?name=<handle>` — returns `{ available: boolean }`.
- **Pseudonym lookup**: `GET /api/v1/profile/pseudonym-lookup/{handle}` — resolves a handle (optionally `namespace:handle`) to its proof and wallet.

## Integrator checklist (production)

- **Treat `proofId` as opaque**: It is a stable proof identifier. Use timestamps/status fields for freshness, not the ID itself.
- **Prefer minimal reads**: For gating, call `GET /api/v1/proofs/check` instead of pulling full proof payloads.
- **Enforce freshness for point-in-time verifiers**: Use `since` / `sinceDays` for balances, ownership, risk, and other stateful checks.
- **Keep proofs private by default**: Use `options.privacyLevel="private"` and `options.publicDisplay=false` unless you intentionally need public discovery.
- **Debug signatures with `standardize`**: `POST /api/v1/verification/standardize` returns the exact string the server expects.
- **Optional attribution**: Send `X-Neus-App: <appId>` for app-level analytics/attribution (public identifier, not a secret).
- **Username claims (`ownership-pseudonym`, `namespace=neus`)**: NEUS handles payment via hosted claim/checkout. If you support on-chain payment inside your app, include `paymentTxHash` in `options` on `POST /api/v1/verification`.

## Rate Limits

The API enforces tiered rate limiting for stability. Limits are applied based on endpoint sensitivity and caller identity.

| Tier | Typical endpoints | Default limit |
| :--- | :--- | :--- |
| **STATUS** | `GET /api/v1/verification/status/*` | 100 req / minute |
| **STANDARD** | Public reads (verifier discovery, proof reads, gate checks) | 60 req/min base (Pro 4×, Enterprise 10×); fallback: 2,000 req/hour |
| **SENSITIVE** | Verification writes (`POST /api/v1/verification`) | 50 req / 15 minutes |

### Resilience and Polling

- **Status Checks**: Successful `2xx` responses for status polling do **not** count toward the status tier limit.
- **Client Backoff**: The official `@neus/sdk` automatically applies jittered exponential backoff when a `429 Too Many Requests` is encountered.

---

## Public OpenAPI Surface

For detailed request/response schemas, parameter definitions, and error codes, refer to the [Public API Spec](public-api.json). The spec includes:

- **Health**: Liveness and readiness probes.
- **Verification**: Submission and polling for new proofs.
- **Verifiers**: Real-time list of enabled verifier modules.
- **Proofs**: Discoverability, gate checking, and revocation.
    
> **Note:** The `/api/v1/auth/*` endpoints (login, passkey, OAuth, step-up, session) are first-party session endpoints used by the NEUS Hub frontend. They are **not** covered in the public OpenAPI spec because they follow the NEUS BFF (Backend-for-Frontend) pattern and are not designed for direct third-party API calls. Third-party integrators should use the `POST /api/v1/auth/code/exchange` endpoint (with a partner API key) documented in the session-first integration pattern above.
