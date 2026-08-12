---
name: neus-setup
description: Connect an MCP client to NEUS. Use when a user wants NEUS in their host, needs to sign in, or wants to verify their setup is healthy.
license: Apache-2.0
compatibility: Requires Node.js 20 or newer and an MCP-capable client.
---

# Connect NEUS

```bash
npx -y -p @neus/sdk neus setup
```

Then verify the connection, sign-in, and skill are healthy:

```bash
npx -y -p @neus/sdk neus doctor --live
```

For a single client, add `--client cursor`, `--client codex`, `--client claude`, or `--client vscode`.

In Cursor, installing the `neus-mcp` plugin from the marketplace also registers NEUS and signs you in. No CLI needed. If both are present, the CLI defers to the plugin.