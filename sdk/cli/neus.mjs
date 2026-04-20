#!/usr/bin/env node
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
    "# NEUS",
    "",
    "## MCP",
    JSON.stringify(mcpBlock, null, 2),
    "",
    "## URLs",
    "MCP: https://mcp.neus.network/mcp",
    "Verify:    https://neus.network/verify",
    "Explorer:  https://neus.network/hub",
    "",
    "## Docs",
    "MCP setup:        https://docs.neus.network/mcp/setup",
    "LLM / assistants: https://docs.neus.network/platform/llm-docs",
    "Agents:           https://docs.neus.network/agents/overview",
    "Agent identity:   https://docs.neus.network/agents/agent-identity",
    "Agent delegation: https://docs.neus.network/agents/agent-delegation",
    "Integration:      https://docs.neus.network/integration",
    "Quickstart:       https://docs.neus.network/quickstart",
    "Machine route map: https://neus.network/llms.txt",
    "",
    "This command only prints to stdout; it does not modify files or create accounts.",
    "Use Authorization: Bearer <access key> when a tool returns auth_required (see MCP auth).",
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
