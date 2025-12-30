---
description: SDK + HTTP API for portable proofs you can gate on.
icon: 🌐
cover: ./assets/covers/overview.svg
---

NEUS provides an open verification network for creating and checking cryptographic proofs used for gating and status checks.

## Get started

<table data-view="cards">
  <thead>
    <tr>
      <th></th>
      <th></th>
      <th data-hidden data-card-target data-type="content-ref"></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>⚡ Quickstart</strong></td>
      <td>Create your first proof and wire a gate.</td>
      <td><a href="./QUICKSTART.md">./QUICKSTART.md</a></td>
    </tr>
    <tr>
      <td><strong>📦 SDK</strong></td>
      <td>Client usage, configuration, and common flows.</td>
      <td><a href="../sdk/README.md">../sdk/README.md</a></td>
    </tr>
    <tr>
      <td><strong>🧩 VerifyGate widget</strong></td>
      <td>Drop-in React gating with freshness controls.</td>
      <td><a href="../sdk/widgets/README.md">../sdk/widgets/README.md</a></td>
    </tr>
    <tr>
      <td><strong>🧭 API reference</strong></td>
      <td>Public endpoints (OpenAPI-backed) + interactive viewers.</td>
      <td><a href="./api/README.md">./api/README.md</a></td>
    </tr>
    <tr>
      <td><strong>🛡️ Verifier catalog</strong></td>
      <td>Verifier IDs, tiers, and input schemas.</td>
      <td><a href="./verifiers/README.md">./verifiers/README.md</a></td>
    </tr>
    <tr>
      <td><strong>🧪 Examples</strong></td>
      <td>Minimal curl / Node.js / React examples.</td>
      <td><a href="../examples/README.md">../examples/README.md</a></td>
    </tr>
  </tbody>
</table>

## Learn the system

<table data-view="cards">
  <thead>
    <tr>
      <th></th>
      <th></th>
      <th data-hidden data-card-target data-type="content-ref"></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>🧠 Concepts</strong></td>
      <td>Signing, verification lifecycle, gating, and widgets.</td>
      <td><a href="./concepts/README.md">./concepts/README.md</a></td>
    </tr>
    <tr>
      <td><strong>🧭 Guides</strong></td>
      <td>Real-world patterns (NFT gating, domains, agents, sybil resistance).</td>
      <td><a href="./guides/README.md">./guides/README.md</a></td>
    </tr>
    <tr>
      <td><strong>🔒 Privacy</strong></td>
      <td>Public vs private proofs and safe defaults.</td>
      <td><a href="./PRIVACY.md">./PRIVACY.md</a></td>
    </tr>
    <tr>
      <td><strong>🔐 Security</strong></td>
      <td>Threat model and integration constraints.</td>
      <td><a href="../SECURITY.md">../SECURITY.md</a></td>
    </tr>
  </tbody>
</table>

## Schema references

| Artifact | Purpose |
| :--- | :--- |
| `spec/VERIFIERS.json` | Verifier IDs + tiers (source of truth). |
| `docs/api/public-api.json` | OpenAPI for the public HTTP surface. |
| `docs/verifiers/schemas/*.json` | Verifier input schemas (public verifiers). |

## Need premium / sponsored capabilities?

Hosted deployments may offer **enterprise API keys** for:

- **Lookup mode** (`POST /api/v1/verification/lookup`): non-persistent, server-to-server checks (no `qHash` minted).
- **Higher limits** on select surfaces (deployment-dependent).
- **Premium verifiers** (for example social and organization OAuth verifications).

Start here: **[API Reference → Premium / Sponsored mode](./api/README.md#premium--sponsored-mode)**.
