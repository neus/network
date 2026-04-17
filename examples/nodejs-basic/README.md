# Node.js example

**Prefer [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) or browser `client.verify()`** for product flows. This repo is for **backend-held keys** or learning the **standardize to sign to submit** HTTP pattern.

**Run the full server-side flow** (prepare signing text, sign, submit, wait for completion, then gate check) in one file - ideal when your backend already has a wallet key or signer and you want **`proofId`** values you can persist like any other id.

```bash
cd nodejs-basic
npm install
export TEST_WALLET_PRIVATE_KEY=0x...   # test wallet only
node index.js
```

Core pattern:

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
