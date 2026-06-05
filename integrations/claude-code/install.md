# Claude Code

## Install NEUS Trust for Claude Code

```bash
npx -y -p @neus/sdk neus setup --client claude
npx -y -p @neus/sdk neus auth
```

Then call `neus_context` at the start of each session.

## Plugin (optional)

Claude Code packages external skills through plugins. NEUS Trust ships a thin plugin that bundles the trust workflow skill.

```text
/plugin marketplace add https://github.com/neus/network
/plugin install neus-trust@neus
/neus-trust:neus-trust-workflow
```

Full docs: [docs.neus.network/install](https://docs.neus.network/install)
