# NEUS Network Fee Structure

**Version:** 1.0.0  

## Current Status (Testnet)

**Testnet only**: During testnet, **no protocol fees** are charged; **no tokens are sold or distributed**. Mainnet pricing will be posted before activation.

During the current testnet phase, verification services are provided **free of charge with limits** for development and testing purposes.

## Future Mainnet Fee Structure

Upon mainnet launch, NEUS Network will implement a sustainable fee structure with multiple payment options:

### Payment Options
1. **Credits or Fiat** - Managed by NEUS Network, Inc.
2. **On-Chain Fee Payment** - Optional utility token (if introduced)

### Token Plumbing (Testnet Only Today)

**No token sale / testnet only.** NEUS has **no live mainnet token** and **does not sell or promise tokens** in connection with Genesis/NFTs. Any future on-chain fee option will be published separately and will not confer financial rights. Access is utility-only.

**Token plumbing (testnet only today).** Mainnet fees will launch in **credits or fiat** via DevCo; **no token is required** to use the protocol. If a token utility path is introduced later, it will be limited to on-chain fee payment/discounts and documented separately. **No token sale, airdrop, or financial rights are being offered.**

### Fee Structure (Mainnet)

**Indicative Fees (mainnet)**
- **Base Verification**: *standard credit charge*
- **Cross-Chain Propagation**: *small incremental credit per target chain*
- **Specialized Verifiers**: *tiered credits by complexity*

### Gas Costs vs. Protocol Fees

**Gas Costs** (Always Required):
- Network transaction fees paid to blockchain validators
- These costs exist regardless of payment method

**Protocol Fees** (Mainnet Only):
- NEUS Network service fees for verification processing
- Can be paid with NEUS tokens OR alternative methods
- Supports ongoing development and ecosystem growth

## Developer Integration

### Testnet Development
```javascript
// Current testnet - no protocol fees
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'My content'
});
// Only gas costs apply
```

### Future Mainnet Integration
```javascript
// Mainnet (future) - fee handling built into SDK
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'My content',
  payment: {
    method: 'neus-token', // or 'alternative'
    // Fee handling managed by SDK
  }
});
```

## Transparency

### Treasury Operations

**Public Treasury Wallet**: `0x929BCAe13Cac6ac1C53EbEd8266F02F8c056F00c`

**Fund Usage** (Genesis Pass sales and contributions):
- **Development**: Protocol development, infrastructure, and technical improvements
- **Security**: Smart contract audits, security reviews, and bug bounties
- **Community**: Community programs, developer grants, and ecosystem support
- **Operations**: Marketing partnerships and business development
- **Legal & Compliance**: Legal framework maintenance and regulatory compliance

All treasury operations are publicly trackable on-chain. Fee structures and token distribution will be fully documented when mainnet launches.

---

**Multiple payment options ensure universal accessibility.**
