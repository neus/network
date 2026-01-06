# API Reference

The NEUS Public API provides a trust-minimized interface for creating and resolving cryptographic proofs.

## Endpoints

Integrators should use the following base URL for all requests:

`https://api.neus.network`

## Authentication

Authentication is handled via request-bound wallet signatures following the [NEUS Standard Signing String](../concepts/signing.md). This ensures that every verification request is cryptographically bound to the user's intent.

- **Proof Creation**: Requires a valid EIP-191 or universal signature in the request body.
- **Status Checks**: Public proofs are globally readable; private proofs require owner authentication headers.

## Recommended integration flows

- **Create a proof**: `POST /api/v1/verification` (SDK: `client.verify(...)`)
- **Poll status**: `GET /api/v1/verification/status/{qHash}` (SDK: `client.getStatus(...)` / `client.pollProofStatus(...)`)
- **Discover verifiers**: `GET /api/v1/verification/verifiers` (use this to avoid drift across deployments)
- **Gate access (minimal)**: `GET /api/v1/proofs/gate/check` (SDK: `client.gateCheck(...)`)
- **Revoke a proof (owner-signed)**: `POST /api/v1/proofs/{qHash}/revoke-self` (SDK: `client.revokeOwnProof(...)`)

## Integrator checklist (production)

- **Treat `qHash` as opaque**: It’s a stable proof identifier. Use timestamps/status fields for freshness, not the ID itself.
- **Prefer minimal reads**: For gating, call `GET /api/v1/proofs/gate/check` instead of pulling full proof payloads.
- **Enforce freshness for point-in-time verifiers**: Use `since` / `sinceDays` for balances, ownership, risk, and other stateful checks.
- **Keep proofs private by default**: Use `options.privacyLevel="private"` and `options.publicDisplay=false` unless you intentionally need public discovery.
- **Debug signatures with `standardize`**: `POST /api/v1/verification/standardize` returns the exact string the server expects.

## Rate Limits

The API enforces tiered rate limiting for stability. Limits are applied based on endpoint sensitivity and caller identity.

| Tier | Typical endpoints | Default limit |
| :--- | :--- | :--- |
| **STATUS** | `GET /api/v1/verification/status/*` | 100 req / minute |
| **STANDARD** | Public reads (verifier discovery, proof reads, gate checks) | 2,000 req / hour |
| **SENSITIVE** | Verification writes (`POST /api/v1/verification`) | 50 req / 15 minutes |

### Resilience and Polling
- **Status Checks**: Successful `2xx` responses for status polling do **not** count toward the status tier limit.
- **Client Backoff**: The official `@neus/sdk` automatically applies jittered exponential backoff when a `429 Too Many Requests` is encountered.

---

## Public OpenAPI Surface

For detailed request/response schemas, parameter definitions, and error codes, refer to the [Public API Spec](public-api.md) (canonical JSON: [`public-api.json`](public-api.json)). The spec includes:

- **Health**: Liveness and readiness probes.
- **Verification**: Submission and polling for new proofs.
- **Verifiers**: Real-time list of enabled verifier modules.
- **Proofs**: Discoverability, gate checking, and revocation.

