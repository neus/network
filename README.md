# NEUS Network

[![npm](https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=@neus/sdk)](https://www.npmjs.com/package/@neus/sdk)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

**Verify once. Prove everywhere.**

NEUS is a **portable proof infrastructure** for creating and managing verifiable proofs. 

> Turn verified claims into portable proofs you can reuse anywhere—apps, APIs, smart contracts, or AI systems—without rebuilding trust logic each time.

---

## Quick Start

```bash
npm install @neus/sdk
```

```js
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

// Create a proof
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'My original content',
  wallet: window.ethereum,
});

// Use proofId for status, gating, and reuse
const proofId = proof.proofId;
const status = await client.getStatus(proofId);
```

---

## Server-Side Gating

For backend eligibility checks, use the minimal gate endpoint:

- **HTTP:** `GET /api/v1/proofs/check`
- **SDK:** `client.gateCheck({ address, verifierIds, since, sinceDays, ... })`

---

## React Widgets

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

For Next.js App Router, render widgets inside a **Client Component**.

---

## Documentation

| Resource | Description |
|----------|-------------|
| [Docs](https://docs.neus.network) | Full documentation |
| [Quickstart](https://docs.neus.network/quickstart) | First proof, gating, hosted verify |
| [API Reference](https://docs.neus.network/api-reference) | OpenAPI reference |
| [Verifiers](https://docs.neus.network/ecosystems/verifiers) | Verifier catalog and schemas |
| [Examples](./examples/) | Node.js, React, curl |

---

## Support

| Channel | Use For |
|---------|---------|
| [GitHub Discussions](https://github.com/neus/network/discussions) | Questions |
| [GitHub Issues](https://github.com/neus/network/issues) | Bug reports |
| [dev@neus.network](mailto:dev@neus.network) | Security issues |

---

## License

- **Smart Contracts:** BUSL-1.1 → Apache-2.0 (Aug 2028)
- **SDK & Tools:** Apache-2.0
