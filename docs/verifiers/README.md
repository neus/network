# Verifier Catalog

NEUS provides public verifiers available to all developers without API keys.

Each verifier is a standardized module that accepts specific input data, validates it, and produces a cryptographic proof.

Machine-readable source of truth:

- `spec/VERIFIERS.json`
- `docs/verifiers/schemas/*.json`
- Runtime verifier list: `GET /api/v1/verification/verifiers`

Per-verifier detail pages are generated from verifier metadata and schemas to reduce drift.

---

## Ownership

| Verifier | Flow | Expiry | Description |
| :--- | :--- | :--- | :--- |
| **[`ownership-basic`](./ownership-basic.md)** | Instant | Permanent | **Content Authorship.** Prove that a wallet created a specific piece of content. Includes origin locking. |
| **[`ownership-social`](./ownership-social.md)** | Interactive (Hosted) | Permanent | **Social Ownership.** Prove control of a social account via NEUS-hosted OAuth flow (Discord, GitHub, X, Farcaster). |
| **[`ownership-pseudonym`](./ownership-pseudonym.md)** | Instant | Expiring | **Handle Binding.** Bind a wallet to a namespace + handle with explicit `expiresAt`. |
| **[`ownership-org-oauth`](./ownership-org-oauth.md)** | Interactive (Hosted) | Permanent | **Organization Ownership.** Prove organization membership via NEUS-hosted OAuth flow (Google Workspace, Microsoft 365). |
| **[`ownership-dns-txt`](./ownership-dns-txt.md)** | Lookup | Point-in-Time | **Domain Control.** Verify ownership of a DNS domain by checking a TXT record at `_neus.{domain}`. |
| **[`contract-ownership`](./contract-ownership.md)** | Lookup | Point-in-Time | **Contract Control.** Verify that a wallet is the contract `owner`, `admin`, or holds DEFAULT_ADMIN_ROLE (AccessControl), depending on method. |

---

## Assets

| Verifier | Flow | Expiry | Description |
| :--- | :--- | :--- | :--- |
| **[`nft-ownership`](./nft-ownership.md)** | Lookup | Point-in-Time | **NFT Gating.** Verify ownership of a specific ERC-721 or ERC-1155 token ID. |
| **[`token-holding`](./token-holding.md)** | Lookup | Point-in-Time | **Token Gating.** Verify that a wallet holds a minimum balance of a specific ERC-20 token. |

---

## Identity & agents

| Verifier | Flow | Expiry | Description |
| :--- | :--- | :--- | :--- |
| **[`proof-of-human`](./proof-of-human.md)** | Interactive (Hosted) | Expiring | **Proof of Human.** Privacy-preserving personhood proof via NEUS-hosted ZK Passport flow. |
| **[`agent-identity`](./agent-identity.md)** | Instant | Permanent | **Bot Identity.** Establish a portable, self-attested identity for an AI agent, bot, or service (ERC-8004 compatible). |
| **[`agent-delegation`](./agent-delegation.md)** | Instant | Expiring | **Authority Delegation.** Cryptographically delegate authority (e.g., "can trade") from a controller to an agent. |
| **[`wallet-link`](./wallet-link.md)** | Instant | Permanent | **Account Linking.** Link a secondary wallet to a primary identity using a cryptographic signature. |
| **[`wallet-risk`](./wallet-risk.md)** | Lookup | Point-in-Time | **Sybil Resistance.** Assess the risk level of a wallet address to prevent fraud and bot spam. |

---

## Content safety

| Verifier | Flow | Expiry | Description |
| :--- | :--- | :--- | :--- |
| **[`ai-content-moderation`](./ai-content-moderation.md)** | Lookup | Permanent | **Safety Check.** Analyze text or images for safety/moderation flags before allowing on-chain actions. |

---

## Flow Types

- **Instant:** The verification is purely cryptographic or self-contained. It happens immediately upon receiving the signature.
- **Interactive (Hosted):** The verification requires a NEUS-hosted checkout flow (popup/redirect), then returns a proof usable by gate checks.
- **External lookup:** The verification requires an external check (blockchain RPC, DNS query, AI provider).

For interactive verifiers (`ownership-social`, `ownership-org-oauth`, `proof-of-human`), use `VerifyGate` hosted checkout. See [Gating](../concepts/gating.md#hosted-checkout-interactive-verifiers).

## Expiry Types

- **Permanent:** The proof remains valid indefinitely unless explicitly revoked by the user.
- **Point-in-Time:** The proof validates the state *at that specific moment*. For “must be true now” actions, create a fresh proof or require recency.
- **Expiring:** The proof contains an explicit expiration timestamp.

---

## Real-world usage (how to choose freshness)

**Proofs are snapshots.** For point-in-time verifiers (on-chain state, risk checks), you control freshness:

- **Real-time / high-stakes actions** (claims, mints, transfers): use `strategy="fresh"` (UI) or create a new proof (`POST /api/v1/verification`).
- **Low-stakes UI gating:** reuse proofs, but enforce a max age (recommended defaults below).
- **Server-side eligibility checks:** `GET /api/v1/proofs/check` evaluates existing public/discoverable proofs; use `since` / `sinceDays` to require recent proofs.

Recommended max ages (defaults you can adopt):

- **On-chain state** (`nft-ownership`, `token-holding`, `contract-ownership`): **1 hour**
- **Off-chain control / provider-backed checks** (`ownership-dns-txt`, `wallet-risk`): **1 hour**
- **Content moderation** (`ai-content-moderation`): **no recency window by default** (content-hash bound). Re-run only if your policy/provider snapshot requirements change.
- **Namespaced handles** (`ownership-pseudonym`): enforce `expiresAt` (treat expired handles as invalid for current-ownership checks)
- **Delegation** (`agent-delegation`): enforce `expiresAt` (and treat expired as invalid)

## Always avoid drift

To list currently available verifiers, call:

- `GET /api/v1/verification/verifiers`
