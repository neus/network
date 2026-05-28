---
description: Verify trust before your assistant acts — reuse receipts, check agent authority, and keep credentials sealed. Sign in once; trust travels with every session.
---

Use this skill whenever trust, identity, agent authority, verification, or NEUS tool usage is in scope.

## Sign in (editors and assistants)

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus auth
npx -y -p @neus/sdk neus doctor --live
```

**OAuth through `neus auth`** is the default—browser sign-in, no keys in chat.

For servers and automation only:

```bash
npx -y -p @neus/sdk neus setup --access-key <npk_...>
```

Create access keys under **Account → Access keys** on [neus.network](https://neus.network/profile?tab=account). Never paste keys into chat.

## Account tools (when signed in)

Personal tools such as **`neus_me`**, private reads, and signatureless verify when allowed require a configured access key or completed OAuth sign-in.

Omit access keys if you only need public catalog and receipt reads.

## Every session (recommended order)

1. Run **`neus_context`** first for live guidance.
2. When signed in, run **`neus_me`** before assuming account state.
3. For agent work, use **`neus_agent_link`** (create agents only through documented flows).
4. Prefer **`neus_proofs_check`** and existing trust receipts before starting new verification.
5. Use **`neus_proofs_get`** when you need exact receipt records or receipt IDs from NEUS.
6. Use **`neus_secret_*`** only when signed in and encrypted portable secrets are required ([Secrets](https://docs.neus.network/mcp/secrets)).
7. Use **`neus_verify_or_guide`** only when setup, consent, payment, or account prerequisites are missing.

## Receipt links (use real IDs only)

- App: `https://neus.network/proof/<qHash>`
- API: `https://api.neus.network/api/v1/proofs/<qHash>`

Never invent receipt IDs, check types, or receipt fields. Take values from tool responses or stored receipts.
