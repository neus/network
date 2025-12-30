# Sybil resistance

Use `wallet-risk` to add a risk signal to onboarding, allowlists, and claim flows.

## Create and evaluate a risk proof

Wallet risk is **point-in-time**: risk can change. For security-sensitive actions, prefer a fresh proof or require recency.

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

export async function evaluateWalletRisk(walletAddress) {
  const created = await client.verify({
    verifier: 'wallet-risk',
    data: { walletAddress },
    wallet: window.ethereum
  });

  const proofId = created.qHash; // Proof ID (qHash)
  const final = await client.pollProofStatus(proofId, { interval: 3000, timeout: 60000 });
  const verifier = (final.data?.verifiedVerifiers || []).find(
    (v) => v.verifierId === 'wallet-risk' && v.verified === true
  );

  return verifier?.data || {};
}
```

## Combine with other gates

Use `VerifyGate` to combine multiple requirements (e.g. “NFT owner + low risk”):

```jsx
<VerifyGate
  requiredVerifiers={['nft-ownership', 'wallet-risk']}
  strategy="fresh"
  verifierData={{
    'nft-ownership': { contractAddress: '0x...', tokenId: '1', chainId: 1 },
    // wallet-risk defaults to the connected wallet if omitted
  }}
>
  <ClaimAirdropButton />
</VerifyGate>
```

## Reference

- Verifier schema: `docs/verifiers/schemas/wallet-risk.json`

