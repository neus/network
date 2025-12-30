# NEUS Network

[![npm](https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=@neus/sdk)](https://www.npmjs.com/package/%40neus%2Fsdk)

**Verify once. Prove everywhere.**

NEUS is a **universal verification protocol** for identity, ownership, and agent authenticity across platforms and chains.  
It turns verifications into a **portable proof** you can reuse anywhere—apps, APIs, smart contracts, or AI systems—without rebuilding trust logic each time.

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

// Proof ID (wire field: qHash)
const proofId = proof.qHash;
console.log('Proof ID:', proofId);

// Resolve status later (for gating, auditing, refresh policy, etc.)
const status = await client.getStatus(proofId);
console.log('Status:', status.status);
```

> **Proof ID = `qHash`** (field name).  
> The Proof ID is stable for repeat verifications. **Freshness** comes from timestamps like `completedAt` / per-verifier `verifiedAt`.

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

| Resource                                 | Description                        |
| ---------------------------------------- | ---------------------------------- |
| [Docs home](./docs/README.md)            | Protocol overview and guides       |
| [Quickstart](./docs/QUICKSTART.md)       | Create your first proof            |
| [API Reference](./docs/api/README.md)    | HTTP endpoints                     |
| [Verifiers](./docs/verifiers/README.md)  | Verifier catalog + schemas         |
| [Contracts](./contracts/VERIFICATION.md) | Verified deployments and explorers |
| [Examples](./examples/)                  | Integration examples               |

---

## Support

| Channel                                                           | Use For         |
| ----------------------------------------------------------------- | --------------- |
| [GitHub Discussions](https://github.com/neus/network/discussions) | Questions       |
| [GitHub Issues](https://github.com/neus/network/issues)           | Bug reports     |
| [dev@neus.network](mailto:dev@neus.network)                       | Security issues |

---

## License

* **Smart Contracts:** BUSL-1.1 → Apache-2.0 (Aug 2028)
* **SDK & Tools:** Apache-2.0
