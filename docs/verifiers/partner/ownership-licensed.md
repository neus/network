# Licensed

What it proves
- Licensed content ownership tied to an on-chain asset (NFT/ERC1155) and expected holder.

Inputs
- See authoritative JSON Schema: [../schemas/ownership-licensed.json](../schemas/ownership-licensed.json)
- Typical fields:
  - content: string — description/title of licensed content
  - owner: string (address) — license owner
  - license: {
      contractAddress: string (address),
      tokenId: string,
      chainId: number,
      ownerAddress: string (address),
      type?: 'erc721' | 'erc1155'
    }

Outputs
- qHash-based proof linking content to an on-chain license and the expected holder.

Privacy
- No PII. Proof visibility follows your privacyLevel. Content string should avoid sensitive data.

High‑value use cases
- Software and API entitlements with wallet‑native access control
- Media licensing claims for distribution partners
- Enterprise seats and feature flags bound to on‑chain ownership

SDK example
```javascript
const result = await client.verify({
  verifier: 'ownership-licensed',
  data: {
    content: 'Pro Tools License',
    owner: walletAddress,
    license: { contractAddress: '0x...', tokenId: '1', chainId: 1, ownerAddress: walletAddress }
  }
});
```

API reference
- Endpoints and response shapes: [../../api/index.md](../../api/index.md)
