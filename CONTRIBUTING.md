# Contributing

Thank you for helping improve NEUS materials in this open project.

**If you are integrating NEUS into a product**, use **[docs.neus.network](https://docs.neus.network)** and the live product first - the table below is for people proposing changes here.

| Need | Where |
| --- | --- |
| Product documentation | [docs.neus.network](https://docs.neus.network) |
| Possible bugs | [Issues](https://github.com/neus/network/issues) |
| Ideas and questions | [Discussions](https://github.com/neus/network/discussions) |
| Security reports | [dev@neus.network](mailto:dev@neus.network) (do not post publicly) |

## What helps

- Bug reports with clear steps to reproduce and no secrets in the thread.
- Verifier suggestions that spell out the user-visible outcome you want.
- Updates to the SDK, examples, or documentation that match what the live product does today.
- Tests or examples when you change behavior that builders rely on.

**Do not** share keys, tokens, bearer secrets, or private proof content in public issues or change descriptions.

## Local setup hints

- `npx -y -p @neus/sdk neus init` prints hosted MCP connection details and links to the documentation (terminal output only).
- Building the documentation site or working on the SDK needs a supported **Node.js** version (see **`engines`** in the root **`package.json`** and in **`sdk/package.json`**). After SDK edits, run the SDK test script defined there.

## What lives in this tree

- Published documentation is served from **docs.neus.network**; sources live under **`docs/`** here.
- The **`mcp/`** directory accompanies the published **`@neus/mcp-server`** package.
- Verifier field schemas live under **`docs/verifiers/schemas/`** and related **`spec/`** files - prefer linking to the [verifier catalog](https://docs.neus.network/verification/verifiers) in prose instead of duplicating long tables.

## Describing your change

Explain **what builders or end users will experience differently** (for example new fields, new errors, or renamed concepts). If you adjust verifiers or any documented HTTP surface, keep the written API reference and examples aligned with the live product.
