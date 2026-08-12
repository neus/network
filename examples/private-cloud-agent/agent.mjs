// Minimal MCP client for a private cloud agent.
//
// Connects to NEUS MCP with a profile access key, loads profile context, and
// is ready to check identity and permissions before sensitive actions. Runs
// anywhere the compose file runs — laptop, VPS, on-prem, or inside a
// TEE-attested confidential VM.
//
// In a real agent, wire this into your framework's MCP client (Hermes tools,
// OpenClaw remote server, CrewAI MCP tool, LangGraph node, etc).

const NEUS_MCP_URL = process.env.NEUS_MCP_URL || 'https://mcp.neus.network/mcp';
const NEUS_ACCESS_KEY = process.env.NEUS_ACCESS_KEY;

if (!NEUS_ACCESS_KEY) {
  console.error('NEUS_ACCESS_KEY is required. Get one at https://neus.network/profile?tab=account');
  process.exit(1);
}

// Send a JSON-RPC request to NEUS MCP.
async function callMcp(method, params = {}) {
  const res = await fetch(NEUS_MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${NEUS_ACCESS_KEY}`,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NEUS MCP ${method} failed: ${res.status} ${text}`);
  }

  return res.json();
}

async function main() {
  console.log('Connecting to NEUS MCP...');
  console.log('Endpoint:', NEUS_MCP_URL);

  // Load profile context: identity, permissions, saved proofs, and Vault.
  const result = await callMcp('tools/call', {
    name: 'neus_context',
    arguments: {},
  });

  console.log('NEUS context loaded:');
  console.log(JSON.stringify(result, null, 2));
  console.log('');
  console.log('Agent is ready. NEUS will check identity and permissions before sensitive actions.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});