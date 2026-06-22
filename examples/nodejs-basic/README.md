# Node.js example

Use this example when your backend already holds a wallet key or signer and you want to create NEUS trust receipts server-side.

For product flows with user signing, prefer [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) or browser `client.verify()`.

## Run it

```bash
cd nodejs-basic
npm install
export TEST_WALLET_PRIVATE_KEY=0x...   # test wallet only
node index.js
```

This runs the full server-side flow: prepare the signing message, sign it, submit the proof, wait for completion, then run a gate check. The result is a `qHash` you can persist like any other id.

## Core pattern

```javascript
const standardizeRes = await fetch('https://api.neus.network/api/v1/verification/standardize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ walletAddress, verifierIds: ['ownership-basic'], data, signedTimestamp })
});

const standardized = await standardizeRes.json();
const message = standardized.data.signerString;
const signature = await wallet.signMessage(message);
```

- [SDK](../../sdk/README.md)
- [API](https://docs.neus.network/api/overview)
