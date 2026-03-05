# NEUS MCP Server

Model Context Protocol (MCP) server for AI-native NEUS verification. Use with Cursor, Claude Desktop, and any MCP-compatible runtime.

## Install {#install}

### Cursor (hosted, recommended)

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "neus": {
      "type": "streamableHttp",
      "url": "https://mcp.neus.network/mcp",
      "description": "NEUS MCP (live)"
    }
  }
}
```

**One-click install:**

- [Install NEUS MCP (hosted)](cursor://anysphere.cursor-deeplink/mcp/install?name=neus&config=eyJ1cmwiOiJodHRwczovL21jcC5uZXVzLm5ldHdvcmsvbWNwIiwiZGVzY3JpcHRpb24iOiJORVVTIE1DUCAobGl2ZSkifQ==)

### Stdio (npx)

```json
{
  "mcpServers": {
    "neus": {
      "command": "npx",
      "args": ["-y", "@neus/mcp-server"],
      "env": { "NEUS_API_URL": "https://api.neus.network" }
    }
  }
}
```

## Tools

| Tool | Purpose |
|------|---------|
| `neus_verifiers_catalog` | Discover verifier IDs and metadata |
| `neus_proofs_check` | Gate check (eligibility only) |
| `neus_verify` | Create proof (elicitation for human-in-the-loop) |
| `neus_verify_or_guide` | Check gate, then guide if missing |
| `neus_proofs_get` | Portable proof context |
| `neus_me` | Identity context: principal, agents, auth status |
| `neus_agent_link` | Check agent-identity + agent-delegation; guide if missing |

## Elicitation and hosted flow

When `neus_verify` returns elicitation (signature required), use `hostedVerifyUrl` for users to sign in with a passkey or connect a wallet in the browser. No wallet extension required for passkey users.

## Related

- [MCP README](https://github.com/neus-network/network/tree/main/mcp) (full docs)
- [Hub Integrator Setup](./hub-integrator-setup.md)
- [API Reference](../api/README.md)
