# NEUS Network

[![npm](https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=@neus/sdk)](https://www.npmjs.com/package/%40neus%2Fsdk)

**Verify once. Prove everywhere.**

NEUS is a **portable proof infrastructure** for creating and managing verifiable proofs that are designed for maximum portability and reuse.
It turns verified claims into **portable proof** you can reuse anywhere-apps, APIs, smart contracts, or AI systems-without rebuilding trust logic each time.

## Quick start (SDK)

```bash
npm install @neus/sdk
```

```js
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

// Create (or refresh) a proof
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'My original content',
  wallet: window.ethereum,
});

// Proof ID (standard).
const proofId = proof.proofId;
console.log('Proof ID:', proofId);

// Resolve status later (for gating, auditing, refresh policy, etc.)
const status = await client.getStatus(proofId);
console.log('Status:', status.status);
```

> **Use `proofId` as the standard ID.**
> `qHash` is a deprecated alias with the same value (`proofId === qHash`).
> Freshness comes from timestamps like `completedAt` / per-verifier `verifiedAt`.

## Server-side gating (recommended)

For backend eligibility checks, use the minimal gate endpoint (or the SDK wrapper). This avoids pulling full proof payloads and lets you enforce freshness windows for point-in-time verifiers.

- HTTP: `GET /api/v1/proofs/check`
- SDK: `client.gateCheck({ address, verifierIds, since, sinceDays, ... })`

---

## Quick start (React widgets)

Widgets are optional and live under a dedicated subpath.

```jsx
import { VerifyGate, ProofBadge } from '@neus/sdk/widgets';

export function Gated() {
  return (
    <VerifyGate verifierData={{ 'nft-ownership': { contractAddress: '0x...', tokenId: '1', chainId: 1 } }}>
      <ProtectedComponent />
    </VerifyGate>
  );
}
```

For Next.js App Router, render widgets inside a **Client Component** (widget modules are client-only).

---

## Documentation

| Resource | Description |
| --- | --- |
| [Docs home](https://docs.neus.network) | Standardized published documentation |
| [Quickstart](https://docs.neus.network/quickstart) | First proof, gating, and hosted verify |
| [API Guides](https://docs.neus.network/api/overview) | Public HTTP contract, signing, and errors |
| [API Reference](https://docs.neus.network) | Generated OpenAPI reference in the docs navbar |
| [Verifiers](https://docs.neus.network/ecosystems/verifiers) | Verifier catalog + schemas |
| [Contracts](./contracts/VERIFICATION.md) | Verified contracts and explorers |
| [Examples](./examples/) | Integration examples |

**Source of truth:**

- Public docs prose lives in [`mintlify/`](./mintlify/).
- Machine-readable verifier assets live in [`spec/verifiers/`](./spec/verifiers/README.md).
- SDK and examples should link to the published docs site or canonical repo assets, never a legacy `docs/` prose tree.
- [`mintlify/openapi/public-api.json`](./mintlify/openapi/public-api.json) is the published OpenAPI contract used by the docs API Reference tab.
- Preview docs locally with `npm run docs:dev`.
- Validate docs locally with `npm run docs:validate`.
- Run the [Docs workflow](./.github/workflows/docs.yml) before publishing docs changes.
- For a release-grade docs receipt, generate a deterministic manifest with `node scripts/generate-docs-manifest.mjs --out docs-v1-manifest.json` and use the aggregate hash in your NEUS proof flow.

---

## Support

| Channel | Use For |
| --- | --- |
| [GitHub Discussions](https://github.com/neus/network/discussions) | Questions |
| [GitHub Issues](https://github.com/neus/network/issues) | Bug reports |
| [dev@neus.network](mailto:dev@neus.network) | Security issues |

---

## License

- **Smart Contracts:** BUSL-1.1 -> Apache-2.0 (Aug 2028)
- **SDK & Tools:** Apache-2.0
