---
description: Public HTTP endpoints (OpenAPI-backed) for proof creation, status polling, and gating checks.
icon: 🧭
cover: ../assets/covers/api.svg
---

# API Reference

## Base URL

`https://api.neus.network`

## Authentication model

- **Proof creation** uses request-bound wallet signatures (NEUS Standard Signing String).
- **Reads** are public for public/discoverable proofs; private proof reads require owner signatures and/or explicit access grants.
- **Premium / sponsored** deployments may additionally accept **enterprise API keys** for higher limits and non-public surfaces (server-side only).

If you are implementing the signing rules yourself, start with **[Signing](../concepts/signing.md)**.

## OpenAPI (public surface)

- **OpenAPI (repo file)**: `./public-api.json`
- **Swagger UI** (interactive): [View in Swagger UI](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/neus/network/main/docs/api/public-api.json)
- **Redoc** (enterprise-style reference): [View in Redoc](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/neus/network/main/docs/api/public-api.json)
- **Raw spec** (GitHub): [public-api.json](https://raw.githubusercontent.com/neus/network/main/docs/api/public-api.json)

> If you are on a fork/branch, replace `main` in the links above with your branch name.

---

## Public integrator surface (stable)

### Health

- `GET /api/v1/health`
- `GET /api/v1/health/ready`
- `GET /api/v1/health/live`
- `GET /api/v1/health/detailed`

### Verification (create + poll)

- `POST /api/v1/verification` — submit a signed request and mint a proof (`qHash`).
- `GET /api/v1/verification/status/{qHash}` — poll status (public or owner-signed for private).
- `GET /api/v1/verification/verifiers` — discover which verifier IDs are enabled in this deployment.
- `POST /api/v1/verification/standardize` — build the exact string-to-sign (debugging).
- `POST /api/v1/verification/access/grant` — owner grants a viewer short-lived access to a private proof.

### Proofs (reads + gating)

- `GET /api/v1/proofs/byWallet/{address}` — list proofs (public/discoverable; private requires owner auth headers).
- `GET /api/v1/proofs/gate/check` — minimal eligibility check against **public + discoverable** proofs.
- `POST /api/v1/proofs/{qHash}/revoke-self` — owner-signed revocation.

---

## Gate checks (recommended for server-side gating)

`GET /api/v1/proofs/gate/check` is optimized for **eligibility decisions** without pulling full proof payloads.

Key behavior:

- Evaluates **public + discoverable** proofs only (`privacyLevel=public` and `publicDisplay=true`).
- Supports **recency requirements** (`since` / `sinceDays`) for point-in-time verifiers.
- Supports **match filters** used by multiple verifiers, including:
  - **On-chain / assets**: `contractAddress`, `tokenId`, `minBalance`, `chainId`
  - **Domains**: `domain`
  - **Identity / handles**: `provider`, `handle` (used by handle-style verifiers and premium social surfaces)
  - **Risk**: `riskLevel`, `sanctioned`, `poisoned`
  - **Tags and projections**: `tags`, `select`

If you need a decision that **must be true right now** and you do not have a recent proof, create a fresh proof via `POST /api/v1/verification` (or in UI use `strategy="fresh"` in `VerifyGate`).

---

## Verifier discovery (avoid drift)

`GET /api/v1/verification/verifiers` returns the verifier IDs enabled for a given deployment.

---

## Premium / Sponsored mode

Some deployments offer **enterprise API keys** for server-side integrations:

- **Lookup mode**: `POST /api/v1/verification/lookup`
  - **Non-persistent**: does not mint/store proofs (no `qHash`)
  - **Real-time**: runs `external_lookup` verifiers for a target wallet
  - **Auth**: `Authorization: Bearer sk_live_...` (or `sk_test_...`)
- **Higher scan limits** for select surfaces (deployment-dependent)
- **Premium verifiers** including interactive OAuth-style verifications (for example **ownership social** and **ownership org OAuth**)

Important constraints:

- **Do not embed API keys in browser apps**. Keep them server-side only.
- API keys **do not replace wallet authorization** for user-owned proofs (see [Security](../../SECURITY.md#enterprise-api-keys-sponsorship)).

To request premium access, use [neus.network/profile](https://neus.network/profile) (hosted) or contact [dev@neus.network](mailto:dev@neus.network).
