# NEUS Trust

**Trust infrastructure for agents that act.** *Trust that travels.*

Verifiable identity, scoped authority, and receipts for every trusted action.

Agent frameworks handle tools and execution. NEUS handles trust before action — who the agent is, who authorized it, what it may do, and what left a receipt.

One setup for Cursor, Claude Code, Codex, and VS Code. Same identity, delegation, and receipts everywhere.

Hosted MCP: **`https://mcp.neus.network/mcp`**

**[Install guide →](https://docs.neus.network/mcp/ide-plugin)**

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus doctor --live
```

Codex:

```bash
npx -y -p @neus/sdk neus setup --client codex
npx -y -p @neus/sdk neus auth --client codex
```

Claude Code plugin:

```text
/plugin marketplace add https://github.com/neus/network
/plugin install neus-trust@neus
```

Skill: `/neus-trust:neus-trust-workflow`
