
# Privacy

NEUS is designed to support privacy-preserving proofs while still enabling gating and status checks.

## Proof visibility model

Proof visibility and content storage are controlled by three separate fields on `options`:

- `options.privacyLevel`: `private` | `public`
- `options.publicDisplay`: discoverability toggle for public proofs
- `options.storeOriginalContent`: whether original content is stored

Behavior:

- **private**: not readable to non-owners (non-owners may receive minimal status).
- **public + publicDisplay=false**: readable by Proof ID (`proofId`) (link-only / non-discoverable).
- **public + publicDisplay=true**: eligible for public discovery surfaces (feeds/lists).

## Content storage

Content storage is independent from proof privacy.

- `options.storeOriginalContent`: when `true`, allows storing original content (use with care).
- `private + storeOriginalContent=true`: original content is stored for owner-authorized access.
- `private + storeOriginalContent=false`: original content is not stored, but the proof remains private.
- `public + storeOriginalContent=true`: original content is stored and readable by direct proof link.
- `public + storeOriginalContent=false`: original content is not stored, but the proof remains public.
- `options.enableIpfs`: enables public snapshotting for public proofs (when IPFS snapshotting is enabled).

## Gate checks (minimal eligibility)

`GET /api/v1/proofs/check` is designed for eligibility checks:

- Evaluates **public + discoverable** proofs only.
- Returns a minimal eligibility result (and optional safe projections), not full proof payloads.

If your app needs to show a user-facing attribute (for example a handle), prefer the minimal surfaces (`/proofs/check` and `/proofs/by-wallet`) and treat any returned `projections` as optional safe fields (they may be null or omitted).

## Owner access (private proofs)

Some reads support signature-authenticated access for private proofs via headers.

Two supported patterns:

- **Owner access**: owner signs `data.action="access_private_proof"` for `GET /api/v1/verification/status/{qHash}` using the same proof identifier value
- **Shared access (recommended for apps with owner-mediated sharing)**: owner issues an explicit access grant (`POST /api/v1/verification/access/grant`), then the viewer signs `data.action="access_private_proof"` to read the proof without requiring a NEUS session cookie.

`POST /api/v1/verification/access/grant` is a constrained route used for owner-mediated sharing flows. It is not part of the stable public OpenAPI contract, so treat it as an advanced integration path rather than a baseline public endpoint.

## Third-party providers

Some verifiers rely on third-party providers (e.g. wallet risk and content moderation). Only verifier-required data is sent to the provider for the verification request.

Recommended practices:

- Keep proofs **private by default** (`privacyLevel: 'private'`, `publicDisplay: false`)
- Decide content storage independently (`storeOriginalContent` is separate from privacy)
- When gating, prefer minimal surfaces (`/proofs/check`) and **avoid pulling full proof payloads**
