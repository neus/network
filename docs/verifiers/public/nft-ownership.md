# NFT

What it proves
- On-chain ownership of a specific NFT by a wallet at current or specified block.

Inputs
- See authoritative JSON Schema: [../schemas/nft-ownership.json](../schemas/nft-ownership.json)
- Typical fields:
  - ownerAddress: string (address) — holder wallet (SDK may set)
  - contractAddress: string (address) — NFT contract
  - tokenId: string — token ID
  - chainId: number — EVM chain ID
  - blockNumber?: number — optional historical check

Outputs
- qHash-based proof with verification data (owner, contract, tokenId, chainId). Cross-chain voucher propagation can be enabled.

Privacy
- No PII. Uses public chain data. Proof visibility follows your privacyLevel.

High‑value use cases
- Token‑gated commerce and loyalty tiers
- Collector credentials for ticketing or airdrops
- Rights gating for derivative content and remix permissions

SDK example
```javascript
const result = await client.verify({
  verifier: 'nft-ownership',
  data: {
    ownerAddress: walletAddress,
    contractAddress: '0x...NFT',
    tokenId: '1234',
    chainId: 1
  }
});
```

API reference
- Endpoints and response shapes: [../../api/index.md](../../api/index.md)
