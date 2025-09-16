# Privacy & Discoverability

**Privacy controls and data visibility settings for verification proofs.**

For the formal, user-facing Privacy Policy, see: https://docs.neus.network/learn/legal/privacy-policy

## Privacy Model

### Two-Tier Privacy System

NEUS uses a simple, intuitive privacy model that matches how people think about sharing information:

| Privacy Level | Visibility | Analogy | Best For |
|---------------|------------|---------|----------|
| **`public`** | Anyone can see details when explicitly enabled (requires publicDisplay=true OR storeOriginalContent=true) | Public news article | Open verification, public records |
| **`private`** | Only wallet owner can access full details (signature required). Non‑owners see a minimal, sanitized status. | Private message | Sensitive proofs, personal verification |

### How It Works

```javascript
// Public proof - visible to everyone
const publicProof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Public announcement',
  options: {
    privacyLevel: 'public',
    publicDisplay: true  // Enables social previews
  }
});

// Private proof - owner-only access
const privateProof = await client.verify({
  verifier: 'token-holding',
  data: {
    ownerAddress: walletAddress,  // Required - Token holder wallet (auto-set by SDK)
    contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI token
    minBalance: '100.0',
    chainId: 1
  },
  options: {
    privacyLevel: 'private',
    publicDisplay: false,
    storeOriginalContent: false  // Extra privacy
  }
});
```

## Security Guarantees

### Built-in Protection

- **Tamper-proof**: Cryptographic signatures prevent modification
- **Hash-based IDs**: Quantum-resistant qHash identifiers
- **Wallet-controlled**: Private proof access is controlled by the wallet owner
- **Fresh signatures**: Time-boxed access prevents replay attacks
- **No personal data**: No emails, names, or identifying information required

### Private Proof Access

Private proofs require wallet ownership to view full details via signed request. Non‑owners always receive a minimal, sanitized status.

```javascript
// Access a private proof with a wallet signature from the proof owner (SDK method)
const privateStatus = await client.getPrivateStatus(qHash, wallet);
```

**Security Features:**
- Signatures must be fresh (5-minute window)
- Only wallet owner can generate valid signatures
- Direct signature verification with timestamp validation
- No API keys or passwords to compromise

## Discovery & Visibility

### What's Hidden vs. Public

**For Private proofs:**
- Not indexed by search engines (`noindex` meta tags)
- No social media previews (generic OG cards)
- Cannot browse or discover without exact proof ID
- Status endpoint returns uniform responses for privacy

**For Public Proofs:**
- Can be indexed and socially shared if `publicDisplay: true`
- Rich social media previews with proof details
- Full status information available to anyone when `publicDisplay: true` OR `storeOriginalContent: true`
- Suitable for public verification use cases

### Status Endpoint Behavior

Private or non-existent proofs return uniform responses to protect privacy. Inaccessible proofs are treated as not found to prevent information disclosure.

## Data Minimization

### What NEUS Never Stores

- Personal identifying information
- Email addresses or contact details  
- Browsing history or activity tracking
- Private keys or seed phrases
- Original sensitive content (when `storeOriginalContent: false`)

### What NEUS Stores

- Wallet addresses (public blockchain data)
- Verification timestamps
- Proof metadata and qHash
- Cross-chain transaction hashes
- Content only when explicitly opted in

### IPFS Storage

For proofs with `enableIpfs: true`:
- **IPFS snapshots** contain proof metadata and verification results
- **Privacy-aware**: Wallet addresses are masked in public snapshots
- **Content inclusion**: Only when `storeOriginalContent: true` AND `privacyLevel: 'public'` (this combination enables public access)
- **Signatures excluded**: Authentication signatures never stored in IPFS
- **Access**: IPFS snapshots are publicly accessible via gateway URLs

## Integration Best Practices

### Default to Private

Always start with the most private settings and only reduce privacy when necessary:

```javascript
const defaultOptions = {
  privacyLevel: 'private',        // Most restrictive by default
  publicDisplay: false,           // No public UI display
  storeOriginalContent: false,    // Don't store original content in IPFS
  enableIpfs: false,              // Skip IPFS snapshot creation
  targetChains: []                // Hub-only verification (no cross-chain storage)
};
```

 

### UI Privacy Indicators

Always show privacy level clearly in your UI:

```jsx
function ProofDisplay({ proof }) {
  const privacyLabel = {
    public: 'Public',
    private: 'Private'
  };
  
  return (
    <div>
      <span>{privacyLabel[proof.privacyLevel]}</span>
      <span>{proof.privacyLevel} proof</span>
      {proof.privacyLevel === 'public' && proof.publicDisplay && 
        <span>Publicly discoverable</span>
      }
    </div>
  );
}
```

## Rate Limiting & Abuse Prevention

### Status Endpoint Protection

- Per-IP rate limits on proof status checks
- Per-ASN (autonomous system) limits for large-scale protection
- Progressive delays for suspicious activity
- CAPTCHA challenges for burst requests

### Proof Creation Limits

- Wallet-based rate limiting (prevents spam)
- Gas cost natural rate limiting on testnets
- Verification complexity affects creation time

### Recommended Client-Side Limits

```javascript
// Implement client-side rate limiting
const rateLimiter = {
  lastRequest: 0,
  minInterval: 1000, // 1 second between requests
  
  async checkStatus(qHash) {
    const now = Date.now();
    const timeSince = now - this.lastRequest;
    
    if (timeSince < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSince)
      );
    }
    
    this.lastRequest = Date.now();
    return client.getStatus(qHash);
  }
};
```

 

## Questions & Support

### Common Questions

**Q: Can I change privacy level after creating a proof?**
A: Currently no - privacy level is set at creation time. Choose carefully.

**Q: Are private proofs really private?**
A: Yes — only the wallet owner can access private proof details via signed requests. NEUS does not have access to view your data.

**Q: Can someone guess my qHash?**
A: No - qHashes are cryptographically secure with 256-bit entropy.

**Q: What happens if I lose my wallet?**
A: Private proofs become permanently inaccessible. Consider backup strategies.

### Getting Help

- **Documentation**: See [5-Minute Tutorial](./QUICKSTART.md)
- **Technical Issues**: [GitHub Issues](https://github.com/neus/network/issues)
- **Security & Technical Concerns**: dev@neus.network
- **Business & Partnerships**: info@neus.network

---

