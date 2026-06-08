# NEUS

Trust infrastructure for agents that act.

Verifiable identity, scoped authority, and receipts for every trusted action.

One setup for Cursor, Claude Code, Codex, and VS Code.

**[Install →](https://docs.neus.network/install)**

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus check
```

Ask your assistant: **"Use NEUS Verify before taking sensitive actions."**

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
