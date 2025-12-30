---
description: Public HTTP endpoints for proof creation, status polling, and gating checks.
icon: 🧭
---

# API Reference

The NEUS Public API provides a trust-minimized interface for creating and resolving cryptographic proofs.

## Endpoints

Integrators should use the following base URL for all requests:

`https://api.neus.network`

## Authentication

Authentication is handled via request-bound wallet signatures following the [NEUS Standard Signing String](../concepts/signing.md). This ensures that every verification request is cryptographically bound to the user's intent.

- **Proof Creation**: Requires a valid EIP-191 or universal signature in the request body.
- **Status Checks**: Public proofs are globally readable; private proofs require owner authentication headers.
- **Premium Access**: Enterprise deployments may require an API key for higher rate limits or non-public verifier lookups.

## Public OpenAPI Surface

For detailed request/response schemas, parameter definitions, and error codes, refer to the [Public API Spec](public-api.json). The spec includes:

- **Health**: Liveness and readiness probes.
- **Verification**: Submission and polling for new proofs.
- **Verifiers**: Real-time list of enabled verifier modules.
- **Proofs**: Discoverability, gate checking, and revocation.

---

## Premium / Sponsored mode

Hosted deployments may offer **enterprise API keys** for server-side integrations that require:

- **Lookup mode** (`POST /api/v1/verification/lookup`): Real-time, non-persistent checks (no `qHash` minted).
- **Higher limits**: Increased scan limits for large-scale gating.
- **Premium verifiers**: Interactive OAuth-based flows (e.g., `ownership-social`, `ownership-org-oauth`).

To request premium access, visit the [NEUS Profile](https://neus.network/profile) or contact [dev@neus.network](mailto:dev@neus.network).
