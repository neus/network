# Node.js example

```bash
cd nodejs-basic
npm install
export TEST_WALLET_PRIVATE_KEY=0x...   # test wallet only
node index.js
```

Uses `standardize` → sign → submit → poll, then `gateCheck`.

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
