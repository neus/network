# CAIP-380 offline verification

[`minimal-evm.json`](./minimal-evm.json) is a complete, non-sensitive wallet-signed request envelope for Base Sepolia. It uses a test-only key and contains no live user data.

```js
import { verifyPortableProofEnvelope } from '@neus/sdk';
import envelope from './minimal-evm.json' with { type: 'json' };

const result = await verifyPortableProofEnvelope(envelope);

if (!result.valid) {
  throw new Error(result.errors.join('; '));
}
```

The helper performs these checks locally:

1. Canonicalize `did`, `verifierIds`, `data`, `signedTimestamp`, and exactly one chain field.
2. Recompute the 32-byte SHAKE-256 `qHash`.
3. Confirm that `did` matches the wallet and chain context.
4. Rebuild the six-line signing message.
5. Verify EIP-191 or Ed25519 signatures.

EIP-1271 smart-account signatures also need chain state. Pass an ethers provider as `options.provider`.

Freshness is reported separately. An old envelope can remain cryptographically valid even though it is no longer valid for replay as a new verification request.
