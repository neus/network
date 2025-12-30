---
description: Privacy model for proofs (private vs public vs discoverable) and safe defaults.
icon: 🔒
---

# Privacy

NEUS is designed to support privacy-preserving proofs while still enabling gating and status checks.

## Proof visibility model

Proof visibility is controlled by two fields on `options`:

- `options.privacyLevel`: `private` | `public`
- `options.publicDisplay`: discoverability toggle for public proofs

Behavior:

- **private**: not readable to non-owners (non-owners may receive minimal status).
- **public + publicDisplay=false**: readable by Proof ID (qHash) (link-only / non-discoverable).
- **public + publicDisplay=true**: eligible for public discovery surfaces (feeds/lists).

## Content storage

By default, raw input content is not stored.

- `options.storeOriginalContent`: when `true`, allows storing original content (use with care).
- `options.enableIpfs`: enables public snapshotting for public proofs (deployment-dependent).

## Gate checks (minimal eligibility)

`GET /api/v1/proofs/gate/check` is designed for eligibility checks:

- Evaluates **public + discoverable** proofs only.
- Returns a minimal eligibility result (and optional safe projections), not full proof payloads.

If your app needs to show a user-facing attribute (for example a handle), prefer **projection fields** (`select`) over fetching full proofs.

## Owner access (private proofs)

Some reads support signature-authenticated access for private proofs via headers.

Two supported patterns:

- **Owner access**: owner signs `data.action="access_private_proof"` for `GET /api/v1/verification/status/{qHash}`
- **Shared access (recommended for apps)**: owner issues an explicit access grant (`POST /api/v1/verification/access/grant`), then the viewer signs `data.action="access_private_proof"` to read the proof without requiring a NEUS session cookie.

## Third-party providers

Some verifiers rely on third-party providers (e.g. wallet risk and content moderation). Only verifier-required data is sent to the provider for the verification request.

Recommended practices:

- Keep proofs **private by default** (`privacyLevel: 'private'`, `publicDisplay: false`)
- Store only what you need (`storeOriginalContent: false` unless explicitly required)
- When gating, prefer minimal surfaces (`/proofs/gate/check`) and **avoid pulling full proof payloads**
