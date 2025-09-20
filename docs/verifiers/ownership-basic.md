# Basic Ownership

Proof of content authorship/ownership with optional external references.

What it proves
- Attests that a wallet claims authorship/ownership of specific content, with an optional reference (URL, IPFS, on-chain tx, etc.).

When to use
- You need a timestamped, portable claim that “this wallet authored/owns this content.”
- You want to anchor provenance without publishing the original content (private by default).

Inputs
- See authoritative JSON Schema: [../schemas/ownership-basic.json](../schemas/ownership-basic.json)
- Typical fields:
  - content: string — content being claimed
  - owner: string (address) — auto-populated by SDK/server
  - reference: { type, id } — optional linkage (e.g., url/ipfs/tx)

Outputs
- A proof identified by qHash. Status available via Status API/SDK. When public, an IPFS snapshot may be created if enabled.

Output shape (representative)
```json
{
  "success": true,
  "data": {
    "qHash": "0x...",
    "status": "verified",
    "verifiedVerifiers": [
      {
        "verifierId": "ownership-basic",
        "verified": true,
        "status": "origin-authenticated",
        "data": {
          "owner": "0x...",
          "reference": { "type": "content", "id": "https://example.com/my-content" },
          "verifierContentHash": "0x...",
          "timestamp": 1730000000000,
          "chainId": 84532
        }
      }
    ]
  }
}
```

Privacy
- Works with private, unlisted, or public proofs. No PII required. Content storage behavior depends on your options.

Options
- privacyLevel: 'private' | 'public'
- publicDisplay: boolean (requires privacyLevel='public')
- storeOriginalContent: boolean (only allowed when public)
- enableIpfs: boolean (create privacy-aware IPFS snapshot)
- targetChains: number[] (testnet spokes for storage; do not include 84532)

High‑value use cases
- IP provenance for AI training and licensing offers
- Editorial timestamping for announcements and research
- Chain‑anchored audit trails for compliance disclosures

SDK example
```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient({ apiUrl: 'https://api.neus.network' });
const result = await client.verify({
  verifier: 'ownership-basic',
  content: 'My original article',
  options: { privacyLevel: 'public' }
});
// result.qHash → track status via client.getStatus(result.qHash)
```

HTTP API (manual) outline
1) Build Standard Signing String via `/api/v1/verification/standardize`
2) Sign the returned string with the wallet
3) Submit to `/api/v1/verification`

Common errors
- INVALID_WALLET_ADDRESS: address format incorrect
- SIGNATURE_INVALID: signed message or parameters mismatch
- VERIFIER_NOT_FOUND: wrong verifier id

API reference
- Endpoints and response shapes: [../../api/README.md](../../api/README.md)
See also
- Privacy & options: [../../PRIVACY.md](../../PRIVACY.md)
- Protocol standards: [../../STANDARDS.md](../../STANDARDS.md)
