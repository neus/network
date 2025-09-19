# NFT

What it proves
- On-chain ownership of a specific NFT by a wallet at current or specified block.

When to use
- Gate features or access by NFT holdings.
- Provide collector credentials for allowlists and airdrops.

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

Output shape (representative)
```json
{
  "success": true,
  "data": {
    "qHash": "0x...",
    "status": "verified",
    "verifiedVerifiers": [
      {
        "verifierId": "nft-ownership",
        "verified": true,
        "status": "nft_ownership_verified",
        "data": {
          "input": {
            "ownerAddress": "0x...",
            "contractAddress": "0x...",
            "tokenId": "1234",
            "chainId": 1,
            "tokenType": "erc721"
          },
          "onChainData": {
            "actualOwner": "0x..."
          },
          "verificationTimestamp": 1730000000000
        }
      }
    ]
  }
}
```

Privacy
- No PII. Uses public chain data. Proof visibility follows your privacyLevel.

Options
- privacyLevel, publicDisplay, enableIpfs, targetChains (testnets only)

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

HTTP API (manual) outline
Use `/verification/standardize` → sign → submit to `/verification`. See API reference.

Common errors
- INVALID_WALLET_ADDRESS, SIGNATURE_INVALID
- VERIFIER_NOT_FOUND
- Token not owned / token not found (verifier-specific status)

API reference
- Endpoints and response shapes: [../../api/index.md](../../api/index.md)
See also
- Privacy & options: [../../PRIVACY.md](../../PRIVACY.md)
- Protocol standards: [../../STANDARDS.md](../../STANDARDS.md)
