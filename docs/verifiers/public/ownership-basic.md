# Basic Ownership

Proof of content authorship/ownership with optional external references.

What it proves
- Attests that a wallet claims authorship/ownership of specific content, with an optional reference (URL, IPFS, on-chain tx, etc.).

Inputs
- See authoritative JSON Schema: [../schemas/ownership-basic.json](../schemas/ownership-basic.json)
- Typical fields:
  - content: string — content being claimed
  - owner: string (address) — auto-populated by SDK/server
  - reference: { type, id } — optional linkage (e.g., url/ipfs/tx)

Outputs
- A proof identified by qHash. Status available via Status API/SDK. When public, an IPFS snapshot may be created if enabled.

Privacy
- Works with private, unlisted, or public proofs. No PII required. Content storage behavior depends on your options.

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

API reference
- Endpoints and response shapes: [../../api/index.md](../../api/index.md)
