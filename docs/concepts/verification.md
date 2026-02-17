# Verification

NEUS proofs are created by signing a deterministic request and submitting it to the API. The API returns a **Proof ID** (`proofId`) you can use for status checks and gating.

## Flow

1. Sign the Standard Signing String ([Signing](./signing.md)).
2. Create a proof (`POST /api/v1/verification` or `NeusClient.verify(...)`).
3. Check status (`GET /api/v1/verification/status/{proofId}` or `NeusClient.getStatus(...)` / `pollProofStatus(...)`).
4. Use the **Proof ID** for gating and downstream integrations.

## Proof ID

The **Proof ID** is the stable identifier for a proof record. In public API/SDK surfaces, this identifier is `proofId`.

Treat the Proof ID as an **opaque** value:

- Store it
- Pass it between systems
- Use it to fetch status and gate access

For standard terminology, see [Glossary](./glossary.md#proof-id).

## Freshness and timestamps

A Proof ID identifies a proof record; it is **not** a “run ID”.

- Use timestamps like `createdAt`, `completedAt`, and/or `lastUpdated` (surface-dependent) to reason about freshness.
- For point-in-time verifiers (balances, ownership, risk), enforce freshness using your chosen gating strategy (see [Gating](./gating.md#proof-freshness-real-world-behavior)).

## Chain context

For most integrators, you can treat chain handling as:

- **EVM (0x addresses):** omit `chain` / `chainId`. The server standardizes the signing string for you (use `POST /api/v1/verification/standardize` if building a custom client).
- **Non-EVM:** provide `chain` as CAIP-2 (for example `solana:mainnet`) and the appropriate `signatureMethod` for that ecosystem.

Important separation:

- The request `chainId`/`chain` (when present) is bound into the signature.
- Some verifiers require an explicit `data.chainId` to tell the verifier *where to look* (for example, NFT / token / contract lookups). That `data.chainId` should be the chain where the asset lives.

## Verifier input shape (single vs multi-verifier)

- **Single verifier:** `data` can be a flat object (verifier input).
- **Multi-verifier:** use payloads keyed by verifier ID: `data[verifierId] = { ... }` to avoid field collisions (`contractAddress`, `chainId`, `content`, etc.).

Notes:

- If a client sends a payload keyed by verifier ID for a **single** verifier, the backend normalizes it to the flat shape before processing.

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

## Proof ID determinism (why the same request reuses the same proof)

The Proof ID (`proofId`) is designed to be stable for the same claim inputs.

At a high level it is computed from:

- Normalized signer wallet (format-aware)
- Signer chain (EVM: standardized by the server; non-EVM: explicit CAIP-2 `chain`)
- Sorted verifier ID list
- Standardized `data` **with keys that change between runs removed** (timestamps, nonces, run IDs)

By design, `signedTimestamp` is **not** included in Proof ID computation so point-in-time verifiers can refresh “in place” without producing a brand-new ID solely due to timestamp changes.
