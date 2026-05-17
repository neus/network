---
description: NEUS trust workflow for hosted MCP — context first, receipts before repeats, BYOA access keys via neus setup (never paste keys into chat).
---

Use this skill whenever NEUS proofs, verification, agent identity, delegation, or MCP tool usage is in scope.

## Bring your own access (account tools)

Personal tools (`neus_me`, private reads, credits, signatureless verify when allowed) need a Profile access key. Configure locally — do not paste keys into chats:

```bash
npx -y -p @neus/sdk neus setup --access-key <npk_...>
```

Create keys in the NEUS app under Account → Access keys. Omit `--access-key` if you only need public catalog and proof reads.

## Every session (tool order)

1. Run **`neus_context`** first for live guidance and catalog hints.
2. If Bearer auth is configured, run **`neus_me`** before assuming account state.
3. For agent work, use **`neus_agent_link`** (and create agents only through the documented flows).
4. Prefer **`neus_proofs_check`** and existing receipts before starting a new verification.
5. Use **`neus_proofs_get`** when you need exact proof records or qHash values from the network.
6. Use **`neus_verify_or_guide`** only when setup, consent, payment, wallet, or profile prerequisites are missing.

## Proof links (use real qHashes only)

- App: `https://neus.network/proof/<qHash>`
- API: `https://api.neus.network/api/v1/proofs/<qHash>`

Never invent qHashes, verifier IDs, or receipt fields. Take values from tool responses or your app’s stored receipts.
