# NEUS

Portable trust for any agent, editor, server, or API. Identity, permissions, proofs, context, and Vault. Verify once. Carry the proof. Enforce before action.

Install the **neus-mcp** plugin from your host's marketplace, then click **Connect**. NEUS signs you in automatically. For servers, CI, or automation, use the public CLI.

**[Install](https://docs.neus.network/install)**

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus doctor --live
```

Ask your assistant: **"Before I take a sensitive action, use NEUS. Reuse what I already have."**

It looks up identity, authority, and saved results first, then summarizes as Passed, Action needed, or Blocked.

Per-client setup: [MCP clients](https://docs.neus.network/mcp/ide-plugin).

Claude Code plugin:

```text
/plugin marketplace add https://github.com/neus/network
/plugin install neus-mcp@neus
```

Skill: `/neus-mcp:neus-setup`