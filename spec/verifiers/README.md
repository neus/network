# Verifier specs

Structured verifier metadata (**JSON list and per-verifier schemas**) published with this project so builders and tools can validate inputs against the same shapes the live product expects.

- [`VERIFIERS.json`](../VERIFIERS.json)
- [`schemas/`](./schemas/)

**Integrator-facing schemas** (`spec/verifiers/schemas/`) show the fields an integrator needs to supply. Hosted-only verifiers like `ownership-social` and `ownership-org-oauth` require only `provider` (and optional `expectedOrgDomain` for org). The `internalSocialToken` field is populated by the hosted OAuth flow and should not be supplied by integrators.

**Complete schemas** (`docs/verifiers/schemas/`) show the full shape including fields like `internalSocialToken` and `walletAddress` that the hosted flow populates automatically. Do not supply these fields in direct API calls.

**What each verifier does:** [Verifier catalog](https://docs.neus.network/verification/verifiers)