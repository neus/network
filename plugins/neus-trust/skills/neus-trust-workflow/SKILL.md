---
name: NEUS Trust Harness
description: Trust harness for AI agents. Use when agents need proof-backed context, identity, authority, policy checks, NEUS MCP tools, or proof receipts before running tools or taking trusted actions.
---

Proof-backed context, identity, authority, policy checks, and receipts before your assistant runs tools.

**Trust harness for AI agents.** NEUS gives assistants verifiable identity, scoped authority, and receipts for every trusted action. Your framework handles reasoning, tools, and execution. NEUS proves whether the agent should be trusted to act and leaves receipts other apps, gates, and audits can check later.

## Setup

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus doctor --live
```

`neus setup` configures hosted MCP for Cursor, Codex, VS Code, and Claude Code. Cursor, VS Code, and Claude Code use browser OAuth. Codex uses its own MCP login after setup.

Codex-only:

```bash
npx -y -p @neus/sdk neus setup --client codex
npx -y -p @neus/sdk neus auth --client codex
```

Servers and CI:

```bash
npx -y -p @neus/sdk neus setup --access-key <npk_...>
```

Create access keys under **Account -> Access keys** on [neus.network](https://neus.network/profile?tab=account). Never paste keys into chat or committed files.

Hosted MCP: **`https://mcp.neus.network/mcp`**

## Every Session

1. Run **`neus_context`** once for mode, profile context, verifier summary, and next steps.
2. Use **`neus_me`** only to refresh profile context or look up a wallet/DID.
3. For agent work, use **`neus_agent_link`** before assuming identity or delegation is ready.
4. Prefer **`neus_proofs_check`** and existing trust receipts before starting new verification.
5. Use **`neus_proofs_get`** when you need exact receipt records or qHash values from NEUS.
6. Use **`neus_secret_*`** only when signed in and encrypted portable secrets are required.
7. Use **`neus_verify_or_guide`** only when setup, consent, payment, or account prerequisites are missing.

## Receipt Links

Use real qHashes only.

- App: `https://neus.network/proof/<qHash>`
- API: `https://api.neus.network/api/v1/proofs/<qHash>`

Never invent qHashes, check types, or receipt fields.
