---
name: neus-setup
description: Install or repair NEUS for the current IDE using the single public setup command. Use when a user wants NEUS MCP, OAuth sign-in, the NEUS trust workflow skill, or duplicate/stale connector cleanup.
license: Apache-2.0
compatibility: Requires Node.js 20 or newer and an MCP-capable IDE.
---

# Set up NEUS

Use the public CLI as the only setup owner:

```bash
npx -y -p @neus/sdk neus setup
```

Then verify the endpoint, OAuth profile, skill, and duplicate state:

```bash
npx -y -p @neus/sdk neus doctor --live
```

Do not create manual MCP JSON, install another NEUS connector, paste an OAuth token into configuration, or use a workspace-specific bootstrap script.

For a single host, add `--client cursor`, `--client codex`, `--client claude`, or `--client vscode` to the setup command.
