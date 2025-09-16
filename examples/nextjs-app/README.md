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

## Integration Patterns

### 1. Client-Side Verification
```javascript
'use client';
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();
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

<ProofBadge qHash={proof.qHash} />
```

## Real-World Use Cases

- **Blog platforms** - Verify author identity
- **NFT marketplaces** - Verify ownership before listing
- **DAO platforms** - Verify governance eligibility
- **Social networks** - Authentic content verification
