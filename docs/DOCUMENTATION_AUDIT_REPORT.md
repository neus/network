# NEUS Documentation Audit Report

**Date:** 2026-03-10  
**Scope:** network (open-source docs), neus-nut (backend), neus (frontend)  
**Method:** Code-first comparison against `verifierRegistry.js`, route handlers, and spec schemas.

---

## Executive Summary

Documentation drift occurs when docs are written from prose or outdated specs instead of the actual implementation. This audit identifies misalignments and establishes a code-first remediation path.

**Source of truth hierarchy:**
1. **Backend** `neus-nut/src/services/verification/verifiers/verifierRegistry.js` — verifier metadata, dataSchema, flowType, expiryType
2. **Backend** route handlers — API paths, query params, request/response shapes
3. **network** `spec/VERIFIERS.json` + `spec/verifiers/schemas/*.json` — public contract (must sync with backend)
4. **network** mintlify docs — human-readable; must derive from API/spec

---

## Critical Misalignments

### 1. Domain Verification — Wrong TXT Format

| Location | Claimed Format | Actual (ownership-dns-txt.js) |
|----------|----------------|------------------------------|
| `mintlify/cookbook/domain-verification.mdx` | `neus=<wallet>` | `wallet=<wallet>` or `wallet=eip155:{chainId}:{wallet}` |

**Impact:** Integrators following docs will fail verification.

**Fix:** Update domain-verification.mdx to use `wallet=0x...` (and optionally DID format).

---

### 2. Agent Identity — CAIP-10 Support Missing in Docs/Spec

| Location | Claimed | Actual (verifierRegistry + agent-identity.js) |
|----------|---------|-----------------------------------------------|
| `spec/verifiers/schemas/agent-identity.json` | `required: ["agentId", "agentWallet"]` | `anyOf: [{ required: ["agentAccountId"] }, { required: ["agentWallet"] }]` |
| `mintlify/agents/agent-identity.mdx` | agentWallet required | Either `agentAccountId` (CAIP-10) OR `agentWallet` required |
| `mintlify/cookbook/verifiable-agents.mdx` | agentWallet "No" (required) | Wrong; agentWallet OR agentAccountId required |

**Impact:** CAIP-10 users cannot use docs; spec rejects valid CAIP-10 payloads if used for validation elsewhere.

**Fix:** Add `agentAccountId`, `agentChainRef` to spec; document both patterns in agent docs.

---

### 3. Agent Delegation — CAIP-10 Support Missing in Docs/Spec

| Location | Claimed | Actual (verifierRegistry + agent-delegation.js) |
|----------|---------|--------------------------------------------------|
| `spec/verifiers/schemas/agent-delegation.json` | `required: ["controllerWallet", "agentWallet"]` | `anyOf: [{ required: ["controllerAccountId", "agentAccountId"] }, { required: ["controllerWallet", "agentWallet"] }]` |
| Docs | Wallet pair only | Supports CAIP-10 controller/agentAccountId |

**Fix:** Add CAIP-10 fields to spec; document both patterns.

---

### 4. Agent Type Enum — Invalid Value in Docs

| Location | Claimed | Actual (verifierRegistry dataSchema) |
|----------|---------|-------------------------------------|
| `mintlify/cookbook/verifiable-agents.mdx` | `ai`, `automation`, `custom` | `ai`, `bot`, `service`, `automation`, `agent` — **no `custom`** |

**Fix:** Remove `custom`; use `agent` as catch-all. Align all agent docs to backend enum.

---

### 5. Verifiable Agents — agentWallet Required Flag Wrong

| Location | Claimed | Actual |
|----------|---------|--------|
| `mintlify/cookbook/verifiable-agents.mdx` | agentWallet "No" (optional) | agentWallet OR agentAccountId **required** (one of the two) |

**Fix:** Mark agentWallet as "Yes (or agentAccountId)" in tables.

---

## Minor / Informational

### 6. Presets — Aligned

`mintlify/platform/presets.mdx` matches `neus/utils/verifierRegistry.ts` PRESET_VERIFIER_IDS. No change needed.

### 7. API Paths — Aligned

- `GET /api/v1/verification/verifiers` ✓
- `GET /api/v1/proofs/check?address=...&verifierIds=...` ✓
- `POST /api/v1/proofs/revoke-self/{qHash}` ✓ (router mounts both `/revoke-self/:qHash` and `/:qHash/revoke-self`)

### 8. Gate Check Query Params

Docs correctly show `address` and `verifierIds`. The check endpoint also supports `contractAddress`, `tokenId`, `chainId`, `domain`, etc. for gate-specific matching — documented in route comments; consider surfacing in API overview.

---

## Remediation Checklist

- [x] Fix domain-verification.mdx TXT format (`wallet=` not `neus=`)
- [x] Update spec/verifiers/schemas/agent-identity.json with agentAccountId/agentChainRef, anyOf
- [x] Update spec/verifiers/schemas/agent-delegation.json with controllerAccountId/agentAccountId, anyOf
- [x] Fix mintlify/agents/agent-identity.mdx — document CAIP-10, fix required fields table
- [x] Fix mintlify/agents/agent-delegation.mdx — document CAIP-10
- [x] Fix mintlify/cookbook/verifiable-agents.mdx — agentWallet required, agentType enum, remove custom
- [x] Fix mintlify/ecosystems/verifiers.mdx — agent-identity and agent-delegation CAIP-10 fields
- [ ] Add sync script or CI check: compare spec schemas vs verifierRegistry dataSchema (neus-verifier-ssot)

---

## Prevention

1. **Code-first rule:** When documenting verifiers, read `verifierRegistry.js` and the verifier implementation first.
2. **Spec sync:** network `spec/verifiers/schemas/*.json` must be derived from or manually aligned with backend `verifierMetadata[].dataSchema`.
3. **CI:** Add a job that diffs `spec/VERIFIERS.json` + schemas against `GET /api/v1/verification/verifiers` response (or backend export).
