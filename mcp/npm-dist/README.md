# @neus/mcp-server

**Trust infrastructure for agents that act** — public discovery metadata for hosted NEUS MCP at **`https://mcp.neus.network/mcp`**. Identity, authority, and reusable receipts for Cursor, Claude Code, Codex, and VS Code. This package does not ship a runtime server.

## Connect

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus auth
npx -y -p @neus/sdk neus doctor --live
```

Sign in with **`neus auth`** (OAuth). For servers and CI only, use a Profile access key:

```bash
npx -y -p @neus/sdk neus setup --access-key <npk_...>
```

Install and auth guides: [docs.neus.network/mcp/setup](https://docs.neus.network/mcp/setup)

## Registry manifest

`server.json` lists the twelve public MCP tools and the hosted endpoint for MCP registries and installers. OAuth discovery:

- `https://mcp.neus.network/.well-known/mcp.json`
- `https://mcp.neus.network/.well-known/oauth-protected-resource`

## Related package

Use **`@neus/sdk`** for the JavaScript SDK, widgets, and the `neus` CLI (`neus setup`, `neus auth`, import/export).

## License

Apache-2.0
