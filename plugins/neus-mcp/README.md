# NEUS MCP (Claude Code plugin)

This folder is the **`neus-mcp`** plugin shipped inside the [`neus/network`](https://github.com/neus/network) Claude Code marketplace. It bundles:

- **Hosted NEUS MCP** (`.mcp.json`) — streamable HTTP to `https://mcp.neus.network/mcp`
- **`neus-trust-workflow` skill** — recommended tool order and Profile access key hygiene

**All editors:** use the same CLI so configs stay aligned:

```bash
npx -y -p @neus/sdk neus setup
```

Optional key in one step:

```bash
npx -y -p @neus/sdk neus setup --access-key <npk_...>
```

## Install (Claude Code)

1. Add the marketplace (published repo root contains `.claude-plugin/marketplace.json`):

   ```text
   /plugin marketplace add https://github.com/neus/network
   ```

2. Install the plugin:

   ```text
   /plugin install neus-mcp@neus
   ```

3. Add your Profile access key on the machine (same flow as other editors):

   ```bash
   npx -y -p @neus/sdk neus setup --access-key <npk_...>
   ```

   Docs: [MCP setup](https://docs.neus.network/mcp/setup) · [Claude Code marketplace](https://docs.neus.network/mcp/claude-code-marketplace)

## Skill command

Namespaced skill (plugin + skill id):

```text
/neus-mcp:neus-trust-workflow
```
