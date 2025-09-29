# NEUS React Example

Complete React app showcasing NEUS verification and widgets.

## Features

- **Basic verification** - Content ownership with SDK
- **NFT-gated content** - Access control with VerifyGate
- **Token holder verification** - DAO governance example
- **Proof badges** - Real-time status display

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

Development proxy:

- The Vite dev server proxies `/api/neus` to the NEUS API. No env needed.
- Alternatively, run the Node backend example and point the browser to it.

## What's Demonstrated

### 1. Simple Verification
```javascript
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'My content'
});
```

### 2. NFT Access Control
```jsx
<VerifyGate requiredVerifiers={['nft-ownership']}>
  <PremiumContent />
</VerifyGate>
```

### 3. Token-Based Access
```jsx
<VerifyGate requiredVerifiers={['token-holding']}>
  <DAOContent />
</VerifyGate>
```

## Use Cases

- **Content platforms** - Verify creator ownership
- **NFT communities** - Token-gated access
- **DAO governance** - Holder verification
- **Social apps** - Proof of ownership/identity
