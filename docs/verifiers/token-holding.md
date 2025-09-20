# Token Holding

What it proves
- Wallet holds at least a specified minimum balance of an ERC-20 token.

When to use
- Gate access or features by minimum ERC‑20 balances.
- Enable tiered roles, pricing, or eligibility checks.

Inputs
- See authoritative JSON Schema: [../schemas/token-holding.json](../schemas/token-holding.json)
- Typical fields:
  - ownerAddress: string (address)
  - contractAddress: string (address)
  - minBalance: string — human-readable minimum (e.g., '100')
  - chainId: number
  - blockNumber?: number

Outputs
- qHash-based proof with verification data (meets minimum balance). Cross-chain voucher propagation optional.

Output shape (representative)
```json
{
  "success": true,
  "data": {
    "qHash": "0x...",
    "status": "verified",
    "verifiedVerifiers": [
      {
        "verifierId": "token-holding",
        "verified": true,
        "status": "verified",
        "data": {
          "input": {
            "ownerAddress": "0x...",
            "contractAddress": "0x...",
            "minBalance": "100.0",
            "chainId": 1
          },
          "onChainData": {
            "requiredMinBalance": "100.0"
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
- Protocol eligibility checks (airdrops, quests, bounties)
- Tiered governance thresholds and council eligibility
- Dynamic pricing and rate limits based on holdings

SDK example
```javascript
const result = await client.verify({
  verifier: 'token-holding',
  data: {
    ownerAddress: walletAddress,
    contractAddress: '0x...ERC20',
    minBalance: '100',
    chainId: 1
  }
});
```

HTTP API (manual) outline
Use `/verification/standardize` → sign → submit to `/verification`. See API reference.

Common errors
- INVALID_WALLET_ADDRESS, SIGNATURE_INVALID
- VERIFIER_NOT_FOUND
- Insufficient balance (verifier-specific status)

API reference
- Endpoints and response shapes: [../../api/README.md](../../api/README.md)
See also
- Privacy & options: [../../PRIVACY.md](../../PRIVACY.md)
- Protocol standards: [../../STANDARDS.md](../../STANDARDS.md)
