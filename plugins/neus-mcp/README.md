# NEUS

Verified identity, scoped permissions, and reusable trust receipts for your assistant.

In Cursor, install this plugin and click **Connect** — NEUS signs you in automatically. For Codex, VS Code, and Claude Code, use the public CLI.

**[Install →](https://docs.neus.network/install)**

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus doctor --live
```

Ask your assistant: **"Use NEUS to check identity and permissions before sensitive actions."**

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
