---
description: Verifier IDs, tiers, and input schemas (public + deployment-enabled).
icon: 🛡️
---

# Verifier Catalog

NEUS provides public verifiers available to all developers without API keys, plus optional early-access verifiers that require deployment configuration.

Each verifier is a standardized module that accepts specific input data, validates it, and produces a cryptographic proof.

Machine-readable source of truth:

- `spec/VERIFIERS.json`

---

## Ownership

| Verifier | Flow | Expiry | Description |
| :--- | :--- | :--- | :--- |
| **`ownership-basic`** | Instant | Permanent | **Content Authorship.** Prove that a wallet created a specific piece of content. Includes origin locking. |
| **`ownership-pseudonym`** | Instant | Permanent | **Handle Binding.** Bind a wallet to a namespace + handle. |
| **`ownership-dns-txt`** | Lookup | Point-in-Time | **Domain Control.** Verify ownership of a DNS domain by checking a TXT record at `_neus.{domain}`. |
| **`contract-ownership`** | Lookup | Point-in-Time | **Contract Control.** Verify that a wallet is the contract `owner`, `admin`, or holds DEFAULT_ADMIN_ROLE (AccessControl), depending on method. |

---

## Assets

| Verifier | Flow | Expiry | Description |
| :--- | :--- | :--- | :--- |
| **`nft-ownership`** | Lookup | Point-in-Time | **NFT Gating.** Verify ownership of a specific ERC-721 or ERC-1155 token ID. |
| **`token-holding`** | Lookup | Point-in-Time | **Token Gating.** Verify that a wallet holds a minimum balance of a specific ERC-20 token. |

---

## Identity & agents

| Verifier | Flow | Expiry | Description |
| :--- | :--- | :--- | :--- |
| **`agent-identity`** | Instant | Permanent | **Bot Identity.** Establish a portable, self-attested identity for an AI agent, bot, or service (ERC-8004 compatible). |
| **`agent-delegation`** | Instant | Expiring | **Authority Delegation.** Cryptographically delegate authority (e.g., "can trade") from a controller to an agent. |
| **`wallet-link`** | Instant | Permanent | **Account Linking.** Link a secondary wallet to a primary identity using a cryptographic signature. |
| **`wallet-risk`** | Lookup | Point-in-Time | **Sybil Resistance.** Assess the risk level of a wallet address to prevent fraud and bot spam. |

---

## Content safety

| Verifier | Flow | Expiry | Description |
| :--- | :--- | :--- | :--- |
| **`ai-content-moderation`** | Lookup | Permanent | **Safety Check.** Analyze text or images for safety/moderation flags before allowing on-chain actions. |

---

## Premium / deployment-enabled verifiers (OAuth + enterprise surfaces)

Some verifiers are **interactive** (OAuth / provider configuration) and are not part of the public “wallet-signature-only” flow.

These typically require:

- A hosted NEUS session / provider handshake (OAuth), and/or
- An **enterprise API key** for server-side integrations.

Common premium examples (names shown as integrator-facing IDs):

| Verifier | Flow | Expiry | Description |
| :--- | :--- | :--- | :--- |
| **`ownership-social`** | Interactive (OAuth) | Point-in-Time | Bind a wallet to a social account (provider + handle) and attest current account control. |
| **`ownership-org-oauth`** | Interactive (OAuth) | Point-in-Time | Bind a wallet to an organization membership/role claim via an OAuth-capable provider. |

How to integrate without the full OAuth flow:

- **Gate using existing proofs**: `GET /api/v1/proofs/gate/check` with match filters (e.g. `provider`, `handle`, `since`).
- **Real-time server decisions (non-persistent)**: `POST /api/v1/verification/lookup` (enterprise API key; no `qHash` minted).

See **[API Reference → Premium / Sponsored mode](../api/README.md#premium--sponsored-mode)** for constraints and auth.

These verifiers can appear in:

- `GET /api/v1/verification/verifiers` (deployment-enabled list)
- `GET /api/v1/proofs/gate/check` (matching against existing public/discoverable proofs)

For the quickstart path and SDK wallet-signature flows, the **public** verifiers listed above are available.

---

## Flow Types

- **Instant:** The verification is purely cryptographic or self-contained. It happens immediately upon receiving the signature.
- **External lookup:** The verification requires an external check (blockchain RPC, DNS query, AI provider).
- **Interactive:** The verification requires a multi-step flow (OAuth / provider configuration).

## Expiry Types

- **Permanent:** The proof remains valid indefinitely unless explicitly revoked by the user.
- **Point-in-Time:** The proof validates the state *at that specific moment*. For “must be true now” actions, create a fresh proof or require recency.
- **Expiring:** The proof contains an explicit expiration timestamp.

---

## Real-world usage (how to choose freshness)

**Proofs are snapshots.** For point-in-time verifiers (on-chain state, risk checks), you control freshness:

- **Real-time / high-stakes actions** (claims, mints, transfers): use `strategy="fresh"` (UI) or create a new proof (`POST /api/v1/verification`).
- **Low-stakes UI gating:** reuse proofs, but enforce a max age (recommended defaults below).
- **Server-side eligibility checks:** `GET /api/v1/proofs/gate/check` evaluates existing public/discoverable proofs; use `since` / `sinceDays` to require recent proofs.

Recommended max ages (defaults you can adopt):

- **On-chain state** (`nft-ownership`, `token-holding`, `contract-ownership`): **1 hour**
- **Off-chain control / provider-backed checks** (`ownership-dns-txt`, `wallet-risk`): **1 hour**
- **Content moderation** (`ai-content-moderation`): **no recency window by default** (content-hash bound). Re-run only if your policy/provider snapshot requirements change.
- **Delegation** (`agent-delegation`): enforce `expiresAt` (and treat expired as invalid)

## Always avoid drift

To list what is enabled in a given deployment, call:

- `GET /api/v1/verification/verifiers`
