# NEUS Trust

**Trust infrastructure for agents that act.** *Trust that travels.*

Verifiable identity, scoped authority, and receipts for every trusted action.

Agent frameworks handle tools and execution. NEUS handles trust before action — who the agent is, who controls it, what it may do, and what left a receipt.

One OAuth sign-in. Same identity, delegation, and receipts in Cursor, Claude Code, and Codex.

Hosted MCP: **`https://mcp.neus.network/mcp`**

**[Install guide →](https://docs.neus.network/mcp/ide-plugin)**

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus auth
```

Claude Code plugin:

```text
/plugin install neus-trust@neus
```

Skill: `/neus-trust:neus-trust-workflow`
