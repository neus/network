# NEUS Verified Handle React Example

Claim a  handle, display a NEUS Proof Badge, and gate a creator action.

## Run

```bash
cd examples/verified-handle-react
npm install
npm run dev
```

## What it demonstrates

1. **Claim flow** — user signs a handle binding with `ownership-pseudonym` and namespace `acme`.
2. **Badge display** — `<ProofBadge qHash={qHash} showChains />` on a profile.
3. **Server gate check** — before a privileged action, the backend calls `client.gateCheck({ gateId, address })`.

## Key files

- `src/App.jsx` — claim + badge UI
- `server/check.mjs` — server-side eligibility check

## Docs

- [Verified Handles Cookbook](../../docs/cookbook/verified-handles.mdx)
- [SDK README](../../sdk/README.md)
