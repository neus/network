# NEUS Next.js Example

Complete Next.js App Router integration with NEUS verification.

## Features

- **App Router** - Modern Next.js 14+ structure
- **Content verification** - Creator ownership proofs
- **NFT access control** - Token-gated premium content
- **Token holder verification** - DAO governance patterns
- **Real-time proof status** - Live verification badges

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

The example includes a server route handler at `/api/neus/*` that forwards requests to the NEUS API with sanitized headers. No env required.

## Integration Patterns

### 1. Client-Side Verification
```javascript
'use client';
import { NeusClient } from '@neus/sdk';

// Use same-origin proxy route to avoid CORS in dev/preview
const client = new NeusClient({ apiUrl: '/api/neus' });
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'My blog post'
});
```

### 2. Access Control Components
```jsx
import { VerifyGate } from '@neus/widgets';

<VerifyGate requiredVerifiers={['nft-ownership']}>
  <PremiumContent />
</VerifyGate>
```

### 3. Proof Status Display
```jsx
import { ProofBadge } from '@neus/widgets';

// In dev, pass the proof object to avoid cross-origin fetches
<ProofBadge qHash={proof.qHash} proof={proof} />
```

## Real-World Use Cases

- **Blog platforms** - Verify author identity
- **NFT marketplaces** - Verify ownership before listing
- **DAO platforms** - Verify governance eligibility
- **Social networks** - Authentic content verification
