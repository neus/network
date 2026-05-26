# NEUS MCP (Claude Code plugin)

This is the **`neus-mcp`** Claude Code plugin. It bundles:

- **Hosted NEUS MCP** (`.mcp.json`) — streamable HTTP to `https://mcp.neus.network/mcp`
- **`neus-trust-workflow` skill** — recommended tool order and Profile access key hygiene

For Cursor, VS Code, and most local assistants, use the CLI setup:

```bash
npx -y -p @neus/sdk neus setup
```

Optional key in one step:

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

3. Authenticate with hosted NEUS login:

   ```bash
   npx -y -p @neus/sdk neus auth
   ```

   This opens your browser to a hosted sign-in page. After authentication, the CLI configures your MCP clients automatically.

4. If hosted login is unavailable, use a Profile access key as fallback:

   ```bash
   npx -y -p @neus/sdk neus setup --access-key <npk_...>
   ```

   Docs: [MCP setup](https://docs.neus.network/mcp/setup) · [NEUS for Claude Code](https://docs.neus.network/mcp/claude-code-marketplace)

## Use the skill

After install, call the skill from Claude Code:

```text
/neus-mcp:neus-trust-workflow
```
