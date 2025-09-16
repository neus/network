# NEUS Network - Safe Wallet Example

Example for contract wallets using EIP-1271/6492 signatures.

## Setup

```bash
# Set environment variables
export SAFE_WALLET_ADDRESS=0x... # Your Safe address
export SAFE_SIGNATURE=0x...      # Signature from Safe tooling

# Run example
node index.js
```

## Usage

1. **Set wallet address**: `SAFE_WALLET_ADDRESS=0x...`
2. **Run script**: Shows standard message to sign
3. **Sign with Safe**: Use Safe interface to sign the standard message
4. **Set signature**: `SAFE_SIGNATURE=0x...`
5. **Complete**: Re-run to submit verification

The server validates contract wallet signatures using EIP-1271/6492 automatically.

## Notes

- Same request format as EOA wallets
- Server handles EIP-1271/6492 validation
- No special client-side logic required
