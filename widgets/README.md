# NEUS Widgets

Drop-in React components for verification. Requires `@neus/sdk`.

## Installation

```bash
npm install @neus/widgets @neus/sdk
```

## Components

### VerifyGate

Gate content behind verification. Two modes: **create** (default) and **access** for private proofs.

```jsx
import { VerifyGate } from '@neus/widgets';

// Create mode - generate new proof
// Use apiUrl to point at your same-origin route in browsers
<VerifyGate requiredVerifiers={['nft-ownership']} apiUrl="/api/neus">
  <PremiumContent />
</VerifyGate>

// Access mode - view private proof
<VerifyGate mode="access" qHash="0x...">
  <PrivateContent />
</VerifyGate>
```

**Props:**
- `requiredVerifiers` - Array of verifier IDs (default: `['ownership-basic']`)
- `mode` - `'create'` | `'access'` (default: `'create'`)
- `qHash` - Proof ID (required for access mode)
- `onVerified` - Callback when verification succeeds
- `children` - Content to gate
- `showBrand` - Always-on NEUS brand (default: `true`). Brand icon is served from IPFS with multi-gateway failover.

### ProofBadge

Display verification status with optional status dot.

```jsx
import { ProofBadge } from '@neus/widgets';

// In dev, pass proof to avoid cross-origin status fetches
<ProofBadge qHash="0x..." proof={{ status: 'verified' }} />
<ProofBadge qHash="0x..." size="md" showDot={false} />
<ProofBadge qHash="0x..." labelOverride="Verified Content" />
```

**Props:**
- `qHash` - Proof identifier (required)
- `size` - `'sm'` | `'md'` (default: `'sm'`)
- `showDot` - Show status dot (default: `true`)
- `labelOverride` - Custom label text
- `uiLinkBase` - Platform URL (default: `'https://neus.network'`)
  
Branding: The NEUS icon is always included and fetched from IPFS using multiple gateways for reliability.

**Status:** Verified (green) | Pending (amber) | Failed (red)

### NeusPillLink

NEUS-branded link component.

```jsx
<NeusPillLink qHash="0x..." label="View Proof" />
```

## Examples

### NFT-Gated Content

```jsx
<VerifyGate 
  requiredVerifiers={['nft-ownership']}
  verifierData={{
    'nft-ownership': {
      contractAddress: '0x...',
      tokenId: '1234',
      chainId: 1
    }
  }}
>
  <div>NFT holders only!</div>
</VerifyGate>
```

### Status Badges

```jsx
// With status dot
<ProofBadge qHash="0x..." />

// Without status dot  
<ProofBadge qHash="0x..." showDot={false} />

// Custom label
<ProofBadge qHash="0x..." labelOverride="Verified Content" />
```

## Requirements

- React 17.0.0+
- @neus/sdk 1.0.0+

## License

Apache 2.0