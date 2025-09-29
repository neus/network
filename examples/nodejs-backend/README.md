# NEUS Node.js Backend Example

Complete backend integration patterns with NEUS verification.

## Features

- **Content publishing** - Verify ownership before publishing
- **NFT marketplace** - Verify ownership before listing
- **DAO governance** - Check voting eligibility
- **Proof status API** - Get verification status

## Setup

```bash
npm install
npm start
```

Server runs on http://localhost:3001

This server exposes a forwarder at `/api/neus/*` for frontend apps to use as a same-origin proxy to the NEUS API. It strips `Origin/Referer/Cookie` from requests.

## API Endpoints

### Content Publishing
```bash
POST /api/publish
{
  "content": "My blog post content",
  "author": "0x...",
  "title": "My Article"
}
```

### NFT Marketplace Listing
```bash
POST /api/list-nft
{
  "contractAddress": "0x...",
  "tokenId": "1234", 
  "sellerWallet": "0x...",
  "chainId": 1
}
```

### DAO Voting Eligibility
```bash
POST /api/check-voting
{
  "walletAddress": "0x...",
  "proposalId": "proposal-123",
  "tokenContract": "0x..."
}
```

### Proof Status
```bash
GET /api/proof/{qHash}
```

## Integration Patterns

Each endpoint verifies user claims before granting access or permissions:

1. **Receive request** with user wallet and data
2. **Create NEUS proof** to verify ownership/eligibility
3. **Grant access** if verification succeeds
4. **Return proof ID** for audit trail

## Use Cases

- **Content platforms** - Verify authors before publishing
- **NFT marketplaces** - Prevent fake listings
- **DAO platforms** - Verify voting eligibility
- **Social apps** - Authenticate content ownership
