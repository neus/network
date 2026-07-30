# NEUS

Stop agents from acting blind. Verified identity, limited permissions, and reusable trust receipts.

This plugin contains the NEUS setup skill. It routes every host to the same public CLI and does not register MCP.

**[Install →](https://docs.neus.network/install)**

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus doctor --live
```

Ask your assistant: **"Use NEUS Verify before taking sensitive actions."**

It reuses existing trust receipts first, guides any missing check, then summarizes as Passed, Action needed, or Blocked.

Codex:

```bash
npx -y -p @neus/sdk neus setup --client codex
```

Claude Code plugin:

```text
/plugin marketplace add https://github.com/neus/network
/plugin install neus-mcp@neus
```

Skill: `/neus-mcp:neus-setup`
