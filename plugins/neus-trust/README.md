# NEUS

Trust infrastructure for agents that act.

Verifiable identity, scoped authority, and receipts for every trusted action.

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
neus auth --client codex
```

Claude Code plugin:

```text
/plugin marketplace add https://github.com/neus/network
/plugin install neus-trust@neus
```

Skill: `/neus-trust:neus-trust-workflow`
