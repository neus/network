---
name: neus-setup
description: Add the hosted NEUS endpoint, sign in, and reuse current proofs.
license: Apache-2.0
compatibility: Requires an MCP-capable client that can register a remote HTTP server.
---

# Connect NEUS

Register the hosted endpoint, then click **Connect**:

`https://mcp.neus.network/mcp`

If this host already has the NEUS marketplace plugin or registry listing, install that and click **Connect**. Do not also write a second `neus` entry.

Optional terminal installer (writes the same URL and the public workflow skill):

```bash
npx -y -p @neus/sdk neus setup
```
