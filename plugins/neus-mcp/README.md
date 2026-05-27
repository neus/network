# NEUS MCP (Claude Code plugin)

This is the **`neus-mcp`** Claude Code plugin. It bundles:

- **Hosted NEUS MCP** (`.mcp.json`) — streamable HTTP to `https://mcp.neus.network/mcp`
- **`neus-trust-workflow` skill** — recommended tool order and Profile access key hygiene

For Cursor, VS Code, and most local assistants, use the CLI setup:

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus auth
npx -y -p @neus/sdk neus doctor --live
```

For servers and CI only:

```bash
npx -y -p @neus/sdk neus setup --access-key <npk_...>
```

## Install in Claude Code

1. Add NEUS:

   ```text
   /plugin marketplace add https://github.com/neus/network
   ```

2. Install NEUS:

   ```text
   /plugin install neus-mcp@neus
   ```

3. Sign in (recommended):

   ```bash
   npx -y -p @neus/sdk neus setup
   npx -y -p @neus/sdk neus auth
   ```

4. For servers and CI only, use a Profile access key:

   ```bash
   npx -y -p @neus/sdk neus setup --access-key <npk_...>
   ```

   Docs: [MCP setup](https://docs.neus.network/mcp/setup) · [NEUS for Claude Code](https://docs.neus.network/mcp/claude-code-marketplace)

## Use the skill

After install, call the skill from Claude Code:

```text
/neus-mcp:neus-trust-workflow
```
