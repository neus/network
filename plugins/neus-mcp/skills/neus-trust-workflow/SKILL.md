---
description: NEUS trust workflow for hosted MCP — context first, receipts before repeats, OAuth sign-in first with access key fallback for automation.
---

Use this skill whenever NEUS proofs, verification, agent identity, delegation, or MCP tool usage is in scope.

## Connect and sign in

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus auth
npx -y -p @neus/sdk neus doctor --live
```

OAuth through **`neus auth`** is the default for editors and assistants. For servers and CI only:

```bash
npx -y -p @neus/sdk neus setup --access-key <npk_...>
```

Create Profile access keys under Account → Access keys on neus.network. Never paste keys into chat.

## Every session (tool order)

1. Run **`neus_context`** first for live guidance and catalog hints.
2. If Bearer auth is configured, run **`neus_me`** before assuming account state.
3. For agent work, use **`neus_agent_link`** (and create agents only through the documented flows).
4. Prefer **`neus_proofs_check`** and existing receipts before starting a new verification.
5. Use **`neus_proofs_get`** when you need exact proof records or qHash values from the network.
6. Use **`neus_secret_*`** only when authenticated and you need encrypted portable secrets ([Secrets](https://docs.neus.network/mcp/secrets)).
7. Use **`neus_verify_or_guide`** only when setup, consent, payment, wallet, or profile prerequisites are missing.

## Proof links (use real qHashes only)

- App: `https://neus.network/proof/<qHash>`
- API: `https://api.neus.network/api/v1/proofs/<qHash>`

Never invent qHashes, verifier IDs, or receipt fields. Take values from tool responses or your app's stored receipts.
