# Licensed

What it proves
- Licensed content ownership tied to an on-chain asset (NFT/ERC1155) and expected holder.

When to use
- Software/API entitlements bound to wallet ownership of a license NFT
- Media licensing claims and distribution partner checks
- Enterprise seats/features gated by on‑chain license ownership

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

Output shape (representative)
```json
{
  "success": true,
  "data": {
    "qHash": "0x...",
    "status": "verified",
    "verifiedVerifiers": [
      {
        "verifierId": "ownership-licensed",
        "verified": true,
        "data": {
          "content": "Pro Tools License",
          "license": {
            "contractAddress": "0x...",
            "tokenId": "1",
            "chainId": 1,
            "ownerAddress": "0x...",
            "type": "erc721"
          },
          "onChainData": {
            "actualOwner": "0x..."
          },
          "verificationTimestamp": 1730000000000
        },
        "status": "licensed_ownership_verified"
      }
    ]
  }
}
```

Privacy
- No PII. Proof visibility follows your privacyLevel. Content string should avoid sensitive data.

Options
- privacyLevel: 'private' | 'public'
- publicDisplay / storeOriginalContent (only when public)
- enableIpfs, targetChains (testnets only)

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

HTTP API (manual) outline
Use `/verification/standardize` → sign → submit to `/verification`.

Common errors
- INVALID_WALLET_ADDRESS, SIGNATURE_INVALID
- VERIFIER_NOT_FOUND
- License not owned / token not found (verifier-specific status)

API reference
- Endpoints and response shapes: [../../api/README.md](../../api/README.md)

See also
- Privacy & options: [../../PRIVACY.md](../../PRIVACY.md)
- Protocol standards: [../../STANDARDS.md](../../STANDARDS.md)
