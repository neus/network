# NEUS

Stop agents from acting blind. Verified identity, limited permissions, and reusable trust receipts.

One setup for Cursor, Claude Code, Codex, and VS Code.

**[Install →](https://docs.neus.network/install)**

```bash
npm i -g @neus/sdk
neus setup
neus check
```

Ask your assistant: **"Use NEUS Verify before taking sensitive actions."**

Codex:

```bash
neus setup --client codex
```

Claude Code plugin:

```text
/plugin marketplace add https://github.com/neus/network
/plugin install neus-trust@neus
```

Skill: `/neus-trust:neus-trust-workflow`
