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

If your host already has a `neus-mcp` marketplace plugin, install it and click **Connect**. The CLI skips a duplicate registration when the plugin is present.
