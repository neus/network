# Verification

NEUS proofs are created by signing a deterministic request and submitting it to the API. The API returns a **Proof ID** (wire field: `qHash`) you can use for status checks and gating.

## Flow

1. Sign the Standard Signing String ([Signing](./signing.md)).
2. Create a proof (`POST /api/v1/verification` or `NeusClient.verify(...)`).
3. Check status (`GET /api/v1/verification/status/{qHash}` or `NeusClient.getStatus(...)` / `pollProofStatus(...)`).
4. Use the **Proof ID** for gating and downstream integrations.

## Proof ID (qHash)

The **Proof ID** is the stable identifier for a proof record. In the API and SDK payloads, this identifier appears as `qHash`.

Treat the Proof ID as an **opaque** value:

- Store it
- Pass it between systems
- Use it to fetch status and gate access

For the canonical terminology, see [Glossary](./glossary.md#proof-id-qhash).

## Freshness and timestamps

A Proof ID identifies a proof record; it is **not** a “run ID”.

- Use timestamps like `createdAt`, `completedAt`, and/or `lastUpdated` (surface-dependent) to reason about freshness.
- For point-in-time verifiers (balances, ownership, risk), enforce freshness using your chosen gating strategy (see [Gating](./gating.md#proof-freshness-real-world-behavior)).

## Chain context

- **EVM (default):** provide `chainId` (number) and sign using EIP-191 (`personal_sign`).
- **Universal (optional):** provide `chain` (CAIP-2 `namespace:reference`) + `signatureMethod` for non-EVM signers (deployment-dependent).

Important separation:

- The request `chainId`/`chain` is the **signing context** (bound into the signature).
- Some verifiers also require their own chain context inside `data` (e.g., `data.chainId` for on-chain reads). This `data.chainId` is input-selected and may be testnet or mainnet, depending on where the target contract lives.

## Verifier input shape (single vs multi-verifier)

- **Single verifier:** `data` can be a flat object (verifier input).
- **Multi-verifier:** prefer namespaced payloads: `data[verifierId] = { ... }` to avoid field collisions (`contractAddress`, `chainId`, `content`, etc.).

## Subject wallet defaults

Many verifiers accept an explicit subject wallet field (e.g., `ownerAddress`, `walletAddress`) but default it to the signed `walletAddress` when omitted. If you provide a mismatched subject wallet without sponsored mode, the server will override it to the signer for signature safety.

## Status model

For integrations, treat statuses as:

- **processing**: verification is in progress
- **verified***: verification succeeded
- **rejected*/error***: verification failed

For the full status enum, see `docs/api/public-api.json` (OpenAPI) or the SDK `VerificationStatus` type.

## Privacy

Proof visibility is controlled by:

- `options.privacyLevel`: `private` | `public`
- `options.publicDisplay`: discoverability toggle for public proofs

Recommended defaults:

- `privacyLevel: 'private'`
- `publicDisplay: false`
- `storeOriginalContent: false`

For owner-only reads of private proofs, see the API reference section “Private proof access (owner-only)”.

For third-party apps, NEUS also supports **explicit private proof sharing** without making a proof public:

- The owner creates an access grant (`POST /api/v1/verification/access/grant`)
- The viewer reads with a short-lived viewer signature on `data.action="access_private_proof"` (no session cookie required)
