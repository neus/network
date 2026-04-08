#!/usr/bin/env node
/**
 * NEUS SDK CLI — stdout-only. No file writes, no account creation, no key generation.
 * Usage: npx -y -p @neus/sdk neus init
 */
const argv = process.argv.slice(2);
const sub = argv[0];

function usage() {
  process.stderr.write("Usage: neus init\n");
  process.stderr.write("Prints hosted MCP config and doc URLs. Does not write files.\n");
  process.exit(sub && sub !== "help" && sub !== "--help" && sub !== "-h" ? 1 : 0);
}

function printInit() {
  const mcpBlock = {
    mcpServers: {
      neus: {
        type: "streamableHttp",
        url: "https://mcp.neus.network/mcp",
      },
    },
  };

  const lines = [
    "# NEUS — copy-paste bootstrap",
    "",
    "## Hosted MCP (public tools; URL only)",
    JSON.stringify(mcpBlock, null, 2),
    "",
    "## URLs",
    "MCP endpoint:     https://mcp.neus.network/mcp",
    "Hosted verify:    https://neus.network/verify",
    "Hub:              https://neus.network/hub",
    "",
    "## Docs (hosted-first)",
    "MCP setup:        https://docs.neus.network/mcp/setup",
    "LLM / assistants: https://docs.neus.network/platform/llm-docs",
    "Agents overview:  https://docs.neus.network/agents/overview",
    "Agent identity:   https://docs.neus.network/agents/agent-identity",
    "Agent delegation: https://docs.neus.network/agents/agent-delegation",
    "Integration loop: https://docs.neus.network/integration",
    "Quickstart:       https://docs.neus.network/quickstart",
    "",
    "Machine-readable route index: https://docs.neus.network/llms.txt",
    "",
    "## Notes",
    "- This command only prints to stdout. It does not modify files or create accounts.",
    "- Use Authorization: Bearer <personal API key> when a tool returns auth_required (see docs MCP auth).",
    "- Prefer credits and sponsor grants for onboarding; use x402 only when you receive HTTP 402 (see platform x402).",
  ];

  process.stdout.write(`${lines.join("\n")}\n`);
}

if (!sub || sub === "help" || sub === "--help" || sub === "-h") {
  usage();
}

if (sub === "init") {
  printInit();
  process.exit(0);
}

usage();
