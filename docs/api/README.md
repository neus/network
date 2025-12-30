# API Reference

Base URL: https://api.neus.network

Authentication:
- Proof creation uses request-body wallet signatures (NEUS Standard Signing String).
- Some deployments enable premium endpoints gated by API keys.

OpenAPI:
- OpenAPI (JSON): ./public-api.json

---

## Public integrator surface (stable)

Health
- GET /api/v1/health
- GET /api/v1/health/ready
- GET /api/v1/health/live
- GET /api/v1/health/detailed

Verification
- POST /api/v1/verification
- GET /api/v1/verification/status/{qHash}
- GET /api/v1/verification/verifiers
- POST /api/v1/verification/standardize
- POST /api/v1/verification/access/grant

Proofs
- GET /api/v1/proofs/byWallet/{address}
- GET /api/v1/proofs/gate/check
- POST /api/v1/proofs/{qHash}/revoke-self

---

## Verifier discovery

GET /api/v1/verification/verifiers returns the verifier IDs enabled.

---

## Premium / Sponsored mode

API key required. These are not part of the public OpenAPI definition.

Premium access can be purchased at https://neus.network/profile