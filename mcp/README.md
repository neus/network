# NEUS MCP (hosted)

Assistants and editors connect to **hosted NEUS MCP** at:

**`https://mcp.neus.network/mcp`**

## Fastest setup (recommended)

```bash
npx -y -p @neus/sdk neus setup
```

With a NEUS Profile access key (for account-aware tools):

```bash
npx -y -p @neus/sdk neus setup --access-key <npk_...>
```

Health check:

```bash
npx -y -p @neus/sdk neus doctor
```

Create access keys under **Profile → Account** on [neus.network](https://neus.network/profile?tab=account). Treat keys like passwords: keep them in MCP or server config only, not in client-side code or public repos.

## After you connect

Start each session with tool **`neus_context`**. If you configured a Profile key, call **`neus_me`** once, then reuse receipts with **`neus_proofs_check`** before starting new verification.

## Docs

| Topic | Link |
|-------|------|
| Full setup (Cursor, VS Code, Claude Code, JSON) | [docs.neus.network/mcp/setup](https://docs.neus.network/mcp/setup) |
| Tools and recommended order | [docs.neus.network/mcp/overview](https://docs.neus.network/mcp/overview) |
| Discovery (`.well-known`, server card) | [docs.neus.network/mcp/endpoints](https://docs.neus.network/mcp/endpoints) |
| Auth and headers | [docs.neus.network/mcp/auth](https://docs.neus.network/mcp/auth) |
| Claude Code skill bundle | [docs.neus.network/mcp/claude-code-marketplace](https://docs.neus.network/mcp/claude-code-marketplace) |

## License

Apache-2.0
