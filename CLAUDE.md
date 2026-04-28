# NEUS Network

NEUS is the trust layer for apps, agents, and the next internet. This repository contains the SDK, MCP server, smart contracts, documentation, and examples for integrating NEUS verification into applications.

## Quick Start

```bash
# Install dependencies
npm install

# Start documentation site locally
npm run docs:dev

# Run SDK tests
npm run test:sdk

# Validate documentation
npm run docs:validate
```

## Project Structure

```
network/
├── sdk/              # JavaScript/TypeScript SDK (@neus/sdk)
├── mcp/              # Model Context Protocol server
├── contracts/        # Smart contracts (Solidity)
├── docs/             # Documentation site (Mint)
├── examples/         # Integration examples
├── spec/             # Verifier schemas and specifications
└── abis/             # Contract ABIs
```

## Components

### SDK (`./sdk/`)

The JavaScript/TypeScript SDK provides APIs and React widgets for NEUS verification.

```bash
npm install @neus/sdk
```

Key methods:
- `client.verify()` - Create verification proofs
- `client.getProof()` - Fetch proofs by ID
- `client.gateCheck()` - Server-side eligibility checks
- `VerifyGate` - React component for gated content

### MCP Server (`./mcp/`)

Model Context Protocol server for AI assistants and IDEs. Enables live verification state access within Claude, Cursor, and other MCP-compatible clients. See authentication details at docs.neus.network/mcp.

Configuration:
```json
{
  "mcpServers": {
    "neus": {
      "type": "streamableHttp",
      "url": "https://mcp.neus.network/mcp"
    }
  }
}
```

### Smart Contracts (`./contracts/`)

Solidity contracts for on-chain verification anchoring and cross-chain propagation.

- `NEUSVerifierRegistry` - Main verification registry
- `NEUSVoucherHub` - Cross-chain hub
- `NEUSVoucherSpoke` - Cross-chain spokes
- `NEUSToken` - Testnet token (Base Sepolia only)

Deployed contracts are documented in `contracts/VERIFICATION.md`.

### Documentation (`./docs/`)

Mint-based documentation site at docs.neus.network.

```bash
npm run docs:dev              # Start dev server
npm run docs:lint:markdown   # Lint markdown
npm run docs:lint:openapi    # Lint OpenAPI spec
npm run docs:validate        # Run all linters
```

### Examples (`./examples/`)

Integration examples demonstrating common patterns:
- Basic verification flows
- React component usage
- Trust receipts showcase
- Hosted Verify integration

## Development Workflow

### Documentation Changes

Documentation is authored in MDX within the `docs/` directory. The site uses Mint for static generation.

1. Edit MDX files in `docs/`
2. Run `npm run docs:dev` to preview
3. Run `npm run docs:validate` before committing

### SDK Changes

The SDK is published as `@neus/sdk` on npm.

1. Make changes in `sdk/`
2. Run `npm run test:sdk` to verify
3. Update documentation to reflect changes

### Contract Changes

Smart contracts use Solidity and are deployed to testnet.

1. Edit contracts in `contracts/`
2. Update `contracts/VERIFICATION.md` with new deployments
3. Update ABIs in `abis/` after deployment

## Testing

```bash
# Run SDK tests
npm run test:sdk
```

## Resources

- [Product Documentation](https://docs.neus.network)
- [Live Demo](https://neus.network/demo)
- [Hosted Verify](https://neus.network/verify)
- [Discussions](https://github.com/neus/network/discussions)
- [Issues](https://github.com/neus/network/issues)

## License

- SDK & tools: Apache-2.0
- Smart contracts: BUSL-1.1 to Apache-2.0 (August 2028)
