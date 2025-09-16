# Token Holding

What it proves
- Wallet holds at least a specified minimum balance of an ERC-20 token.

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

Privacy
- No PII. Uses public chain data. Proof visibility follows your privacyLevel.

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

API reference
- Endpoints and response shapes: [../../api/index.md](../../api/index.md)
